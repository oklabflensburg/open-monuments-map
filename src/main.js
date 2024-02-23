import L from 'leaflet'
import 'leaflet-control-geocoder'
import 'leaflet.markercluster'

import 'leaflet/dist/leaflet.css'
import 'leaflet-control-geocoder/dist/Control.Geocoder.css'

import monuments from 'url:../data/stadt-flensburg-denkmalschutz.geojson'
import districts from 'url:../data/flensburg_stadtteile.geojson'

import markerDefault from 'url:../static/marker-icon-default.webp'
import markerSelected from 'url:../static/marker-icon-active.webp'


const defaultIcon = L.icon({
  iconUrl: markerDefault,
  iconSize: [30, 36],
  iconAnchor: [15, 36],
  tooltipAnchor: [0, -37]
})


const selectedIcon = L.icon({
  iconUrl: markerSelected,
  iconSize: [30, 36],
  iconAnchor: [15, 36],
  tooltipAnchor: [0, -37]
})


const layerStyle = {
  standard: {
    color: '#fff',
    fillColor: '#6ed0ef',
    fillOpacity: 0.4,
    opacity: 0.6,
    weight: 3
  }
}

const map = L.map('map').setView([54.79443515, 9.43205485], 13)

L.tileLayer.wms('https://sgx.geodatenzentrum.de/wms_basemapde?SERVICE=WMS&Request=GetCapabilities', {
  layers: 'de_basemapde_web_raster_grau',
  maxZoom: 20,
  attribution: '<a href="https://www.bkg.bund.de">© GeoBasis-DE / BKG 2024</a> | <a href="https://creativecommons.org/licenses/by/4.0">CC BY 4.0</a>'
}).addTo(map)


window.addEventListener('popstate', (event) => {
  console.debug(`location: ${document.location}, state: ${JSON.stringify(event.state)}`)
})

fetch(monuments, {
  method: 'GET'
}).then((response) => response.json()).then((data) => {
  marker(data)
}).catch(function (error) {
  console.log(error)
})


fetch(districts, {
  method: 'GET'
}).then((response) => response.json()).then((data) => {
  addDistrictsLayer(data)
}).catch(function (error) {
  console.log(error)
})


let geocoder = L.Control.Geocoder.nominatim()
let previousSelectedMarker = null
let slugUrlActive = null


if (typeof URLSearchParams !== 'undefined' && location.search) {
  // parse /?geocoder=nominatim from URL
  const params = new URLSearchParams(location.search)
  const geocoderString = params.get('geocoder')

  if (geocoderString && L.Control.Geocoder[geocoderString]) {
    console.log('Using geocoder', geocoderString)
    geocoder = L.Control.Geocoder[geocoderString]()
  }
  else if (geocoderString) {
    console.warn('Unsupported geocoder', geocoderString)
  }
}

const osmGeocoder = new L.Control.geocoder({
  query: 'Flensburg',
  position: 'topright',
  placeholder: 'Adresse oder Ort',
  defaultMarkGeocode: false
}).addTo(map)


osmGeocoder.on('markgeocode', (e) => {
  const bounds = L.latLngBounds(e.geocode.bbox._southWest, e.geocode.bbox._northEast)
  map.fitBounds(bounds)
})


function imageExists(image_url) {
  const http = new XMLHttpRequest()

  http.open('HEAD', image_url, false)
  http.send()

  return http.status !== 404
}


function addDistrictsLayer(data) {
  L.geoJson(data, {
    style: layerStyle.standard
  }).addTo(map)
}


function capitalizeEachWord(str) {
  return str.replace(/-/g, ' ').replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}


function renderFeatureDetails(feature) {
  const slug = feature.properties.slug
  const address = feature.properties.address
  const postal_code = feature.properties.postal_code
  const district = feature.properties.place_name.slice(6)
  const monument_type = feature.properties.monument_type
  const description = feature.properties.description
  const designation = feature.properties.designation
  const objectId = feature.properties.object_id

  let reasons = feature.properties.reasons
  let scope = feature.properties.scope

  const image_url = `https://efi2.schleswig-holstein.de/dish/dish_opendata/Foto/${objectId}.jpg`

  if (Array.isArray(scope)) {
    scope = scope.join(', ')
  }

  if (Array.isArray(reasons)) {
    reasons = reasons.join(', ')
  }

  const title = `${capitalizeEachWord(slug)} - Denkmalliste Flensburg`

  document.querySelector('title').innerHTML = title
  document.querySelector('meta[property="og:title"]').setAttribute('content', title)
  document.querySelector('meta[property="og:url"]').setAttribute('content', `${window.location.href}${slug}`)

  if (imageExists(image_url)) {
    const image = `<img src="${image_url}" alt="${designation}"><div class="px-3 py-2 w-full text-xs text-gray-100 bg-gray-600">Foto © Landesamt für Denkmalpflege</div>`

    document.querySelector('#detailImage').innerHTML = image
  }

  let detailOutput = ''

  detailOutput += `<li class="pb-2 text-xl lg:text-2xl"><strong>${designation}</strong></li>`
  detailOutput += `<li class="last-of-type:pb-2 py-1 mb-3">${address}<br>${postal_code}  ${district}</li>`
  detailOutput += `<li class="last-of-type:pb-2 pt-2"><strong>Beschreibung</strong><br>${description}</li>`
  detailOutput += `<li class="last-of-type:pb-2 pt-2"><strong>Schutzumfang</strong><br>${scope}</li>`
  detailOutput += `<li class="last-of-type:pb-2 pt-2"><strong>Begründung</strong><br>${reasons}</li>`
  detailOutput += `<li class="pt-2"><strong>Merkmal</strong><br>${monument_type}</li>`

  document.querySelector('#details').classList.remove('hidden')
  document.querySelector('#detailList').innerHTML = detailOutput

  document.querySelector('title').innerHTML = title
  document.querySelector('meta[property="og:title"]').setAttribute('content', title)
}


function marker(data) {
  const markers = L.markerClusterGroup({
    zoomToBoundsOnClick: true,
    disableClusteringAtZoom: 18
  })

  const geojsonGroup = L.geoJSON(data, {
    onEachFeature(feature, layer) {
      const slug = String(feature.properties.slug)
      const path = decodeURIComponent(window.location.pathname)

      if (slug === path.slice(1)) {
        document.querySelector('#about').classList.add('hidden')
        layer.setIcon(selectedIcon)
        previousSelectedMarker = layer
        renderFeatureDetails(feature)
        map.setView(layer._latlng, 19)
        slugUrlActive = true
      }

      layer.on('click', function (e) {
        document.getElementById('filter').scrollTo({
          top: 0,
          left: 0
        })

        const currentZoom = map.getZoom()

        if (currentZoom < 15) {
          map.setView(e.latlng, 15)
        }

        document.querySelector('#detailImage').innerHTML = ''
        document.querySelector('#detailList').innerHTML = ''
        document.querySelector('#about').classList.add('hidden')
        map.setView(e.latlng, 19)
        renderFeatureDetails(e.target.feature)
        history.pushState({ page: slug }, slug, slug)
      })
    },
    pointToLayer(feature, latlng) {
      const label = String(feature.properties.address)

      return L.marker(latlng, { icon: defaultIcon }).bindTooltip(label, {
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