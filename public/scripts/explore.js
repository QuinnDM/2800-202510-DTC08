document.addEventListener("DOMContentLoaded", function () {
    var map = L.map("map").fitWorld();

    map.zoomControl.setPosition('topright');

    const provider = new window.GeoSearch.OpenStreetMapProvider();

    const searchControl = new window.GeoSearch.GeoSearchControl({
        provider: provider,
        style: 'bar',
        showMarker: false,
        notFoundMessage: 'No results found',
        resetButton: '×' // Optional: message when no results
        // resetButton: '🔍',
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

    let jawgStreetMap = L.tileLayer("/tiles/{z}/{x}/{y}", {
        attribution: 'Tiles &copy; <a href="https://jawg.io">Jawg</a>, &copy; OpenStreetMap contributors',
        minZoom: 3,
        maxZoom: 22,
    }).addTo(map);

    // Esri world imagery base map
    let esriWorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });

    // creating layer groups
    var baseMaps = {
        "Street Map": jawgStreetMap,
        "Satellite": esriWorldImagery
    };

    // Add layer control to the map to enable toggling on and off of layer groups
    var layer_control = L.control.layers(baseMaps).addTo(map);

    function styleDropDownLayers() {
        const labels = document.querySelectorAll('.leaflet-control-layers label');

        labels.forEach(label => {
            const text = label.textContent.trim();

            // Match the label by its name and apply custom background to represent layer
            if (text === 'Satellite') {
                label.style.backgroundImage = "url('../images/satellite.png')";
            } else if (text === 'Street Map') {
                label.style.backgroundImage = "url('../images/streetmap.png')";
            }
        });
    }

    styleDropDownLayers()

    // Retrieve and display current location information
    const x = document.getElementById("demo");
    const apiKey = "19a6232696617ab3c94fab8259f33fe7"
    window.getLocation = function () {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(success, error);
            console.log("hello")
        } else {
            x.innerHTML = "Geolocation is not supported by this browser.";
        }
    };

    function success(position) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                const place = data.name;
                const weatherData = {
                    temperature: (data.main.temp - 273.15).toFixed(1),
                    description: data.weather[0].description,
                    icon: data.weather[0].icon,
                }
                document.getElementById("output").innerHTML =
                    `Lat: ${lat}, Lon: ${lon}, Location: ${place}, temperature: ${weatherData.temperature}°C`;
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

    getLocation()
});

// Implement toggle for the location information popup
const locationInformationButton = document.getElementById("locationInformationButton");
const locationInformationContainer = document.getElementById("locationInformationContainer");

locationInformationButton.addEventListener("click", () => {
    if (locationInformationContainer.style.display === "none" || locationInformationContainer.style.display === "") {
        locationInformationContainer.style.display = "block";
    } else {
        locationInformationContainer.style.display = "none";
    }
});