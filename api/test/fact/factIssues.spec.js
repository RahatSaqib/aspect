const supertest = require('supertest')
const chai = require('chai')
const { addDays, subDays } = require('date-fns')
const { createTestContext, getDeviceFromApiKey } = require('../deviceApi/utils')
const {
  deviceOffline,
  deviceOnline,
  deviceNoResults,
  deviceMaintenance,
  deviceMaintenanceResolved,
} = require('../../src/device/actions')
const { issueAcknowledged, issueResolved } = require('../../src/issue/actions')
const {
  createMessageContext,
  waitForIdle,
  waitForAction,
} = require('../utils/mqUtils')
const { factGenerateDeviceConnectivity } = require('../../src/fact/actions')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai
const USER_LU = 'myanmar_lab1'
const USER_RO = 'myanmar_ro1'

const context = createTestContext(server, {
  user: USER_LU,
  password: USER_LU,
  // We want to create a new device for this test, so use a type
  // that is not seeded
  type: 'GenericRDT',
  partner: 'Myanmar',
})

describe('Fact based issues', () => {
  const devicePath = '/device'
  const issuePath = '/api/issue'

  const { runTest } = context

  beforeEach(context.beforeEach)
  afterEach(context.afterEach)

  it('should create issues when Device Offline and No Results > max days no results', () =>
    runTest(async knex => {
      const now = new Date()
      const { apiKey, deviceAuth, clientAuth } = context
      assert.isOk(apiKey)

      const messageContext = await createMessageContext()
      messageContext.bindActionCreators({
        deviceOffline,
        deviceOnline,
        deviceMaintenance,
        deviceMaintenanceResolved,
        factGenerateDeviceConnectivity,
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
      await waitForIdle(1000)

      const newDevice = await getDeviceFromApiKey(knex, apiKey)
      assert.isOk(newDevice)
      assert.isOk(newDevice.name)
      assert.isOk(newDevice.id)
      assert.isOk(newDevice.partnerId)

      const { id: deviceId } = newDevice

      let [factDevice] = await knex('FactDeviceFlag').where({ deviceId })
      assert.equal(factDevice.offline, 0)
      assert.equal(factDevice.noResults, 0)
      assert.equal(factDevice.maintenance, 0)
      assert.isNotOk(factDevice.maintenanceDueOn)

      messageContext.factGenerateDeviceConnectivity(newDevice.id)
      await waitForIdle()
      ;[factDevice] = await knex('FactDeviceFlag').where({ deviceId })
      assert.equal(factDevice.offline, 0)
      assert.equal(factDevice.noResults, 0)
      assert.equal(factDevice.maintenance, 0)
      assert.isNotOk(factDevice.maintenanceDueOn)

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
      messageContext.factGenerateDeviceConnectivity(newDevice.id)
      await waitForOffline
      await waitForIdle()
      ;[factDevice] = await knex('FactDeviceFlag').where({ deviceId })
      assert.equal(factDevice.offline, 1)
      assert.equal(factDevice.noResults, 0)
      assert.equal(factDevice.maintenance, 0)
      assert.isNotOk(factDevice.maintenanceDueOn)

      let issues = await knex('Issue as i')
        .join('IssueType as it', 'i.issueTypeId', 'it.id')
        .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
        .join('IssueStatusLog as isl', function() {
          // ensures we have a log with the same status as the issue
          // and we are expecting only one, so issues should not duplicate
          this.on('isl.issueId', 'i.id').andOn('isl.issueStatusId', 'is.id')
        })
        .where({ 'i.deviceId': deviceId })
        .whereNotNull('isl.changedOn')
        .whereNotNull('isl.createdOn')
        .select(
          'i.id',
          'it.externalId as issueType',
          'i.deviceId',
          'is.externalId as issueStatus',
          'i.level'
        )
      assert.equal(issues.length, 1)
      assert.equal(issues[0].issueType, 'DeviceOffline')
      assert.equal(issues[0].deviceId, deviceId)
      assert.equal(issues[0].issueStatus, 'Active')
      const issueId = issues[0].id

      let notifications = await knex('Notification as n')
        .join('NotificationType as nt', 'nt.id', 'n.notificationTypeId')
        .join('JobFunction as jf', 'jf.id', 'nt.jobFunctionId')
        .join('Person as p', 'p.id', 'n.personId')
        .join('User as u', 'u.id', 'p.userId')
        .where({ 'n.issueId': issueId })
        .orderBy('jf.name')
        .select(
          'u.name as userName',
          'jf.name as jobFunction',
          'nt.level',
          'nt.canAcknowledge'
        )

      assert.equal(notifications.length, 2)
      let [notificationLU, notificationRO] = notifications
      assert.equal(notificationLU.userName, USER_LU)
      assert.equal(notificationLU.jobFunction, 'Lab User')
      assert.equal(notificationLU.level, issues[0].level)
      assert.equal(notificationLU.canAcknowledge, 1)
      assert.equal(notificationRO.userName, USER_RO)
      assert.equal(notificationRO.jobFunction, 'Regional Officer')
      assert.equal(notificationRO.level, issues[0].level)
      assert.equal(notificationRO.canAcknowledge, 0)

      const waitForAck = waitForAction(issueAcknowledged(issueId))
      await server
        .put(`${issuePath}/status/${issueId}`)
        .set('Authorization', clientAuth)
        .send({ issueStatusExternalId: 'Acknowledged' })
        .then(res => {
          assert.equal(res.status, 200)
        })
      await waitForAck
      await waitForIdle()

      issues = await knex('Issue as i')
        .join('IssueType as it', 'i.issueTypeId', 'it.id')
        .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
        .join('IssueStatusLog as isl', function() {
          this.on('isl.issueId', 'i.id').andOn('isl.issueStatusId', 'is.id')
        })
        .where({ 'i.deviceId': deviceId })
        .whereNotNull('isl.changedOn')
        .whereNotNull('isl.createdOn')
        .select(
          'i.id',
          'it.externalId as issueType',
          'i.deviceId',
          'is.externalId as issueStatus'
        )
      assert.equal(issues.length, 1)
      assert.equal(issues[0].issueType, 'DeviceOffline')
      assert.equal(issues[0].deviceId, deviceId)
      assert.equal(issues[0].issueStatus, 'Acknowledged')

      const waitForResolve = waitForAction(issueResolved(issueId))
      const waitForOnline = waitForAction(deviceOnline(newDevice.id))
      const waitForNoResults = waitForAction(deviceNoResults(newDevice.id))
      await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({})
        .then(res => {
          assert.equal(res.status, 200)
        })
      await Promise.all([waitForOnline, waitForResolve, waitForNoResults])
      await waitForIdle()
      ;[factDevice] = await knex('FactDeviceFlag').where({ deviceId })
      assert.equal(factDevice.offline, 0)
      assert.equal(factDevice.noResults, 1)
      assert.equal(factDevice.maintenance, 0)
      assert.isNotOk(factDevice.maintenanceDueOn)

      issues = await knex('Issue as i')
        .join('IssueType as it', 'i.issueTypeId', 'it.id')
        .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
        .where({ 'i.deviceId': deviceId })
        .select(
          'i.id',
          'it.externalId as issueType',
          'i.deviceId',
          'is.externalId as issueStatus',
          'i.level'
        )
        .orderBy('id', 'ASC')
      assert.equal(issues.length, 2)
      assert.equal(issues[0].id, issueId)
      assert.equal(issues[0].issueType, 'DeviceOffline')
      assert.equal(issues[0].deviceId, deviceId)
      assert.equal(issues[0].issueStatus, 'Resolved')
      assert.equal(issues[1].issueType, 'DeviceNoResults')
      assert.equal(issues[1].deviceId, deviceId)
      assert.equal(issues[1].issueStatus, 'Active')

      notifications = await knex('Notification as n')
        .join('NotificationType as nt', 'nt.id', 'n.notificationTypeId')
        .join('JobFunction as jf', 'jf.id', 'nt.jobFunctionId')
        .join('Person as p', 'p.id', 'n.personId')
        .join('User as u', 'u.id', 'p.userId')
        .where({ 'n.issueId': issueId })
        .orderBy('jf.name')
        .select(
          'u.name as userName',
          'jf.name as jobFunction',
          'nt.level',
          'nt.canAcknowledge'
        )

      assert.equal(notifications.length, 2)
      ;[notificationLU, notificationRO] = notifications
      assert.equal(notificationLU.userName, USER_LU)
      assert.equal(notificationLU.jobFunction, 'Lab User')
      assert.equal(notificationLU.level, issues[0].level)
      assert.equal(notificationLU.canAcknowledge, 1)
      assert.equal(notificationRO.userName, USER_RO)
      assert.equal(notificationRO.jobFunction, 'Regional Officer')
      assert.equal(notificationRO.level, issues[0].level)
      assert.equal(notificationRO.canAcknowledge, 0)

      const resultPayload = {
        startedOn: now,
        data: { a: 'b' },
        assay: { id: 'GenericRDT' },
        instrument: { serial: '1234567' },
        sample: { id: '76543789' },
      }
      await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({ result: resultPayload })
        .then(res => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
        })
      await waitForIdle()
      ;[factDevice] = await knex('FactDeviceFlag').where({ deviceId })
      assert.equal(factDevice.offline, 0)
      assert.equal(factDevice.noResults, 0)
      assert.equal(factDevice.maintenance, 0)
      assert.isNotOk(factDevice.maintenanceDueOn)

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
        .orderBy('id', 'ASC')
      assert.equal(issues.length, 2)
      assert.equal(issues[0].id, issueId)
      assert.equal(issues[0].issueType, 'DeviceOffline')
      assert.equal(issues[0].deviceId, deviceId)
      assert.equal(issues[0].issueStatus, 'Resolved')
      assert.equal(issues[1].issueType, 'DeviceNoResults')
      assert.equal(issues[1].deviceId, deviceId)
      assert.equal(issues[1].issueStatus, 'Resolved')

      const dueOn = new Date(+new Date() + 72000000)
      messageContext.deviceMaintenance(deviceId, {
        dueOn,
        data: { a: 1, hi: 'world' },
      })
      await waitForIdle()
      ;[factDevice] = await knex('FactDeviceFlag').where({ deviceId })
      assert.equal(factDevice.offline, 0)
      assert.equal(factDevice.noResults, 0)
      assert.equal(factDevice.maintenance, 1)
      assert.approximately(+factDevice.maintenanceDueOn, +dueOn, 3000)
      issues = await knex('Issue as i')
        .join('IssueType as it', 'i.issueTypeId', 'it.id')
        .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
        .where({ 'i.deviceId': deviceId })
        .select(
          'i.id',
          'it.externalId as issueType',
          'i.deviceId',
          'is.externalId as issueStatus',
          'i.data',
          'i.dueOn'
        )
        .orderBy('id', 'ASC')
      assert.equal(issues.length, 3)
      assert.equal(issues[0].id, issueId)
      assert.equal(issues[0].issueType, 'DeviceOffline')
      assert.equal(issues[0].deviceId, deviceId)
      assert.equal(issues[0].issueStatus, 'Resolved')
      assert.equal(issues[1].issueType, 'DeviceNoResults')
      assert.equal(issues[1].deviceId, deviceId)
      assert.equal(issues[1].issueStatus, 'Resolved')
      assert.equal(issues[2].issueType, 'DeviceMaintenance')
      assert.equal(issues[2].deviceId, deviceId)
      assert.equal(issues[2].issueStatus, 'Active')
      assert.approximately(+issues[2].dueOn, +dueOn, 3000)
      assert.deepEqual(JSON.parse(issues[2].data), { a: 1, hi: 'world' })

      messageContext.deviceMaintenance(deviceId, {
        data: { b: 2, hi: 'universe' },
      })
      await waitForIdle()
      ;[factDevice] = await knex('FactDeviceFlag').where({ deviceId })
      assert.equal(factDevice.offline, 0)
      assert.equal(factDevice.noResults, 0)
      assert.equal(factDevice.maintenance, 1)
      assert.approximately(+factDevice.maintenanceDueOn, +dueOn, 3000)
      issues = await knex('Issue as i')
        .join('IssueType as it', 'i.issueTypeId', 'it.id')
        .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
        .where({ 'i.deviceId': deviceId })
        .select(
          'i.id',
          'it.externalId as issueType',
          'i.deviceId',
          'is.externalId as issueStatus',
          'i.data',
          'i.dueOn'
        )
        .orderBy('id', 'ASC')
      assert.equal(issues.length, 3)
      assert.equal(issues[0].id, issueId)
      assert.equal(issues[0].issueType, 'DeviceOffline')
      assert.equal(issues[0].deviceId, deviceId)
      assert.equal(issues[0].issueStatus, 'Resolved')
      assert.equal(issues[1].issueType, 'DeviceNoResults')
      assert.equal(issues[1].deviceId, deviceId)
      assert.equal(issues[1].issueStatus, 'Resolved')
      assert.equal(issues[2].issueType, 'DeviceMaintenance')
      assert.equal(issues[2].deviceId, deviceId)
      assert.equal(issues[2].issueStatus, 'Active')
      assert.approximately(+issues[2].dueOn, +dueOn, 3000)
      assert.deepEqual(JSON.parse(issues[2].data), {
        a: 1,
        b: 2,
        hi: 'universe',
      })

      messageContext.deviceMaintenanceResolved(deviceId)
      await waitForIdle()
      ;[factDevice] = await knex('FactDeviceFlag').where({ deviceId })
      assert.equal(factDevice.offline, 0)
      assert.equal(factDevice.noResults, 0)
      assert.equal(factDevice.maintenance, 0)
      assert.isNotOk(factDevice.maintenanceDueOn)
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
        .orderBy('id', 'ASC')
      assert.equal(issues.length, 3)
      assert.equal(issues[0].id, issueId)
      assert.equal(issues[0].issueType, 'DeviceOffline')
      assert.equal(issues[0].deviceId, deviceId)
      assert.equal(issues[0].issueStatus, 'Resolved')
      assert.equal(issues[1].issueType, 'DeviceNoResults')
      assert.equal(issues[1].deviceId, deviceId)
      assert.equal(issues[1].issueStatus, 'Resolved')
      assert.equal(issues[2].issueType, 'DeviceMaintenance')
      assert.equal(issues[2].deviceId, deviceId)
      assert.equal(issues[2].issueStatus, 'Resolved')
    }))

  it('should create no result issue maintenance expected back > Y days', () =>
    runTest(async knex => {
      const now = new Date()
      const { apiKey, deviceAuth } = context
      assert.isOk(apiKey)

      const messageContext = await createMessageContext()
      messageContext.bindActionCreators({
        deviceOffline,
        deviceOnline,
        deviceMaintenance,
        deviceMaintenanceResolved,
        factGenerateDeviceConnectivity,
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
      await waitForIdle(1000)

      const newDevice = await getDeviceFromApiKey(knex, apiKey)
      assert.isOk(newDevice)
      assert.isOk(newDevice.name)
      assert.isOk(newDevice.id)
      assert.isOk(newDevice.partnerId)

      const { id: deviceId } = newDevice

      messageContext.factGenerateDeviceConnectivity(newDevice.id)
      await waitForIdle()
      let [factDevice] = await knex('FactDeviceFlag').where({ deviceId })
      assert.equal(factDevice.offline, 0)
      assert.equal(factDevice.noResults, 0)
      assert.equal(factDevice.maintenance, 0)
      assert.isNotOk(factDevice.maintenanceDueOn)

      const { maxDaysDeviceOffline, maxDaysDeviceNoResults } = await knex(
        'Partner'
      )
        .where({ id: newDevice.partnerId })
        .first()
      assert.isOk(maxDaysDeviceOffline > 1)
      assert.isOk(maxDaysDeviceNoResults > maxDaysDeviceOffline)
      const deviceOfflineDate = subDays(now, maxDaysDeviceOffline - 2)
      const deviceNoResultsDate = subDays(now, maxDaysDeviceNoResults - 2)
      const maintenanceDueOn = addDays(now, 30 + 2)
      await knex('Device as d')
        .where('d.id', newDevice.id)
        .update({
          createdOn: deviceNoResultsDate,
          lastPingOn: deviceOfflineDate,
        })

      messageContext.factGenerateDeviceConnectivity(newDevice.id)
      await waitForIdle()
      ;[factDevice] = await knex('FactDeviceFlag').where({ deviceId })
      assert.equal(factDevice.offline, 0)
      assert.equal(factDevice.noResults, 0)
      assert.equal(factDevice.maintenance, 0)
      assert.isNotOk(factDevice.maintenanceDueOn)

      let issues = await knex('Issue as i')
        .join('IssueType as it', 'i.issueTypeId', 'it.id')
        .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
        .join('IssueStatusLog as isl', function() {
          // ensures we have a log with the same status as the issue
          // and we are expecting only one, so issues should not duplicate
          this.on('isl.issueId', 'i.id').andOn('isl.issueStatusId', 'is.id')
        })
        .where({ 'i.deviceId': deviceId })
        .whereNotNull('isl.changedOn')
        .whereNotNull('isl.createdOn')
        .select(
          'i.id',
          'it.externalId as issueType',
          'i.deviceId',
          'is.externalId as issueStatus',
          'i.level'
        )
      assert.equal(issues.length, 0)

      messageContext.deviceMaintenance(deviceId, {
        dueOn: maintenanceDueOn,
        data: { a: 1, hi: 'world' },
      })
      await waitForIdle()
      ;[factDevice] = await knex('FactDeviceFlag').where({ deviceId })
      assert.equal(factDevice.offline, 0)
      assert.equal(factDevice.noResults, 1)
      assert.equal(factDevice.maintenance, 1)
      assert.approximately(
        +factDevice.maintenanceDueOn,
        +maintenanceDueOn,
        3000
      )
      issues = await knex('Issue as i')
        .join('IssueType as it', 'i.issueTypeId', 'it.id')
        .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
        .where({ 'i.deviceId': deviceId })
        .select(
          'i.id',
          'it.externalId as issueType',
          'i.deviceId',
          'is.externalId as issueStatus',
          'i.data',
          'i.dueOn'
        )
        .orderBy('id', 'ASC')
      assert.equal(issues.length, 2)
      assert.equal(issues[0].issueType, 'DeviceMaintenance')
      assert.equal(issues[0].deviceId, deviceId)
      assert.equal(issues[0].issueStatus, 'Active')
      assert.equal(issues[1].issueType, 'DeviceNoResults')
      assert.equal(issues[1].deviceId, deviceId)
      assert.equal(issues[1].issueStatus, 'Active')
      assert.approximately(+issues[0].dueOn, +maintenanceDueOn, 3000)
      assert.deepEqual(JSON.parse(issues[0].data), { a: 1, hi: 'world' })

      messageContext.deviceMaintenanceResolved(deviceId)
      await waitForIdle()
      ;[factDevice] = await knex('FactDeviceFlag').where({ deviceId })
      assert.equal(factDevice.offline, 0)
      assert.equal(factDevice.noResults, 1)
      assert.equal(factDevice.maintenance, 0)
      assert.isNotOk(factDevice.maintenanceDueOn)
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
        .orderBy('id', 'ASC')
      assert.equal(issues.length, 2)
      assert.equal(issues[0].issueType, 'DeviceMaintenance')
      assert.equal(issues[0].deviceId, deviceId)
      assert.equal(issues[0].issueStatus, 'Resolved')
      assert.equal(issues[1].issueType, 'DeviceNoResults')
      assert.equal(issues[1].deviceId, deviceId)
      assert.equal(issues[1].issueStatus, 'Active')

      const resultPayload = {
        startedOn: now,
        data: { a: 'b' },
        assay: { id: 'GenericRDT' },
        instrument: { serial: '1234567' },
        sample: { id: '76543789' },
      }
      await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({ result: resultPayload })
        .then(res => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
        })
      await waitForIdle()
      ;[factDevice] = await knex('FactDeviceFlag').where({ deviceId })
      assert.equal(factDevice.offline, 0)
      assert.equal(factDevice.noResults, 0)
      assert.equal(factDevice.maintenance, 0)
      assert.isNotOk(factDevice.maintenanceDueOn)

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
        .orderBy('id', 'ASC')
      assert.equal(issues.length, 2)
      assert.equal(issues[0].issueType, 'DeviceMaintenance')
      assert.equal(issues[0].deviceId, deviceId)
      assert.equal(issues[0].issueStatus, 'Resolved')
      assert.equal(issues[1].issueType, 'DeviceNoResults')
      assert.equal(issues[1].deviceId, deviceId)
      assert.equal(issues[1].issueStatus, 'Resolved')
    }))

  it('should NOT create no result issue maintenance expected back < Y days', () =>
    runTest(async knex => {
      const now = new Date()
      const { apiKey, deviceAuth } = context
      assert.isOk(apiKey)

      const messageContext = await createMessageContext()
      messageContext.bindActionCreators({
        deviceOffline,
        deviceOnline,
        deviceMaintenance,
        deviceMaintenanceResolved,
        factGenerateDeviceConnectivity,
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
      await waitForIdle(1000)

      const newDevice = await getDeviceFromApiKey(knex, apiKey)
      assert.isOk(newDevice)
      assert.isOk(newDevice.name)
      assert.isOk(newDevice.id)
      assert.isOk(newDevice.partnerId)

      const { id: deviceId } = newDevice

      messageContext.factGenerateDeviceConnectivity(newDevice.id)
      await waitForIdle()
      let [factDevice] = await knex('FactDeviceFlag').where({ deviceId })
      assert.equal(factDevice.offline, 0)
      assert.equal(factDevice.noResults, 0)
      assert.equal(factDevice.maintenance, 0)
      assert.isNotOk(factDevice.maintenanceDueOn)

      const { maxDaysDeviceOffline, maxDaysDeviceNoResults } = await knex(
        'Partner'
      )
        .where({ id: newDevice.partnerId })
        .first()
      assert.isOk(maxDaysDeviceOffline > 1)
      assert.isOk(maxDaysDeviceNoResults > maxDaysDeviceOffline)
      const deviceOfflineDate = subDays(now, maxDaysDeviceOffline - 2)
      const deviceNoResultsDate = subDays(now, maxDaysDeviceNoResults - 2)
      const maintenanceDueOn = addDays(now, 30 - 2)
      await knex('Device as d')
        .where('d.id', newDevice.id)
        .update({
          createdOn: deviceNoResultsDate,
          lastPingOn: deviceOfflineDate,
        })

      messageContext.factGenerateDeviceConnectivity(newDevice.id)
      await waitForIdle()
      ;[factDevice] = await knex('FactDeviceFlag').where({ deviceId })
      assert.equal(factDevice.offline, 0)
      assert.equal(factDevice.noResults, 0)
      assert.equal(factDevice.maintenance, 0)
      assert.isNotOk(factDevice.maintenanceDueOn)

      let issues = await knex('Issue as i')
        .join('IssueType as it', 'i.issueTypeId', 'it.id')
        .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
        .join('IssueStatusLog as isl', function() {
          // ensures we have a log with the same status as the issue
          // and we are expecting only one, so issues should not duplicate
          this.on('isl.issueId', 'i.id').andOn('isl.issueStatusId', 'is.id')
        })
        .where({ 'i.deviceId': deviceId })
        .whereNotNull('isl.changedOn')
        .whereNotNull('isl.createdOn')
        .select(
          'i.id',
          'it.externalId as issueType',
          'i.deviceId',
          'is.externalId as issueStatus',
          'i.level'
        )
      assert.equal(issues.length, 0)

      messageContext.deviceMaintenance(deviceId, {
        dueOn: maintenanceDueOn,
        data: { a: 1, hi: 'world' },
      })
      await waitForIdle()
      ;[factDevice] = await knex('FactDeviceFlag').where({ deviceId })
      assert.equal(factDevice.offline, 0)
      assert.equal(factDevice.noResults, 0)
      assert.equal(factDevice.maintenance, 1)
      assert.approximately(
        +factDevice.maintenanceDueOn,
        +maintenanceDueOn,
        3000
      )
      issues = await knex('Issue as i')
        .join('IssueType as it', 'i.issueTypeId', 'it.id')
        .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
        .where({ 'i.deviceId': deviceId })
        .select(
          'i.id',
          'it.externalId as issueType',
          'i.deviceId',
          'is.externalId as issueStatus',
          'i.data',
          'i.dueOn'
        )
        .orderBy('id', 'ASC')
      assert.equal(issues.length, 1)
      assert.equal(issues[0].issueType, 'DeviceMaintenance')
      assert.equal(issues[0].deviceId, deviceId)
      assert.equal(issues[0].issueStatus, 'Active')
      assert.approximately(+issues[0].dueOn, +maintenanceDueOn, 3000)
      assert.deepEqual(JSON.parse(issues[0].data), { a: 1, hi: 'world' })

      messageContext.deviceMaintenanceResolved(deviceId)
      await waitForIdle()
      ;[factDevice] = await knex('FactDeviceFlag').where({ deviceId })
      assert.equal(factDevice.offline, 0)
      assert.equal(factDevice.noResults, 0)
      assert.equal(factDevice.maintenance, 0)
      assert.isNotOk(factDevice.maintenanceDueOn)
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
        .orderBy('id', 'ASC')
      assert.equal(issues.length, 1)
      assert.equal(issues[0].issueType, 'DeviceMaintenance')
      assert.equal(issues[0].deviceId, deviceId)
      assert.equal(issues[0].issueStatus, 'Resolved')
    }))

  it('should create no result issue maintenance expected back < Y days but date passes expected back', () =>
    runTest(async knex => {}))
})
