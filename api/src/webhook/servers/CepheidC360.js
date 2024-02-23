const fetch = require('node-fetch')

module.exports = {
  getToken: async (headers = {}, params = {}) => {
    let error
    let statusCode
    let statusText
    try {
      const body = new URLSearchParams()
      body.append('client_id', '53u20emeku2jfnclol12u54cjr')
      body.append('grant_type', 'client_credentials')

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
