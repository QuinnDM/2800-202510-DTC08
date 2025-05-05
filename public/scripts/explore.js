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

    // Update geosearch reset button style. Cannot seem to get it to work using css.
    map.addControl(searchControl);

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
});
