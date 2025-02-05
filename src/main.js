import L from 'leaflet'
import 'leaflet.markercluster'

import 'leaflet/dist/leaflet.css'

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

// Store markers by slug
const markerMap = new Map()

// Flag to ensure fitBounds is called only once
let isBoundsSet = false
let previousSelectedMarker = null
let currentLayer = null

const center = [54.79443515, 9.43205485]
const zoomLevelInitial = 13
const addMonumentsByBounds = false

const markerClusterGroup = L.markerClusterGroup({
  zoomToBoundsOnClick: true,
  disableClusteringAtZoom: 18
})

const map = L.map('map', {
  zoomControl: false
}).setView(center, zoomLevelInitial)


let zoomControl = L.control.zoom({
  position: 'bottomright'
}).addTo(map)


function updateScreen(screen) {
  const title = 'Digitale Denkmalkarte für Schleswig-Holstein'

  if (screen === 'home') {
    document.title = title
    document.querySelector('meta[property="og:title"]').setAttribute('content', title)
  }
  else {
    document.title = `${screen} - ${title}`
    document.querySelector('meta[property="og:title"]').setAttribute('content', `${screen} - ${title}`)
  }
}


function fetchBlob(url, designation) {
  if (!url || typeof url !== 'string') {
    console.error('Invalid URL passed to fetchBlob:', url)
    return
  }

  fetch(url, { method: 'get', mode: 'cors' })
    .then((response) => {
      if (!response.ok) {
        console.warn(`${url} returned HTTP status code ${response.status}`)
        return null
      }
      return response.blob()
    })
    .then((blob) => {
      if (!blob) {
        console.error('Failed to retrieve image blob from response')
        return
      }

      const imageUrl = URL.createObjectURL(blob)
      const imageElement = document.createElement('img')
      imageElement.src = imageUrl
      imageElement.setAttribute('alt', designation || 'Denkmalschutz')

      const divElement = document.createElement('div')
      divElement.classList.add('px-3', 'py-2', 'w-full', 'text-xs', 'text-gray-100', 'bg-gray-600')
      divElement.innerText = 'Foto © Landesamt für Denkmalpflege'

      const container = document.querySelector('#detailImage')

      if (!container) {
        console.error('Element #detailImage not found')
        return
      }
      else {
        container.innerHTML = ''
      }

      container.appendChild(imageElement)
      container.appendChild(divElement)
    })
    .catch((error) => console.error('Error in fetchBlob:', error))
}


function capitalizeEachWord(str) {
  return str.replace(/-/g, ' ').replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}


function isValidUrl(string) {
  try {
    const url = new URL(string)
    return url.protocol === 'http:' || url.protocol === 'https:'
  }
  catch (_) {
    return false
  }
}


function renderMonumentMeta(data) {
  const slug = data.slug
  const street = data.street
  const housenumber = data.housenumber
  const postcode = data.postcode
  const city = data.city
  const monumentType = data.monument_type
  const description = data.description
  const designation = data.designation
  const objectId = data.object_id
  const monumentReason = data.monument_reason
  const monumentScope = data.monument_scope

  const title = `${capitalizeEachWord(slug)} - Digitale Denkmalkarte`

  document.querySelector('title').innerHTML = title
  document.querySelector('meta[property="og:title"]').setAttribute('content', title)
  document.querySelector('meta[property="og:url"]').setAttribute('content', `${window.location.href}${slug}`)

  let detailOutput = ''

  detailOutput += `<li class="pb-2 text-xl lg:text-2xl"><strong>${designation}</strong></li>`
  detailOutput += `<li class="last-of-type:pb-2 py-1 mb-3">${street} ${housenumber}<br>${postcode} ${city}</li>`
  detailOutput += `<li class="last-of-type:pb-2 pt-2"><strong>Beschreibung</strong><br>${description}</li>`

  if (monumentScope) {
    detailOutput += `<li class="last-of-type:pb-2 pt-2"><strong>Schutzumfang</strong><br>${monumentScope}</li>`
  }

  if (monumentReason) {
    detailOutput += `<li class="last-of-type:pb-2 pt-2"><strong>Begründung</strong><br>${monumentReason}</li>`
  }

  detailOutput += `<li class="pt-2"><strong>Merkmal</strong><br>${monumentType}</li>`

  const detailList = document.querySelector('#detailList')

  document.querySelector('title').innerHTML = title
  document.querySelector('meta[property="og:title"]').setAttribute('content', title)

  detailList.innerHTML = detailOutput
  document.querySelector('#about').classList.add('hidden')
  document.querySelector('#sidebar').classList.add('absolute')
  document.querySelector('#sidebar').classList.remove('hidden')
  document.querySelector('#sidebarContent').classList.remove('hidden')
  document.querySelector('#sidebarCloseWrapper').classList.remove('block')
}


