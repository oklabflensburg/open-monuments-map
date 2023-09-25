fetch('/data/stadt-flensburg-denkmalschutz.geojson', {
    method: 'GET'
})
.then((response) => {
    return response.json()
})
.then((data) => {
    marker(data)
})
.catch(function (error) {
    console.log(error)
})


fetch('/data/flensburg_stadtteile.geojson', {
    method: 'GET'
})
.then((response) => {
    return response.json()
})
.then((data) => {
    addDistrictsLayer(data)
})
.catch(function (error) {
    console.log(error)
})


const layerStyle = {
    transparent: {
        color: 'transparent',
        fillColor: 'transparent',
        fillOpacity: 0.7,
        opacity: 0.6,
        weight: 1
    },
    standard: {
        color: '#fff',
        fillColor: '#185a44',
        fillOpacity: 0.4,
        opacity: 0.6,
        weight: 1
    },
    click: {
        color: '#fff',
        fillColor: '#002db4',
        fillOpacity: 0.4,
        opacity: 0.8,
        weight: 4
    }
}


const map = L.map('map').setView([54.7836, 9.4321], 13)

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map)

let geocoder = L.Control.Geocoder.nominatim()

if (typeof URLSearchParams !== 'undefined' && location.search) {
    // parse /?geocoder=nominatim from URL
    let params = new URLSearchParams(location.search)
    let geocoderString = params.get('geocoder')

    if (geocoderString && L.Control.Geocoder[geocoderString]) {
        console.log('Using geocoder', geocoderString)
        geocoder = L.Control.Geocoder[geocoderString]()
    } else if (geocoderString) {
        console.warn('Unsupported geocoder', geocoderString)
    }
}

const osmGeocoder = new L.Control.geocoder({
    query: 'Flensburg',
    position: 'topright',
    placeholder: 'Adresse oder Ort',
    defaultMarkGeocode: false
}).addTo(map)


osmGeocoder.on('markgeocode', e => {
    const bounds = L.latLngBounds(e.geocode.bbox._southWest, e.geocode.bbox._northEast)
    map.fitBounds(bounds)
})


function addDistrictsLayer(data) {
    L.geoJson(data, {
        style: layerStyle.standard,
    }).addTo(map)

    const layer = L.geoJson(data, {
        style: layerStyle.transparent,
    }).addTo(map)
}


function marker(data) {
    let previousSelectedMarker = null
    let markers = L.markerClusterGroup({
        zoomToBoundsOnClick: true,
        disableClusteringAtZoom: 18
    })

    const defaultIcon = L.icon({
        iconUrl: '/static/marker-icon-blue.png',
        shadowUrl: '/static/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        tooltipAnchor: [2, -41],
        shadowSize: [45, 41]
    })

    const geojsonGroup = L.geoJSON(data, {
        onEachFeature: function (feature, layer) {
            layer.on('click', function (e) {
                document.getElementById('filter').scrollTo({
                    top: 0,
                    left: 0
                })

                map.setView(e.latlng, 19)

                let scope = e.target.feature.properties.scope
                let reasons = e.target.feature.properties.reasons
                let url = e.target.feature.properties.url
                let image = ''

                if (Array.isArray(scope)) {
                    scope = scope.join(', ')
                }

                if (Array.isArray(reasons)) {
                    reasons = reasons.join(', ')
                }

                if (url.length > 0) {
                    image = '<img class="mt-1 mb-3" src="' + url + '" alt="Denkmalschutz Objekt">'
                }

                let address = e.target.feature.properties.address
                let postal_code = e.target.feature.properties.postal_code
                let district = e.target.feature.properties.district.slice(6)

                document.getElementById('details').classList.remove('hidden')
                document.getElementById('address').innerHTML = address + '<br>' + postal_code + ' ' + district
                document.getElementById('type').innerHTML = e.target.feature.properties.type
                document.getElementById('designation').innerHTML = e.target.feature.properties.designation
                document.getElementById('description').innerHTML = e.target.feature.properties.description
                document.getElementById('reasons').innerHTML = reasons
                document.getElementById('scope').innerHTML = scope
                document.getElementById('img').innerHTML = image
            })
        },
        pointToLayer: function (feature, latlng) {
            const label = String(feature.properties.address)

            return L.marker(latlng, {icon: defaultIcon}).bindTooltip(label, {
                permanent: false,
                direction: 'top'
            }).openTooltip()
        }
    })


    markers.on('click', function (a) {
        if (previousSelectedMarker !== null) {
            previousSelectedMarker.setIcon(defaultIcon)
        }
        
        const selectedIcon = L.icon({
            iconUrl: '/static/marker-icon-green.png',
            shadowUrl: '/static/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            tooltipAnchor: [2, -41],
            shadowSize: [45, 41]
        })

        a.layer.setIcon(selectedIcon)
        previousSelectedMarker = a.layer
    })

    markers.addLayer(geojsonGroup)
    map.addLayer(markers)
}
