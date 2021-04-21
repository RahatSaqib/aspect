const chai = require('chai')
const { subDays } = require('date-fns')

const shared = require('../utils/sharedToken')
const { knex } = require('../../src/db')
const { issueTypeToId } = require('../../src/shared/dictionary')

const { assert } = chai
const server = require('../utils/testUtils')

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

  shared.checkToken(server, '/api/device')

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
    // get 1st available device for current user
    let deviceId
    let maxLastDateOffline
    let maxLastDateNoResult
    it('should return a list of devices when using valid token "approved"', async () => {
      const res = await server
        .get('/api/device')
        .set('Authorization', `Bearer ${shared.token}`)

      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')
      assert.property(res.body, 'data')
      assert.typeOf(res.body.data, 'array')
      assert.isAbove(res.body.data.length, 0)
      deviceId = res.body.data[0].id

      const {
        maxDaysDeviceOffline = 7,
        maxDaysDeviceNoResults = 14,
      } = await knex('Device as d')
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

      // helper funcs
      // eslint-disable-next-line no-unused-vars
      async function checkIssues(issueType, deviceId) {
        // check records added to Issue table
        const issueTypeId = await issueTypeToId(issueType)
        const newIssues = await knex('Issue')
          .whereNotIn('id', oldIssueIds)
          .where({ issueTypeId, deviceId })
          .select('id', 'level')
        // may have few records created for level=1 and =2 during timeout,
        // so check at least one record exists
        assert.isAtLeast(newIssues.length, 1)
        // has issue with level=1
        assert.equal(newIssues.filter(x => x.level === 1).length, 1)
      }

      it(`should trigger issue type DeviceOffline`, done => {
        const issueType = 'DeviceOffline'
        server
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
          .end(async (err, res) => {
            baseAssert(res, issueType)

            setTimeout(async () => {
              // check records added to IssueEvent table
              const newIssueEventIds = await knex('IssueEvent')
                .whereNotIn('id', oldIssueEventIds)
                .whereRaw(`IFNULL(data->>"$.type", '') = 'DEVICE_OFFLINE'`)
                .whereRaw(`IFNULL(data->>"$.deviceId", 0) = ${deviceId}`)
                .pluck('id')
              assert.equal(newIssueEventIds.length, 1)

              // await checkIssues(issueType, deviceId)

              done()
            }, 2000)
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
              lastResultOn: maxLastDateNoResult,
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

              // await checkIssues(issueType, deviceId)

              done()
            }, 2000)
          })
      })
    })
  })
})
