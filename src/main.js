import L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet/dist/leaflet.css'

import markerDefault from 'url:../static/marker-icon-default.webp'
import markerSelected from 'url:../static/marker-icon-active.webp'

import { Env } from './env.js'

// Initialize environment
const env = new Env()
env.injectLinkContent('.contact-mail', 'mailto:', '', env.contactMail, 'E-Mail')

// Map configuration
const center = [54.79443515, 9.43205485]
const zoomLevelInitial = 13
const zoomLevelDetail = 19
const addMonumentsByBounds = false

const map = L.map('map', { zoomControl: false }).setView(center, zoomLevelInitial)
const markerClusterGroup = L.markerClusterGroup({
  zoomToBoundsOnClick: true,
  disableClusteringAtZoom: 19,
})
let zoomControl = L.control.zoom({ position: 'bottomright' }).addTo(map)

// Marker icons
const defaultIcon = L.icon({
  iconUrl: markerDefault,
  iconSize: [30, 36],
  iconAnchor: [15, 36],
  tooltipAnchor: [0, -37],
})

const selectedIcon = L.icon({
  iconUrl: markerSelected,
  iconSize: [30, 36],
  iconAnchor: [15, 36],
  tooltipAnchor: [0, -37],
})

// State variables
const markerMap = new Map()
let isBoundsSet = false
let previousSelectedMarker = null
let currentLayer = null

// Utility functions
function capitalizeEachWord(str) {
  return str.replace(/-/g, ' ').replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  )
}

