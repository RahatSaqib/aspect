const chai = require('chai')
const _ = require('lodash')
const shared = require('../utils/sharedToken')
const { randomToken } = require('../../src/deviceApi/apiKey')
const { knex } = require('../../src/db')

const server = require('../utils/testUtils')

const { assert } = chai

describe('Device API Key routes', () => {
  const path = '/api/deviceApiKey'
  const deviceApiKeyIds = []
  const deviceAssignments = []

  before(async () => {
    shared.checkToken(server, path)
    const now = new Date()
    const { id: partnerId } = await knex('Partner').where('name', 'Partner One').first('id')
    const { userId } = await knex('User').where({ name: 'admin' }).first('id as userId')
    const { id: geographyId } = await knex('Geography as g')
      .join('JobContext as jc', 'g.id', 'jc.geographyId')
      .join('Person as p', 'jc.personId', 'p.id')
      .join('User as u', 'p.userId', 'u.id')
      .where('p.lastPartnerId', partnerId)
      .andWhere('u.id', userId)
      .first('g.id')

    await Promise.all(
      _.map(_.range(3), async () => {
        const apiKey = { token: randomToken() }
        const [deviceApiKeyId] = await knex('DeviceApiKey').insert({
          token: apiKey.token,
          revoked: 0,
          partnerId,
          geographyId,
          createdOn: now,
          createdBy: userId,
          updatedOn: now,
          updatedBy: userId,
        })
        deviceApiKeyIds.push(deviceApiKeyId)
      })
    )

    const devices = await knex('Device as d')
      .leftJoin('Site as s', 'd.siteId', 's.id')
      .whereNotNull('d.siteId')
      .limit(2)
      .select('d.id', 'd.deviceApiKeyId', 'd.name', 's.id as siteId', 's.name as siteName')

    if (devices.length === 2) {
      deviceAssignments.push(...devices)
      await knex('Device')
        .whereIn(
          'id',
          devices.map(device => device.id)
        )
        .update({ deviceApiKeyId: deviceApiKeyIds[0] })
    }
  })

  after(async () => {
    await Promise.all(
      deviceAssignments.map(device =>
        knex('Device').where('id', device.id).update({ deviceApiKeyId: device.deviceApiKeyId })
      )
    )
    await knex('DeviceApiKey').whereIn('id', deviceApiKeyIds).delete()
  })

  describe('GET', () => {
    it('should return a list of deviceApiKeys when using valid token', async () => {
      const res = await server.get(`${path}?size=all&sortDir=desc`).set('Authorization', `Bearer ${shared.token}`)

      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')
      assert.property(res.body, 'data')
      assert.typeOf(res.body.data, 'array')
      assert.isAtLeast(res.body.data.length, 2)
      assert.property(res.body.data[0], 'id')
      assert.property(res.body.data[0], 'createdOn')
      assert.property(res.body.data[0], 'token')
      assert.property(res.body.data[0], 'partner')
      assert.property(res.body.data[0], 'country')
      assert.property(res.body.data[0], 'site')
      assert.property(res.body.data[0], 'sites')
      assert.property(res.body.data[0], 'devices')
      assert.property(res.body.data[0], 'revoked')
      assert.property(res.body, 'total')

      const multiDeviceApiKey = res.body.data.find(item => Number(item.id) === Number(deviceApiKeyIds[0]))
      assert.exists(multiDeviceApiKey)
      assert.isArray(multiDeviceApiKey.sites)
      assert.isArray(multiDeviceApiKey.devices)
      assert.isAtLeast(multiDeviceApiKey.devices.length, 2)
      assert.containsAllKeys(multiDeviceApiKey.devices[0], ['id', 'name', 'siteId', 'siteName'])
    })
  })
  describe('POST', () => {
    it('should generate deviceApiKeys token', async () => {
      const res = await server.post(`${path}/api-key`).set('Authorization', `Bearer ${shared.token}`)

      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')
      assert.property(res.body, 'token')

      const deviceApiKeyInDb = await knex('DeviceApiKey').where('token', res.body.token).first()
      assert.isNotNull(deviceApiKeyInDb.partnerId)
      assert.isNotNull(deviceApiKeyInDb.geographyId)

      deviceApiKeyIds.push(deviceApiKeyInDb.id)
    })
  })
})
