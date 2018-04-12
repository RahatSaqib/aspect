const supertest = require('supertest')
const chai = require('chai')
const { createTestContext, getDeviceFromApiKey } = require('../deviceApi/utils')
const { deviceOffline, deviceOnline } = require('../../src/device/actions')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai
const context = createTestContext(server, {
  user: 'myanmar_admin',
  partner: 'myanmar',
})

describe('Notification endpoints', () => {
  const devicePath = '/device'

  const { runTest } = context

  beforeEach(context.beforeEach)
  afterEach(context.afterEach)

  describe('Device Offline', () => {
    it.skip('should create Notification when DeviceOffline', () =>
      runTest(async knex => {
        const { apiKey, deviceAuth, createMessageContext } = context
        assert.isOk(apiKey)

        const messageContext = await createMessageContext()
        messageContext.bindActionCreators({ deviceOffline, deviceOnline })

        // add device
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
        assert.equal(newDevice.serial, null)

        const { id: deviceId } = newDevice

        // Notify device offline and wait for completion
        const waitForOffline = context.waitForAction(deviceOffline(deviceId))
        messageContext.deviceOffline(deviceId)
        await waitForOffline
        await context.waitForIdle()

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

        // Notify device online and wait for completion
        const waitForOnline = context.waitForAction(deviceOnline(deviceId))
        messageContext.deviceOnline(deviceId)
        await waitForOnline
        await context.waitForIdle()

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
      }))
  })
})
