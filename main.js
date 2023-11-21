window.addEventListener("popstate", (event) => {
    console.debug(`location: ${document.location}, state: ${JSON.stringify(event.state)}`)
})

fetch('./data/stadt-flensburg-denkmalschutz.geojson', {
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


fetch('./data/flensburg_stadtteile.geojson', {
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

L.tileLayer.wms('https://sgx.geodatenzentrum.de/wms_basemapde?SERVICE=WMS&Request=GetCapabilities', {
  layers: 'de_basemapde_web_raster_grau',
  maxZoom: 19,
  attribution: '<a href="https://www.bkg.bund.de">GeoBasis-DE BKG</a> | <a href="https://creativecommons.org/licenses/by/4.0">CC BY 4.0</a>'
}).addTo(map);

/*L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map)*/

let geocoder = L.Control.Geocoder.nominatim()
let previousSelectedMarker = null


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


function imageExists(image_url) {
    const http = new XMLHttpRequest()

    http.open('HEAD', image_url, false)
    http.send()

    return http.status != 404
}


function addDistrictsLayer(data) {
    L.geoJson(data, {
        style: layerStyle.standard,
    }).addTo(map)

    const layer = L.geoJson(data, {
        style: layerStyle.transparent,
    }).addTo(map)
}


function capitalizeEachWord(str) {
    return str.replace(/-/g, ' ').replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    })
}


function renderFeatureDetails(feature) {
    let scope = feature.properties.scope
    let reasons = feature.properties.reasons
    const objectId = feature.properties.object_id
    const image_url = `https://efi2.schleswig-holstein.de/dish/dish_opendata/Foto/${objectId}.jpg`
    let image = ''

    if (Array.isArray(scope)) {
        scope = scope.join(', ')
    }

    if (Array.isArray(reasons)) {
        reasons = reasons.join(', ')
    }

    if (imageExists(image_url)) {
        image = '<img class="mt-1 mb-3" src="' + image_url + '" alt="Denkmalschutz Objekt">'
    }

    const slug = feature.properties.slug
    const address = feature.properties.address
    const postal_code = feature.properties.postal_code
    const district = feature.properties.place_name.slice(6)
    const designation = feature.properties.designation

    document.getElementById('details').classList.remove('hidden')
    document.getElementById('address').innerHTML = address + '<br>' + postal_code + ' ' + district
    document.getElementById('monument_type').innerHTML = feature.properties.monument_type
    document.getElementById('designation').innerHTML = feature.properties.designation
    document.getElementById('description').innerHTML = feature.properties.description
    document.getElementById('reasons').innerHTML = reasons
    document.getElementById('scope').innerHTML = scope
    document.getElementById('img').innerHTML = image

    const title = `Denkmalliste - ${capitalizeEachWord(slug)}`

    document.querySelector('title').innerHTML = title
    document.querySelector('meta[property="og:title"]').setAttribute('content', title)
    document.querySelector('meta[property="og:url"]').setAttribute('content', `${window.location.href}${slug}`)
}


const defaultIcon = L.icon({
    iconUrl: './static/marker-icon-blue.png',
    shadowUrl: './static/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    tooltipAnchor: [2, -41],
    shadowSize: [45, 41]
})


const selectedIcon = L.icon({
    iconUrl: './static/marker-icon-green.png',
    shadowUrl: './static/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    tooltipAnchor: [2, -41],
    shadowSize: [45, 41]
})


function marker(data) {
    let markers = L.markerClusterGroup({
        zoomToBoundsOnClick: true,
        disableClusteringAtZoom: 18
    })

    const geojsonGroup = L.geoJSON(data, {
        onEachFeature: function (feature, layer) {
            const slug = String(feature.properties.slug)
            const path = decodeURIComponent(window.location.pathname)

            if (slug === path.slice(1)) {
                layer.setIcon(selectedIcon)
                previousSelectedMarker = layer
                renderFeatureDetails(feature)
                map.setView(layer._latlng, 18)
            }

            layer.on('click', function (e) {
                document.getElementById('filter').scrollTo({
                    top: 0,
                    left: 0
                })

                const slug = e.target.feature.properties.slug

                map.setView(e.latlng, 18)
                renderFeatureDetails(e.target.feature)
                history.pushState({ page: slug }, designation, slug)
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

        a.layer.setIcon(selectedIcon)
        previousSelectedMarker = a.layer
    })

    markers.addLayer(geojsonGroup)
    map.addLayer(markers)
}
