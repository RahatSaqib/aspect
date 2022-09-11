const _ = require('lodash')
const Promise = require('bluebird')
const Boom = require('@hapi/boom')
const { lookupUsingCredentials } = require('../../../deviceApiKey/service')
const { getRemoteAddress } = require('../../../shared/request')
const { SynchronousDataProcessor } = require('../_base')
const { postPayloadFromDevice } = require('../../../device/service')
const { deviceSeen } = require('../../../device/actions')

class TruenatLogin extends SynchronousDataProcessor {
  static get AllowUnauthenticatedRequests() {
    return true
  }

  constructor(request, messageContext) {
    super(request, messageContext)
    this.encryptRawData = false
    this.timeoutMilliseconds = 60000
    this.processRequest = this.processRequest.bind(this)
    this.getResponse = this.getResponse.bind(this)
    this.response = {}
  }

  static async canProcessRequest(request) {
    const { params } = request
    const path = _.get(params, 'params', '').toLowerCase()
    return Promise.resolve(path.startsWith('truelab/devices/login'))
  }

  async processRequest() {
    const { request } = this
    const { payload } = request
    const deviceApiKeyAuthResult = await lookupUsingCredentials(payload.Username, payload.Password)
    const deviceId = _.get(deviceApiKeyAuthResult, 'data.deviceId')
    if (deviceId) {
      await postPayloadFromDevice({
        deviceId,
        source: 'Diagnostic Device POST',
        senderIp: getRemoteAddress(request),
        rawMessage: JSON.stringify(request.plugins.rawPayload),
      })
      this.messageContext.dispatch(deviceSeen(deviceId))
    }
    if (deviceApiKeyAuthResult.authenticated) {
      this.response.username = payload.Username
      this.response.token = `Bearer ${deviceApiKeyAuthResult.data.token}`
      this.response.success = true
    } else {
      throw Boom.unauthorized(
        JSON.stringify({
          username: payload.Username,
          success: false,
        })
      )
    }
  }

  async getResponse() {
    return Promise.resolve(this.response)
  }
}

module.exports = TruenatLogin
