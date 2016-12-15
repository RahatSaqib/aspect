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
      (value === null || value === undefined || _.isObject(value) ? value : String(value)) :
      changeAllIdsToString(value)))
  }
  return data
}
