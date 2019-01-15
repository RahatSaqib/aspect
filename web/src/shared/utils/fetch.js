import _ from 'lodash'
import { createFetch, base, header, accept } from 'http-client'
import { defineMessages } from 'react-intl'
import { showError } from '../../appNotification/AppNotificationRedux'
import { setLastServerResponseTime } from '../../globals/GlobalsRedux'

import config from '../../config'
import { getAspectAccess } from '../../globals/sideEffects/LocalStorage'

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
    _.set(options, 'headers.Authorization', `Bearer ${token}`)
  }
  return fetch(input, options)
}

class APIApplicationError extends Error {
  constructor(...args) {
    super(...args)
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
        if (date) {
          const store = require('../../store').default
          store.dispatch(setLastServerResponseTime(new Date(date)))
        }
        if (resp.ok) {
          // HTTP Status === 2xx
          return resp.json().then(changeAllIdsToString)
        }
        // HTTP Status !== 2xx
        return resp.json().then(data => {
          const error = new APIApplicationError(data.message)
          error.statusCode =
            data.statusCode /* HAPI always responds with statusCode */
          throw error
        })
      },
      () => Promise.reject(new ConnectionError('Connection Error'))
    )
    .catch(err => {
      let errorNotification = _.get(
        options,
        `errorNotifications.${err.statusCode}`,
        _.get(options, 'errorNotifications.default')
      )

      if (errorNotification) {
        if (errorNotification[err.message]) {
          errorNotification = errorNotification[err.message]
        } else if (errorNotification.default) {
          errorNotification = errorNotification.default
        }
        const store = require('../../store').default
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
        store.dispatch(showError(errorNotification, err))
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
  if (_.isArray(data)) {
    return data.map(changeAllIdsToString)
  } else if (_.isObject(data)) {
    return _.mapValues(
      data,
      (value, key) =>
        isIdLike(key)
          ? value === null || value === undefined || _.isObject(value)
            ? value
            : String(value)
          : changeAllIdsToString(value)
    )
  }
  return data
}
