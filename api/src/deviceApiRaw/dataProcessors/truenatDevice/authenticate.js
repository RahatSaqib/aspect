const _ = require('lodash')
const Promise = require('bluebird')
const Boom = require('@hapi/boom')
const bcrypt = require('bcrypt')
const config = require('../../../config')
const { knex } = require('../../../db')
const { randomToken } = require('../../../deviceApi/apiKey')
const { lookupUsingCredentials } = require('../../../deviceApiKey/service')
const { getRemoteAddress } = require('../../../shared/request')
const { SynchronousDataProcessor } = require('../_base')
const { postPayloadFromDevice } = require('../../../device/service')
const { deviceSeen } = require('../../../device/actions')
const { deviceApprovalToId, deviceTypeToId } = require('../../../shared/dictionary')
const { insertSite } = require('../../../site/common/db')

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

    // Basic payload validation
    if (!payload) {
      throw Boom.badRequest('Request payload is required')
    }
    if (!payload.Username) {
      throw Boom.badRequest('Username cannot be empty')
    }
    if (!payload.Password) {
      throw Boom.badRequest('Password cannot be empty')
    }

    const deviceApiKeyAuthResult = await lookupUsingCredentials(payload.Username, payload.Password)
    const deviceId = _.get(deviceApiKeyAuthResult, 'data.deviceId')
    if (deviceId) {
      await postPayloadFromDevice(
        {
          deviceApiKeyId: deviceApiKeyAuthResult.data.id,
          source: 'Diagnostic Device POST',
          senderIp: getRemoteAddress(request),
          rawMessage: JSON.stringify(request.plugins.rawPayload),
        },
        deviceId
      )
      this.messageContext.dispatch(deviceSeen(deviceId))
    }
    if (deviceApiKeyAuthResult.authenticated) {
      this.response.username = payload.Username
      this.response.token = `Bearer ${deviceApiKeyAuthResult.data.token}`
      this.response.success = true
    } else if (deviceApiKeyAuthResult.data) {
      throw Boom.unauthorized(
        JSON.stringify({
          username: payload.Username,
          success: false,
        })
      )
    } else {
      const defaultPartner = await knex('Partner').where({ isDefault: true }).first('id')
      if (!defaultPartner) {
        throw Boom.unauthorized(
          JSON.stringify({
            username: payload.Username,
            success: false,
          })
        )
      }
      const now = new Date()
      let site
      let device = await knex('Device')
        .where('name', payload.Username)
        .orWhere('shortName', payload.Username)
        .orWhere('hostId', payload.Username)
        .first()
      if (!device) {
        site = await knex('Site').where('name', payload.Username).orWhere('shortName', payload.Username).first()
        if (!site) {
          const { id: countryId } = await knex('Country').orderBy('id').first('id')
          const { id: geographyId } = await knex('Geography')
            .where('countryId', countryId)
            .where('stateId', null)
            .where('lgaId', null)
            .first('id')
          site = {
            name: payload.Username,
            shortName: payload.Username,
            partnerId: defaultPartner.id,
            externalId: payload.Username,
            geographyId,
            notes: 'Created automatically by new Truelab device',
            createdOn: now,
            updatedOn: now,
          }
          const [siteId] = await insertSite(knex, site)
          site.id = siteId
        }
        const truenatDeviceTypeId = await deviceTypeToId('molbioTruenat')
        const deviceApprovalId = await deviceApprovalToId('pendingDeployment')
        device = {
          name: payload.Username,
          shortName: payload.Username,
          partnerId: site.partnerId,
          siteId: site.id,
          hostId: payload.Username,
          deviceTypeId: truenatDeviceTypeId,
          deviceApprovalId,
          createdOn: now,
          updatedOn: now,
        }
        const [deviceId] = await knex('Device').insert(device)
        device.id = deviceId
      }
      if (!site) {
        site = await knex('Site').where('id', device.siteId).first()
      }
      const { id: adminId } = await knex('User').where({ name: 'admin' }).first('id')
      const apiKey = { token: randomToken() }
      const saltRounds = parseInt(config.passwordSaltRounds, 10)
      const passwordHash = bcrypt.hashSync(payload.Password, saltRounds)
      const deviceApiKey = {
        deviceId: device.id,
        partnerId: device.partnerId,
        geographyId: site.geographyId,
        siteId: site.id,
        token: apiKey.token,
        username: payload.Username,
        password: passwordHash,
        revoked: 0,
        createdOn: now,
        createdBy: adminId,
        updatedOn: now,
        updatedBy: adminId,
      }
      await knex('DeviceApiKey').insert(deviceApiKey)
      this.response.username = payload.Username
      this.response.token = `Bearer ${apiKey.token}`
      this.response.success = true
    }
  }

  async getResponse() {
    return Promise.resolve(this.response)
  }
}

module.exports = TruenatLogin
