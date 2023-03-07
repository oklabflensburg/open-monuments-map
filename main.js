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

let geocoder = L.Control.Geocoder.nominatim();

if (typeof URLSearchParams !== 'undefined' && location.search) {
    // parse /?geocoder=nominatim from URL
    let params = new URLSearchParams(location.search);
    let geocoderString = params.get('geocoder');

    if (geocoderString && L.Control.Geocoder[geocoderString]) {
        console.log('Using geocoder', geocoderString);
        geocoder = L.Control.Geocoder[geocoderString]();
    } else if (geocoderString) {
        console.warn('Unsupported geocoder', geocoderString);
    }
}

const osmGeocoder = new L.Control.geocoder({
    query: 'Flensburg',
    position: 'topright',
    placeholder: 'Adresse oder Ort',
    defaultMarkGeocode: false
}).addTo(map);

osmGeocoder.on('markgeocode', e => {
    console.log(e);
    const bounds = L.latLngBounds(e.geocode.bbox._southWest, e.geocode.bbox._northEast);
    map.fitBounds(bounds);
});

function marker(data) {
    let markers = L.markerClusterGroup({
        zoomToBoundsOnClick: true,
        disableClusteringAtZoom: 18
    });

    const geojsonGroup = L.geoJSON(data, {
        onEachFeature: function (feature, layer) {
            layer.on('click', function (e) {
                document.getElementById('filter').scrollTo({top: 0, behavior: 'smooth'});

                map.setView(e.latlng, 19);

                let scope = e.target.feature.properties.scope
                let reasons = e.target.feature.properties.reasons
                let url = e.target.feature.properties.url
                let image = '';

                if (Array.isArray(scope)) {
                    scope = scope.join(', ')
                }

                if (Array.isArray(reasons)) {
                    reasons = reasons.join(', ')
                }

                if (url.length > 0) {
                    image = '<img class="mt-1 mb-3" src="' + url + '" alt="Denkmalschutz Objekt">';
                }

                document.getElementById('details').classList.remove('hidden');
                document.getElementById('address').innerHTML = e.target.feature.properties.address;
                document.getElementById('type').innerHTML = e.target.feature.properties.type;
                document.getElementById('designation').innerHTML = e.target.feature.properties.designation;
                document.getElementById('description').innerHTML = e.target.feature.properties.description;
                document.getElementById('reasons').innerHTML = reasons;
                document.getElementById('scope').innerHTML = scope;
                document.getElementById('img').innerHTML = image;
            })
        },
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng);
        }
    });

    markers.addLayer(geojsonGroup);
    map.addLayer(markers);
}