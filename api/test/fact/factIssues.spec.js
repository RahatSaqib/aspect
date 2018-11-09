const supertest = require('supertest')
const chai = require('chai')
const { addDays, subDays } = require('date-fns')
const { run } = require('../../src/db')
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
  processDynamicMessage,
  numberOfDays,
} = require('../../src/stringTemplate/service')
const {
  createMessageContext,
  waitForIdle,
  waitForAction,
} = require('../utils/mqUtils')
const { factGenerateDeviceConnectivity } = require('../../src/fact/actions')

const server = supertest.agent('http://localhost:8080')
const { assert, expect } = chai
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
  let siteName

  const { runTest } = context
  before(async () =>
    run(async knex => {
      const { siteId } = await knex('JobContext as jc')
        .innerJoin('Job as j', 'jc.jobId', 'j.id')
        .innerJoin('Person as p', 'j.personId', 'p.id')
        .innerJoin('User as u', 'p.userId', 'u.id')
        .where('u.name', USER_LU)
        .first('jc.siteId')
      const site = await knex('Site')
        .where({ id: siteId })
        .first('name')
      siteName = site.name
    })
  )
  beforeEach(async () => {
    await context.createDeviceApiKey()
  })
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
          site: { id: siteName },
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
      expect(factDevice).to.containSubset({
        offline: 0,
        noResults: 0,
        maintenance: 0,
      })
      assert.isNotOk(factDevice.maintenanceDueOn)

      await messageContext.factGenerateDeviceConnectivity(newDevice.id)
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
      expect(maxDaysDeviceOffline).to.be.above(1)
      expect(maxDaysDeviceNoResults).to.be.above(maxDaysDeviceOffline)
      const deviceOfflineDate = subDays(now, maxDaysDeviceOffline + 1)
      const deviceNoResultsDate = subDays(now, maxDaysDeviceNoResults + 1)
      const numberOfDaysOffline = numberOfDays(deviceOfflineDate)
      const numberOfDaysNoResults = numberOfDays(deviceNoResultsDate)
      assert.equal(numberOfDaysOffline, `${maxDaysDeviceOffline + 2} days`)
      assert.equal(numberOfDaysNoResults, `${maxDaysDeviceNoResults + 2} days`)
      await knex('Device as d')
        .where('d.id', newDevice.id)
        .update({
          createdOn: deviceNoResultsDate,
          lastPingOn: deviceOfflineDate,
        })

      const waitForOffline = waitForAction(deviceOffline(newDevice.id))
      await messageContext.factGenerateDeviceConnectivity(newDevice.id)
      await waitForOffline
      await waitForIdle()
      ;[factDevice] = await knex('FactDeviceFlag')
        .where({ deviceId })
        .select()
      expect(factDevice).to.containSubset({
        offline: 1,
        noResults: 0,
        maintenance: 0,
      })
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
      expect(issues).to.have.length(1)
      expect(issues).to.containSubset([
        {
          issueType: 'DeviceOffline',
          deviceId,
          issueStatus: 'Active',
        },
      ])
      const issueId = issues[0].id

      let notifications = await knex('Notification as n')
        .join('NotificationType as nt', 'nt.id', 'n.notificationTypeId')
        .join('JobFunction as jf', 'jf.id', 'nt.jobFunctionId')
        .join('Person as p', 'p.id', 'n.personId')
        .join('User as u', 'u.id', 'p.userId')
        .join('AlertMessage as am', 'am.id', 'n.alertMessageId')
        .where({ 'n.issueId': issueId })
        .orderBy('jf.name')
        .select(
          'u.name as userName',
          'jf.name as jobFunction',
          'nt.level',
          'nt.canAcknowledge',
          'am.message as alertMessage'
        )

      expect(notifications).to.have.length(2)
      let [notificationLU, notificationRO] = notifications
      expect(notificationLU).to.containSubset({
        userName: USER_LU,
        jobFunction: 'Lab User',
        level: issues[0].level,
        canAcknowledge: 1,
      })
      assert.equal(
        processDynamicMessage(notificationLU.alertMessage),
        `Cannot reach network for ${numberOfDaysOffline}`
      )
      expect(notificationRO).to.containSubset({
        userName: USER_RO,
        jobFunction: 'Regional Officer',
        level: issues[0].level,
        canAcknowledge: 0,
      })
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
      expect(issues).to.have.length(1)
      expect(issues).to.containSubset([
        {
          issueType: 'DeviceOffline',
          deviceId,
          issueStatus: 'Acknowledged',
        },
      ])

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
      ;[factDevice] = await knex('FactDeviceFlag')
        .where({ deviceId })
        .select()
      expect(factDevice).to.containSubset({
        offline: 0,
        noResults: 1,
        maintenance: 0,
      })
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
      expect(issues).to.have.length(2)
      expect(issues).to.containSubset([
        {
          id: issueId,
          issueType: 'DeviceOffline',
          deviceId,
          issueStatus: 'Resolved',
        },
        {
          issueType: 'DeviceNoResults',
          deviceId,
          issueStatus: 'Active',
        },
      ])

      notifications = await knex('Notification as n')
        .join('NotificationType as nt', 'nt.id', 'n.notificationTypeId')
        .join('JobFunction as jf', 'jf.id', 'nt.jobFunctionId')
        .join('Person as p', 'p.id', 'n.personId')
        .join('User as u', 'u.id', 'p.userId')
        .join('AlertMessage as am', 'am.id', 'n.alertMessageId')
        .where({ 'n.issueId': issues[1].id })
        .orderBy('jf.name')
        .select(
          'u.name as userName',
          'jf.name as jobFunction',
          'nt.level',
          'nt.canAcknowledge',
          'am.message as alertMessage'
        )

      expect(notifications).to.have.length(2)
      ;[notificationLU, notificationRO] = notifications
      expect(notificationLU).to.containSubset({
        userName: USER_LU,
        jobFunction: 'Lab User',
        level: issues[1].level,
        canAcknowledge: 1,
      })
      expect(notificationRO).to.containSubset({
        userName: USER_RO,
        jobFunction: 'Regional Officer',
        level: issues[1].level,
        canAcknowledge: 0,
      })
      assert.equal(
        processDynamicMessage(notificationRO.alertMessage),
        `No testing for ${numberOfDaysNoResults}`
      )

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
      ;[factDevice] = await knex('FactDeviceFlag')
        .where({ deviceId })
        .select()
      expect(factDevice).to.containSubset({
        offline: 0,
        noResults: 0,
        maintenance: 0,
      })
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
      expect(issues).to.have.length(2)
      expect(issues).to.containSubset([
        {
          id: issueId,
          issueType: 'DeviceOffline',
          deviceId,
          issueStatus: 'Resolved',
        },
        {
          issueType: 'DeviceNoResults',
          deviceId,
          issueStatus: 'Resolved',
        },
      ])

      const dueOn = new Date(+new Date() + 72000000)
      messageContext.deviceMaintenance(deviceId, {
        dueOn,
        data: { a: 1, hi: 'world' },
      })
      await waitForIdle()
      ;[factDevice] = await knex('FactDeviceFlag')
        .where({ deviceId })
        .select()
      expect(factDevice).to.containSubset({
        offline: 0,
        noResults: 0,
        maintenance: 1,
      })
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
      expect(issues).to.have.length(3)
      expect(issues).to.containSubset([
        {
          id: issueId,
          issueType: 'DeviceOffline',
          deviceId,
          issueStatus: 'Resolved',
        },
        {
          issueType: 'DeviceNoResults',
          deviceId,
          issueStatus: 'Resolved',
        },
        {
          issueType: 'DeviceMaintenance',
          deviceId,
          issueStatus: 'Active',
        },
      ])
      assert.approximately(+issues[2].dueOn, +dueOn, 3000)
      assert.deepEqual(JSON.parse(issues[2].data), { a: 1, hi: 'world' })

      await messageContext.deviceMaintenance(deviceId, {
        data: { b: 2, hi: 'universe' },
      })
      await waitForIdle()
      ;[factDevice] = await knex('FactDeviceFlag')
        .where({ deviceId })
        .select()
      expect(factDevice).to.containSubset({
        offline: 0,
        noResults: 0,
        maintenance: 1,
      })
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
      expect(issues).to.have.length(3)
      expect(issues).to.containSubset([
        {
          id: issueId,
          issueType: 'DeviceOffline',
          deviceId,
          issueStatus: 'Resolved',
        },
        {
          issueType: 'DeviceNoResults',
          deviceId,
          issueStatus: 'Resolved',
        },
        {
          issueType: 'DeviceMaintenance',
          deviceId,
          issueStatus: 'Active',
        },
      ])
      assert.approximately(+issues[2].dueOn, +dueOn, 3000)
      assert.deepEqual(JSON.parse(issues[2].data), {
        a: 1,
        b: 2,
        hi: 'universe',
      })

      const waitForFactGenerateDeviceConnectivity = waitForAction(
        factGenerateDeviceConnectivity(deviceId)
      )
      const waitForIssueResolve = waitForAction(issueResolved(issues[2].id))

      await messageContext.deviceMaintenanceResolved(deviceId)

      await Promise.all([
        waitForFactGenerateDeviceConnectivity,
        waitForIssueResolve,
      ])
      ;[factDevice] = await knex('FactDeviceFlag').where({ deviceId })
      expect(factDevice).to.containSubset({
        offline: 0,
        noResults: 0,
        maintenance: 0,
      })
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
      expect(issues).to.have.length(3)
      expect(issues).to.containSubset([
        {
          id: issueId,
          issueType: 'DeviceOffline',
          deviceId,
          issueStatus: 'Resolved',
        },
        {
          issueType: 'DeviceNoResults',
          deviceId,
          issueStatus: 'Resolved',
        },
        {
          issueType: 'DeviceMaintenance',
          deviceId,
          issueStatus: 'Resolved',
        },
      ])
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
          site: { id: siteName },
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

      const waitForFactGenerateDeviceConnectivity = waitForAction(
        factGenerateDeviceConnectivity(deviceId)
      )
      const waitForIssueResolve = waitForAction(issueResolved(issues[0].id))

      await messageContext.deviceMaintenanceResolved(deviceId)

      await Promise.all([
        waitForFactGenerateDeviceConnectivity,
        waitForIssueResolve,
      ])
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
          site: { id: siteName },
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

      const waitForFactGenerateDeviceConnectivity = waitForAction(
        factGenerateDeviceConnectivity(deviceId)
      )
      const waitForIssueResolve = waitForAction(issueResolved(issues[0].id))

      await messageContext.deviceMaintenanceResolved(deviceId)

      await Promise.all([
        waitForFactGenerateDeviceConnectivity,
        waitForIssueResolve,
      ])
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
          site: { id: siteName },
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
      const maintenanceDueOn = subDays(now, 2)
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

      const waitForFactGenerateDeviceConnectivity = waitForAction(
        factGenerateDeviceConnectivity(deviceId)
      )
      const waitForIssueResolve = waitForAction(issueResolved(issues[0].id))

      await messageContext.deviceMaintenanceResolved(deviceId)

      await Promise.all([
        waitForFactGenerateDeviceConnectivity,
        waitForIssueResolve,
      ])
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
})
