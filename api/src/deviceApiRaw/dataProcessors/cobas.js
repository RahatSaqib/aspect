const Promise = require('bluebird')
const _ = require('lodash')
const Boom = require('@hapi/boom')

const { transact } = require('../../db')
const { getRemoteAddress } = require('../../shared/request')

const { deviceSeen } = require('../../device/actions')
const { SynchronousDataProcessor } = require('./_base')

class DefaultCOBAS extends SynchronousDataProcessor {
  constructor(request, messageContext) {
    super(request, messageContext)
    this.encryptRawData = false
    this.processRequest = this.processRequest.bind(this)
    this.getResponse = this.getResponse.bind(this)
    this.response = {}
  }

  static checkHeader(line) {
    try {
      return (
        line.split('\n')[0].split('|')[9].toString().indexOf('cobas') === 0 ||
        line.split('\n')[0].split('|')[4].toString().indexOf('cobas') === 0
      )
    } catch (ex) {
      return false
    }
  }

  static sanitisePayload(payload) {
    return `\n${payload}`
      .replace(/\u0002/g, '') // eslint-disable-line no-control-regex
      .replace(/\u0003/g, '\n') // eslint-disable-line no-control-regex
      .replace(/\r/g, '')
      .replace(/\x02/g, '') // eslint-disable-line no-control-regex
      .replace(/\x03/g, '') // eslint-disable-line no-control-regex
      .replace(/(a*)?\(?l?p(\d)*\n/g, '\n')
      .replace(/\n(a*)?S'(\d)?/g, '\n')
      .replace(/\\r\\x[a-zA-Z0-9]{4}\\r\\n'\n/g, '\n')
      .replace(/\na*\.\n?/g, '')
      .replace(/\n[A-Z0-9]{2}\n/g, '\n')
      .replace(/\n+/g, '\n')
      .replace(/\n[0-9]?/g, '\n')
      .trim()
  }

  static async canProcessRequest(request) {
    const { payload } = request
    if (!payload) {
      return false
    }
    const sanitisedHeader = DefaultCOBAS.sanitisePayload(payload.header)

    return DefaultCOBAS.checkHeader(sanitisedHeader)
  }

  async processRequest() {
    const { request } = this
    const { auth, payload } = request

    this.response = { deviceApiRawId: this.id }
    await transact(async knex => {
      const { id: deviceApiKeyId, deviceId } = await knex('DeviceApiKey as dak')
        .leftJoin('Device as d', 'd.deviceApiKeyId', 'dak.id')
        .where('dak.token', auth.credentials.token)
        .first('dak.id as id', 'd.id as deviceId')
      const remoteAddress = getRemoteAddress(request)
      if (!deviceId) {
        throw Boom.badRequest('Invalid device API key: Cannot determine which device this came from')
      }

      this.response.deviceId = deviceId

      const now = new Date()

      const [deviceLogId] = await knex('DeviceLog').insert({
        deviceApiKeyId,
        source: _.get(payload, 'log.source', ''),
        createdOn: now,
        senderIp: remoteAddress,
        // TODO: DeviceLog handle non-JSON payloads
        rawMessage: JSON.stringify(request.plugins.rawPayload),
      })

      this.response.deviceLogId = deviceLogId

      await knex('Device').where({ id: deviceId }).update({ lastSeenOn: now, updatedOn: now })
      this.messageContext.dispatch(deviceSeen(deviceId))

      if (!this.request.payload) {
        throw Boom.badRequest('No payload to process')
      }
    })
  }

  async getResponse() {
    return Promise.resolve(this.response)
  }
}

module.exports = DefaultCOBAS
