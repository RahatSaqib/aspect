import _ from 'lodash'
import {
  createFetch,
  base,
  header,
  accept,
  onResponse
} from 'http-client'
import config from 'config'

import { getJWT } from './localStorage'

export function getBrowserNameAndVersion() {
  const browser = getBrowserInfo()

  if (!browser) {
    return 'Unknown'
  }

  return `${browser.name} ${browser.version}`
}

// fetch with auth and other headers we need
export const aspectFetch = createFetch(
  base(config.aspectApi),
  accept('application/json'),
  header('Content-Type', 'application/json'),
  addAuthHeaderMiddleware,
  onResponse(handleFetchResponse)
)

function addAuthHeaderMiddleware(fetch, input, options = {}) {
  const token = getJWT()
  if (token) {
    (options.headers || (options.headers = {})).Authorization = `Bearer ${token}`
  }
  return fetch(input, options)
}

// adds authorization and content type headers to a request
export function getHeaders(json) {
  const headers = new Headers()

  const token = getJWT()
  if (token) {
    headers.append('Authorization', `Bearer ${token}`)
  }

  if (json) {
    headers.append('Content-Type', 'application/json')
  }

  return headers
}

// using this in a fetch (ajax request) to check if request was successful
export function handleFetchResponse(resp) {
  const json = resp.json()

  if (resp.ok) {
    return json.then((prevJson) => {
      const nextJson = changeAllIdsToString(prevJson)
      return nextJson
    })
  }
  return json.then(Promise.reject.bind(Promise))
}

// returns name and version of the user's browser
function getBrowserInfo() {
  try {
    const ua = navigator.userAgent
    let tem
    let M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || []

    if (/trident/i.test(M[1])) {
      tem = /\brv[ :]+(\d+)/g.exec(ua) || []
      return { name: 'IE ', version: (tem[1] || '') }
    }

    if (M[1] === 'Chrome') {
      tem = ua.match(/\bOPR\/(\d+)/)
      if (tem != null) {
        return { name: 'Opera', version: tem[1] }
      }
    }

    M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?']

    tem = ua.match(/version\/(\d+)/i)

    if (tem != null) { M.splice(1, 1, tem[1]) }
    return {
      name: M[0],
      version: M[1]
    }
  } catch (e) {
    return null
  }
}

// check if a property looks like an ID (key is equal to 'id' or ends with 'Id')
function isIdLike(key) {
  return key === 'id' || key.match(/.+Id$/)
}

// change data type of IDs to a string
// params in react router are always strings
// so this saves us from having to do conversions throught the app
function changeAllIdsToString(data) {
  if (_.isArray(data)) {
    return data.map(changeAllIdsToString)
  } else if (_.isObject(data)) {
    return _.mapValues(data, (value, key) => (isIdLike(key) ?
      (value === null || value === undefined ? value : String(value)) :
      changeAllIdsToString(value)))
  }
  return data
}
