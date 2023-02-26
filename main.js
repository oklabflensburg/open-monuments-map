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
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, markerStyle);
        },
        onEachFeature: function (feature, layer) {
            layer.on('click', function (e) {
                map.setView(e.latlng, 18);

                let scope = e.target.feature.properties.scope
                let reasons = e.target.feature.properties.reasons

                if (Array.isArray(scope)) {
                    scope = scope.join(', ')
                }

                if (Array.isArray(reasons)) {
                    reasons = reasons.join(', ')
                }

                document.getElementById('details').classList.remove('hidden');
                document.getElementById('type').innerHTML = e.target.feature.properties.type;
                document.getElementById('designation').innerHTML = e.target.feature.properties.designation;
                document.getElementById('description').innerHTML = e.target.feature.properties.description;
                document.getElementById('reasons').innerHTML = reasons;
                document.getElementById('scope').innerHTML = scope;
                document.getElementById('address').innerHTML = e.target.feature.properties.address;
            })
        }
    });

    markers.addLayer(geojsonGroup);
    map.addLayer(markers);
}