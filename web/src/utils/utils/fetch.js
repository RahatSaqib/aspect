/* eslint-disable max-classes-per-file */
import { createFetch, base, header, accept } from 'http-client'
import get from 'lodash/get'
import set from 'lodash/set'
import trim from 'lodash/trim'
import { defineMessages } from 'react-intl'
import config from '../../config'
import { expiredTokenLogout } from '../../store/AuthRedux'
import { notifyError } from '../notifications'

export const aspectFetch = createFetch(
  base(config.aspectApi),
  accept('application/json'),
  header('Content-Type', 'application/json'),
  addAuthHeaderMiddleware,
  handleFetchResponseOrError
)

function addAuthHeaderMiddleware(fetch, input, options = {}) {
  const token = localStorage.getItem('asAccess')
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
        const contentType = resp.headers.get('Content-Type')
        const contentDisposition = resp.headers.get('Content-Disposition')

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
          return resp.json()
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
        notifyError(customErrorMessage, err)
        return Promise.reject(err)
      }
      let errorNotification = get(
        options,
        `errorNotifications.${err.statusCode}`,
        get(options, 'errorNotifications.default')
      )

      if (errorNotification) {
        if (err.data?.errorKeyCode && errorNotification[err.data.errorKeyCode]) {
          errorNotification = { message: errorNotification[err.data.errorKeyCode] }
        } else if (err.data?.problems) {
          const message = Object.keys(err.data.problems).map(errorKeyCode => errorNotification[errorKeyCode])[0] // TODO Remove when there is support for multiple messages.
          errorNotification = { message }
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
        // If the statusCode is 401 unauthorized the system should redirect the user to the logout screen
        // For all other types of errors the user should be shown an error message.
        if (err.statusCode === 401 && input !== `${config.aspectApi}/auth`) {
          store.dispatch(expiredTokenLogout())
        } else {
          let customErrorNotification = null
          if (typeof errorNotification === 'function') {
            customErrorNotification = errorNotification(err.data, true)
            if (!customErrorNotification) return Promise.reject(err)
          }
          // Maybe dont dispatch always the message? in case we need to do something else with the response.
          notifyError(customErrorNotification || errorNotification, err)
        }
      }
      return Promise.reject(err)
    })
}
