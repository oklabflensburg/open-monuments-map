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

let s_light_style = {
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
            let popupContent = '<div class="popup"><table class="table table-striped">' +
                '<tbody><tr><td valign="top">Bezeichnung</td><td>' + feature.properties.type + '</td></tr>' +
                '<tr><td valign="top">Denkmaltyp</td><td>' + feature.properties.designation + '</td></tr>' +
                '<tr><td valign="top">Fotolink</td><td><a href="' + feature.properties.url + '" target="_blank">' + feature.properties.url + '</a></td></tr>' +
                '<tr><td valign="top">Beschreibung</td><td>' + feature.properties.description + '</td></tr>' +
                '<tr><td valign="top">Begründung</td><td>' + feature.properties.reasons + '</td></tr>' +
                '<tr><td valign="top">Schutzumfang</td><td>' + feature.properties.scope + '</td></tr>' +
                '<tr><td valign="top">Adresse</td><td>' + feature.properties.address + '</td></tr></tbody></table>';
            layer.bindPopup(popupContent, {
                maxWidth: 560
            })
        },
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, s_light_style);
        }
    });

    markers.addLayer(geojsonGroup);
    map.addLayer(markers);
}