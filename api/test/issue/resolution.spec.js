const chai = require('chai')
const Promise = require('bluebird')
const _ = require('lodash')
const { subDays, subHours } = require('date-fns')
const { knex } = require('../../src/db')

const { createMessageContext, waitForAction, waitForIdle } = require('../utils/mqUtils')
const { resolveIssues, issueResolved } = require('../../src/issue/actions')
const { types: deviceActionTypes } = require('../../src/device/actions')
const {
  getPartner,
  getDeviceApproval,
  cleanUpIssues,
  deleteDeviceAndTestData,
  createDeviceNoResult,
  createIssueEvent,
  createAndTriggerIssue,
  getIssue,
  getIssueEventStatus,
  getIssueType,
  getDevice,
  getIssueStatus,
} = require('./issuesHelperFunctions')

const { assert } = chai

describe('Issue Resolution', () => {
  describe.skip('For Myanmar', () => {
    const partnerName = 'MoHS'
    const countryAbbreviation = 'MM'
    let activeIssueStatus
    let resolvedIssueStatus
    let triggeredIssueEventStatus
    let decommissionedDeviceApproval

    let partner
    let messageContext
    const deviceIdsToRemove = []

    before(async () => {
      partner = await getPartner(knex, partnerName)
      messageContext = await createMessageContext()
      messageContext.bindActionCreators({ resolveIssues })
      activeIssueStatus = await getIssueStatus(knex, 'Active')
      resolvedIssueStatus = await getIssueStatus(knex, 'Resolved')
      triggeredIssueEventStatus = await getIssueEventStatus(knex, 'Triggered')
      decommissionedDeviceApproval = await getDeviceApproval(knex, 'decommissioned')
      const testDeviceId1 = await createDeviceNoResult(knex, {
        partnerId: partner.id,
        countryAbbreviation,
      })
      const testDeviceId2 = await createDeviceNoResult(knex, {
        partnerId: partner.id,
        countryAbbreviation,
      })
      deviceIdsToRemove.push(testDeviceId1)
      deviceIdsToRemove.push(testDeviceId2)
    })
    after(async () => deleteDeviceAndTestData(knex, deviceIdsToRemove))

    describe('when DeviceOffline issues exist', () => {
      let deviceOfflineIssueType
      let device1
      let device2
      const dateIssueRaised = subDays(new Date(), 1)
      let device1OfflineIssueId
      let device2OfflineIssueId
      const devicesToBringBackOnline = []
      const factDeviceFlagsToRemove = []

      before(async () => {
        deviceOfflineIssueType = await getIssueType(knex, 'DeviceOffline')
        const device1Details = await getDevice(knex, {
          partnerId: partner.id,
          countryAbbreviation,
        })
        device1 = device1Details.d
        if (!_.get(device1Details, 'fdf.offline')) {
          if (!_.get(device1Details, 'fdf.deviceId')) {
            await knex('FactDeviceFlag').insert({
              deviceId: device1.id,
              offline: 1,
              updatedOn: new Date(),
            })
            factDeviceFlagsToRemove.push(device1.id)
          } else {
            await knex('FactDeviceFlag').where('deviceId', device1.id).update({ offline: 1 })
            devicesToBringBackOnline.push(device1.id)
          }
        }

        const device2Details = await getDevice(knex, {
          partnerId: partner.id,
          countryAbbreviation,
          notIn: [device1.id],
        })
        device2 = device2Details.d
        if (!_.get(device2Details, 'fdf.offline')) {
          if (!_.get(device2Details, 'fdf.deviceId')) {
            await knex('FactDeviceFlag').insert({
              deviceId: device2.id,
              offline: 1,
              updatedOn: new Date(),
            })
            factDeviceFlagsToRemove.push(device2.id)
          } else {
            await knex('FactDeviceFlag').where('deviceId', device2.id).update({ offline: 1 })
            devicesToBringBackOnline.push(device2.id)
          }
        }
      })

      after(async () => {
        await Promise.all(
          _.map(factDeviceFlagsToRemove, deviceId => knex('FactDeviceFlag').where('deviceId', deviceId).del())
        )

        return Promise.all(
          _.map(devicesToBringBackOnline, deviceId =>
            knex('FactDeviceFlag').where('deviceId', deviceId).update({ offline: 0 })
          )
        )
      })

      beforeEach(async () => {
        device1OfflineIssueId = await createAndTriggerIssue({
          knex,
          partnerId: partner.id,
          device: device1,
          issueTypeId: deviceOfflineIssueType.id,
          actionType: deviceActionTypes.DEVICE_OFFLINE,
          level: 1,
          dateIssueRaised,
        })
        device2OfflineIssueId = await createAndTriggerIssue({
          knex,
          partnerId: partner.id,
          device: device2,
          issueTypeId: deviceOfflineIssueType.id,
          actionType: deviceActionTypes.DEVICE_OFFLINE,
          level: 1,
          dateIssueRaised,
        })
      })

      afterEach(() => cleanUpIssues(knex, [device1OfflineIssueId, device2OfflineIssueId]))

      describe('then RESOLVE_ISSUES is dispatched with no issue ID', () => {
        it('the issues should still be active', async () => {
          const waitForResolveIssues = waitForAction(resolveIssues())
          messageContext.resolveIssues()
          await waitForResolveIssues

          const device1OfflineIssue = await getIssue(knex, device1OfflineIssueId)
          const device2OfflineIssue = await getIssue(knex, device2OfflineIssueId)

          assert.equal(device1OfflineIssue.issueStatusId, activeIssueStatus.id)
          assert.equal(device2OfflineIssue.issueStatusId, activeIssueStatus.id)
        })
      })

      describe('then RESOLVE_ISSUES is dispatched with an issue ID', () => {
        it('the issues should still be active', async () => {
          const waitForResolveIssue = waitForAction(resolveIssues(device1OfflineIssueId))
          messageContext.resolveIssues(device1OfflineIssueId)
          await waitForResolveIssue

          const device1OfflineIssue = await getIssue(knex, device1OfflineIssueId)
          const device2OfflineIssue = await getIssue(knex, device2OfflineIssueId)

          assert.equal(device1OfflineIssue.issueStatusId, activeIssueStatus.id)
          assert.equal(device2OfflineIssue.issueStatusId, activeIssueStatus.id)
        })
      })

      describe('and then one of the devices come back online', () => {
        beforeEach(async () => {
          await knex('FactDeviceFlag').where('deviceId', device1.id).update({ offline: 0 })
          return knex('FactDeviceFlag').where('deviceId', device2.id).update({ offline: 1 })
        })

        describe('then RESOLVE_ISSUES is dispatched with no issue ID', () => {
          it('the issue should be resolved for the online device only', async () => {
            const waitForIssueResolved = waitForAction(issueResolved(device1OfflineIssueId))
            messageContext.resolveIssues()
            await waitForIssueResolved

            const device1OfflineIssue = await getIssue(knex, device1OfflineIssueId)
            const device2OfflineIssue = await getIssue(knex, device2OfflineIssueId)

            assert.equal(device1OfflineIssue.issueStatusId, resolvedIssueStatus.id)
            assert.equal(device2OfflineIssue.issueStatusId, activeIssueStatus.id)
          })
        })
      })

      describe('then both of the devices come back online', () => {
        beforeEach(async () => {
          await knex('FactDeviceFlag').where('deviceId', device1.id).update({ offline: 0 })
          return knex('FactDeviceFlag').where('deviceId', device2.id).update({ offline: 0 })
        })

        describe('then RESOLVE_ISSUES is dispatched with no issue ID', () => {
          it('the issues for both devices should be resolved', async () => {
            const waitForDevice1IssueResolved = waitForAction(issueResolved(device1OfflineIssueId))
            const waitForDevice2IssueResolved = waitForAction(issueResolved(device2OfflineIssueId))
            messageContext.resolveIssues()
            await Promise.all([waitForDevice1IssueResolved, waitForDevice2IssueResolved])

            const device1OfflineIssue = await getIssue(knex, device1OfflineIssueId)
            const device2OfflineIssue = await getIssue(knex, device2OfflineIssueId)

            assert.equal(device1OfflineIssue.issueStatusId, resolvedIssueStatus.id)
            assert.equal(device2OfflineIssue.issueStatusId, resolvedIssueStatus.id)
          })
        })

        describe('then RESOLVE_ISSUES is dispatched with an issue ID', () => {
          it('the issue should still be resolved for the one issue only', async () => {
            const waitForIssueResolved = waitForAction(issueResolved(device1OfflineIssueId))
            messageContext.resolveIssues(device1OfflineIssueId)
            await waitForIssueResolved

            const device1OfflineIssue = await getIssue(knex, device1OfflineIssueId)
            const device2OfflineIssue = await getIssue(knex, device2OfflineIssueId)

            assert.equal(device1OfflineIssue.issueStatusId, resolvedIssueStatus.id)
            assert.equal(device2OfflineIssue.issueStatusId, activeIssueStatus.id)
          })
        })
      })

      describe('then a reason is specified for one of the devices being offline', () => {
        let maintenanceReasonEventId

        beforeEach(async () => {
          await knex('FactDeviceFlag').where('deviceId', device1.id).update({ offline: 1 })
          maintenanceReasonEventId = await createIssueEvent({
            knex,
            deviceId: device1.id,
            issueId: device1OfflineIssueId,
            issueEventStatusId: triggeredIssueEventStatus.id,
            actionType: 'DEVICE_MAINTENANCE',
            createdOn: new Date(),
            options: { data: { reason: 'Flaky data connection' } },
          })
          return knex('FactDeviceFlag').where('deviceId', device2.id).update({ offline: 1 })
        })

        afterEach(async () => {
          await knex('FactDeviceFlag').where('deviceId', device1.id).update({ offline: 0 })
          await knex('IssueEvent').where('id', maintenanceReasonEventId).del()
          return knex('FactDeviceFlag').where('deviceId', device2.id).update({ offline: 0 })
        })

        describe('then RESOLVE_ISSUES is dispatched with no issue ID', () => {
          it('the issue should be resolved for the device that has a reason specified only', async () => {
            const waitForIssueResolved = waitForAction(issueResolved(device1OfflineIssueId))
            messageContext.resolveIssues()
            await waitForIssueResolved

            const device1OfflineIssue = await getIssue(knex, device1OfflineIssueId)
            const device2OfflineIssue = await getIssue(knex, device2OfflineIssueId)

            assert.equal(device1OfflineIssue.issueStatusId, resolvedIssueStatus.id)
            assert.equal(device2OfflineIssue.issueStatusId, activeIssueStatus.id)
          })
        })
      })

      describe('then reasons are specified for both of the devices being offline', () => {
        let maintenanceReasonEventId1
        let maintenanceReasonEventId2

        beforeEach(async () => {
          await knex('FactDeviceFlag').where('deviceId', device1.id).update({ offline: 1 })
          maintenanceReasonEventId1 = await createIssueEvent({
            knex,
            deviceId: device1.id,
            issueId: device1OfflineIssueId,
            issueEventStatusId: triggeredIssueEventStatus.id,
            actionType: 'DEVICE_MAINTENANCE',
            createdOn: new Date(),
            options: { data: { reason: 'Flaky data connection' } },
          })
          await knex('FactDeviceFlag').where('deviceId', device2.id).update({ offline: 1 })
          maintenanceReasonEventId2 = await createIssueEvent({
            knex,
            deviceId: device2.id,
            issueId: device2OfflineIssueId,
            issueEventStatusId: triggeredIssueEventStatus.id,
            actionType: 'DEVICE_MAINTENANCE',
            createdOn: new Date(),
            options: { data: { reason: 'Not really sure why' } },
          })
        })

        afterEach(async () => {
          await knex('FactDeviceFlag').where('deviceId', device1.id).update({ offline: 0 })
          await knex('IssueEvent').where('id', maintenanceReasonEventId1).del()
          await knex('FactDeviceFlag').where('deviceId', device2.id).update({ offline: 0 })
          await knex('IssueEvent').where('id', maintenanceReasonEventId2).del()
        })

        describe('then RESOLVE_ISSUES is dispatched with no issue ID', () => {
          it('the issues for both devices should be resolved', async () => {
            const waitForDevice1IssueResolved = waitForAction(issueResolved(device1OfflineIssueId))
            const waitForDevice2IssueResolved = waitForAction(issueResolved(device1OfflineIssueId))
            messageContext.resolveIssues()
            await Promise.all([waitForDevice1IssueResolved, waitForDevice2IssueResolved])

            const device1OfflineIssue = await getIssue(knex, device1OfflineIssueId)
            const device2OfflineIssue = await getIssue(knex, device2OfflineIssueId)

            assert.equal(device1OfflineIssue.issueStatusId, resolvedIssueStatus.id)
            assert.equal(device2OfflineIssue.issueStatusId, resolvedIssueStatus.id)
          })
        })

        describe('then RESOLVE_ISSUES is dispatched with an issue ID', () => {
          it('the issue should still be resolved for the one issue only', async () => {
            const waitForIssueResolved = waitForAction(issueResolved(device1OfflineIssueId))
            messageContext.resolveIssues(device1OfflineIssueId)
            await waitForIssueResolved

            const device1OfflineIssue = await getIssue(knex, device1OfflineIssueId)
            const device2OfflineIssue = await getIssue(knex, device2OfflineIssueId)

            assert.equal(device1OfflineIssue.issueStatusId, resolvedIssueStatus.id)
            assert.equal(device2OfflineIssue.issueStatusId, activeIssueStatus.id)
          })
        })
      })

      describe('then one then the devices is decommissioned', () => {
        beforeEach(async () => {
          await knex('Device').where('id', device1.id).update({ deviceApprovalId: decommissionedDeviceApproval.id })
          await knex('FactDeviceFlag').where('deviceId', device2.id).update({ offline: 1 })
        })

        afterEach(async () => {
          await knex('Device').where('id', device1.id).update({ deviceApprovalId: device1.deviceApprovalId })
          await knex('FactDeviceFlag').where('deviceId', device2.id).update({ offline: 0 })
        })

        describe('then RESOLVE_ISSUES is dispatched with no issue ID', () => {
          it('the issue should be resolved for the decommissioned device only', async () => {
            const waitForIssueResolved = waitForAction(issueResolved(device1OfflineIssueId))
            messageContext.resolveIssues()
            await waitForIssueResolved

            const device1OfflineIssue = await getIssue(knex, device1OfflineIssueId)
            const device2OfflineIssue = await getIssue(knex, device2OfflineIssueId)

            assert.equal(device1OfflineIssue.issueStatusId, resolvedIssueStatus.id)
            assert.equal(device2OfflineIssue.issueStatusId, activeIssueStatus.id)
          })
        })
      })

      describe('then both of the devices are decommissioned', () => {
        beforeEach(async () => {
          await knex('Device').where('id', device1.id).update({ deviceApprovalId: decommissionedDeviceApproval.id })
          await knex('Device').where('id', device2.id).update({ deviceApprovalId: decommissionedDeviceApproval.id })
        })

        afterEach(async () => {
          await knex('Device').where('id', device1.id).update({ deviceApprovalId: device1.deviceApprovalId })
          await knex('Device').where('id', device2.id).update({ deviceApprovalId: device2.deviceApprovalId })
        })

        describe('then RESOLVE_ISSUES is dispatched with no issue ID', () => {
          it('the issues for both devices should be resolved', async () => {
            const waitForDevice1IssueResolved = waitForAction(issueResolved(device1OfflineIssueId))
            const waitForDevice2IssueResolved = waitForAction(issueResolved(device2OfflineIssueId))
            messageContext.resolveIssues()
            await Promise.all([waitForDevice1IssueResolved, waitForDevice2IssueResolved])

            const device1OfflineIssue = await getIssue(knex, device1OfflineIssueId)
            const device2OfflineIssue = await getIssue(knex, device2OfflineIssueId)

            assert.equal(device1OfflineIssue.issueStatusId, resolvedIssueStatus.id)
            assert.equal(device2OfflineIssue.issueStatusId, resolvedIssueStatus.id)
          })
        })

        describe('then RESOLVE_ISSUES is dispatched with an issue ID', () => {
          it('the issue should still be resolved for the one issue only', async () => {
            const waitForIssueResolved = waitForAction(issueResolved(device1OfflineIssueId))
            messageContext.resolveIssues(device1OfflineIssueId)
            await waitForIssueResolved

            const device1OfflineIssue = await getIssue(knex, device1OfflineIssueId)
            const device2OfflineIssue = await getIssue(knex, device2OfflineIssueId)

            assert.equal(device1OfflineIssue.issueStatusId, resolvedIssueStatus.id)
            assert.equal(device2OfflineIssue.issueStatusId, activeIssueStatus.id)
          })
        })
      })
    })

    describe('when DeviceNoResults issues exist', () => {
      let deviceNoResultsIssueType
      let device1
      let device2
      const dateIssueRaised = subDays(new Date(), 1)
      let device1NoResultsIssueId
      let device2NoResultsIssueId
      const devicesToResetNoResults = []
      const factDeviceFlagsToRemove = []

      let now
      let admin
      let gxMtbRifAssay
      let resultSource
      let resultType
      let sampleType
      let noResultCategory

      async function postResult(knex, device) {
        const [sampleId] = await knex('Sample').insert({
          externalId: `NEW SAMPLE ${new Date().getTime()}`,
          collectedOn: now,
          sampleTypeId: sampleType.id,
          originSiteId: device.siteId,
        })
        const [resultId] = await knex('Result').insert({
          createdOn: now,
          createdBy: admin.id,
          updatedOn: now,
          updatedBy: admin.id,
          externalId: `NEW RESULT ${new Date().getTime()}`,
          assayId: gxMtbRifAssay.id,
          partnerId: partner.id,
          siteId: device.siteId,
          reportableSiteId: device.siteId,
          deviceId: device.id,
          resultSourceId: resultSource.id,
          resultTypeId: resultType.id,
          sampleId,
          resultCategory1: noResultCategory.id,
          resultCategory2: noResultCategory.id,
          startedOn: subHours(now, 2),
          endedOn: now,
        })

        return resultId
      }

      before(async () => {
        deviceNoResultsIssueType = await getIssueType(knex, 'DeviceNoResults')
        const noResultsSince = subDays(new Date(), partner.maxDaysDeviceNoResults + 1)
        const device1Details = await getDevice(knex, {
          partnerId: partner.id,
          countryAbbreviation,
          noResultsSince,
        })
        device1 = device1Details.d
        if (!_.get(device1Details, 'fdf.noResults')) {
          if (!_.get(device1Details, 'fdf.deviceId')) {
            await knex('FactDeviceFlag').insert({
              deviceId: device1.id,
              noResults: 1,
              updatedOn: new Date(),
            })
            factDeviceFlagsToRemove.push(device1.id)
          } else {
            await knex('FactDeviceFlag').where('deviceId', device1.id).update({ noResults: 1 })
            devicesToResetNoResults.push(device1.id)
          }
        }

        const device2Details = await getDevice(knex, {
          partnerId: partner.id,
          countryAbbreviation,
          noResultsSince,
          notIn: [device1.id],
        })

        device2 = device2Details.d
        if (!_.get(device2Details, 'fdf.noResults')) {
          if (!_.get(device2Details, 'fdf.deviceId')) {
            await knex('FactDeviceFlag').insert({
              deviceId: device2.id,
              noResults: 1,
              updatedOn: new Date(),
            })
            factDeviceFlagsToRemove.push(device2.id)
          } else {
            await knex('FactDeviceFlag').where('deviceId', device2.id).update({ noResults: 1 })
            devicesToResetNoResults.push(device2.id)
          }
        }
        now = new Date()
        admin = await knex('User').where({ name: 'myanmar_admin' }).first()
        gxMtbRifAssay = await knex('Assay').where({ externalId: 'GxMtbRif' }).first()
        resultSource = await knex('ResultSource').where({ externalId: 'DiagnosticDevice' }).first()
        resultType = await knex('ResultType').where({ externalId: 'Patient' }).first()
        sampleType = await knex('SampleType').where({ externalId: 'Sputum' }).first()
        noResultCategory = await knex('ResultCategory').where({ externalId: 'NoResult' }).first()
      })

      after(async () => {
        await Promise.all(
          _.map(factDeviceFlagsToRemove, deviceId => knex('FactDeviceFlag').where('deviceId', deviceId).del())
        )

        return Promise.all(
          _.map(devicesToResetNoResults, deviceId =>
            knex('FactDeviceFlag').where('deviceId', deviceId).update({ noResults: 0 })
          )
        )
      })

      beforeEach(async () => {
        device1NoResultsIssueId = await createAndTriggerIssue({
          knex,
          partnerId: partner.id,
          device: device1,
          issueTypeId: deviceNoResultsIssueType.id,
          actionType: deviceActionTypes.DEVICE_NO_RESULTS,
          level: 1,
          dateIssueRaised,
        })
        device2NoResultsIssueId = await createAndTriggerIssue({
          knex,
          partnerId: partner.id,
          device: device2,
          issueTypeId: deviceNoResultsIssueType.id,
          actionType: deviceActionTypes.DEVICE_NO_RESULTS,
          level: 1,
          dateIssueRaised,
        })
      })

      afterEach(async () => cleanUpIssues(knex, [device1NoResultsIssueId, device2NoResultsIssueId]))

      describe('then RESOLVE_ISSUES is dispatched with no issue ID', () => {
        it('the issues should still be active', async () => {
          const waitForResolveIssues = waitForAction(resolveIssues())
          messageContext.resolveIssues()
          await waitForResolveIssues

          const device1NoResultsIssue = await getIssue(knex, device1NoResultsIssueId)
          const device2NoResultsIssue = await getIssue(knex, device2NoResultsIssueId)

          assert.equal(device1NoResultsIssue.issueStatusId, activeIssueStatus.id)
          assert.equal(device2NoResultsIssue.issueStatusId, activeIssueStatus.id)
        })
      })

      describe('then RESOLVE_ISSUES is dispatched with an issue ID', () => {
        it('the issues should still be active', async () => {
          const waitForResolveIssue = waitForAction(resolveIssues(device1NoResultsIssueId))
          messageContext.resolveIssues(device1NoResultsIssueId)
          await waitForResolveIssue

          const device1NoResultsIssue = await getIssue(knex, device1NoResultsIssueId)
          const device2NoResultsIssue = await getIssue(knex, device2NoResultsIssueId)

          assert.equal(device1NoResultsIssue.issueStatusId, activeIssueStatus.id)
          assert.equal(device2NoResultsIssue.issueStatusId, activeIssueStatus.id)
        })
      })

      describe('and then one of the devices posts a result', () => {
        const resultIdsToCleanUp = []

        beforeEach(async () => {
          const resultId = await postResult(knex, device1)
          resultIdsToCleanUp.push(resultId)
        })

        afterEach(async () => {
          await Promise.each(resultIdsToCleanUp, resultId => knex('Result').where('id', resultId).del())
        })

        describe('then RESOLVE_ISSUES is dispatched with no issue ID', () => {
          it('the issue should be resolved for the online device only', async () => {
            const waitForIssueResolved = waitForAction(issueResolved(device1NoResultsIssueId))
            messageContext.resolveIssues()
            await waitForIssueResolved

            const device1NoResultsIssue = await getIssue(knex, device1NoResultsIssueId)
            const device2NoResultsIssue = await getIssue(knex, device2NoResultsIssueId)

            assert.equal(device1NoResultsIssue.issueStatusId, resolvedIssueStatus.id)
            assert.equal(device2NoResultsIssue.issueStatusId, activeIssueStatus.id)
          })
        })
      })

      describe('then the other device posts a result', () => {
        const resultIdsToCleanUp = []

        beforeEach(async () => {
          const resultId = await postResult(knex, device2)
          resultIdsToCleanUp.push(resultId)
        })

        afterEach(async () => {
          await Promise.each(resultIdsToCleanUp, resultId => knex('Result').where('id', resultId).del())
        })

        describe('then RESOLVE_ISSUES is dispatched with no issue ID', () => {
          it('the issues for the other device should be resolved', async () => {
            const waitForIssueResolved = waitForAction(issueResolved(device2NoResultsIssueId))
            messageContext.resolveIssues()
            await waitForIssueResolved
            await waitForIdle(3000)
            const device1NoResultsIssue = await getIssue(knex, device1NoResultsIssueId)
            const device2NoResultsIssue = await getIssue(knex, device2NoResultsIssueId)

            assert.equal(device1NoResultsIssue.issueStatusId, activeIssueStatus.id)
            assert.equal(device2NoResultsIssue.issueStatusId, resolvedIssueStatus.id)
          })
        })

        describe('then RESOLVE_ISSUES is dispatched with an issue ID', () => {
          it('the issue should be resolved for the one issue only', async () => {
            const waitForIssueResolved = waitForAction(issueResolved(device2NoResultsIssueId))
            messageContext.resolveIssues(device2NoResultsIssueId)
            await waitForIssueResolved

            const device1NoResultsIssue = await getIssue(knex, device1NoResultsIssueId)
            const device2NoResultsIssue = await getIssue(knex, device2NoResultsIssueId)

            assert.equal(device1NoResultsIssue.issueStatusId, activeIssueStatus.id)
            assert.equal(device2NoResultsIssue.issueStatusId, resolvedIssueStatus.id)
          })
        })
      })

      describe('then a reason is specified for one of the devices being inactive', () => {
        let device1ConfigurationData

        beforeEach(async () => {
          await knex('FactDeviceFlag').where('deviceId', device1.id).update({ noResults: 1 })
          const device1ConfigurationData = JSON.parse(device1.configurationData || '{}')
          await knex('Device')
            .where('id', device1.id)
            .update({
              configurationData: JSON.stringify(
                _.merge({}, device1ConfigurationData, {
                  inactive: true,
                  inactiveMaintenanceReason: 'Just not working',
                })
              ),
            })
        })

        afterEach(async () => {
          await knex('FactDeviceFlag').where('deviceId', device1.id).update({ noResults: 0 })
          await knex('Device')
            .where('id', device1.id)
            .update({
              configurationData: _.isEmpty(device1ConfigurationData) ? null : JSON.stringify(device1ConfigurationData),
            })
        })

        describe('then RESOLVE_ISSUES is dispatched with no issue ID', () => {
          it('the issue should be resolved for the device that has a reason specified only', async () => {
            const waitForIssueResolved = waitForAction(issueResolved(device1NoResultsIssueId))
            messageContext.resolveIssues()
            await waitForIssueResolved
            await waitForIdle(2000)
            const device1NoResultsIssue = await getIssue(knex, device1NoResultsIssueId)
            const device2NoResultsIssue = await getIssue(knex, device2NoResultsIssueId)

            assert.equal(device1NoResultsIssue.issueStatusId, resolvedIssueStatus.id)
            assert.equal(device2NoResultsIssue.issueStatusId, activeIssueStatus.id)
          })
        })
      })

      describe('then reasons are specified for both of the devices being inactive', () => {
        let device1ConfigurationData
        let device2ConfigurationData

        beforeEach(async () => {
          await knex('FactDeviceFlag').where('deviceId', device1.id).update({ noResults: 1 })
          const device1ConfigurationData = JSON.parse(device1.configurationData || '{}')
          await knex('Device')
            .where('id', device1.id)
            .update({
              configurationData: JSON.stringify(
                _.merge({}, device1ConfigurationData, {
                  inactive: true,
                  inactiveMaintenanceReason: 'Just not working',
                })
              ),
            })

          await knex('FactDeviceFlag').where('deviceId', device2.id).update({ noResults: 1 })
          const device2ConfigurationData = JSON.parse(device2.configurationData || '{}')
          await knex('Device')
            .where('id', device2.id)
            .update({
              configurationData: JSON.stringify(
                _.merge({}, device2ConfigurationData, {
                  inactive: true,
                  inactiveMaintenanceReason: 'Under Maintenance',
                })
              ),
            })
        })

        afterEach(async () => {
          await knex('FactDeviceFlag').where('deviceId', device1.id).update({ noResults: 0 })
          await knex('Device')
            .where('id', device1.id)
            .update({
              configurationData: _.isEmpty(device1ConfigurationData) ? null : JSON.stringify(device1ConfigurationData),
            })

          await knex('FactDeviceFlag').where('deviceId', device2.id).update({ noResults: 0 })
          await knex('Device')
            .where('id', device2.id)
            .update({
              configurationData: _.isEmpty(device2ConfigurationData) ? null : JSON.stringify(device2ConfigurationData),
            })
        })

        describe('then RESOLVE_ISSUES is dispatched with no issue ID', () => {
          it('the issues for both devices should be resolved', async () => {
            const waitForDevice1IssueResolved = waitForAction(issueResolved(device1NoResultsIssueId))
            const waitForDevice2IssueResolved = waitForAction(issueResolved(device2NoResultsIssueId))
            messageContext.resolveIssues()
            await Promise.all([waitForDevice1IssueResolved, waitForDevice2IssueResolved])

            const device1NoResultsIssue = await getIssue(knex, device1NoResultsIssueId)
            const device2NoResultsIssue = await getIssue(knex, device2NoResultsIssueId)

            assert.equal(device1NoResultsIssue.issueStatusId, resolvedIssueStatus.id)
            assert.equal(device2NoResultsIssue.issueStatusId, resolvedIssueStatus.id)
          })
        })

        describe('then RESOLVE_ISSUES is dispatched with an issue ID', () => {
          it('only the one issue should be resolved', async () => {
            const waitForIssueResolved = waitForAction(issueResolved(device1NoResultsIssueId))
            messageContext.resolveIssues(device1NoResultsIssueId)
            await waitForIssueResolved

            const device1NoResultsIssue = await getIssue(knex, device1NoResultsIssueId)
            const device2NoResultsIssue = await getIssue(knex, device2NoResultsIssueId)

            assert.equal(device1NoResultsIssue.issueStatusId, resolvedIssueStatus.id)
            assert.equal(device2NoResultsIssue.issueStatusId, activeIssueStatus.id)
          })
        })
      })

      describe('then one then the devices is decommissioned', () => {
        beforeEach(async () => {
          await knex('Device').where('id', device1.id).update({ deviceApprovalId: decommissionedDeviceApproval.id })
          await knex('FactDeviceFlag').where('deviceId', device2.id).update({ noResults: 1 })
        })

        afterEach(async () => {
          await knex('Device').where('id', device1.id).update({ deviceApprovalId: device1.deviceApprovalId })
          await knex('FactDeviceFlag').where('deviceId', device2.id).update({ noResults: 0 })
        })

        describe('then RESOLVE_ISSUES is dispatched with no issue ID', () => {
          it('the issue should be resolved for the decommissioned device only', async () => {
            const waitForIssueResolved = waitForAction(issueResolved(device1NoResultsIssueId))
            messageContext.resolveIssues()
            await waitForIssueResolved
            await waitForIdle(3000)

            const device1NoResultsIssue = await getIssue(knex, device1NoResultsIssueId)
            const device2NoResultsIssue = await getIssue(knex, device2NoResultsIssueId)

            assert.equal(device1NoResultsIssue.issueStatusId, resolvedIssueStatus.id)
            assert.equal(device2NoResultsIssue.issueStatusId, activeIssueStatus.id)
          })
        })
      })

      describe('then both of the devices are decommissioned', () => {
        beforeEach(async () => {
          await knex('Device').where('id', device1.id).update({ deviceApprovalId: decommissionedDeviceApproval.id })
          await knex('Device').where('id', device2.id).update({ deviceApprovalId: decommissionedDeviceApproval.id })
        })

        afterEach(async () => {
          await knex('Device').where('id', device1.id).update({ deviceApprovalId: device1.deviceApprovalId })
          await knex('Device').where('id', device2.id).update({ deviceApprovalId: device2.deviceApprovalId })
        })

        describe('then RESOLVE_ISSUES is dispatched with no issue ID', () => {
          it('the issues for both devices should be resolved', async () => {
            const waitForDevice1IssueResolved = waitForAction(issueResolved(device1NoResultsIssueId))
            const waitForDevice2IssueResolved = waitForAction(issueResolved(device2NoResultsIssueId))
            messageContext.resolveIssues()
            await Promise.all([waitForDevice1IssueResolved, waitForDevice2IssueResolved])

            const device1NoResultsIssue = await getIssue(knex, device1NoResultsIssueId)
            const device2NoResultsIssue = await getIssue(knex, device2NoResultsIssueId)

            assert.equal(device1NoResultsIssue.issueStatusId, resolvedIssueStatus.id)
            assert.equal(device2NoResultsIssue.issueStatusId, resolvedIssueStatus.id)
          })
        })

        describe('then RESOLVE_ISSUES is dispatched with an issue ID', () => {
          it('the issue should still be resolved for the one issue only', async () => {
            const waitForIssueResolved = waitForAction(issueResolved(device1NoResultsIssueId))
            messageContext.resolveIssues(device1NoResultsIssueId)
            await waitForIssueResolved

            const device1NoResultsIssue = await getIssue(knex, device1NoResultsIssueId)
            const device2NoResultsIssue = await getIssue(knex, device2NoResultsIssueId)

            assert.equal(device1NoResultsIssue.issueStatusId, resolvedIssueStatus.id)
            assert.equal(device2NoResultsIssue.issueStatusId, activeIssueStatus.id)
          })
        })
      })
    })
  })
})
