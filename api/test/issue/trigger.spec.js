const chai = require('chai')
const { subDays } = require('date-fns')

const shared = require('../utils/sharedToken')
const { knex } = require('../../src/db')

const { assert } = chai
const server = require('../utils/testUtils')
const { waitForIdle } = require('../utils/mqUtils')

const baseAssert = (res, issueType) => {
  assert.equal(res.status, 200)

  const { ok, data = {} } = res.body
  assert.equal(ok, true)
  assert.equal(issueType, data.issueType)
  assert.equal(data.triggered, true)
}

describe('Issue Trigger', () => {
  const path = '/api/issue/trigger'
  const now = new Date()

  it(`should trigger issue type NewResultsAvailable`, async () => {
    const issueType = 'NewResultsAvailable'
    const res = await server.post(path).set('Authorization', `Bearer ${shared.token}`).send({
      issueType,
    })

    baseAssert(res, issueType)
  })

  describe('For Device', () => {
    // get 1st available device for current user
    let deviceId
    let maxLastDateOffline
    let maxLastDateNoResult
    it('should return a list of devices when using valid token "approved"', async () => {
      const res = await server.get('/api/device').set('Authorization', `Bearer ${shared.token}`)

      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')
      assert.property(res.body, 'data')
      assert.typeOf(res.body.data, 'array')
      assert.isAbove(res.body.data.length, 0)
      deviceId = res.body.data[0].id

      const { maxDaysDeviceOffline = 7, maxDaysDeviceNoResults = 14 } = await knex('Device as d')
        .join('Partner as p', 'd.partnerId', 'p.id')
        .where('d.id', deviceId)
        .first('p.maxDaysDeviceOffline', 'p.maxDaysDeviceNoResults')

      maxLastDateOffline = subDays(now, maxDaysDeviceOffline + 1)
      maxLastDateNoResult = subDays(now, maxDaysDeviceNoResults + 1)
    })

    describe('should trigger different device events', () => {
      let oldIssueEventIds = []
      let oldIssueIds = []
      beforeEach(async () => {
        // read existing items
        oldIssueEventIds = await knex('IssueEvent').pluck('id')
        oldIssueIds = await knex('Issue').pluck('id')
      })
      afterEach(async () => {
        // delete only new items
        await knex('IssueEvent').whereNotIn('id', oldIssueEventIds).del()
        await knex('Issue').whereNotIn('id', oldIssueIds).del()
      })

      it(`should trigger issue type DeviceOffline`, async () => {
        const issueType = 'DeviceOffline'
        const res = await server
          .post(path)
          .set('Authorization', `Bearer ${shared.token}`)
          .send({
            issueType,
            data: {
              deviceId,
              lastSeenOn: maxLastDateOffline,
              lastPingOn: maxLastDateOffline,
            },
          })

        baseAssert(res, issueType)

        await waitForIdle(2000)

        // check records added to IssueEvent table
        const newIssueEventIds = await knex('IssueEvent')
          .whereNotIn('id', oldIssueEventIds)
          .whereRaw(`IFNULL(data->>"$.type", '') = 'DEVICE_OFFLINE'`)
          .whereRaw(`IFNULL(data->>"$.deviceId", 0) = ${deviceId}`)
          .pluck('id')
        assert.equal(newIssueEventIds.length, 1)
      })

      it(`should trigger issue type DeviceNoResults`, async () => {
        const issueType = 'DeviceNoResults'
        const res = await server
          .post(path)
          .set('Authorization', `Bearer ${shared.token}`)
          .send({
            issueType,
            data: {
              deviceId,
              lastResultOn: maxLastDateNoResult,
            },
          })

        baseAssert(res, issueType)
        await waitForIdle(2000)

        // check that record created
        const newIssueEventIds = await knex('IssueEvent')
          .whereNotIn('id', oldIssueEventIds)
          .whereRaw(`IFNULL(data->>"$.type", '') = 'DEVICE_NO_RESULTS'`)
          .whereRaw(`IFNULL(data->>"$.deviceId", 0) = ${deviceId}`)
          .pluck('id')
        assert.equal(newIssueEventIds.length, 1)
      })
    })
  })
})
