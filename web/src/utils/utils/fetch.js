/* eslint-disable max-classes-per-file */
/* eslint-disable no-loop-func */
/* eslint-env es6 */
import { createFetch, base, header, accept } from 'http-client'
import get from 'lodash/get'
import isArray from 'lodash/isArray'
import isObject from 'lodash/isObject'
import mapValues from 'lodash/mapValues'
import set from 'lodash/set'
import trim from 'lodash/trim'
import { defineMessages } from 'react-intl'
import config from '../../config'
import { showError } from '../../store/AppNotificationRedux'
import { setLastServerResponseTime } from '../../store/GlobalsRedux'
import { getAspectAccess } from '../LocalStorage'

export const aspectFetchFile = createFetch(
  base(config.aspectApi),
  header('Content-Type', 'application/octet-stream'),
  addAuthHeaderMiddleware,
  handleFetchResponseOrError
)

export const aspectFetch = createFetch(
  base(config.aspectApi),
  accept('application/json'),
  header('Content-Type', 'application/json'),
  addAuthHeaderMiddleware,
  handleFetchResponseOrError
)

export default aspectFetch

function addAuthHeaderMiddleware(fetch, input, options = {}) {
  const token = getAspectAccess()
  if (token) {
    set(options, 'headers.Authorization', `Bearer ${token}`)
  }
  return fetch(input, options)
}

class APIApplicationError extends Error {
  constructor(data, ...args) {
    super(...args)
    // We need to pass here the new errorKeyCode prop.
    this.data = data
    // make `instanceof APIApplicationError` work in ES5 for Jest
    this.constructor = APIApplicationError
    this.__proto__ = APIApplicationError.prototype // eslint-disable-line no-proto
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIApplicationError)
    }
  }
}

class ConnectionError extends Error {
  constructor(...args) {
    super(...args)
    // make `instanceof ConnectionError` work in ES5 for Jest
    this.constructor = ConnectionError
    this.__proto__ = ConnectionError.prototype // eslint-disable-line no-proto
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ConnectionError)
    }
    this.statusCode = 0
  }
}

function handleFetchResponseOrError(fetch, input, options = {}) {
  return fetch(input, options)
    .then(
      resp => {
        const date = resp.headers.get('date')
        const contentType = resp.headers.get('Content-Type')
        const contentDisposition = resp.headers.get('Content-Disposition')
        if (date) {
          const store = require('../../store/store').default
          store.dispatch(setLastServerResponseTime(new Date(date)))
        }
        if (contentDisposition && contentDisposition.indexOf('attachment;') === 0) {
          const str = 'filename='
          const fileName = trim(contentDisposition.substr(contentDisposition.indexOf(str) + str.length), ' ;')
          return {
            blob: resp.blob(), // <--- blob() returns Promise
            fileName,
          }
        }
        if (contentType && contentType.indexOf('octet-stream') > 0) {
          return resp.blob()
        }
        if (resp.ok) {
          // HTTP Status === 2xx
          return resp.json().then(changeAllIdsToString)
        }
        // HTTP Status !== 2xx
        return resp.json().then(resp => {
          const error = new APIApplicationError(resp || {}, resp.message)
          error.statusCode = resp.statusCode /* HAPI always responds with statusCode */
          throw error
        })
      },
      () => Promise.reject(new ConnectionError('Connection Error'))
    )
    .catch(err => {
      const store = require('../../store/store').default
      const customErrorNotifications = get(options, `errorNotifications.customErrorNotifications.${err.statusCode}`)

      if (customErrorNotifications && typeof customErrorNotifications === 'function') {
        const customErrorMessage = customErrorNotifications(err.data.extraData)

        store.dispatch(showError(customErrorMessage, err))
        return Promise.reject(err)
      }
      let errorNotification = get(
        options,
        `errorNotifications.${err.statusCode}`,
        get(options, 'errorNotifications.default')
      )
      if (errorNotification) {
        if (err.statusCode === 409 || err.statusCode === 422) {
          errorNotification = {
            ...defineMessages({
              message: {
                id: 'server.userFriendly.message',
                defaultMessage: err.message,
              },
            }),
          }
        } else if (errorNotification[err.message]) {
          errorNotification = errorNotification[err.message]
        } else if (errorNotification.default) {
          errorNotification = errorNotification.default
        }
        if (err.statusCode === 0) {
          errorNotification = {
            ...defineMessages({
              message: {
                id: 'errorResponseMessages.disconnected.default.message',
                defaultMessage:
                  'Either your computer has been disconnected from the internet or our server has failed to respond.',
              },
            }),
            ...errorNotification,
          }
        }
        // Only if statusCode isn't unauthorized or message isn't Expired Token, we should show the error as notification. For 401 errors of type Expired Token, the user will be logged out.
        if (err.statusCode !== 401 || err.message !== 'Expired token') {
          let customErrorNotification = null
          if (typeof errorNotification === 'function') {
            customErrorNotification = errorNotification(err.data, true)
          }
          // Maybe dont dispatch always the message? in case we need to do something else with the response.
          store.dispatch(showError(customErrorNotification || errorNotification, err))
        }
      }
      return Promise.reject(err)
    })
}

// check if a property looks like an ID (key is equal to 'id' or ends with 'Id')
function isIdLike(key) {
  return key === 'id' || key.match(/.+Id$/)
}

// change data type of IDs to a string
// params in react router are always strings
// so this saves us from having to do conversions throught the app
function changeAllIdsToString(data) {
  if (isArray(data)) {
    return data.map(changeAllIdsToString)
  }
  if (isObject(data)) {
    return mapValues(data, (value, key) =>
      isIdLike(key)
        ? value === null || value === undefined || isObject(value)
          ? value
          : String(value)
        : changeAllIdsToString(value)
    )
  }
  return data
}
