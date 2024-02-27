const _ = require('lodash')
const fetch = require('node-fetch')

module.exports = {
  getToken: async (headers = {}, params = {}) => {
    let error
    let statusCode
    let statusText
    try {
      const body = new URLSearchParams()
      _.keys(params.payload).forEach(key => {
        body.append(key, params.payload[key])
      })

      const options = {
        method: params.method || 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      }

      const resp = await fetch(params.url, options)
      const respJson = await resp.json()
      if (resp.status === 200) {
        return {
          params: {
            lastAction: {
              statusCode: resp.status,
              statusText: resp.statusText,
              error: null,
            },
          },
          accessToken: respJson.access_token,
          isValid: true,
          expiresOn: new Date(Date.now() + respJson.expires_in * 1000),
        }
      }
      ;({ error } = respJson)
      statusCode = resp.status
      statusText = resp.statusText
    } catch (err) {
      error = err.toString()
    }
    return {
      params: {
        lastAction: {
          statusCode,
          statusText,
          error,
        },
      },
      accessToken: '',
      // refreshToken: '',
      isValid: false,
      expiresOn: new Date(),
    }
  },
}
