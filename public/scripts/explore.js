document.addEventListener("DOMContentLoaded", async function () {
    var map = L.map("map", {
        minZoom: 3,
        maxZoom: 21
    });

    map.zoomControl.setPosition('topright');

    let jawgStreetMap = L.tileLayer("/tiles/{z}/{x}/{y}", {
        attribution: 'Tiles &copy; <a href="https://jawg.io">Jawg</a>, &copy; OpenStreetMap contributors',
        minZoom: 3,
        maxZoom: 22,
        // Add tile caching to store tiles locally and improve load speed
        crossOrigin: true,
    });

    jawgStreetMap.addTo(map)

    map.whenReady( async () => {
        jawgStreetMap.addTo(map)
        await loadSightings("/sightings");
        displayTotalSightingsCount();
        insertLayerControlSeparator();
        styleDropDownLayers();
        getLocation();
    });

    // Esri world imagery base map
    let esriWorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        // Add tile caching to store tiles locally and improve load speed
        crossOrigin: true,
        minZoom: 3,
        maxZoom: 22,
    });

    // Dummy layer just for the header label
    const dummyHeader = L.layerGroup();

    // creating layer groups
    var baseMaps = {
        "Street Map": jawgStreetMap,
        "Satellite": esriWorldImagery
    };

    var overlayMaps = {
        "Taxonomic Groups": dummyHeader,
        "Birds": L.featureGroup(),
        "Plants": L.featureGroup(),
        "Heatmaps": dummyHeader,
        "Birds HM": L.featureGroup(),
        "Plants HM": L.featureGroup()
    };

    function styleDropDownLayers() {
        const labels = document.querySelectorAll('.leaflet-control-layers label');

        labels.forEach(label => {
            const text = label.textContent.trim();

            // Match the label by its name and apply custom background to represent layer
            if (text === 'Satellite') {
                label.style.backgroundImage = "url('../images/satellite.png')";
            } else if (text === 'Street Map') {
                label.style.backgroundImage = "url('../images/streetmap.png')";
            } else if (text === 'Birds') {
                label.style.backgroundColor = "#2A81CB";
            } else if (text === 'Plants') {
                label.style.backgroundColor = "#2AAD27";
            } else if (text === 'Birds HM') {
                label.style.backgroundColor = "#FF7F7F";
            } else if (text === 'Plants HM') {
                label.style.backgroundColor = "#FF7F7F";
            }
        });
    }

    // // Move the map view to the user's location on open and refresh
    map.locate({ setView: true, maxZoom: 16 });

    const provider = new window.GeoSearch.OpenStreetMapProvider();

    const searchControl = new window.GeoSearch.GeoSearchControl({
        provider: provider,
        style: 'bar',
        showMarker: false,
        notFoundMessage: 'No results found',
        resetButton: '×'
    });

    map.addControl(searchControl);

    // Update geosearch reset button style. Cannot seem to get it to work using css.
    function updateGeosearchResetButtonStyle() {
        const resetButton = document.querySelector('.leaflet-control-geosearch .reset');
        if (resetButton) {
            resetButton.style.position = 'absolute';
            resetButton.style.top = '4px';
            resetButton.style.right = '10px';
            resetButton.style.backgroundColor = 'white';
            resetButton.style.border = 'none';
        }
    }

    map.on("load", updateGeosearchResetButtonStyle())

    // Set the map bounds
    const south_west = L.latLng(-90, -200)
    const north_east = L.latLng(90, 200)
    const bounds = L.latLngBounds(south_west, north_east)

    // Prevent users from being able to pan outside of the map's bounds
    /* credit to rob.m's stackflow answer to prevent user from being able to pan out of map bounds
    https://stackoverflow.com/questions/22155017/can-i-prevent-panning-leaflet-map-out-of-the-worlds-edge*/
    map.setMaxBounds(bounds);
    map.on('drag', function () {
        map.panInsideBounds(bounds, { animate: false });
    })

    // Retrieve and display current location information
    window.getLocation = function () {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(success, error);
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    };
    // if position retrieval is successful, use info to pull location information using openweathermaps api
    async function success(position) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        fetch(`/openweathermap/${lat}/${lon}`)
            .then((response) => response.json()).then((data) => {
                const place = data.name;
                const weatherData = {
                    temperature: (data.main.temp - 273.15).toFixed(1),
                    description: (data.weather[0].description),
                    icon: data.weather[0].icon,
                }
                let iconUrl = "http://openweathermap.org/img/w/" + weatherData.icon + ".png"
                document.getElementById("locationInformationButton").innerHTML = `<img src=${iconUrl}></img>`
                document.getElementById("output").innerHTML =
                    `<div class='infoContainer'><h3 class='bold'>Location: </h3><p> ${place}</p></div>`
                    + `<div class='infoContainer'><h3 class='bold'>Latitude: </h3><p> ${lat}</p></div>`
                    + `<div class='infoContainer'><h3 class='bold'>Longitude: </h3><p> ${lon}</p></div>`
                    + `<div class='infoContainer'><h3 class='bold'>Temperature: </h3><p> ${weatherData.temperature}°C</p></div>`
                    + `<div class='infoContainer'><h3 class='bold'>Weather: </h3><p> ${weatherData.description}</p></div>`;
            })
            .catch(err => {
                document.getElementById("output").innerText = "Failed to fetch weather data.";
                console.error(err);
            });
    }

    function error(err) {
        document.getElementById("output").innerText = "Error getting location.";
        console.warn(`ERROR(${err.code}): ${err.message}`);
    }

    // retrieve user's location information every 5 minutes
    setInterval(getLocation, 300000);

    const layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);

    // Add the initial empty layers to the map such that they are on by default
    overlayMaps["Birds"].addTo(map);
    overlayMaps["Plants"].addTo(map);

    async function loadSightings(route) {
        try {
            response = await fetch(route);
            data = await response.json();

            // first clear layer to avoid duplication
            overlayMaps["Birds"].clearLayers();
            overlayMaps["Plants"].clearLayers();
            overlayMaps["Birds HM"].clearLayers();
            overlayMaps["Plants HM"].clearLayers();

            // for building heat maps
            coordinateArrayBirds = [];
            coordinateArrayPlants = [];

            data.forEach(sighting => {
                const [lng, lat] = sighting.location.coordinates;
                let sightingPopupContent = `<img src=${sighting.photoUrl}><h1 class="species">${sighting.species}</h1><p class="speciesDescription infoBlock"><span class="subheader">Description:</span> ${sighting.description}</p><p class="infoBlock"><span class="subheader">Coordinates:</span> ${lat}, ${lng}</p>
                <p class="infoBlock"><span class="subheader">Sighting Time:</span> ${convertTimeStampToDate(sighting.timestamp)}</p><p class="infoBlock"><span class="subheader">Observer:</span></p>`
                let markerIcon = L.icon({})
                let sightingMarker = L.marker([lat, lng], { icon: markerIcon }).bindPopup(sightingPopupContent).openPopup();
                switch (sighting.taxonomicGroup) {
                    case "plant":
                        markerIcon = colourMarkerIcon("marker-icon-2x-green")
                        sightingMarker = L.marker([lat, lng], { icon: markerIcon }).bindPopup(sightingPopupContent).openPopup();
                        sightingMarker.bindTooltip(sighting.species).openTooltip();
                        overlayMaps["Plants"].addLayer(sightingMarker);
                        coordinateArrayPlants.push([lat, lng])
                        break;
                    case "bird":
                        markerIcon = colourMarkerIcon("marker-icon-2x-blue")
                        sightingMarker = L.marker([lat, lng], { icon: markerIcon }).bindPopup(sightingPopupContent).openPopup();
                        sightingMarker.bindTooltip(sighting.species).openTooltip();
                        overlayMaps["Birds"].addLayer(sightingMarker);
                        coordinateArrayBirds.push([lat, lng])
                        break;
                }
            });
            // Create heat maps for the various layers. 
            addHeatMap(coordinateArrayBirds, "Birds HM");
            addHeatMap(coordinateArrayPlants, "Plants HM");
            
            return overlayMaps["Birds"];
        } catch (err) {
            console.error('Failed to load sightings:', err);
            return null;
        }
    };

    // Create and add a heat map to the overlay layers group
    // L.heatlayer from Leaflet.heat Leaflet plugin from https://github.com/Leaflet/Leaflet.heat?tab=readme-ov-file maintained by Vladimir Agafonkin.
    function addHeatMap(coordinateArray, layerName) {
        overlayMaps[layerName].addLayer(L.heatLayer(
            coordinateArray
            , { radius: 25 }))
    }

    // must use colour codes from https://github.com/pointhi/leaflet-color-markers
    function colourMarkerIcon(colour) {
        markerIcon = L.icon({
            iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/${colour}.png`,
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });
        return markerIcon;
    }

    function convertTimeStampToDate(timestamp) {
        let date = new Date(timestamp);
        let dateString = date.toDateString();
        let hours = date.getHours();
        if (hours < 10) { hours = "0" + hours; }
        let minutes = date.getMinutes();
        let seconds = date.getSeconds();
        let fullDate = `${dateString} at ${hours}:${minutes}:${seconds}`;
        return fullDate;
    }

    // await loadSightings("/sightings");

    const yoursOnly = document.getElementById("onlyShowYourSightings");
    yoursOnly.addEventListener("change", () => {
        applySightingsFilter();
    });

    // apply sighting filters by adding query parameters when fetching the sighting data
    async function applySightingsFilter() {
        let filterQuery = "/sightings?"
        const showOnlyYourSightingsFilterElement = document.getElementById("onlyShowYourSightings");
        if (showOnlyYourSightingsFilterElement.checked) {
            filterQuery = filterQuery + "onlyYours=true"
            await loadSightings(filterQuery);
        } else {
            await loadSightings(filterQuery); // load sighting without any filters
        }
        return null;
    }

    // Zoom to extent of sitings
    async function zoomToYourSightings() {
        const yourSightingsButton = document.getElementById("yourSightings");
        yourSightingsButton.addEventListener("click", function () {
            if (overlayMaps["Birds"] && overlayMaps["Birds"].getLayers().length > 0) {
                map.fitBounds(overlayMaps["Birds"].getBounds());
            } else {
                console.warn("Sightings layer is not loaded or empty.");
            }
        });
    }
    zoomToYourSightings();

    // Displays the total count of total sighting contributions from all user
    async function displayTotalSightingsCount() {
        let totalSightingsElement = document.getElementById("totalSightingsCount");
        let totalSightingsCount = overlayMaps["Birds"].getLayers().length + overlayMaps["Plants"].getLayers().length;
        totalSightingsElement.innerText = totalSightingsCount;
    }

    // displayTotalSightingsCount();

    // Populates the visible sightings counts (number of sightings within the current map view)
    function countVisibleMarkers(map) {
        let visibleMarkersCount = document.getElementById("visibleSightings");
        const bounds = map.getBounds();
        let sightingsCount = 0;
        map.eachLayer(function (layer) {
            if (layer instanceof L.LayerGroup) {
                layer.eachLayer(groupLayer => {
                    if (groupLayer instanceof L.Marker && bounds.contains(groupLayer.getLatLng())) {
                        sightingsCount++;
                    }
                })
            }
        });
        visibleMarkersCount.innerText = sightingsCount;
        return sightingsCount;
    }
    // populate visible markers on map load
    jawgStreetMap.on("load", function () {
        countVisibleMarkers(map)
    })
    // refresh visible marker count on pan
    map.on("move", function () {
        countVisibleMarkers(map);
    });

    // Get the count of your sightings on the explore page
    async function displayYourSightingsCount() {
        try {
            const response = await fetch("/yourSightings");
            const data = await response.json();
            let yourSightingsCount = 0;
            if (Array.isArray(data)){
                yourSightingsCount = data.length;
            } 
            let yourSightingsElement = document.getElementById("yourSightingsCount");
            yourSightingsElement.innerText = yourSightingsCount;
        } catch (err) {
            console.error('Failed to load your sightings:', err);
            return null;
        }
    }
    displayYourSightingsCount();

    // Add separator to the leaflet layer control group
    function insertLayerControlSeparator() {
        const controlContainer = document.querySelector('.leaflet-control-layers-overlays');
        if (controlContainer) {
            const separator = document.createElement('div');
            separator.className = 'leaflet-control-layers-separator';
            controlContainer.insertBefore(separator, controlContainer.children[3]);
        }
    }


});

// Implement toggle for the location information popup
const locationInformationButton = document.getElementById("locationInformationButton");
const locationInformationContainer = document.getElementById("locationInformationContainer");

locationInformationButton.addEventListener("click", () => {
    if (locationInformationContainer.style.display === "none" || locationInformationContainer.style.display === "") {
        locationInformationContainer.style.display = "block";
    } else {
        locationInformationContainer.removeAttribute('style');
    }
});