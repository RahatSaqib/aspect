const supertest = require('supertest')
const chai = require('chai')
const subDays = require('date-fns/sub_days')
const { createTestContext, getDeviceFromApiKey } = require('../deviceApi/utils')
const {
  deviceOffline,
  deviceOnline,
  deviceNoResults,
} = require('../../src/device/actions')
const {
  createMessageContext,
  waitForIdle,
  waitForAction,
} = require('../utils/mqUtils')
const {
  factGenerate,
  factTypes: { DEVICE_OFFLINE, DEVICE_NO_RESULTS },
} = require('../../src/fact/actions')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai
const context = createTestContext(server, {
  user: 'myanmar_admin',
  partner: 'myanmar',
})

describe('Fact based issues', () => {
  const devicePath = '/device'

  const { runTest } = context

  beforeEach(context.beforeEach)
  afterEach(context.afterEach)

  it('should create issues when Device Offline and No Results', () =>
    runTest(async knex => {
      const now = new Date()
      const { apiKey, deviceAuth } = context
      assert.isOk(apiKey)

      const messageContext = await createMessageContext()
      messageContext.bindActionCreators({
        deviceOffline,
        deviceOnline,
        factGenerate,
      })

      await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          type: { id: 'GenericRDT' },
          site: { id: 'Hinthada TBC' },
        })
        .then(res => {
          assert.equal(res.status, 200)
        })
      const newDevice = await getDeviceFromApiKey(knex, apiKey)
      assert.isOk(newDevice)
      assert.isOk(newDevice.name)
      assert.isOk(newDevice.id)
      assert.isOk(newDevice.partnerId)

      const { id: deviceId } = newDevice

      let [factDevice] = await knex('FactDeviceFlag').where({ deviceId })
      assert.equal(factDevice.offline, 0)
      assert.equal(factDevice.noResults, 0)

      messageContext.factGenerate(DEVICE_OFFLINE, newDevice.id)
      messageContext.factGenerate(DEVICE_NO_RESULTS, newDevice.id)
      await waitForIdle()
      ;[factDevice] = await knex('FactDeviceFlag').where({ deviceId })
      assert.equal(factDevice.offline, 0)
      assert.equal(factDevice.noResults, 0)

      const { maxDaysDeviceOffline, maxDaysDeviceNoResults } = await knex(
        'Partner'
      )
        .where({ id: newDevice.partnerId })
        .first()
      assert.isOk(maxDaysDeviceOffline > 1)
      assert.isOk(maxDaysDeviceNoResults > maxDaysDeviceOffline)
      const deviceOfflineDate = subDays(now, maxDaysDeviceOffline + 1)
      const deviceNoResultsDate = subDays(now, maxDaysDeviceNoResults + 1)
      await knex('Device as d')
        .where('d.id', newDevice.id)
        .update({
          createdOn: deviceNoResultsDate,
          lastPingOn: deviceOfflineDate,
        })

      const waitForOffline = waitForAction(deviceOffline(newDevice.id))
      messageContext.factGenerate(DEVICE_OFFLINE, newDevice.id)
      messageContext.factGenerate(DEVICE_NO_RESULTS, newDevice.id)
      await waitForOffline
      await waitForIdle()
      ;[factDevice] = await knex('FactDeviceFlag').where({ deviceId })
      assert.equal(factDevice.offline, 1)
      assert.equal(factDevice.noResults, 0)

      let issues = await knex('Issue as i')
        .join('IssueType as it', 'i.issueTypeId', 'it.id')
        .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
        .where({ 'i.deviceId': deviceId })
        .select(
          'i.id',
          'it.externalId as issueType',
          'i.deviceId',
          'is.externalId as issueStatus'
        )
      assert.equal(issues.length, 1)
      assert.equal(issues[0].issueType, 'DeviceOffline')
      assert.equal(issues[0].deviceId, deviceId)
      assert.equal(issues[0].issueStatus, 'Active')
      const issueId = issues[0].id

      const waitForOnline = waitForAction(deviceOnline(newDevice.id))
      await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({})
        .then(res => {
          assert.equal(res.status, 200)
        })
      await waitForOnline
      await waitForIdle()
      ;[factDevice] = await knex('FactDeviceFlag').where({ deviceId })
      assert.equal(factDevice.offline, 0)
      assert.equal(factDevice.noResults, 0)

      issues = await knex('Issue as i')
        .join('IssueType as it', 'i.issueTypeId', 'it.id')
        .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
        .where({ 'i.deviceId': deviceId })
        .select(
          'i.id',
          'it.externalId as issueType',
          'i.deviceId',
          'is.externalId as issueStatus'
        )
      assert.equal(issues.length, 1)
      assert.equal(issues[0].id, issueId)
      assert.equal(issues[0].issueType, 'DeviceOffline')
      assert.equal(issues[0].deviceId, deviceId)
      assert.equal(issues[0].issueStatus, 'Resolved')

      const waitForNoResults = waitForAction(deviceNoResults(newDevice.id))
      messageContext.factGenerate(DEVICE_OFFLINE, newDevice.id)
      messageContext.factGenerate(DEVICE_NO_RESULTS, newDevice.id)
      await waitForNoResults
      await waitForIdle()
      ;[factDevice] = await knex('FactDeviceFlag').where({ deviceId })
      assert.equal(factDevice.offline, 0)
      assert.equal(factDevice.noResults, 1)

      issues = await knex('Issue as i')
        .join('IssueType as it', 'i.issueTypeId', 'it.id')
        .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
        .where({ 'i.deviceId': deviceId })
        .select(
          'i.id',
          'it.externalId as issueType',
          'i.deviceId',
          'is.externalId as issueStatus'
        )
        .orderBy('id', 'DESC')
      assert.equal(issues.length, 2)
      assert.equal(issues[0].issueType, 'DeviceNoResults')
      assert.equal(issues[0].deviceId, deviceId)
      assert.equal(issues[0].issueStatus, 'Active')
    }))
})
