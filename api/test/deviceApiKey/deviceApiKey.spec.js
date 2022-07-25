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

  before(async () => {
    shared.checkToken(server, path)
    const now = new Date()
    const { id: partnerId } = await knex('Partner').where('name', 'Partner One').first('id')
    const { userId } = await knex('User').where({ name: 'admin' }).first('id as userId')
    const { id: geographyId } = await knex('Geography as g')
      .join('JobContext as jc', 'g.id', 'jc.geographyId')
      .join('Job as j', 'jc.jobId', 'j.id')
      .join('Person as p', 'j.personId', 'p.id')
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
  })

  after(async () => knex('DeviceApiKey').whereIn('id', deviceApiKeyIds).delete())

  describe('GET', () => {
    it('should return a list of deviceApiKeys when using valid token', async () => {
      const res = await server.get(path).set('Authorization', `Bearer ${shared.token}`)

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
      assert.property(res.body.data[0], 'device')
      assert.property(res.body.data[0], 'revoked')
      assert.property(res.body, 'total')
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