function cleanMonumentMeta() {
  document.querySelector('#detailList').innerHTML = ''
  document.querySelector('#detailImage').innerHTML = ''
  document.querySelector('#sidebar').classList.add('hidden')
  document.querySelector('#sidebar').classList.remove('absolute')
  document.querySelector('#about').classList.remove('hidden')
  document.querySelector('#sidebarContent').classList.add('hidden')
}


async function fetchJsonData(url) {
  try {
    const response = await fetch(url, { method: 'GET' })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    return await response.json()
  }
  catch (error) {
    console.error('Fetch error:', error)

    return null
  }
}


async function fetchMonumentDetailBySlug(slug) {
  const url = `https://api.oklabflensburg.de/monument/v1/detail?slug=${slug}`

  const data = await fetchJsonData(url)
  const zoomLevelDetail = 17

  const geoJsonData = {
    'type': 'FeatureCollection',
    'features': [{
      'type': 'Feature',
      'id': data[0]['id'],
      'geometry': {
        'type': data[0]['geojson']['type'],
        'coordinates': data[0]['geojson']['coordinates']
      },
      'properties': {
        'label': data[0]['label'],
        'slug': data[0]['slug']
      }
    }]
  }

  if (isValidUrl(data[0].image_url)) {
    fetchBlob(data[0].image_url, data[0].designation)
  }

  renderMonumentMeta(data[0])
  addMonumentsToMap(geoJsonData, true, zoomLevelDetail)

  const matchingMarker = findMarkerById(data[0]['id'])

  if (matchingMarker) {
    setSelectedMarker(matchingMarker)
  }
}


async function fetchMonumentDetailById(id) {
  const url = `https://api.oklabflensburg.de/monument/v1/details?monument_id=${id}`

  const data = await fetchJsonData(url)
  const zoomLevelDetail = 17

  const geoJsonData = {
    'type': 'FeatureCollection',
    'features': [{
      'type': 'Feature',
      'id': data[0]['id'],
      'geometry': {
        'type': data[0]['geojson']['type'],
        'coordinates': data[0]['geojson']['coordinates']
      },
      'properties': {
        'label': data[0]['label'],
        'slug': data[0]['slug']
      }
    }]
  }

  if (isValidUrl(data[0].image_url)) {
    fetchBlob(data[0].image_url, data[0].designation)
  }

  navigateTo(data[0]['slug'])
  renderMonumentMeta(data[0])
  addMonumentsToMap(geoJsonData, addMonumentsByBounds, zoomLevelDetail)


  const matchingMarker = findMarkerById(data[0]['id'])

  if (matchingMarker) {
    setSelectedMarker(matchingMarker)
  }
}


// https://api.oklabflensburg.de/monument/v1/geometries
async function fetchMonumentPointsByBounds() {
  const bounds = map.getBounds()
  const bbox = {
    xmin: bounds.getWest(),
    ymin: bounds.getSouth(),
    xmax: bounds.getEast(),
    ymax: bounds.getNorth()
  }

  const url = `https://api.oklabflensburg.de/monument/v1/geometries?xmin=${bbox.xmin}&ymin=${bbox.ymin}&xmax=${bbox.xmax}&ymax=${bbox.ymax}`

  const data = await fetchJsonData(url)

  addMonumentsToMap(data, addMonumentsByBounds, zoomLevelInitial)
}


