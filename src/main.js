import L from 'leaflet'
import 'leaflet-control-geocoder'
import 'leaflet.markercluster'

import 'leaflet/dist/leaflet.css'
import 'leaflet-control-geocoder/dist/Control.Geocoder.css'

import monuments from 'url:../data/stadt-flensburg-denkmalschutz.geojson'
import districts from 'url:../data/flensburg_stadtteile.geojson'

import markerDefault from 'url:../static/marker-icon-default.webp'
import markerSelected from 'url:../static/marker-icon-active.webp'

import { Env } from './env.js'


const env = new Env()
env.injectLinkContent('.contact-mail', 'mailto:', '', env.contactMail, 'E-Mail')


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


let geocoder = L.Control.Geocoder.nominatim()
let previousSelectedMarker = null
let slugUrlActive = null

const center = [54.79443515, 9.43205485]
const map = L.map('map').setView(center, 13)

L.tileLayer.wms('https://sgx.geodatenzentrum.de/wms_basemapde?SERVICE=WMS&Request=GetCapabilities', {
  layers: 'de_basemapde_web_raster_grau',
  maxZoom: 20,
  attribution: '<a href="https://www.bkg.bund.de">© GeoBasis-DE / BKG 2024</a> | <a href="https://creativecommons.org/licenses/by/4.0">CC BY 4.0</a>'
}).addTo(map)


window.addEventListener('popstate', (event) => {
  if (event.state !== null) {
    document.querySelector('#detailImage').innerHTML = ''
    document.querySelector('#detailList').innerHTML = ''
    document.querySelector('#details').classList.remove('hidden')
    document.querySelector('#about').classList.add('hidden')

    map.setView(event.state.latlng, 19)
    renderFeatureDetails(event.state.feature)
  }
  else {
    const latlng = new L.latLng(center[0], center[1])
    document.querySelector('#about').classList.remove('hidden')
    document.querySelector('#details').classList.add('hidden')
    map.setView(latlng, 13)
  }

  // event.state.layer.setIcon(selectedIcon)
  previousSelectedMarker.setIcon(defaultIcon)
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


function fetchBlob(url, designation) {
  fetch(url, {
    method: 'get',
    mode: 'cors'
  }).then((response) => {
    if (response.ok) {
      response.blob().then((blob) => {
        const imageUrl = URL.createObjectURL(blob)
        const imageElement = document.createElement('img')
        imageElement.src = imageUrl
        imageElement.setAttribute('alt', designation)

        const divElement = document.createElement('div')
        divElement.classList.add('px-3', 'py-2', 'w-full', 'text-xs', 'text-gray-100', 'bg-gray-600')
        divElement.innerText = 'Foto © Landesamt für Denkmalpflege'

        const container = document.querySelector('#detailImage')
        container.appendChild(imageElement)
        container.appendChild(divElement)
      })
    }
    else {
      const debugLog = `${url} returned http status code ${response.status}`
      console.debug(debugLog)
    }
  }).catch((error) => {
    console.error(error)
  })
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

  const imageUrl = `https://opendata.schleswig-holstein.de/data/denkmalpflege/fotos/${objectId}.jpg`
  fetchBlob(imageUrl, designation)

  let reasons = feature.properties.reasons
  let scope = feature.properties.scope

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
        history.pushState({ 'feature': e.target.feature, 'latlng': e.latlng }, slug, slug)
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