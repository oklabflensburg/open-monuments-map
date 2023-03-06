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

let greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

let markers = L.markerClusterGroup({
    zoomToBoundsOnClick: true,
    disableClusteringAtZoom: 18
});

function marker(data) {
    const geojsonGroup = L.geoJSON(data, {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng);
        },
        onEachFeature: function (feature, layer) {
            layer.on('click', function (e) {
                document.getElementById('filter').scrollTo({top: 0, behavior: 'smooth'});

                map.setView(e.latlng, 18);

                let scope = e.target.feature.properties.scope
                let reasons = e.target.feature.properties.reasons
                let url = e.target.feature.properties.url

                if (Array.isArray(scope)) {
                    scope = scope.join(', ')
                }

                if (Array.isArray(reasons)) {
                    reasons = reasons.join(', ')
                }

                if (url.length > 0) {
                    img = '<img class="mb-3" src="' + url + '" alt="Denkmalschutz Objekt">';
                } else {
                    img = '';
                }

                document.getElementById('details').classList.remove('hidden');
                document.getElementById('img').innerHTML = img;
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