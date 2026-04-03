const format = require('date-fns/format')
const chai = require('chai')
const chaiSubset = require('chai-subset')
const { addDays, subDays, subHours } = require('date-fns')
const { range, random, map } = require('lodash')
const { knex } = require('../../src/db')
const { createTestContext, getDeviceFromApiKey } = require('../deviceApi/utils')
const {
  deviceOffline,
  deviceOnline,
  deviceMaintenance,
  deviceMaintenanceResolved,
} = require('../../src/device/actions')
const { issueAcknowledged, issueResolved, resolveIssues } = require('../../src/issue/actions')
const { processDynamicMessage, numberOfDays } = require('../../src/stringTemplate/service')
const { createMessageContext, waitForIdle, waitForAction, dispatchAndWaitForAction } = require('../utils/mqUtils')
const {
  factGenerateDeviceConnectivity,
  factNewResultsAvailableCheck,
  factCheckCompletionRatePerSite,
} = require('../../src/fact/actions')
const {
  resultSourceToId,
  resultTypeToId,
  issueTypeToId,
  issueStatusToId,
  issueEventStatusToId,
} = require('../../src/shared/dictionary')

const server = require('../utils/testUtils')

const { assert, expect } = chai.use(chaiSubset)
const USER_LU = 'myanmar_lab1'
const USER_RO = 'myanmar_ro1'

const context = createTestContext(knex, server, {
  user: USER_LU,
  password: USER_LU,
  // We want to create a new device for this test, so use a type
  // that is not seeded
  type: 'CepheidGeneXpert',
  partner: 'MoHS',
})

