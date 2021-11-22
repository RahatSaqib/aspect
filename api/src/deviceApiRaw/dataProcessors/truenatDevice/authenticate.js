const _ = require('lodash')
const Promise = require('bluebird')
const Boom = require('@hapi/boom')
const { lookupUsingCredentials } = require('../../../deviceApiKey/service')
const { getRemoteAddress } = require('../../../shared/request')
const { SynchronousDataProcessor } = require('../_base')
const { transact } = require('../../../db')
const { deviceSeen } = require('../../../device/actions')

class TruenatLogin extends SynchronousDataProcessor {
  static AllowUnauthenticatedRequests = true

  constructor(request, messageContext) {
    super(request, messageContext)
    this.encryptRawData = false
    this.processRequest = this.processRequest.bind(this)
    this.getResponse = this.getResponse.bind(this)
    this.response = {}
  }

  static async canProcessRequest(request) {
    const { params } = request
    const path = _.get(params, 'params')
    return Promise.resolve(path === 'truelab/devices/login')
  }

  async processRequest() {
    const { request } = this
    const { payload } = request
    const now = new Date()
    const remoteAddress = getRemoteAddress(request)
    const deviceApiKeyAuthResult = await lookupUsingCredentials(
      payload.Username,
      payload.Password
    )
    const deviceId = _.get(deviceApiKeyAuthResult, 'data.deviceId')
    if (deviceId) {
      await transact(async knex => {
        await knex('DeviceLog').insert({
          deviceId: _.get(deviceApiKeyAuthResult, 'data.deviceId'),
          source: 'Diagnostic Device POST',
          createdOn: now,
          senderIp: remoteAddress,
          rawMessage: JSON.stringify(request.plugins.rawPayload),
        })
        await knex('Device')
          .where({ id: deviceId })
          .update({ lastSeenOn: now, updatedOn: now })
        this.messageContext.dispatch(deviceSeen(deviceId))
      })
    }
    if (deviceApiKeyAuthResult.authenticated) {
      this.response.username = payload.Username
      this.response.token = `Bearer ${deviceApiKeyAuthResult.data.token}`
      this.response.success = true
    } else {
      throw Boom.unauthorized({
        username: payload.Username,
        success: false,
      })
    }
  }

  async getResponse() {
    return Promise.resolve(this.response)
  }
}

module.exports = TruenatLogin
