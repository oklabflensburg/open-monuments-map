const origin = `${window.location.protocol}//${window.location.hostname}`
console.log(origin)

const websiteOrigin = document.querySelector('#websiteOrigin')
websiteOrigin.href = origin
websiteOrigin.innerHTML = origin

const matomoDisagreeOrigin = document.querySelector('#matomoDisagreeOrigin')
matomoDisagreeOrigin.href = `${origin}/index.php?module=CoreAdminHome&action=optOut&language=de`