function isValidUrl(string) {
  try {
    const url = new URL(string)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function findMarkerById(id) {
  const marker = markerMap.get(id)
  if (marker && typeof marker.setIcon === 'function') return marker
  console.warn(`Marker with ID ${id} is not a valid Leaflet marker.`)
  return null
}

function setSelectedMarker(marker) {
  if (!marker || typeof marker.setIcon !== 'function') {
    console.error('Invalid marker passed to setSelectedMarker:', marker)
    return
  }
  if (previousSelectedMarker) previousSelectedMarker.setIcon(defaultIcon)
  marker.setIcon(selectedIcon)
  previousSelectedMarker = marker
}

// Map-related functions
function addMonumentsToMap(data, fetchAdditionalMonuments, zoomLevel) {
  if (currentLayer) currentLayer.removeLayer(currentLayer)
  else currentLayer = markerClusterGroup

  const geojsonGroup = L.geoJSON(data, {
    onEachFeature(feature, layer) {
      const id = feature.id
      markerMap.set(id, layer)
      layer.on('click', async () => {
        cleanMonumentMeta()
        await fetchMonumentDetailById(id)
        setSelectedMarker(layer)
      })
    },
    pointToLayer(feature, latlng) {
      return L.marker(latlng, { icon: defaultIcon }).bindTooltip(feature.properties.label, {
        permanent: false,
        direction: 'top',
      })
    },
  })

  currentLayer.addLayer(geojsonGroup)
  map.addLayer(currentLayer)

  if (!isBoundsSet) {
    map.fitBounds(currentLayer.getBounds(), { zoom: zoomLevel })
    isBoundsSet = true
  }
}

function handleWindowSize() {
  const innerWidth = window.innerWidth
  map.removeControl(zoomControl)
  zoomControl = L.control.zoom({ position: innerWidth >= 1024 ? 'topleft' : 'bottomright' }).addTo(map)
}

// Fetch functions
async function fetchJsonData(url) {
  try {
    const response = await fetch(url, { method: 'GET' })
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`)
    return await response.json()
  } catch (error) {
    console.error('Fetch error:', error)
    return null
  }
}

async function fetchBlob(url, monumentFunction) {
  if (!url || typeof url !== 'string') return

  try {
    const response = await fetch(url, { method: 'get', mode: 'cors' })
    if (!response.ok) {
      console.warn(`${url} returned HTTP status code ${response.status}`)
      return
    }
    const blob = await response.blob()
    const imageUrl = URL.createObjectURL(blob)
    const imageElement = document.createElement('img')
    imageElement.src = imageUrl
    imageElement.setAttribute('alt', monumentFunction || 'Denkmalschutz')

    const divElement = document.createElement('div')
    divElement.classList.add('px-3', 'py-2', 'w-full', 'text-xs', 'text-gray-100', 'bg-gray-600')
    divElement.innerText = 'Foto © Landesamt für Denkmalpflege'

    const container = document.querySelector('#detailImage')
    if (!container) {
      console.error('Element #detailImage not found')
      return
    }
    container.appendChild(imageElement)
    container.appendChild(divElement)
  } catch (error) {
    console.error('Error in fetchBlob:', error)
  }
}

async function fetchMonumentPointsByBounds() {
  const bounds = map.getBounds()
  const bbox = {
    xmin: bounds.getWest(),
    ymin: bounds.getSouth(),
    xmax: bounds.getEast(),
    ymax: bounds.getNorth(),
  }

  const url = `${process.env.PARCEL_BASE_API_URL}/monument/v1/geometries?xmin=${bbox.xmin}&ymin=${bbox.ymin}&xmax=${bbox.xmax}&ymax=${bbox.ymax}`
  const data = await fetchJsonData(url)
  addMonumentsToMap(data, addMonumentsByBounds, zoomLevelInitial)

  if (previousSelectedMarker) {
    const previousMarkerId = previousSelectedMarker.feature.id
    const newSelectedMarker = findMarkerById(previousMarkerId)
    if (newSelectedMarker) setSelectedMarker(newSelectedMarker)
  }
}

async function fetchMonumentDetailBySlug(slug) {
  const url = `${process.env.PARCEL_BASE_API_URL}/monument/v1/detail?slug=${slug}`
  const data = await fetchJsonData(url)

  if (!data || !data[0]) return

  const geoJsonData = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: data[0].id,
        geometry: data[0].geojson,
        properties: { label: data[0].label, slug: data[0].slug },
      },
    ],
  }

  if (isValidUrl(data[0].photo_link)) {
    document.querySelector('#detailImage').innerHTML = ''
    fetchBlob(data[0].photo_link, data[0].monument_function)
  }

  renderMonumentMeta(data[0])
  addMonumentsToMap(geoJsonData, true, zoomLevelDetail)

  let matchingMarker = findMarkerById(data[0].id)
  if (!matchingMarker) {
    console.warn('No matching marker found. Loading additional markers...')
    await fetchMonumentPointsByBounds()
    matchingMarker = findMarkerById(data[0].id)
  }
  if (matchingMarker) setSelectedMarker(matchingMarker)

  return data
}

async function fetchMonumentDetailById(id) {
  const url = `${process.env.PARCEL_BASE_API_URL}/monument/v1/details?monument_id=${id}`
  const data = await fetchJsonData(url)

  if (!data || !data[0]) return

  if (isValidUrl(data[0].photo_link)) fetchBlob(data[0].photo_link, data[0].monument_function)

  navigateTo(data[0].slug)
  renderMonumentMeta(data[0])
}

// UI-related functions
function renderMonumentMeta(data) {
  const { slug, street, housenumber, postcode, city, last_update, monument_type, description, monument_function, object_number, monument_scope } = data

  const title = `${capitalizeEachWord(slug || monument_function || object_number)} - Digitale Denkmalkarte`
  document.title = title
  document.querySelector('meta[property="og:title"]').setAttribute('content', title)
  document.querySelector('meta[property="og:url"]').setAttribute('content', `${window.location.href}${slug}`)

  let detailOutput = `
    <li class="pb-2 text-xl lg:text-2xl"><strong>${monument_function}</strong></li>
    <li class="last-of-type:pb-2 py-1 mb-3">${street} ${housenumber}<br>${postcode} ${city}</li>
    <li class="last-of-type:pb-2 pt-2"><strong>Beschreibung</strong><br>${description}</li>
  `

  if (monument_scope) detailOutput += `<li class="last-of-type:pb-2 pt-2"><strong>Schutzumfang</strong><br>${monument_scope}</li>`
  if (last_update) {
    const date = new Date(last_update)
    const formattedDate = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`
    detailOutput += `<li class="last-of-type:pb-2 pt-2"><strong>Aktualisiert</strong><br>${formattedDate}</li>`
  }
  detailOutput += `<li class="pt-2"><strong>Merkmal</strong><br>${monument_type}</li>`

  document.querySelector('#detailList').innerHTML = detailOutput
  document.querySelector('#about').classList.add('hidden')
  document.querySelector('#sidebar').classList.add('absolute')
  document.querySelector('#sidebar').classList.remove('hidden')
  document.querySelector('#sidebarContent').classList.remove('hidden')
}

function cleanMonumentMeta() {
  document.querySelector('#detailList').innerHTML = ''
  document.querySelector('#detailImage').innerHTML = ''
  document.querySelector('#sidebar').classList.add('hidden')
  document.querySelector('#sidebar').classList.remove('absolute')
  document.querySelector('#about').classList.remove('hidden')
  document.querySelector('#sidebarContent').classList.add('hidden')
}

function navigateTo(screen, updateHistory = true) {
  if (updateHistory) history.pushState({ screen }, '', screen === 'home' ? '/' : `/${screen}`)
  updateScreen(screen)
}

function updateScreen(screen) {
  const title = 'Digitale Denkmalkarte für Schleswig-Holstein'
  document.title = screen === 'home' ? title : `${screen} - ${title}`
  document.querySelector('meta[property="og:title"]').setAttribute('content', document.title)
}

// Event listeners
window.onload = async () => {
  L.tileLayer('https://tiles.oklabflensburg.de/sgm/{z}/{x}/{y}.png', {
    maxZoom: 20,
    tileSize: 256,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="dc:rights">OpenStreetMap</a> contributors',
  }).addTo(map)

  map.on('moveend', fetchMonumentPointsByBounds)
  map.on('click', cleanMonumentMeta)

  document.querySelector('#sidebarCloseButton')?.addEventListener('click', (e) => {
    e.preventDefault()
    cleanMonumentMeta()
  })

  document.querySelector('#sidebarToggle')?.addEventListener('click', (e) => {
    e.preventDefault()
    document.querySelector('#sidebar').classList.toggle('translate-y-full')
  })

  const path = decodeURIComponent(window.location.pathname)
  const screen = path === '/' ? 'home' : path.slice(1)
  if (!history.state) history.replaceState({ screen }, '', path)

  updateScreen(screen)

  if (screen === 'home') {
    map.setView(center, zoomLevelInitial) // Use default center for home
    fetchMonumentPointsByBounds()
  } else {
    const data = await fetchMonumentDetailBySlug(screen)
    if (data && data[0] && data[0].geojson && data[0].geojson.coordinates) {
      const [lng, lat] = data[0].geojson.coordinates // Use slug coordinates as center
      map.setView([lat, lng], zoomLevelDetail)
    }
  }
}

window.addEventListener('popstate', (event) => {
  const screen = event.state?.screen || 'home'
  if (screen === 'home') {
    cleanMonumentMeta()
    fetchMonumentPointsByBounds()
  } else fetchMonumentDetailBySlug(screen)
})

window.addEventListener('resize', handleWindowSize)
handleWindowSize()