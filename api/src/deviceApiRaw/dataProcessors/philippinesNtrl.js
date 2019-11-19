const _ = require('lodash')
const Boom = require('boom')
const { knex, transact } = require('../../db')
const { getRemoteAddress } = require('../../shared/request')
const { getUtcTime } = require('../../shared/date')
const { deviceSeen } = require('../../device/actions')
const { SynchronousDataProcessor } = require('./_base')

class DefaultPhilippinesNtrl extends SynchronousDataProcessor {
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
    return deviceTypeId === 'PhilippinesNtrl'
  }

  async processRequest() {
    const { request } = this
    const { auth, payload } = request

    this.response = { deviceApiRawId: this.id }
    await transact(async knex => {
      const { deviceId } = await knex('DeviceApiKey')
        .where('token', auth.credentials.token)
        .first('deviceId')
      const remoteAddress = getRemoteAddress(request)
      if (!deviceId) {
        throw Boom.badRequest(
          'Invalid device API key: Cannot determine which device this came from'
        )
      }

      this.response.deviceId = deviceId

      const utcNow = getUtcTime()

      const [deviceLogId] = await knex('DeviceLog').insert({
        deviceId,
        source: _.get(payload, 'log.source', ''),
        createdOn: utcNow,
        senderIp: remoteAddress,
        rawMessage: JSON.stringify(request.plugins.rawPayload),
      })

      this.response.deviceLogId = deviceLogId

      await knex('Device')
        .where({ id: deviceId })
        .update({ lastSeenOn: utcNow, updatedOn: utcNow })
      this.messageContext.dispatch(deviceSeen(deviceId))

      if (!this.request.payload) {
        throw Boom.badRequest('No payload to process')
      }
    })
  }
}

module.exports = DefaultPhilippinesNtrl