describe('Fact based issues', () => {
  const devicePath = '/device'
  const issuePath = '/api/issue'
  const { runTest } = context
  beforeEach(async () => {
    await context.createDeviceApiKey()
  })
  afterEach(context.afterEach)

  it.skip('should create issues when Device Offline and No Results > max days no results', () =>
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
          includeDeviceConfiguration: false,
          type: {
            id: 'CepheidGeneXpert',
          },
          result: {
            startedOn: new Date(),
            data: { assay: 'Xpert MTB-RIF', a: 'b' },
            assay: { id: 'GxMtbRif' },
            instrument: { serial: 'GX-00001' },
            sample: { id: '29347293' },
          },
          name: 'Fact Test Device',
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

      const { maxDaysDeviceOffline, maxDaysDeviceNoResults } = await knex('Partner')
        .where({ id: newDevice.partnerId })
        .first()
      expect(maxDaysDeviceOffline).to.be.above(1)
      expect(maxDaysDeviceNoResults).to.be.above(maxDaysDeviceOffline)
      const deviceOfflineDate = subDays(now, maxDaysDeviceOffline + 1)
      const deviceNoResultsDate = subDays(now, maxDaysDeviceNoResults + 1)
      const numberOfDaysOffline = numberOfDays(deviceOfflineDate)
      const numberOfDaysNoResults = numberOfDays(deviceNoResultsDate)
      assert.equal(numberOfDaysOffline, `${maxDaysDeviceOffline + 1} days`)
      assert.equal(numberOfDaysNoResults, `${maxDaysDeviceNoResults + 1} days`)
      await knex('Device as d').where('d.id', newDevice.id).update({
        createdOn: deviceNoResultsDate,
        lastPingOn: deviceOfflineDate,
        lastSeenOn: deviceOfflineDate,
      })

      const [{ id: deviceApprovalIdApproved }] = [await knex('DeviceApproval').where({ token: 'approved' }).first()]
      await knex('Device').update('deviceApprovalId', deviceApprovalIdApproved).where('id', deviceId)

      const waitForOffline = waitForAction(deviceOffline(newDevice.id))
      await messageContext.factGenerateDeviceConnectivity(newDevice.id)
      await waitForOffline
      await waitForIdle()
      ;[factDevice] = await knex('FactDeviceFlag').where({ deviceId }).select()
      expect(factDevice).to.containSubset({
        offline: 1,
        noResults: 1,
        maintenance: 0,
      })
      assert.isNotOk(factDevice.maintenanceDueOn)

      let issues = await knex('Issue as i')
        .join('IssueType as it', 'i.issueTypeId', 'it.id')
        .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
        .join('IssueStatusLog as isl', function () {
          // ensures we have a log with the same status as the issue
          // and we are expecting only one, so issues should not duplicate
          this.on('isl.issueId', 'i.id').andOn('isl.issueStatusId', 'is.id')
        })
        .where({ 'i.deviceId': deviceId })
        .whereNotNull('isl.changedOn')
        .whereNotNull('isl.createdOn')
        .select('i.id', 'it.externalId as issueType', 'i.deviceId', 'is.externalId as issueStatus', 'i.level')
      expect(issues).to.have.length(2)
      expect(issues).to.containSubset([
        {
          issueType: 'DeviceOffline',
          deviceId,
          issueStatus: 'Active',
        },
        {
          issueType: 'DeviceNoResults',
          deviceId,
          issueStatus: 'Active',
        },
      ])
      const issueId = issues.find(issue => issue.issueType === 'DeviceOffline').id

      let notifications = await knex('Notification as n')
        .join('NotificationType as nt', 'nt.id', 'n.notificationTypeId')
        .join('Person as p', 'p.id', 'n.personId')
        .join('User as u', 'u.id', 'p.userId')
        .join('AlertMessage as am', 'am.id', 'n.alertMessageId')
        .where({ 'n.issueId': issueId })
        .distinct('u.name as userName', 'am.message as alertMessage')

      expect(notifications).to.have.length.greaterThanOrEqual(1)
      const [notificationLU] = notifications
      expect(notificationLU).to.containSubset({
        userName: USER_LU,
      })
      assert.equal(
        processDynamicMessage(notificationLU.alertMessage),
        `Cannot reach network for ${numberOfDaysOffline}`
      )

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
        .join('IssueStatusLog as isl', function () {
          this.on('isl.issueId', 'i.id').andOn('isl.issueStatusId', 'is.id')
        })
        .where({ 'i.deviceId': deviceId })
        .whereNotNull('isl.changedOn')
        .whereNotNull('isl.createdOn')
        .select('i.id', 'it.externalId as issueType', 'i.deviceId', 'is.externalId as issueStatus')
      expect(issues).to.have.length(2)
      expect(issues).to.containSubset([
        {
          issueType: 'DeviceOffline',
          deviceId,
          issueStatus: 'Acknowledged',
        },
        {
          issueType: 'DeviceNoResults',
          deviceId,
          issueStatus: 'Active',
        },
      ])

      const waitForResolve = waitForAction(issueResolved(issueId))
      const waitForOnline = waitForAction(deviceOnline(newDevice.id))
      await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({})
        .then(res => {
          assert.equal(res.status, 200)
        })
      await Promise.all([waitForOnline, waitForResolve])
      await waitForIdle()
      ;[factDevice] = await knex('FactDeviceFlag').where({ deviceId }).select()
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
        .select('i.id', 'it.externalId as issueType', 'i.deviceId', 'is.externalId as issueStatus', 'i.level')
        .orderBy('id', 'ASC')
      expect(issues).to.have.length(2)
      const deviceOfflineIssue = issues.find(issue => issue.issueType === 'DeviceOffline')
      assert.equal(deviceOfflineIssue.deviceId, deviceId)
      assert.equal(deviceOfflineIssue.issueStatus, 'Resolved')
      const deviceNoResultsIssue = issues.find(issue => issue.issueType === 'DeviceNoResults')
      assert.equal(deviceNoResultsIssue.issueType, 'DeviceNoResults')
      assert.equal(deviceNoResultsIssue.deviceId, deviceId)
      assert.equal(deviceNoResultsIssue.issueStatus, 'Active')

      notifications = await knex('Notification as n')
        .join('NotificationType as nt', 'nt.id', 'n.notificationTypeId')
        .join('Person as p', 'p.id', 'n.personId')
        .join('User as u', 'u.id', 'p.userId')
        .join('AlertMessage as am', 'am.id', 'n.alertMessageId')
        .where({ 'n.issueId': deviceNoResultsIssue.id })
        .distinct('u.name as userName', 'am.message as alertMessage')

      expect(notifications).to.have.length.greaterThanOrEqual(2)
      expect(notifications).to.containSubset([
        {
          userName: USER_LU,
          alertMessage: `No testing for ${numberOfDaysNoResults}`,
        },
        {
          userName: USER_RO,
          alertMessage: `No testing for ${numberOfDaysNoResults}`,
        },
      ])

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
      ;[factDevice] = await knex('FactDeviceFlag').where({ deviceId }).select()
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
        .select('i.id', 'it.externalId as issueType', 'i.deviceId', 'is.externalId as issueStatus')
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
      ;[factDevice] = await knex('FactDeviceFlag').where({ deviceId }).select()
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
        .select('i.id', 'it.externalId as issueType', 'i.deviceId', 'is.externalId as issueStatus', 'i.data', 'i.dueOn')
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
      ;[factDevice] = await knex('FactDeviceFlag').where({ deviceId }).select()
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
        .select('i.id', 'it.externalId as issueType', 'i.deviceId', 'is.externalId as issueStatus', 'i.data', 'i.dueOn')
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

      const waitForFactGenerateDeviceConnectivity = waitForAction(factGenerateDeviceConnectivity(deviceId))
      const waitForIssueResolve = waitForAction(issueResolved(issues[2].id))

      await messageContext.deviceMaintenanceResolved(deviceId)

      await Promise.all([waitForFactGenerateDeviceConnectivity, waitForIssueResolve])
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
        .select('i.id', 'it.externalId as issueType', 'i.deviceId', 'is.externalId as issueStatus')
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
          includeDeviceConfiguration: false,
          type: {
            id: 'CepheidGeneXpert',
          },
          result: {
            startedOn: subDays(now, 45),
            data: { assay: 'Xpert MTB-RIF', a: 'b' },
            assay: { id: 'GxMtbRif' },
            instrument: { serial: 'GX-00001' },
            sample: { id: '29347293' },
          },
          name: 'Fact Test Device',
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

      const { maxDaysDeviceOffline, maxDaysDeviceNoResults } = await knex('Partner')
        .where({ id: newDevice.partnerId })
        .first()
      assert.isOk(maxDaysDeviceOffline > 1)
      assert.isOk(maxDaysDeviceNoResults > maxDaysDeviceOffline)
      const deviceOfflineDate = subDays(now, maxDaysDeviceOffline - 2)
      let deviceNoResultsDate = subDays(now, maxDaysDeviceNoResults - 2)
      const maintenanceDueOn = addDays(now, 30 + 2)
      await knex('Device as d')
        .where('d.id', newDevice.id)
        .update({
          siteId: knex('Site').where('partnerId', newDevice.partnerId).first('id'),
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
        .join('IssueStatusLog as isl', function () {
          // ensures we have a log with the same status as the issue
          // and we are expecting only one, so issues should not duplicate
          this.on('isl.issueId', 'i.id').andOn('isl.issueStatusId', 'is.id')
        })
        .where({ 'i.deviceId': deviceId })
        .whereNotNull('isl.changedOn')
        .whereNotNull('isl.createdOn')
        .select('i.id', 'it.externalId as issueType', 'i.deviceId', 'is.externalId as issueStatus', 'i.level')
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
      assert.approximately(+factDevice.maintenanceDueOn, +maintenanceDueOn, 3000)
      issues = await knex('Issue as i')
        .join('IssueType as it', 'i.issueTypeId', 'it.id')
        .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
        .where({ 'i.deviceId': deviceId })
        .select('i.id', 'it.externalId as issueType', 'i.deviceId', 'is.externalId as issueStatus', 'i.data', 'i.dueOn')
        .orderBy('id', 'ASC')
      assert.equal(issues.length, 1)
      assert.equal(issues[0].issueType, 'DeviceMaintenance')
      assert.equal(issues[0].deviceId, deviceId)
      assert.equal(issues[0].issueStatus, 'Active')
      assert.approximately(+issues[0].dueOn, +maintenanceDueOn, 3000)
      assert.deepEqual(JSON.parse(issues[0].data), { a: 1, hi: 'world' })

      deviceNoResultsDate = subDays(now, maxDaysDeviceNoResults + 1)
      await knex('Device as d').where('d.id', newDevice.id).update({
        createdOn: deviceNoResultsDate,
      })

      messageContext.factGenerateDeviceConnectivity(deviceId)
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
        .select('i.id', 'it.externalId as issueType', 'i.deviceId', 'is.externalId as issueStatus')
        .orderBy('id', 'ASC')
      assert.equal(issues.length, 2)

      let deviceMaintenanceIssue = issues.find(issue => issue.issueType === 'DeviceMaintenance')
      assert.equal(deviceMaintenanceIssue.deviceId, deviceId)
      assert.equal(deviceMaintenanceIssue.issueStatus, 'Resolved')
      let deviceNoResultsIssue = issues.find(issue => issue.issueType === 'DeviceNoResults')
      assert.equal(deviceNoResultsIssue.issueType, 'DeviceNoResults')
      assert.equal(deviceNoResultsIssue.deviceId, deviceId)
      assert.equal(deviceNoResultsIssue.issueStatus, 'Active')

      const resultPayload = {
        startedOn: now,
        data: { assay: 'Xpert MTB-RIF', a: 'b' },
        assay: { id: 'GxMtbRif' },
        instrument: { serial: 'GX-00001' },
        sample: { id: '76543789' },
        endedOn: addDays(new Date(), 2),
      }
      await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          type: {
            id: 'CepheidGeneXpert',
          },
          result: resultPayload,
        })
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
        .select('i.id', 'it.externalId as issueType', 'i.deviceId', 'is.externalId as issueStatus')
        .orderBy('id', 'ASC')
      assert.equal(issues.length, 2)
      deviceMaintenanceIssue = issues.find(issue => issue.issueType === 'DeviceMaintenance')
      assert.equal(deviceMaintenanceIssue.deviceId, deviceId)
      assert.equal(deviceMaintenanceIssue.issueStatus, 'Resolved')
      deviceNoResultsIssue = issues.find(issue => issue.issueType === 'DeviceNoResults')
      assert.equal(deviceNoResultsIssue.issueType, 'DeviceNoResults')
      assert.equal(deviceNoResultsIssue.deviceId, deviceId)
      assert.equal(deviceNoResultsIssue.issueStatus, 'Resolved')
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
          includeDeviceConfiguration: false,
          type: {
            id: 'CepheidGeneXpert',
          },
          result: {
            startedOn: subDays(now, 45),
            data: { assay: 'Xpert MTB-RIF', a: 'b' },
            assay: { id: 'GxMtbRif' },
            instrument: { serial: 'GX-00001' },
            sample: { id: '29347293' },
          },
          name: 'Fact Test Device',
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

      const { maxDaysDeviceOffline, maxDaysDeviceNoResults } = await knex('Partner')
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
          siteId: knex('Site').where('partnerId', newDevice.partnerId).first('id'),
          createdOn: format(deviceNoResultsDate, 'yyyy-MM-dd'),
          lastPingOn: format(deviceOfflineDate, 'yyyy-MM-dd'),
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
        .join('IssueStatusLog as isl', function () {
          // ensures we have a log with the same status as the issue
          // and we are expecting only one, so issues should not duplicate
          this.on('isl.issueId', 'i.id').andOn('isl.issueStatusId', 'is.id')
        })
        .where({ 'i.deviceId': deviceId })
        .whereNotNull('isl.changedOn')
        .whereNotNull('isl.createdOn')
        .select('i.id', 'it.externalId as issueType', 'i.deviceId', 'is.externalId as issueStatus', 'i.level')
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
      assert.approximately(+factDevice.maintenanceDueOn, +maintenanceDueOn, 3000)
      issues = await knex('Issue as i')
        .join('IssueType as it', 'i.issueTypeId', 'it.id')
        .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
        .where({ 'i.deviceId': deviceId })
        .select('i.id', 'it.externalId as issueType', 'i.deviceId', 'is.externalId as issueStatus', 'i.data', 'i.dueOn')
        .orderBy('id', 'ASC')
      assert.equal(issues.length, 1)
      assert.equal(issues[0].issueType, 'DeviceMaintenance')
      assert.equal(issues[0].deviceId, deviceId)
      assert.equal(issues[0].issueStatus, 'Active')
      assert.approximately(+issues[0].dueOn, +maintenanceDueOn, 3000)
      assert.deepEqual(JSON.parse(issues[0].data), { a: 1, hi: 'world' })

      const waitForFactGenerateDeviceConnectivity = waitForAction(factGenerateDeviceConnectivity(deviceId))
      const waitForIssueResolve = waitForAction(issueResolved(issues[0].id))

      await messageContext.deviceMaintenanceResolved(deviceId)

      await Promise.all([waitForFactGenerateDeviceConnectivity, waitForIssueResolve])
      ;[factDevice] = await knex('FactDeviceFlag').where({ deviceId })
      assert.equal(factDevice.offline, 0)
      assert.equal(factDevice.noResults, 0)
      assert.equal(factDevice.maintenance, 0)
      assert.isNotOk(factDevice.maintenanceDueOn)
      issues = await knex('Issue as i')
        .join('IssueType as it', 'i.issueTypeId', 'it.id')
        .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
        .where({ 'i.deviceId': deviceId })
        .select('i.id', 'it.externalId as issueType', 'i.deviceId', 'is.externalId as issueStatus')
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
          includeDeviceConfiguration: false,
          type: {
            id: 'CepheidGeneXpert',
          },
          result: {
            startedOn: subDays(now, 45),
            data: { assay: 'Xpert MTB-RIF', a: 'b' },
            assay: { id: 'GxMtbRif' },
            instrument: { serial: 'GX-00001' },
            sample: { id: '29347293' },
          },
          name: 'Fact Test Device',
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

      const { maxDaysDeviceOffline, maxDaysDeviceNoResults } = await knex('Partner')
        .where({ id: newDevice.partnerId })
        .first()
      assert.isOk(maxDaysDeviceOffline > 1)
      assert.isOk(maxDaysDeviceNoResults > maxDaysDeviceOffline)
      const deviceOfflineDate = subDays(now, maxDaysDeviceOffline - 2)
      let deviceNoResultsDate = subDays(now, maxDaysDeviceNoResults - 2)
      const maintenanceDueOn = subDays(now, 2)
      await knex('Device as d').where('d.id', newDevice.id).update({
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
        .join('IssueStatusLog as isl', function () {
          // ensures we have a log with the same status as the issue
          // and we are expecting only one, so issues should not duplicate
          this.on('isl.issueId', 'i.id').andOn('isl.issueStatusId', 'is.id')
        })
        .where({ 'i.deviceId': deviceId })
        .whereNotNull('isl.changedOn')
        .whereNotNull('isl.createdOn')
        .select('i.id', 'it.externalId as issueType', 'i.deviceId', 'is.externalId as issueStatus', 'i.level')
      assert.equal(issues.length, 0)

      deviceNoResultsDate = subDays(now, maxDaysDeviceNoResults + 1)
      await knex('Device as d')
        .where('d.id', newDevice.id)
        .update({
          siteId: knex('Site').where('partnerId', newDevice.partnerId).first('id'),
          createdOn: deviceNoResultsDate,
        })
      messageContext.factGenerateDeviceConnectivity(newDevice.id)
      await waitForIdle()
      ;[factDevice] = await knex('FactDeviceFlag').where({ deviceId })
      assert.equal(factDevice.offline, 0)
      assert.equal(factDevice.noResults, 1)
      assert.equal(factDevice.maintenance, 0)
      assert.isNotOk(factDevice.maintenanceDueOn)

      issues = await knex('Issue as i')
        .join('IssueType as it', 'i.issueTypeId', 'it.id')
        .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
        .join('IssueStatusLog as isl', function () {
          // ensures we have a log with the same status as the issue
          // and we are expecting only one, so issues should not duplicate
          this.on('isl.issueId', 'i.id').andOn('isl.issueStatusId', 'is.id')
        })
        .where({ 'i.deviceId': deviceId })
        .whereNotNull('isl.changedOn')
        .whereNotNull('isl.createdOn')
        .select('i.id', 'it.externalId as issueType', 'i.deviceId', 'is.externalId as issueStatus', 'i.level')
      assert.equal(issues.length, 1)

      messageContext.deviceMaintenance(deviceId, {
        dueOn: maintenanceDueOn,
        data: { a: 1, hi: 'world' },
      })
      await waitForIdle()
      ;[factDevice] = await knex('FactDeviceFlag').where({ deviceId })
      assert.equal(factDevice.offline, 0)
      assert.equal(factDevice.noResults, 1)
      assert.equal(factDevice.maintenance, 1)
      assert.approximately(+factDevice.maintenanceDueOn, +maintenanceDueOn, 3000)
      issues = await knex('Issue as i')
        .join('IssueType as it', 'i.issueTypeId', 'it.id')
        .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
        .where({ 'i.deviceId': deviceId })
        .select('i.id', 'it.externalId as issueType', 'i.deviceId', 'is.externalId as issueStatus', 'i.data', 'i.dueOn')
        .orderBy('id', 'ASC')
      assert.equal(issues.length, 2)
      let deviceMaintenanceIssue = issues.find(issue => issue.issueType === 'DeviceMaintenance')
      assert.equal(deviceMaintenanceIssue.deviceId, deviceId)
      assert.equal(deviceMaintenanceIssue.issueStatus, 'Active')
      let deviceNoResultsIssue = issues.find(issue => issue.issueType === 'DeviceNoResults')
      assert.equal(deviceNoResultsIssue.deviceId, deviceId)
      assert.equal(deviceNoResultsIssue.issueStatus, 'Active')
      assert.approximately(+deviceMaintenanceIssue.dueOn, +maintenanceDueOn, 3000)
      assert.deepEqual(JSON.parse(deviceMaintenanceIssue.data), { a: 1, hi: 'world' })

      const waitForFactGenerateDeviceConnectivity = waitForAction(factGenerateDeviceConnectivity(deviceId))
      const waitForIssueResolve = waitForAction(issueResolved(deviceMaintenanceIssue.id))

      await messageContext.deviceMaintenanceResolved(deviceId)

      await Promise.all([waitForFactGenerateDeviceConnectivity, waitForIssueResolve])
      ;[factDevice] = await knex('FactDeviceFlag').where({ deviceId })
      assert.equal(factDevice.offline, 0)
      assert.equal(factDevice.noResults, 1)
      assert.equal(factDevice.maintenance, 0)
      assert.isNotOk(factDevice.maintenanceDueOn)
      issues = await knex('Issue as i')
        .join('IssueType as it', 'i.issueTypeId', 'it.id')
        .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
        .where({ 'i.deviceId': deviceId })
        .select('i.id', 'it.externalId as issueType', 'i.deviceId', 'is.externalId as issueStatus')
        .orderBy('id', 'ASC')
      assert.equal(issues.length, 2)
      deviceMaintenanceIssue = issues.find(issue => issue.issueType === 'DeviceMaintenance')
      assert.equal(deviceMaintenanceIssue.deviceId, deviceId)
      assert.equal(deviceMaintenanceIssue.issueStatus, 'Resolved')
      deviceNoResultsIssue = issues.find(issue => issue.issueType === 'DeviceNoResults')
      assert.equal(deviceNoResultsIssue.issueType, 'DeviceNoResults')
      assert.equal(deviceNoResultsIssue.deviceId, deviceId)
      assert.equal(deviceNoResultsIssue.issueStatus, 'Active')

      const resultPayload = {
        startedOn: now,
        data: { assay: 'Xpert MTB-RIF', a: 'b' },
        assay: { id: 'GxMtbRif' },
        instrument: { serial: 'GX-00001' },
        sample: { id: '76543789' },
        endedOn: addDays(new Date(), 2),
      }
      await server
        .post(devicePath)
        .set('Authorization', deviceAuth)
        .send({
          type: {
            id: 'CepheidGeneXpert',
          },
          result: resultPayload,
        })
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
        .select('i.id', 'it.externalId as issueType', 'i.deviceId', 'is.externalId as issueStatus')
        .orderBy('id', 'ASC')
      assert.equal(issues.length, 2)
      deviceMaintenanceIssue = issues.find(issue => issue.issueType === 'DeviceMaintenance')
      assert.equal(deviceMaintenanceIssue.deviceId, deviceId)
      assert.equal(deviceMaintenanceIssue.issueStatus, 'Resolved')
      deviceNoResultsIssue = issues.find(issue => issue.issueType === 'DeviceNoResults')
      assert.equal(deviceNoResultsIssue.issueType, 'DeviceNoResults')
      assert.equal(deviceNoResultsIssue.deviceId, deviceId)
      assert.equal(deviceNoResultsIssue.issueStatus, 'Resolved')
    }))

  describe('New results available', () => {
    let issueId = null

    after(async () => {
      await waitForIdle()

      // remove result and sample:
      const { id: resultId, sampleId } = await knex('Result')
        .where('externalId', 'AVAILABLE_RESULT_1')
        .first('id', 'sampleId')
      await knex('Result').update('treatmentStatusLogId', null).where('id', resultId)
      await knex('ResultTreatmentStatusLog').where('resultId', resultId).delete()
      await knex('Result').where('id', resultId).delete()
      await knex('Sample').where('id', sampleId).delete()
      await knex('Issue').where('id', issueId).delete()
    })

    it('should create a new results available issue and resolve it when it is older than 24 hours', () =>
      runTest(async knex => {
        const now = new Date()
        const issueTypeId = await issueTypeToId('NewResultsAvailable')
        const issueStatusActive = await issueStatusToId('Active')
        const issueStatusResolved = await issueStatusToId('Resolved')
        const issueEventStatusTriggered = await issueEventStatusToId('Triggered')

        const issueResolutionTrigger = await knex('IssueResolutionTrigger').where('issueTypeId', issueTypeId).first()

        // get first device for partner so we can create a couple of results
        const device = await knex('Device').where('partnerId', issueResolutionTrigger.partnerId).first()

        const messageContext = await createMessageContext()
        messageContext.bindActionCreators({
          factNewResultsAvailableCheck,
        })

        await messageContext.factNewResultsAvailableCheck()
        await waitForIdle()

        // should have no new results available to begin with
        let issues = await knex('Issue')
          .where('issueTypeId', issueTypeId)
          .where('siteId', device.siteId)
          .where('issueStatusId', issueStatusActive)
        assert.equal(issues.length, 0)

        // add sample and result
        const gxMtbRifAssay = await knex('Assay').where({ externalId: 'GxMtbRif' }).first()
        const resultSourceId = await resultSourceToId('DiagnosticDevice')
        const resultTypeId = await resultTypeToId('Patient')

        const [sampleId] = await knex('Sample').insert({
          externalId: 'AVAILABLE_SAMPLE_1',
          collectedOn: subHours(now, 12),
          originSiteId: device.siteId,
        })

        await knex('Result').insert({
          createdOn: subHours(now, 6),
          updatedOn: subHours(now, 6),
          externalId: 'AVAILABLE_RESULT_1',
          assayId: gxMtbRifAssay.id,
          partnerId: device.partnerId,
          siteId: device.siteId,
          reportableSiteId: device.siteId,
          deviceId: device.id,
          resultSourceId,
          resultTypeId,
          sampleId,
          startedOn: subHours(now, 8),
          endedOn: subHours(now, 6),
        })

        await messageContext.factNewResultsAvailableCheck()
        await waitForIdle()

        // should now have new results available
        issues = await knex('Issue')
          .where('issueTypeId', issueTypeId)
          .where('siteId', device.siteId)
          .where('issueStatusId', issueStatusActive)

        issueId = issues[0].id

        assert.equal(issues.length, 1)
        assert.deepEqual(JSON.parse(issues[0].data), {
          siteId: device.siteId,
          numberOfResults: 1,
        })

        // update issue date to be triggered 24 hours ago:
        await knex('IssueEvent')
          .update('createdOn', subHours(now, 24))
          .where('issueId', issueId)
          .where('issueEventStatusId', issueEventStatusTriggered)

        await dispatchAndWaitForAction(resolveIssues(issueId))
        await waitForIdle()

        // issue should now be resolved
        const issue = await knex('Issue').where('id', issueId).first()

        assert.equal(issue.issueStatusId, issueStatusResolved)
      }))
  })

  describe('Sites with low completion rate based on FactCustomFieldCompletion', () => {
    const issueId = null
    let siteId = null
    after(async () => {
      await waitForIdle()
      await knex('FactCustomFieldCompletion').delete()
      await knex('Issue').where('id', issueId).delete()
    })

    before(async () => {
      const { id } = await knex('Site').first('id')

      const { id: assayId } = await knex('Assay').first()
      siteId = id
      const factRecords = map(range(3), i => ({
        siteId,
        completionRate: random(0, 0.79),
        recordCount: random(100, 1000),
        assayId,
        date: subDays(new Date(), i),
        completionByField: JSON.stringify({}),
        updatedOn: new Date(),
      }))

      await knex('FactCustomFieldCompletion').insert(factRecords)
    })
    it('should create a Site new Completion rate issue and then update the rate and resolve it', async () => {
      const messageContext = await createMessageContext()
      messageContext.bindActionCreators({
        factCheckCompletionRatePerSite,
        resolveIssues,
      })

      const issueTypeId = await issueTypeToId('SiteWithLowFieldCompletionRate')

      let issues = await knex('Issue').where('issueTypeId', issueTypeId)
      assert.equal(issues.length, 0, 'This test should start with no issues')

      await messageContext.factCheckCompletionRatePerSite()
      await waitForIdle()

      issues = await knex('Issue as i')
        .join('IssueStatus as is', 'is.id', 'i.issueStatusId')
        .where('issueTypeId', issueTypeId)
        .select('siteId', 'is.externalId as issueStatusId')

      assert.equal(issues.length, 1)
      assert.equal(issues[0].siteId, siteId)
      assert.equal(issues[0].issueStatusId, 'Active')

      await knex('FactCustomFieldCompletion').update({ completionRate: 0.9 })
      await messageContext.resolveIssues()
      await waitForIdle(2000)

      issues = await knex('Issue as i')
        .join('IssueStatus as is', 'is.id', 'i.issueStatusId')
        .where('issueTypeId', issueTypeId)
        .select('siteId', 'is.externalId as issueStatusId')
      assert.equal(issues.length, 1)
      assert.equal(issues[0].siteId, siteId)
      assert.equal(
        issues[0].issueStatusId,
        'Resolved',
        'Issue should be "Resolved" after update stats and re-run this process'
      )
    })
  })
})
