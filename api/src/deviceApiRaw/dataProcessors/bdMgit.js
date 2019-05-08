const Promise = require('bluebird')
const _ = require('lodash')
const Boom = require('boom')
const { knex, transact } = require('../../db')
const { getRemoteAddress } = require('../../shared/request')
const { getUtcTime } = require('../../shared/date')
const { deviceSeen } = require('../../device/actions')
const { SynchronousDataProcessor } = require('./_base')

class DefaultBDMGIT extends SynchronousDataProcessor {
  constructor(request, messageContext) {
    super(request, messageContext)
    this.encryptRawData = false
    this.processRequest = this.processRequest.bind(this)
    this.getResponse = this.getResponse.bind(this)
    this.response = {}
  }

  static async canProcessRequest(request) {
    const { auth } = request
    const { externalId: deviceTypeId } =
      (await knex('DeviceApiKey as dak')
        .join('Device as d', 'dak.deviceId', 'd.id')
        .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
        .where('dak.token', auth.credentials.token)
        .first('dt.externalId')) || {}
    return deviceTypeId === 'BDMGIT'
  }

  async processRequest() {
    const { request } = this
    const { auth, payload } = request
    const now = getUtcTime()
    this.response = await transact(async knex => {
      const { deviceId } = await knex('DeviceApiKey')
        .where('token', auth.credentials.token)
        .first('deviceId')
      const remoteAddress = getRemoteAddress(request)
      if (!deviceId) {
        throw Boom.badRequest(
          'Invalid device API key: Cannot determine which device this came from'
        )
      }
      const [deviceLogId] = await knex('DeviceLog').insert({
        deviceId,
        source: _.get(payload, 'log.source', ''),
        createdOn: now,
        senderIp: remoteAddress,
        // TODO: DeviceLog handle non-JSON payloads
        rawMessage: request.plugins.rawPayload,
      })
      await knex('Device')
        .where({ id: deviceId })
        .update({ lastSeenOn: now, updatedOn: now })
      this.messageContext.dispatch(deviceSeen(deviceId))
      // TODO ZIMBABWE: Process payload over here
      return {
        deviceApiRawId: this.id,
        deviceId,
        deviceLogId,
      }
    })
  }

  async getResponse() {
    return Promise.resolve(this.response)
  }
}

module.exports = DefaultBDMGIT
