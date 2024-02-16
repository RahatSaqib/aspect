const { createFetch, base, accept, header, method, body } = require('http-client')
const jwtDecode = require('jwt-decode')
const uuid = require('node-uuid')

const { WEBHOOK_SERVERS } = require('../../../shared/constants')

const srvCepheidC360 = (function () {
  /**
   * private
   */
  const baseUrl = 'https://dev.aspect.id'
  // const baseUrl = 'http://localhost:8080'
  const baseProps = {
    clientId: uuid.v4(),
    clientType: 'web',
  }
  const urlToAuthorize = '/api/api/auth'
  const urlToRefreshToken = '/api/api/auth/refresh'
  // const urlToAuthorize = '/api/auth'
  // const urlToRefreshToken = '/api/auth/refresh'
  const username = 'admin'
  const password = 'test07'
  // const username = ''
  // const password = ''
  const fetchArgs = [
    method('POST'),
    base(baseUrl),
    accept('application/json'),
    header('Content-Type', 'application/json'),
  ]
  let accessToken = ''
  let refreshToken = ''
  let expiresOn = null
  let isValid = false
  const processSuccess = respJson => {
    const { access, refresh } = respJson
    const decoded = jwtDecode(access)
    accessToken = access
    refreshToken = refresh
    isValid = true
    expiresOn = new Date(Date.now() + (decoded.exp - decoded.iat) * 1000)
  }
  /**
   * public
   */
  const authorize = async () => {
    try {
      const payload = {
        ...baseProps,
        clientName: 'Aspect API Webhook',
        name: username,
        password,
      }
      const fetch = createFetch(...fetchArgs, body(JSON.stringify(payload), 'application/json'))
      const resp = await fetch(urlToAuthorize)
      if (resp.status === 200) {
        const respJson = await resp.json()
        processSuccess(respJson)
      } else {
        isValid = false
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log('__________authorize err =', err)
      isValid = false
    }
  }
  const refresh = async () => {
    try {
      const payload = {
        ...baseProps,
        token: refreshToken,
      }
      const fetch = createFetch(...fetchArgs, body(JSON.stringify(payload), 'application/json'))
      const resp = await fetch(urlToRefreshToken)
      if (resp.status === 200) {
        const respJson = await resp.json()
        processSuccess(respJson)
      } else {
        isValid = false
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log('__________refresh token err =', err)
      isValid = false
    }
  }
  const pushResult = async (/* { resultRaw } */) => {
    /**
     * TODO: fill in this func for ticket
     * https://systemone.youtrack.cloud/issue/ASP-6621
     */
    if (isValid) {
      //
    } else {
      //
    }
  }

  return {
    /**
     * to get values
     */
    getAccessToken: () => accessToken,
    getRefreshToken: () => refreshToken,
    getExpirationDate: () => expiresOn,
    isTokenValid: () => isValid,
    /**
     * methods
     */
    authorize,
    refresh,
    pushResult,
  }
})()

const getWebHookServers = async () => {
  return {
    [WEBHOOK_SERVERS.CepheidC360]: srvCepheidC360,
  }
}

module.exports = getWebHookServers
