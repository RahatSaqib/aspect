const supertest = require('supertest')
const chai = require('chai')

const shared = require('../utils/sharedToken')
const { knex } = require('../../src/db')

const { assert } = chai
const server = supertest.agent('http://localhost:8080')

const baseAssert = (res, issueType) => {
  assert.equal(res.status, 200)

  const { ok, data = {} } = res.body
  assert.equal(ok, true)
  assert.equal(issueType, data.issueType)
  assert.equal(data.triggered, true)
}

describe('Issue Trigger', () => {
  // describe('issue type NewResultsAvailable', () => {
  const path = '/api/issue/trigger'
  // let messageContext
  const now = new Date()

  // get 1st available device for current user
  let deviceId
  shared.checkToken(server, '/api/device')
  it('should return a list of devices when using valid token "approved"', async () => {
    await server
      .get('/api/device')
      .set('Authorization', `Bearer ${shared.token}`)
      .then(res => {
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')
        assert.property(res.body, 'data')
        assert.typeOf(res.body.data, 'array')
        assert.isAbove(res.body.data.length, 0)
        deviceId = res.body.data[0].id
      })
  })

  it(`should trigger issue type NewResultsAvailable`, done => {
    const issueType = 'NewResultsAvailable'
    server
      .post(path)
      .set('Authorization', `Bearer ${shared.token}`)
      .send({
        issueType,
      })
      .end(async (err, res) => {
        baseAssert(res, issueType)

        done()
      })
  })

  describe('For Device', () => {
    let oldIssueEventIds = []
    beforeEach(async () => {
      // read existing items
      oldIssueEventIds = await knex('IssueEvent').pluck('id')
    })
    afterEach(async () => {
      // // make sure we delete only new items and not existing, accidentally
      await knex('IssueEvent').whereNotIn('id', oldIssueEventIds).del()
    })

    it(`should trigger issue type DeviceOffline`, done => {
      const issueType = 'DeviceOffline'
      server
        .post(path)
        .set('Authorization', `Bearer ${shared.token}`)
        .send({
          issueType,
          data: {
            deviceId,
            lastSeenOn: now,
            lastPingOn: now,
          },
        })
        .end(async (err, res) => {
          baseAssert(res, issueType)

          setTimeout(async () => {
            // check that record created
            const newIssueEventIds = await knex('IssueEvent')
              .whereNotIn('id', oldIssueEventIds)
              .whereRaw(`IFNULL(data->>"$.type", '') = 'DEVICE_OFFLINE'`)
              .whereRaw(`IFNULL(data->>"$.deviceId", 0) = ${deviceId}`)
              .pluck('id')
            assert.equal(newIssueEventIds.length, 1)

            done()
          }, 1500)
        })
    })

    it(`should trigger issue type DeviceNoResults`, done => {
      const issueType = 'DeviceNoResults'
      server
        .post(path)
        .set('Authorization', `Bearer ${shared.token}`)
        .send({
          issueType,
          data: {
            deviceId,
            lastResultOn: now,
          },
        })
        .end(async (err, res) => {
          baseAssert(res, issueType)

          setTimeout(async () => {
            // check that record created
            const newIssueEventIds = await knex('IssueEvent')
              .whereNotIn('id', oldIssueEventIds)
              .whereRaw(`IFNULL(data->>"$.type", '') = 'DEVICE_NO_RESULTS'`)
              .whereRaw(`IFNULL(data->>"$.deviceId", 0) = ${deviceId}`)
              .pluck('id')
            assert.equal(newIssueEventIds.length, 1)

            done()
          }, 1500)
        })
    })
  })
})
