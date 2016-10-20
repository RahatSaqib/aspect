import window from 'global/window'

const { localStorage } = window

export function isDrawerOpen() {
  return localStorage.drawerOpen === 'true'
}

export function updateLanguageAndCulture(lang, culture) {
  localStorage.lang = lang
  localStorage.culture = culture
}

export function updateTimezone(timezone) {
  localStorage.timezone = timezone
}

export function toggleDrawerOpen() {
  localStorage.drawerOpen = !isDrawerOpen()
}

export function closeDrawer() {
  localStorage.drawerOpen = false
}

export function getCulture() {
  return localStorage.culture
}

export function getLang() {
  return localStorage.lang
}

export function getTimezone() {
  return localStorage.timezone
}

export function getClientId() {
  return localStorage.clientId
}

export function getJWT() {
  return localStorage.jwt
}

export function getRefreshToken() {
  return localStorage.refresh
}

export function hasBlankOrExpiredJWT() {
  // if no access token or it is expired or expires within 10 minutes (600s)
  return (
    !localStorage.jwt ||
    !localStorage.jwt_expires ||
    localStorage.jwt_expires < Math.floor(Date.now() / 1000) + 600
  )
}

export function store(access, exp, refresh, clientId) {
  localStorage.jwt = access
  localStorage.jwt_expires = exp
  localStorage.refresh = refresh
  localStorage.clientId = clientId
}

export function clear() {
  localStorage.removeItem('jwt')
  localStorage.removeItem('jwt_expires')
  localStorage.removeItem('refresh')
  localStorage.removeItem('clientId')
  localStorage.removeItem('lang')
  localStorage.removeItem('culture')
  localStorage.removeItem('timezone')
  // FIXME: Add drawerOpen?
}
