document.addEventListener("DOMContentLoaded", function () {
    var map = L.map("map").fitWorld();

    L.tileLayer("/tiles/{z}/{x}/{y}", {
        attribution: 'Tiles &copy; <a href="https://jawg.io">Jawg</a>, &copy; OpenStreetMap contributors',
        minZoom: 3, 
        maxZoom: 22,
    }).addTo(map);
});