function addMonumentsToMap(data, fetchAdditionalMonuments, zoomLevel) {
  // Remove the existing layer
  if (currentLayer !== null) {
    currentLayer.removeLayer(currentLayer)
  }
  else {
    currentLayer = markerClusterGroup
  }

  const geojsonGroup = L.geoJSON(data, {
    onEachFeature(feature, layer) {
      const id = feature.id

      // Store marker reference in markerMap
      markerMap.set(id, layer)

      layer.on('click', async function (e) {
        cleanMonumentMeta()

        if (!e || !e.target || !e.target.feature) {
          console.error('Invalid event object:', e)
          return
        }

        await fetchMonumentDetailById(id)

        // Set selected icon when a marker is clicked
        setSelectedMarker(e.target)
      })
    },
    pointToLayer(feature, latlng) {
      return L.marker(latlng, { icon: defaultIcon })
        .bindTooltip(feature.properties.label, { permanent: false, direction: 'top' })
        .openTooltip()
    }
  })

  currentLayer.addLayer(geojsonGroup)
  map.addLayer(currentLayer)

  // Fit map bounds
  if (!isBoundsSet) {
    map.fitBounds(currentLayer.getBounds(), { maxZoom: zoomLevel })
    isBoundsSet = true
  }
}


function handleWindowSize() {
  const innerWidth = window.innerWidth

  if (innerWidth >= 1024) {
    map.removeControl(zoomControl)

    zoomControl = L.control.zoom({
      position: 'topleft'
    }).addTo(map)
  }
  else {
    map.removeControl(zoomControl)
  }
}


// Find marker by slug
function findMarkerById(slug) {
  return markerMap.get(slug) || null
}


// Set the selected marker
function setSelectedMarker(marker) {
  if (previousSelectedMarker !== null) {
    previousSelectedMarker.setIcon(defaultIcon) // Reset previous marker
  }

  marker.setIcon(selectedIcon)
  previousSelectedMarker = marker
}


// Function to handle navigation changes
function navigateTo(screen, updateHistory = true) {
  const currentState = history.state

  // Avoid pushing a duplicate entry
  if (currentState && currentState.screen === screen) {
    return
  }

  if (updateHistory) {
    history.pushState({ screen }, '', screen === 'home' ? '/' : `/${screen}`)
  }

  updateScreen(screen)
}


// Handle initial page load
window.onload = () => {
  // Initialize the map and handle events after DOM is ready
  L.tileLayer('https://tiles.oklabflensburg.de/sgm/{z}/{x}/{y}.png', {
    maxZoom: 20,
    tileSize: 256,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="dc:rights">OpenStreetMap</a> contributors'
  }).addTo(map)

  // Attach event listeners
  map.on('moveend', fetchMonumentPointsByBounds)
  map.on('click', cleanMonumentMeta)

  // Sidebar close button handler
  document.querySelector('#sidebarCloseButton').addEventListener('click', function (e) {
    e.preventDefault()
    cleanMonumentMeta()
  })

  // Get the current path and determine screen
  const path = decodeURIComponent(window.location.pathname)
  const screen = path === '/' ? 'home' : path.slice(1) // Remove leading "/"

  // Ensure history state is set correctly
  if (!history.state) {
    history.replaceState({ screen }, '', path)
  }

  updateScreen(screen)

  // Load content based on the screen
  if (screen === 'home') {
    fetchMonumentPointsByBounds()
  }
  else {
    fetchMonumentDetailBySlug(screen)
  }
}

// Handle back/forward button navigation
window.addEventListener('popstate', (event) => {
  // If event.state exists, use it; otherwise, determine from pathname
  const screen = event.state && event.state.screen ? event.state.screen : 'home'

  if (screen === 'home') {
    cleanMonumentMeta()
    fetchMonumentPointsByBounds()
  }
  else {
    fetchMonumentDetailBySlug(screen)
  }
})


// Attach the resize event listener, but ensure proper function reference
window.addEventListener('resize', handleWindowSize)

// Trigger the function initially to handle the initial screen size
handleWindowSize()