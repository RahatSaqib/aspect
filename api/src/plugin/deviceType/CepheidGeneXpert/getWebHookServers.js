const _ = require('lodash')
const { createFetch, base, accept, header, method, body } = require('http-client')
const jwtDecode = require('jwt-decode')

const { WEBHOOK_SERVERS } = require('../../../shared/constants')

const setHeaders = (src, dst) => {
  _.each(_.keys(src), key => {
    dst.push(header(key, src[key]))
  })
}

const srvCepheidC360 = (function () {
  const emptyData = {
    accessToken: '',
    refreshToken: '',
    isValid: false,
    expiresOn: new Date(),
  }
  const getResponseData = respJson => {
    const { access, refresh } = respJson
    const decoded = jwtDecode(access)
    return {
      accessToken: access,
      refreshToken: refresh,
      isValid: true,
      expiresOn: new Date(Date.now() + (decoded.exp - decoded.iat) * 1000),
    }
  }
  /**
   * public
   */
  const authorize = async (baseUrl, headers = {}, params = {}) => {
    try {
      const fetchArgs = [
        //
        method(params.method || 'POST'),
        //
        base(baseUrl),
      ]
      setHeaders(headers, fetchArgs)
      const payload = params.payload || {}
      const fetch = createFetch(...fetchArgs, body(JSON.stringify(payload), 'application/json'))
      const resp = await fetch(params.url)
      if (resp.status === 200) {
        const respJson = await resp.json()
        return getResponseData(respJson)
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log('__________authorize err =', err)
    }
    return emptyData
  }
  const refresh = async (baseUrl, headers = {}, params = {}, refreshToken) => {
    try {
      const fetchArgs = [
        //
        method(params.method || 'POST'),
        //
        base(baseUrl),
      ]
      setHeaders(headers, fetchArgs)
      let payload = params.payload || {}

      payload = {
        ...payload,
        token: refreshToken,
      }
      const fetch = createFetch(...fetchArgs, body(JSON.stringify(payload), 'application/json'))
      const resp = await fetch(params.url)
      if (resp.status === 200) {
        const respJson = await resp.json()
        return getResponseData(respJson)
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log('__________refresh token err =', err)
    }
    return emptyData
  }
  const pushResult = async (baseUrl, headers = {}, params = {}, data) => {
    /**
     * see https://systemone.youtrack.cloud/issue/ASP-6621
     */
    const { isValid } = params
    if (isValid) {
      try {
        const fetchArgs = [
          //
          method(params.method || 'POST'),
          //
          base(baseUrl),
        ]
        setHeaders(headers, fetchArgs)
        let payload = params.payload || {}

        payload = {
          ...payload,
          data,
        }
        const fetch = createFetch(...fetchArgs, body(JSON.stringify(payload), 'application/json'))
        const resp = await fetch(params.url)
        if (resp.status === 200) {
          // const respJson = await resp.json()
          return true
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log('__________pushResult token err =', err)
      }
    }
  }

  return {
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
