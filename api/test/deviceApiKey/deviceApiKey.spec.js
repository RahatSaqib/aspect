const supertest = require('supertest')
const chai = require('chai')
const _ = require('lodash')
const shared = require('../utils/sharedToken')
const { randomToken } = require('../../src/deviceApi/apiKey')
const { run } = require('../../src/db')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai

describe('Device routes', () => {
  const path = '/api/deviceApiKey'
  const deviceApiKeyIds = []

  describe('GET', () => {
    shared.checkToken(server, path)

    before(async () =>
      run(async knex => {
        const now = new Date()
        const { id: partnerId } = await knex('Partner')
          .where('name', 'Partner One')
          .first('id')
        const { userId } = await knex('User')
          .where({ name: 'admin' })
          .first('id as userId')
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
    )

    after(async () =>
      run(async knex => {
        await knex('DeviceApiKey')
          .whereIn('id', deviceApiKeyIds)
          .delete()
      })
    )

    it('should return a list of deviceApiKeys when using valid token', done => {
      server
        .get(path)
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 3)
          assert.property(res.body.data[0], 'id')
          assert.property(res.body.data[0], 'createdOn')
          assert.property(res.body.data[0], 'token')
          assert.property(res.body.data[0], 'partner')
          assert.property(res.body.data[0], 'country')
          assert.property(res.body.data[0], 'site')
          assert.property(res.body.data[0], 'device')
          assert.property(res.body.data[0], 'revoked')
          assert.property(res.body, 'total')
          done()
        })
    })
  })
})
