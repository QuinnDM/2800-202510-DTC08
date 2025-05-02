document.addEventListener("DOMContentLoaded", function () {
    var map = L.map("map").fitWorld();

    map.zoomControl.setPosition('topright');

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

    L.tileLayer("/tiles/{z}/{x}/{y}", {
        attribution: 'Tiles &copy; <a href="https://jawg.io">Jawg</a>, &copy; OpenStreetMap contributors',
        minZoom: 3, 
        maxZoom: 22,
    }).addTo(map);
});
