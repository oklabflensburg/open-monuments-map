fetch('./flensburg_denkmalschutz.geojson', {
    method: 'GET'
})
    .then((response) => {
        return response.json();
    })
    .then((data) => {
        marker(data);
    })
    .catch(function (error) {
        console.log(error);
    });

const map = L.map('map').setView([54.7836, 9.4321], 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

let markerStyle = {
    radius: 8,
    fillColor: "#007cff",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
};

let markers = L.markerClusterGroup();

function marker(data) {
    const geojsonGroup = L.geoJSON(data, {
        onEachFeature: function (feature, layer) {
            let popupContentUrl = ''

            if (feature.properties.url) {
                popupContentUrl = '<div class="md:grid md:grid-cols-5"><div class="font-bold">Denkmaltyp</div><div class="col-span-3">' + feature.properties.url + '</div></div>'
            }

            let popupContent =
                '<div class="popup grid grid-rows-6 auto-cols-max grid-flow-col gap-2 font-mono">' +
                '<div class="md:grid md:grid-cols-5"><div class="font-bold">Bezeichnung</div>' +
                '<div class="col-span-3">' + feature.properties.type + '</div></div>' +
                '<div class="md:grid md:grid-cols-5"><div class="font-bold">Denkmaltyp</div>' +
                '<div class="col-span-3">' + feature.properties.designation + '</div></div>' +
                '<div class="md:grid md:grid-cols-5"><div class="font-bold">Beschreibung</div>' +
                popupContentUrl +
                '<div class="col-span-3">' + feature.properties.description + '</div></div>' +
                '<div class="md:grid md:grid-cols-5"><div class="font-bold">Begründung</div>' +
                '<div class="col-span-3">' + feature.properties.reasons + '</div></div>' +
                '<div class="md:grid md:grid-cols-5"><div class="font-bold">Schutzumfang</div>' +
                '<div class="col-span-3">' + feature.properties.scope + '</div></div>' +
                '<div class="md:grid md:grid-cols-5"><div class="font-bold">Adresse</div>' +
                '<div class="col-span-3">' + feature.properties.address + '</div></div></div>';
            layer.bindPopup(popupContent, {
                maxWidth: 460
            })
        },
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, markerStyle);
        }
    });

    markers.addLayer(geojsonGroup);
    map.addLayer(markers);
}