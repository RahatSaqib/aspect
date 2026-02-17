const { addHours, subHours } = require('date-fns')
const bcrypt = require('bcrypt')
const { assert } = require('chai')

const { knex } = require('../../../../src/db')
const { passwordSaltRounds } = require('../../../../src/config')
const { randomToken } = require('../../../../src/deviceApi/apiKey')
const { deviceApprovalToId } = require('../../../../src/shared/dictionary')
const server = require('../../../utils/testUtils')
const { insertSite } = require('../../../../src/site/common/db')

const saltRounds = parseInt(passwordSaltRounds, 10)

describe('Device API Raw routes for Truenat Authentication', () => {
  const deviceApiRawPath = '/device/raw/truelab/devices/login'
  const validApiKey = {
    token: randomToken(),
    username: 'valid-device',
    password: 'valid-password',
    expiresOn: addHours(new Date(), 1),
  }
  const expiredApiKey = {
    token: randomToken(),
    username: 'expired-token',
    password: 'expired-token-password',
    expiresOn: subHours(new Date(), 1),
  }
  const newTruenatDevice = {
    username: 'some-non-existent-username',
    password: 'valid_Pa55w()rd',
  }

  before(async () => {
    const now = new Date()
    const { id: userId } = await knex('User').first('id')

    const truenatDeviceType = await knex.from('DeviceType').where('externalId', 'molbioTruenat').first()
    const partner = await knex.from('Partner').where('name', 'Partner One').first()
    const geography = await knex
      .from('Country as c')
      .join('Geography as g', 'g.countryId', 'c.id')
      .where('c.abbreviation', 'US')
      .andWhere('g.stateId', null)
      .andWhere('g.lgaId', null)
      .first('g.*')
    const approvedDeviceApproval = await knex.from('DeviceApproval').where('token', 'approved').first()

    const [siteId] = await insertSite(knex, {
      name: 'Some Site for Some Truenat Device',
      shortName: 'SSF',
      externalId: 'SSF',
      partnerId: partner.id,
      geographyId: geography.id,
      city: 'Sparks',
      street1: '7 Loveton Circle',
      zip: '21152',
      longitude: 17.0,
      latitude: 95.0,
      createdOn: now,
      updatedOn: now,
    })
    const [deviceId] = await knex('Device').insert({
      partnerId: partner.id,
      siteId,
      deviceTypeId: truenatDeviceType.id,
      moduleBayCapacity: 0,
      deviceApprovalId: approvedDeviceApproval.id,
      name: 'Some Truenat Device',
      shortName: 'TRUENAT',
      configurationData: '{}',
      putInService: now,
      lastSeenOn: now,
      createdOn: now,
      updatedOn: now,
    })
    const [validApiKeyId] = await knex('DeviceApiKey').insert({
      ...validApiKey,
      password: bcrypt.hashSync(validApiKey.password, saltRounds),
      deviceId,
      siteId,
      revoked: false,
      createdOn: now,
      createdBy: userId,
      updatedOn: now,
      updatedBy: userId,
      partnerId: partner.id,
    })
    validApiKey.id = validApiKeyId
    const [expiredApiKeyId] = await knex('DeviceApiKey').insert({
      ...expiredApiKey,
      password: bcrypt.hashSync(expiredApiKey.password, saltRounds),
      deviceId,
      siteId,
      revoked: false,
      createdOn: now,
      createdBy: userId,
      updatedOn: now,
      updatedBy: userId,
      partnerId: partner.id,
    })
    expiredApiKey.id = expiredApiKeyId
  })

  after(async () => {
    const { deviceId: validDeviceId, siteId: validSiteId } = await knex('DeviceApiKey as dak')
      .leftJoin('Device as d', 'dak.deviceId', 'd.id')
      .where('dak.id', validApiKey.id)
      .first('dak.deviceId', 'd.siteId')
    const { deviceId: expiredDeviceId, siteId: expiredSiteId } = await knex('DeviceApiKey as dak')
      .leftJoin('Device as d', 'dak.deviceId', 'd.id')
      .where('dak.id', expiredApiKey.id)
      .first('dak.deviceId', 'd.siteId')
    await knex('DeviceApprovalLog').where('deviceId', validDeviceId).delete()
    await knex('DeviceApprovalLog').where('deviceId', expiredDeviceId).delete()
    await knex('DeviceLog').where('deviceApiKeyId', validApiKey.id).delete()
    await knex('DeviceLog').where('deviceApiKeyId', expiredApiKey.id).delete()

    await knex('DeviceApiRaw').where('deviceApiKeyId', validApiKey.id).delete()
    await knex('DeviceApiRaw').where('deviceApiKeyId', expiredApiKey.id).delete()
    await knex('DeviceApiKey').where('id', validApiKey.id).orWhere('deviceId', validDeviceId).delete()
    await knex('DeviceApiKey').where('id', expiredApiKey.id).orWhere('deviceId', expiredDeviceId).delete()
    await knex('Device').where('id', validDeviceId).delete()
    await knex('Device').where('id', expiredDeviceId).delete()
    await knex('Site').where('id', validSiteId).delete()
    await knex('Site').where('id', expiredSiteId).delete()

    const {
      id: newTruenatDeviceApiKeyId,
      deviceId: newTruenatDeviceId,
      siteId: newTruenatDeviceSiteId,
    } = await knex('DeviceApiKey as dak')
      .where('dak.username', newTruenatDevice.username)
      .first('dak.id', 'dak.deviceId', 'dak.siteId')
    await knex('DeviceApiKey').where('id', newTruenatDeviceApiKeyId).delete()
    await knex('DeviceLog').where('deviceApiKeyId', newTruenatDeviceApiKeyId).delete()
    await knex('Device').where('id', newTruenatDeviceId).delete()
    await knex('Site').where('id', newTruenatDeviceSiteId).delete()
  })

  describe('with a valid API key', () => {
    it('should respond with the API Key token in the body', async () => {
      const response = await server.post(deviceApiRawPath).set('Content-type', 'application/json').send({
        Username: validApiKey.username,
        Password: validApiKey.password,
      })
      assert.equal(response.statusCode, 200)
      assert.equal(response.body.token, `Bearer ${validApiKey.token}`)
      assert.equal(response.body.username, validApiKey.username)
      assert.isTrue(response.body.success)
    })
  })

  describe('with an expired API key', () => {
    it('should respond with a renewed API Key token in the body', async () => {
      const response = await server.post(deviceApiRawPath).set('Content-type', 'application/json').send({
        Username: expiredApiKey.username,
        Password: expiredApiKey.password,
      })
      assert.equal(response.statusCode, 200)
      assert.notEqual(response.body.token, `Bearer ${expiredApiKey.token}`)
      assert.equal(response.body.username, expiredApiKey.username)
      assert.isTrue(response.body.success)
    })
  })

  describe('with existing username but wrong password', () => {
    it('should return a 401 (unauthenticated) response', async () => {
      const incorrectPasswordResponse = await server
        .post(deviceApiRawPath)
        .set('Content-type', 'application/json')
        .send({
          Username: validApiKey.username,
          Password: 'some-random-password',
        })
      assert.equal(incorrectPasswordResponse.statusCode, 401)
      assert.isUndefined(incorrectPasswordResponse.body.token)
      assert.equal(incorrectPasswordResponse.body.message, `{"username":"${validApiKey.username}","success":false}`)
    })
  })

  describe('with unexisting username and no matching device/site', () => {
    it('should create new device api key, device and site', async () => {
      const incorrectUsernameResponse = await server
        .post(deviceApiRawPath)
        .set('Content-type', 'application/json')
        .send({
          Username: newTruenatDevice.username,
          Password: newTruenatDevice.password,
        })
      assert.equal(incorrectUsernameResponse.statusCode, 200)
      assert.isDefined(incorrectUsernameResponse.body.token)
      assert.equal(incorrectUsernameResponse.body.username, newTruenatDevice.username)
      assert.isTrue(incorrectUsernameResponse.body.success)

      const unapprovedDeviceApprovalId = await deviceApprovalToId('assigned')
      const device = await knex('Device').where('name', newTruenatDevice.username).first()
      const site = await knex('Site').where('name', newTruenatDevice.username).first()
      assert.isDefined(device, 'new device should be created with username as device name')
      assert.isDefined(site, 'new site should be created with username as site name')
      assert.equal(device.deviceApprovalId, unapprovedDeviceApprovalId, 'new device should be unapproved')

      it('should be able to login with the same username and password', async () => {
        const response = await server.post(deviceApiRawPath).set('Content-type', 'application/json').send({
          Username: newTruenatDevice.username,
          Password: newTruenatDevice.password,
        })
        assert.equal(response.statusCode, 200)
        assert.isDefined(response.body.token)
        assert.isTrue(response.body.success)
      })

      it('should get 401 unauthorized response when password is incorrect', async () => {
        const response = await server.post(deviceApiRawPath).set('Content-type', 'application/json').send({
          Username: newTruenatDevice.username,
          Password: 'wrong_Pa55w()rd',
        })
        assert.equal(response.statusCode, 401)
        assert.isUndefined(response.body.token)
        assert.equal(response.body.message, `{"username":"${newTruenatDevice.username}","success":false}`)
      })
    })
  })

  describe('with empty payload', () => {
    it('should return a 400 (bad request) response', async () => {
      const response = await server.post(deviceApiRawPath).set('Content-type', 'application/json').send()
      assert.equal(response.statusCode, 400)
      assert.isUndefined(response.body.token)
      assert.equal(response.body.message, `Request payload is required`)
    })

    it('should return a 400 (bad request) response when username is empty', async () => {
      const response = await server.post(deviceApiRawPath).set('Content-type', 'application/json').send({
        Username: '',
        Password: 'valid_Pa55w()rd',
      })
      assert.equal(response.statusCode, 400)
      assert.isUndefined(response.body.token)
      assert.equal(response.body.message, `Username cannot be empty`)
    })
  })
})
