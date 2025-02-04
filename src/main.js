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


const layerStyle = {
  standard: {
    color: '#fff',
    fillColor: '#6ed0ef',
    fillOpacity: 0.4,
    opacity: 0.6,
    weight: 3
  }
}


let previousSelectedMarker = null
let currentLayer = null

const markerClusterGroup = L.markerClusterGroup({
  zoomToBoundsOnClick: true,
  disableClusteringAtZoom: 19
})


const center = [54.79443515, 9.43205485]
const zoomLevelInitial = 13


const map = L.map('map', {
  zoomControl: false
}).setView(center, zoomLevelInitial)


let zoomControl = L.control.zoom({
  position: 'bottomright'
}).addTo(map)


function updateScreen(screen) {
  const title = 'Stadtplan der Denkmalkarte Schleswig-Holstein'

  if (screen === 'home') {
    document.querySelector('title').innerHTML = title
    document.querySelector('meta[property="og:title"]').setAttribute('content', title)
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

      container.appendChild(imageElement)
      container.appendChild(divElement)
    })
    .catch((error) => console.error('Error in fetchBlob:', error))
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

  history.pushState({ 'screen': slug }, '', slug)
  window.dispatchEvent(new Event('popstate'))

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
  history.replaceState({ screen: 'home' }, '', '/')

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
  const url = `https://api.oklabflensburg.de/monument/v1/geometry?slug=${slug}`

  const data = await fetchJsonData(url)
  const zoomLevelDetail = 17

  addMonumentsToMap(data, zoomLevelDetail)
  fetchMonumentPointsByBounds()
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
  console.log(bbox)

  const url = `https://api.oklabflensburg.de/monument/v1/geometries?xmin=${bbox.xmin}&ymin=${bbox.ymin}&xmax=${bbox.xmax}&ymax=${bbox.ymax}`

  const data = await fetchJsonData(url)

  addMonumentsToMap(data, zoomLevelInitial)
}


function addMonumentsToMap(data, zoomLevel) {
  if (currentLayer !== null) {
    currentLayer.removeLayer(currentLayer)
  }
  else {
    currentLayer = markerClusterGroup
  }

  const geojsonGroup = L.geoJSON(data, {
    onEachFeature(feature, layer) {
      const slug = String(feature.properties.slug)
      const path = decodeURIComponent(window.location.pathname)

      if (slug === path.slice(1)) {
        document.querySelector('#about').classList.add('hidden')
        layer.setIcon(selectedIcon)
        previousSelectedMarker = layer
        renderMonumentMeta(feature)
        map.setView(layer._latlng, zoomLevel)
      }

      layer.on('click', async function (e) {
        cleanMonumentMeta()

        if (!e || !e.target || !e.target.feature) {
          console.error('Invalid event object:', e)
          return
        }

        const url = `https://api.oklabflensburg.de/monument/v1/details?monument_id=${e.target.feature.id}`

        const monumentDetailData = await fetchJsonData(url)

        if (!monumentDetailData) {
          console.error('Error: No data returned from fetchJsonData')
          return
        }

        if (!Array.isArray(monumentDetailData)) {
          console.error('Error: Data is not array', monumentDetailData)
          return
        }
        if (isValidUrl(monumentDetailData[0].image_url)) {
          fetchBlob(monumentDetailData[0].image_url, monumentDetailData[0].designation)
        }

        renderMonumentMeta(monumentDetailData[0])
      })
    },
    pointToLayer(feature, latlng) {
      const label = feature.properties.label

      return L.marker(latlng, { icon: defaultIcon }).bindTooltip(label, {
        permanent: false,
        direction: 'top'
      }).openTooltip()
    }
  })

  currentLayer.on('click', function (a) {
    if (previousSelectedMarker !== null) {
      previousSelectedMarker.setIcon(defaultIcon)
    }

    a.layer.setIcon(selectedIcon)
    previousSelectedMarker = a.layer
  })

  currentLayer.addLayer(geojsonGroup)
  map.addLayer(currentLayer)
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


document.querySelector('#sidebarCloseButton').addEventListener('click', function (e) {
  e.preventDefault()

  document.querySelector('#sidebar').classList.add('sm:h-screen')
  document.querySelector('#sidebar').classList.remove('absolute', 'h-screen')
  document.querySelector('#sidebarCloseWrapper').classList.add('hidden')

  history.replaceState({ screen: 'home' }, '', '/')
})


document.addEventListener('DOMContentLoaded', function () {
  L.tileLayer('https://tiles.oklabflensburg.de/sgm/{z}/{x}/{y}.png', {
    maxZoom: 20,
    tileSize: 256,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="dc:rights">OpenStreetMap</a> contributors'
  }).addTo(map)

  map.on('moveend', fetchMonumentPointsByBounds)

  fetchMonumentPointsByBounds()

  map.on('click', function (e) {
    cleanMonumentMeta()
  })

  document.querySelector('#sidebarCloseButton').addEventListener('click', function (e) {
    e.preventDefault()
    cleanMonumentMeta()
  })
})


window.onload = () => {
  const path = decodeURIComponent(window.location.pathname)
  const slug = path.slice(1)

  if (!history.state && path === '/') {
    history.replaceState({ screen: 'home' }, '', '/')
  }
  else if (!history.state && path !== '/') {
    history.replaceState({ screen: path }, '', path)
    fetchMonumentDetailBySlug(slug)
  }
}


// Handle popstate event when navigating back/forward in the history
window.addEventListener('popstate', (event) => {
  if (event.state && event.state.screen === 'home') {
    document.querySelector('#sidebar').classList.add('sm:h-screen')
    document.querySelector('#sidebar').classList.remove('absolute', 'h-screen')
    document.querySelector('#sidebarCloseWrapper').classList.add('hidden')
  }
  else {
    updateScreen('home')
  }
})


// Attach the resize event listener, but ensure proper function reference
window.addEventListener('resize', handleWindowSize)

// Trigger the function initially to handle the initial screen size
handleWindowSize()