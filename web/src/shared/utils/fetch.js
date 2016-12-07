import _ from 'lodash'
import {
  createFetch,
  base,
  header,
  accept,
  recv
} from 'http-client'
import { showErrorNotification } from '../../error/ErrorRedux'

import config from '../../config'
import { getJWT } from './localStorage'

// fetch with auth and other headers we need
export function aspectFetch(path, options) {
  const fetch = createFetch(
    base(config.aspectApi),
    accept('application/json'),
    header('Content-Type', 'application/json'),
    addAuthHeaderMiddleware,
    recv(handleFetchResponse(options))
  )
  return fetch(path, options)
}

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
export function handleFetchResponse(options) {
  return (resp) => {
    const json = resp.json()
    if (resp.ok) {
      return json.then((prevJson) => {
        const nextJson = changeAllIdsToString(prevJson)
        return nextJson
      })
    }
    return json.then((err) => {
      let errorNotification = _.get(options, `errorNotifications.${err.statusCode}`) ||
        _.get(options, 'errorNotifications.default')
      if (errorNotification) {
        if (errorNotification[err.message]) {
          errorNotification = errorNotification[err.message]
        } else if (errorNotification.default) {
          errorNotification = errorNotification.default
        }
        const store = require('../../store').default
        store.dispatch(showErrorNotification(errorNotification, err))
      }
      return Promise.reject(err)
    })
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
