const _ = require('lodash')
const fetch = require('node-fetch')

const { WEBHOOK_SERVERS } = require('../../../shared/constants')

const emptyData = {
  accessToken: '',
  refreshToken: '',
  isValid: false,
  expiresOn: new Date(),
}

const srvCepheidC360 = (function () {
  /**
   * public
   */
  const getToken = async (headers = {}, params = {}) => {
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
            accessToken: respJson.access_token,
            isValid: true,
            expiresOn: new Date(Date.now() + respJson.expires_in * 1000),
            lastAction: {
              type: 'GET_TOKEN',
              statusCode: resp.status,
              statusText: resp.statusText,
              error: null,
            },
          },
          headers: {
            toPushResult: {
              Authorization: `Bearer ${respJson.access_token}`,
            },
          },
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
        ...emptyData,
        lastAction: {
          type: 'GET_TOKEN',
          statusCode,
          statusText,
          error,
        },
      },
    }
  }
  const pushResult = async (headers = {}, params = {}, action) => {
    /**
     * see https://systemone.youtrack.cloud/issue/ASP-6621
     */
    const { isValid } = params
    if (isValid) {
      let error
      let statusCode
      let statusText
      try {
        const { instrumentSerialNumber } = action
        let { data } = action
        if (_.isPlainObject(data)) {
          data = [data]
        }
        const url = _.replace(params.url, '{{instrumentSerialNumber}}', instrumentSerialNumber)
        const options = {
          method: params.method || 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }

        const resp = await fetch(url, options)
        const respJson = await resp.json()
        if (resp.status === 200) {
          return {
            params: {
              lastAction: {
                type: 'PUSH_RESULT',
                statusCode: resp.status,
                statusText: resp.statusText,
                error: null,
              },
            },
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
            type: 'PUSH_RESULT',
            statusCode,
            statusText,
            error,
          },
        },
      }
    }
  }

  return {
    getToken,
    pushResult,
  }
})()

const getWebHookServers = async () => {
  return {
    [WEBHOOK_SERVERS.CepheidC360]: srvCepheidC360,
  }
}

module.exports = getWebHookServers
