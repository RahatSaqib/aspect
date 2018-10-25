const chai = require('chai')
const Promise = require('bluebird')
const _ = require('lodash')
const { subDays, subHours } = require('date-fns')
const { run } = require('../../src/db')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')
const { createMessageContext, waitForAction } = require('../utils/mqUtils')
const { resolveIssues, issueResolved } = require('../../src/issue/actions')
const { types: deviceActionTypes } = require('../../src/device/actions')
const {
  deviceTypeToId,
  deviceStatusToId,
} = require('../../src/shared/dictionary')

const { assert } = chai

describe('Issue Resolution', () => {
  function ensureMySqlBeforeNestedTablesOptions(knex) {
    assert.equal(
      knex.client.config.client,
      'mysql',
      'The knex query below uses .options({ nestTables: true }) which, at the time of writing, only works when using the MySQL driver (https://github.com/tgriesser/knex/issues/882). If the database has changed, we need to find another way to nest results (possibly using: https://github.com/CoursePark/KnexNest)'
    )
  }

  async function getPartner(knex, partnerName) {
    return knex('Partner')
      .where('name', partnerName)
      .first()
  }

  async function getDevice(
    knex,
    { countryAbbreviation, partnerId, noResultsSince = null, notIn = [] }
  ) {
    ensureMySqlBeforeNestedTablesOptions(knex)
    return knex('Device as d')
      .join('Geography as lgaGeography', 'd.geographyId', 'lgaGeography.id')
      .join('Geography as regionalGeography', function() {
        this.on('lgaGeography.stateId', 'regionalGeography.stateId').onNull(
          'regionalGeography.lgaId'
        )
      })
      .join('Country as c', 'lgaGeography.countryId', 'c.id')
      .join('Person as labUser', 'lgaGeography.id', 'labUser.geographyId')
      .join('Job as labUserJob', 'labUser.id', 'labUserJob.personId')
      .join(
        'JobFunction as labUserJobFunction',
        'labUserJob.jobFunctionId',
        'labUserJobFunction.id'
      )
      .join(
        'JobContext as regionalContext',
        'regionalGeography.id',
        'regionalContext.geographyId'
      )
      .join(
        'Job as regionalOfficerJob',
        'regionalContext.jobId',
        'regionalOfficerJob.id'
      )
      .join(
        'JobFunction as regionalOfficerJobFunction',
        'regionalOfficerJob.jobFunctionId',
        'regionalOfficerJobFunction.id'
      )
      .join(
        'Person as regionalOfficer',
        'regionalOfficerJob.personId',
        'regionalOfficer.id'
      )
      .leftJoin('FactDeviceFlag as fdf', 'd.id', 'fdf.deviceId')
      .where({
        'c.abbreviation': countryAbbreviation,
        'd.partnerId': partnerId,
        'labUserJobFunction.name': 'Lab User',
        'regionalOfficerJobFunction.name': 'Regional Officer',
      })
      .modify(queryBuilder => {
        if (!_.isEmpty(notIn)) {
          queryBuilder.whereNotIn('d.id', notIn)
        }
        if (noResultsSince) {
          const resultsAfter = knex('Result as r')
            .whereRaw('r.deviceId = d.id')
            .andWhere(function() {
              this.where('r.startedOn', '>', noResultsSince)
              this.orWhere('r.endedOn', '>', noResultsSince)
            })
            .limit(1)
            .select()
          queryBuilder.whereRaw(`NOT EXISTS(${resultsAfter.toString()})`)
        }
      })
      .options({ nestTables: true })
      .first()        
  }

  async function getSite(knex, { countryAbbreviation, partnerId }) {
    ensureMySqlBeforeNestedTablesOptions(knex)
    return knex('Site as s')
      .join('Geography as lgaGeography', 's.geographyId', 'lgaGeography.id')
      .join('Geography as regionalGeography', function() {
        this.on('lgaGeography.stateId', 'regionalGeography.stateId').onNull(
          'regionalGeography.lgaId'
        )
      })
      .join('Country as c', 'lgaGeography.countryId', 'c.id')
      .join('Person as labUser', 'lgaGeography.id', 'labUser.geographyId')
      .join('Job as labUserJob', 'labUser.id', 'labUserJob.personId')
      .join(
        'JobFunction as labUserJobFunction',
        'labUserJob.jobFunctionId',
        'labUserJobFunction.id'
      )
      .join(
        'JobContext as regionalContext',
        'regionalGeography.id',
        'regionalContext.geographyId'
      )
      .join(
        'Job as regionalOfficerJob',
        'regionalContext.jobId',
        'regionalOfficerJob.id'
      )
      .join(
        'JobFunction as regionalOfficerJobFunction',
        'regionalOfficerJob.jobFunctionId',
        'regionalOfficerJobFunction.id'
      )
      .join(
        'Person as regionalOfficer',
        'regionalOfficerJob.personId',
        'regionalOfficer.id'
      )
      .where({
        'c.abbreviation': countryAbbreviation,
        's.partnerId': partnerId,
        'labUserJobFunction.name': 'Lab User',
        'regionalOfficerJobFunction.name': 'Regional Officer',
      })
      .options({ nestTables: true })
      .first()
  }

  async function getDeviceStatus(knex, deviceStatusToken) {
    return knex('DeviceStatus')
      .where('token', deviceStatusToken)
      .first()
  }

  async function getIssueType(knex, issueType) {
    return knex('IssueType')
      .where('externalId', issueType)
      .first()
  }

  async function getIssueStatus(knex, issueStatus) {
    return knex('IssueStatus')
      .where('externalId', issueStatus)
      .first()
  }

  async function getIssueEventStatus(knex, issueEventStatus) {
    return knex('IssueEventStatus')
      .where('externalId', issueEventStatus)
      .first()
  }

  async function getIssue(knex, issueId) {
    return knex('Issue')
      .where('id', issueId)
      .first()
  }

  async function createAndTriggerIssue({
    knex,
    partnerId,
    device,
    issueTypeId,
    actionType,
    level,
    dateIssueRaised,
  }) {
    const activeIssueStatus = await getIssueStatus(knex, 'Active')
    const triggeredIssueEventStatus = await getIssueEventStatus(
      knex,
      'Triggered'
    )
    const [issueId] = await knex('Issue').insert({
      issueTypeId,
      issueStatusId: activeIssueStatus.id,
      partnerId,
      geographyId: device.geographyId,
      deviceId: device.id,
      level,
      createdOn: dateIssueRaised,
      updatedOn: dateIssueRaised,
    })
    await createIssueEvent({
      knex,
      deviceId: device.id,
      issueId,
      issueEventStatusId: triggeredIssueEventStatus.id,
      actionType,
      createdOn: dateIssueRaised,
    })
    return issueId
  }

  async function createIssueEvent({
    knex,
    deviceId,
    issueId,
    issueEventStatusId,
    actionType,
    createdOn,
    options = null,
  }) {
    const issueEvent = {
      issueEventStatusId,
      issueId,
      data: {
        type: actionType,
        deviceId,
      },
      createdOn,
    }
    if (options) {
      issueEvent.data.options = options
    }
    issueEvent.data = JSON.stringify(issueEvent.data)
    return knex('IssueEvent').insert(issueEvent)
  }

  async function createDeviceNoResult(knex, { countryAbbreviation, partnerId }) {
    // get 1st site for current partner
    const { s: { id: siteId, geographyId } } = await getSite(knex, {
      countryAbbreviation,
      partnerId,
    })

    const [deviceId] = await knex('Device').insert({
      partnerId,
      geographyId,
      siteId, // new site id
      deviceTypeId: await deviceTypeToId('CepheidGeneXpert'),
      deviceStatusId: await deviceStatusToId('approved'),
      name: 'Test Device',
      shortName: 'Test Device',
      lastSeenOn: new Date(),
    })
    return deviceId
  }

  async function deleteDeviceAndTestData(knex, deviceIds) {
    await knex('FactDeviceFlag')
      .whereIn('deviceId', deviceIds)
      .delete()
    await knex('DeviceStatusLog')
      .whereIn('deviceId', deviceIds)
      .delete()
    await knex('FactDeviceFlag')
      .whereIn('deviceId', deviceIds)
      .delete()
    await knex('DeviceLog')
      .whereIn('deviceId', deviceIds)
      .delete()
    await knex('DeviceSiteHistory')
      .whereIn('deviceId', deviceIds)
      .delete()
    await knex('DeviceOperation')
      .whereIn('deviceId', deviceIds)
      .delete()
    await knex('Device')
      .whereIn('id', deviceIds)
      .delete()
  }

  async function cleanUpIssues(knex, issueIds) {
    const notifications = await knex('Notification')
      .whereIn('issueId', issueIds)
      .select()
    const alertMessageIds = _.filter(
      _.uniq(_.map(notifications, 'alertMessageId')),
      alertMessageId => !_.isNull(alertMessageId)
    )
    if (!_.isEmpty(alertMessageIds)) {
      await knex('AlertMessage')
        .whereIn('id', alertMessageIds)
        .del()
    }
    const emailMessageIds = _.filter(
      _.uniq(_.map(notifications, 'emailMessageId')),
      emailMessageId => !_.isNull(emailMessageId)
    )
    if (!_.isEmpty(emailMessageIds)) {
      await knex('EmailMessage')
        .whereIn('id', emailMessageIds)
        .del()
    }
    const smsMessageIds = _.filter(
      _.uniq(_.map(notifications, 'smsMessageId')),
      smsMessageId => !_.isNull(smsMessageId)
    )
    if (!_.isEmpty(smsMessageIds)) {
      await knex('SmsMessage')
        .whereIn('id', smsMessageIds)
        .del()
    }
    await knex('Notification')
      .whereIn('issueId', issueIds)
      .del()
    return knex('Issue')
      .whereIn('id', issueIds)
      .del()
  }

  describe('For Myanmar', () => {
    const partnerName = 'Myanmar'
    const countryAbbreviation = 'MM'
    let activeIssueStatus
    let resolvedIssueStatus
    let triggeredIssueEventStatus
    let decommissionedDeviceStatus

    let partner
    let messageContext

    before(async () =>
      run(async knex => {
        partner = await getPartner(knex, partnerName)
        messageContext = await createMessageContext()
        messageContext.bindActionCreators({ resolveIssues })
        activeIssueStatus = await getIssueStatus(knex, 'Active')
        resolvedIssueStatus = await getIssueStatus(knex, 'Resolved')
        triggeredIssueEventStatus = await getIssueEventStatus(knex, 'Triggered')
        decommissionedDeviceStatus = await getDeviceStatus(
          knex,
          'decommissioned'
        )
      })
    )

    describe('when DeviceOffline issues exist', () => {
      let deviceOfflineIssueType
      let device1
      let device2
      const dateIssueRaised = subDays(new Date(), 1)
      let device1OfflineIssueId
      let device2OfflineIssueId
      const devicesToBringBackOnline = []
      const factDeviceFlagsToRemove = []

      before(async () =>
        run(async knex => {
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
              await knex('FactDeviceFlag')
                .where('deviceId', device1.id)
                .update({ offline: 1 })
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
              await knex('FactDeviceFlag')
                .where('deviceId', device2.id)
                .update({ offline: 1 })
              devicesToBringBackOnline.push(device2.id)
            }
          }
        })
      )

      after(async () =>
        run(async knex => {
          await Promise.all(
            _.map(factDeviceFlagsToRemove, deviceId =>
              knex('FactDeviceFlag')
                .where('deviceId', deviceId)
                .del()
            )
          )

          return Promise.all(
            _.map(devicesToBringBackOnline, deviceId =>
              knex('FactDeviceFlag')
                .where('deviceId', deviceId)
                .update({ offline: 0 })
            )
          )
        })
      )

      beforeEach(async () =>
        run(async knex => {
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
      )

      afterEach(async () =>
        run(async knex => {
          await cleanUpIssues(knex, [
            device1OfflineIssueId,
            device2OfflineIssueId,
          ])
        })
      )

      describe('then RESOLVE_ISSUES is dispatched with no issue ID', () => {
        it('the issues should still be active', () =>
          runTestWithKnex(async knex => {
            const waitForResolveIssues = waitForAction(resolveIssues())
            messageContext.resolveIssues()
            await waitForResolveIssues

            const device1OfflineIssue = await getIssue(
              knex,
              device1OfflineIssueId
            )
            const device2OfflineIssue = await getIssue(
              knex,
              device2OfflineIssueId
            )

            assert.equal(
              device1OfflineIssue.issueStatusId,
              activeIssueStatus.id
            )
            assert.equal(
              device2OfflineIssue.issueStatusId,
              activeIssueStatus.id
            )
          }))
      })

      describe('then RESOLVE_ISSUES is dispatched with an issue ID', () => {
        it('the issues should still be active', () =>
          runTestWithKnex(async knex => {
            const waitForResolveIssue = waitForAction(
              resolveIssues(device1OfflineIssueId)
            )
            messageContext.resolveIssues(device1OfflineIssueId)
            await waitForResolveIssue

            const device1OfflineIssue = await getIssue(
              knex,
              device1OfflineIssueId
            )
            const device2OfflineIssue = await getIssue(
              knex,
              device2OfflineIssueId
            )

            assert.equal(
              device1OfflineIssue.issueStatusId,
              activeIssueStatus.id
            )
            assert.equal(
              device2OfflineIssue.issueStatusId,
              activeIssueStatus.id
            )
          }))
      })

      describe('and then one of the devices come back online', () => {
        beforeEach(async () =>
          run(async knex => {
            await knex('FactDeviceFlag')
              .where('deviceId', device1.id)
              .update({ offline: 0 })
            return knex('FactDeviceFlag')
              .where('deviceId', device2.id)
              .update({ offline: 1 })
          })
        )

        describe('then RESOLVE_ISSUES is dispatched with no issue ID', () => {
          it('the issue should be resolved for the online device only', () =>
            runTestWithKnex(async knex => {
              const waitForIssueResolved = waitForAction(
                issueResolved(device1OfflineIssueId)
              )
              messageContext.resolveIssues()
              await waitForIssueResolved

              const device1OfflineIssue = await getIssue(
                knex,
                device1OfflineIssueId
              )
              const device2OfflineIssue = await getIssue(
                knex,
                device2OfflineIssueId
              )

              assert.equal(
                device1OfflineIssue.issueStatusId,
                resolvedIssueStatus.id
              )
              assert.equal(
                device2OfflineIssue.issueStatusId,
                activeIssueStatus.id
              )
            }))
        })
      })

      describe('then both of the devices come back online', () => {
        beforeEach(async () =>
          run(async knex => {
            await knex('FactDeviceFlag')
              .where('deviceId', device1.id)
              .update({ offline: 0 })
            return knex('FactDeviceFlag')
              .where('deviceId', device2.id)
              .update({ offline: 0 })
          })
        )

        describe('then RESOLVE_ISSUES is dispatched with no issue ID', () => {
          it('the issues for both devices should be resolved', () =>
            runTestWithKnex(async knex => {
              const waitForDevice1IssueResolved = waitForAction(
                issueResolved(device1OfflineIssueId)
              )
              const waitForDevice2IssueResolved = waitForAction(
                issueResolved(device2OfflineIssueId)
              )
              messageContext.resolveIssues()
              await Promise.all([
                waitForDevice1IssueResolved,
                waitForDevice2IssueResolved,
              ])

              const device1OfflineIssue = await getIssue(
                knex,
                device1OfflineIssueId
              )
              const device2OfflineIssue = await getIssue(
                knex,
                device2OfflineIssueId
              )

              assert.equal(
                device1OfflineIssue.issueStatusId,
                resolvedIssueStatus.id
              )
              assert.equal(
                device2OfflineIssue.issueStatusId,
                resolvedIssueStatus.id
              )
            }))
        })

        describe('then RESOLVE_ISSUES is dispatched with an issue ID', () => {
          it('the issue should still be resolved for the one issue only', () =>
            runTestWithKnex(async knex => {
              const waitForIssueResolved = waitForAction(
                issueResolved(device1OfflineIssueId)
              )
              messageContext.resolveIssues(device1OfflineIssueId)
              await waitForIssueResolved

              const device1OfflineIssue = await getIssue(
                knex,
                device1OfflineIssueId
              )
              const device2OfflineIssue = await getIssue(
                knex,
                device2OfflineIssueId
              )

              assert.equal(
                device1OfflineIssue.issueStatusId,
                resolvedIssueStatus.id
              )
              assert.equal(
                device2OfflineIssue.issueStatusId,
                activeIssueStatus.id
              )
            }))
        })
      })

      describe('then a reason is specified for one of the devices being offline', () => {
        let maintenanceReasonEventId

        beforeEach(async () =>
          run(async knex => {
            await knex('FactDeviceFlag')
              .where('deviceId', device1.id)
              .update({ offline: 1 })
            maintenanceReasonEventId = await createIssueEvent({
              knex,
              deviceId: device1.id,
              issueId: device1OfflineIssueId,
              issueEventStatusId: triggeredIssueEventStatus.id,
              actionType: 'DEVICE_MAINTENANCE',
              createdOn: new Date(),
              options: { data: { reason: 'Flaky data connection' } },
            })
            return knex('FactDeviceFlag')
              .where('deviceId', device2.id)
              .update({ offline: 1 })
          })
        )

        afterEach(async () =>
          run(async knex => {
            await knex('FactDeviceFlag')
              .where('deviceId', device1.id)
              .update({ offline: 0 })
            await knex('IssueEvent')
              .where('id', maintenanceReasonEventId)
              .del()
            return knex('FactDeviceFlag')
              .where('deviceId', device2.id)
              .update({ offline: 0 })
          })
        )

        describe('then RESOLVE_ISSUES is dispatched with no issue ID', () => {
          it('the issue should be resolved for the device that has a reason specified only', () =>
            runTestWithKnex(async knex => {
              const waitForIssueResolved = waitForAction(
                issueResolved(device1OfflineIssueId)
              )
              messageContext.resolveIssues()
              await waitForIssueResolved

              const device1OfflineIssue = await getIssue(
                knex,
                device1OfflineIssueId
              )
              const device2OfflineIssue = await getIssue(
                knex,
                device2OfflineIssueId
              )

              assert.equal(
                device1OfflineIssue.issueStatusId,
                resolvedIssueStatus.id
              )
              assert.equal(
                device2OfflineIssue.issueStatusId,
                activeIssueStatus.id
              )
            }))
        })
      })

      describe('then reasons are specified for both of the devices being offline', () => {
        let maintenanceReasonEventId1
        let maintenanceReasonEventId2

        beforeEach(async () =>
          run(async knex => {
            await knex('FactDeviceFlag')
              .where('deviceId', device1.id)
              .update({ offline: 1 })
            maintenanceReasonEventId1 = await createIssueEvent({
              knex,
              deviceId: device1.id,
              issueId: device1OfflineIssueId,
              issueEventStatusId: triggeredIssueEventStatus.id,
              actionType: 'DEVICE_MAINTENANCE',
              createdOn: new Date(),
              options: { data: { reason: 'Flaky data connection' } },
            })
            await knex('FactDeviceFlag')
              .where('deviceId', device2.id)
              .update({ offline: 1 })
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
        )

        afterEach(async () =>
          run(async knex => {
            await knex('FactDeviceFlag')
              .where('deviceId', device1.id)
              .update({ offline: 0 })
            await knex('IssueEvent')
              .where('id', maintenanceReasonEventId1)
              .del()
            await knex('FactDeviceFlag')
              .where('deviceId', device2.id)
              .update({ offline: 0 })
            await knex('IssueEvent')
              .where('id', maintenanceReasonEventId2)
              .del()
          })
        )

        describe('then RESOLVE_ISSUES is dispatched with no issue ID', () => {
          it('the issues for both devices should be resolved', () =>
            runTestWithKnex(async knex => {
              const waitForDevice1IssueResolved = waitForAction(
                issueResolved(device1OfflineIssueId)
              )
              const waitForDevice2IssueResolved = waitForAction(
                issueResolved(device1OfflineIssueId)
              )
              messageContext.resolveIssues()
              await Promise.all([
                waitForDevice1IssueResolved,
                waitForDevice2IssueResolved,
              ])

              const device1OfflineIssue = await getIssue(
                knex,
                device1OfflineIssueId
              )
              const device2OfflineIssue = await getIssue(
                knex,
                device2OfflineIssueId
              )

              assert.equal(
                device1OfflineIssue.issueStatusId,
                resolvedIssueStatus.id
              )
              assert.equal(
                device2OfflineIssue.issueStatusId,
                resolvedIssueStatus.id
              )
            }))
        })

        describe('then RESOLVE_ISSUES is dispatched with an issue ID', () => {
          it('the issue should still be resolved for the one issue only', () =>
            runTestWithKnex(async knex => {
              const waitForIssueResolved = waitForAction(
                issueResolved(device1OfflineIssueId)
              )
              messageContext.resolveIssues(device1OfflineIssueId)
              await waitForIssueResolved

              const device1OfflineIssue = await getIssue(
                knex,
                device1OfflineIssueId
              )
              const device2OfflineIssue = await getIssue(
                knex,
                device2OfflineIssueId
              )

              assert.equal(
                device1OfflineIssue.issueStatusId,
                resolvedIssueStatus.id
              )
              assert.equal(
                device2OfflineIssue.issueStatusId,
                activeIssueStatus.id
              )
            }))
        })
      })

      describe('then one then the devices is decommissioned', () => {
        beforeEach(async () =>
          run(async knex => {
            await knex('Device')
              .where('id', device1.id)
              .update({ deviceStatusId: decommissionedDeviceStatus.id })
            await knex('FactDeviceFlag')
              .where('deviceId', device2.id)
              .update({ offline: 1 })
          })
        )

        afterEach(async () =>
          run(async knex => {
            await knex('Device')
              .where('id', device1.id)
              .update({ deviceStatusId: device1.deviceStatusId })
            await knex('FactDeviceFlag')
              .where('deviceId', device2.id)
              .update({ offline: 0 })
          })
        )

        describe('then RESOLVE_ISSUES is dispatched with no issue ID', () => {
          it('the issue should be resolved for the decommissioned device only', () =>
            runTestWithKnex(async knex => {
              const waitForIssueResolved = waitForAction(
                issueResolved(device1OfflineIssueId)
              )
              messageContext.resolveIssues()
              await waitForIssueResolved

              const device1OfflineIssue = await getIssue(
                knex,
                device1OfflineIssueId
              )
              const device2OfflineIssue = await getIssue(
                knex,
                device2OfflineIssueId
              )

              assert.equal(
                device1OfflineIssue.issueStatusId,
                resolvedIssueStatus.id
              )
              assert.equal(
                device2OfflineIssue.issueStatusId,
                activeIssueStatus.id
              )
            }))
        })
      })

      describe('then both of the devices are decommissioned', () => {
        beforeEach(async () =>
          run(async knex => {
            await knex('Device')
              .where('id', device1.id)
              .update({ deviceStatusId: decommissionedDeviceStatus.id })
            await knex('Device')
              .where('id', device2.id)
              .update({ deviceStatusId: decommissionedDeviceStatus.id })
          })
        )

        afterEach(async () =>
          run(async knex => {
            await knex('Device')
              .where('id', device1.id)
              .update({ deviceStatusId: device1.deviceStatusId })
            await knex('Device')
              .where('id', device2.id)
              .update({ deviceStatusId: device2.deviceStatusId })
          })
        )

        describe('then RESOLVE_ISSUES is dispatched with no issue ID', () => {
          it('the issues for both devices should be resolved', () =>
            runTestWithKnex(async knex => {
              const waitForDevice1IssueResolved = waitForAction(
                issueResolved(device1OfflineIssueId)
              )
              const waitForDevice2IssueResolved = waitForAction(
                issueResolved(device2OfflineIssueId)
              )
              messageContext.resolveIssues()
              await Promise.all([
                waitForDevice1IssueResolved,
                waitForDevice2IssueResolved,
              ])

              const device1OfflineIssue = await getIssue(
                knex,
                device1OfflineIssueId
              )
              const device2OfflineIssue = await getIssue(
                knex,
                device2OfflineIssueId
              )

              assert.equal(
                device1OfflineIssue.issueStatusId,
                resolvedIssueStatus.id
              )
              assert.equal(
                device2OfflineIssue.issueStatusId,
                resolvedIssueStatus.id
              )
            }))
        })

        describe('then RESOLVE_ISSUES is dispatched with an issue ID', () => {
          it('the issue should still be resolved for the one issue only', () =>
            runTestWithKnex(async knex => {
              const waitForIssueResolved = waitForAction(
                issueResolved(device1OfflineIssueId)
              )
              messageContext.resolveIssues(device1OfflineIssueId)
              await waitForIssueResolved

              const device1OfflineIssue = await getIssue(
                knex,
                device1OfflineIssueId
              )
              const device2OfflineIssue = await getIssue(
                knex,
                device2OfflineIssueId
              )

              assert.equal(
                device1OfflineIssue.issueStatusId,
                resolvedIssueStatus.id
              )
              assert.equal(
                device2OfflineIssue.issueStatusId,
                activeIssueStatus.id
              )
            }))
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
      const deviceIdsToRemove = []

      let now
      let admin
      let gxMtbRifAssay
      let resultWorkflowStatus
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
          geographyId: device.geographyId,
          siteId: device.siteId,
          deviceId: device.id,
          resultWorkflowStatusId: resultWorkflowStatus.id,
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

      before(async () =>
        run(async knex => {          
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
          
          deviceNoResultsIssueType = await getIssueType(knex, 'DeviceNoResults')
          const noResultsSince = subDays(
            new Date(),
            partner.maxDaysDeviceNoResults + 1
          )
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
              await knex('FactDeviceFlag')
                .where('deviceId', device1.id)
                .update({ noResults: 1 })
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
              await knex('FactDeviceFlag')
                .where('deviceId', device2.id)
                .update({ noResults: 1 })
              devicesToResetNoResults.push(device2.id)
            }
          }
          now = new Date()
          admin = await knex('User')
            .where({ name: 'myanmar_admin' })
            .first()
          gxMtbRifAssay = await knex('Assay')
            .where({ externalId: 'GxMtbRif' })
            .first()
          resultWorkflowStatus = await knex('ResultWorkflowStatus')
            .where({ externalId: 'OK' })
            .first()
          resultSource = await knex('ResultSource')
            .where({ externalId: 'DiagnosticDevice' })
            .first()
          resultType = await knex('ResultType')
            .where({ externalId: 'Patient' })
            .first()
          sampleType = await knex('SampleType')
            .where({ externalId: 'Sputum' })
            .first()
          noResultCategory = await knex('ResultCategory')
            .where({ externalId: 'NoResult' })
            .first()
        })
      )

      after(async () =>
        run(async knex => {
          await deleteDeviceAndTestData(knex, deviceIdsToRemove)

          await Promise.all(
            _.map(factDeviceFlagsToRemove, deviceId =>
              knex('FactDeviceFlag')
                .where('deviceId', deviceId)
                .del()
            )
          )

          return Promise.all(
            _.map(devicesToResetNoResults, deviceId =>
              knex('FactDeviceFlag')
                .where('deviceId', deviceId)
                .update({ noResults: 0 })
            )
          )
        })
      )

      beforeEach(async () =>
        run(async knex => {
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
      )

      afterEach(async () =>
        run(async knex => {
          await cleanUpIssues(knex, [
            device1NoResultsIssueId,
            device2NoResultsIssueId,
          ])
        })
      )

      describe('then RESOLVE_ISSUES is dispatched with no issue ID', () => {
        it('the issues should still be active', () =>
          runTestWithKnex(async knex => {
            const waitForResolveIssues = waitForAction(resolveIssues())
            messageContext.resolveIssues()
            await waitForResolveIssues

            const device1NoResultsIssue = await getIssue(
              knex,
              device1NoResultsIssueId
            )
            const device2NoResultsIssue = await getIssue(
              knex,
              device2NoResultsIssueId
            )

            assert.equal(
              device1NoResultsIssue.issueStatusId,
              activeIssueStatus.id
            )
            assert.equal(
              device2NoResultsIssue.issueStatusId,
              activeIssueStatus.id
            )
          }))
      })

      describe('then RESOLVE_ISSUES is dispatched with an issue ID', () => {
        it('the issues should still be active', () =>
          runTestWithKnex(async knex => {
            const waitForResolveIssue = waitForAction(
              resolveIssues(device1NoResultsIssueId)
            )
            messageContext.resolveIssues(device1NoResultsIssueId)
            await waitForResolveIssue

            const device1NoResultsIssue = await getIssue(
              knex,
              device1NoResultsIssueId
            )
            const device2NoResultsIssue = await getIssue(
              knex,
              device2NoResultsIssueId
            )

            assert.equal(
              device1NoResultsIssue.issueStatusId,
              activeIssueStatus.id
            )
            assert.equal(
              device2NoResultsIssue.issueStatusId,
              activeIssueStatus.id
            )
          }))
      })

      describe('and then one of the devices posts a result', () => {
        const resultIdsToCleanUp = []

        beforeEach(async () =>
          run(async knex => {
            const resultId = await postResult(knex, device1)
            resultIdsToCleanUp.push(resultId)
          })
        )

        afterEach(async () =>
          run(async knex =>
            Promise.each(resultIdsToCleanUp, resultId =>
              knex('Result')
                .where('id', resultId)
                .del()
            )
          )
        )

        describe('then RESOLVE_ISSUES is dispatched with no issue ID', () => {
          it('the issue should be resolved for the online device only', () =>
            runTestWithKnex(async knex => {
              const waitForIssueResolved = waitForAction(
                issueResolved(device1NoResultsIssueId)
              )
              messageContext.resolveIssues()
              await waitForIssueResolved

              const device1NoResultsIssue = await getIssue(
                knex,
                device1NoResultsIssueId
              )
              const device2NoResultsIssue = await getIssue(
                knex,
                device2NoResultsIssueId
              )

              assert.equal(
                device1NoResultsIssue.issueStatusId,
                resolvedIssueStatus.id
              )
              assert.equal(
                device2NoResultsIssue.issueStatusId,
                activeIssueStatus.id
              )
            }))
        })
      })

      describe('then the other device posts a result', () => {
        const resultIdsToCleanUp = []

        beforeEach(async () =>
          run(async knex => {
            const resultId = await postResult(knex, device2)
            resultIdsToCleanUp.push(resultId)
          })
        )

        afterEach(async () =>
          run(async knex =>
            Promise.each(resultIdsToCleanUp, resultId =>
              knex('Result')
                .where('id', resultId)
                .del()
            )
          )
        )

        describe('then RESOLVE_ISSUES is dispatched with no issue ID', () => {
          it('the issues for the other device should be resolved', () =>
            runTestWithKnex(async knex => {
              const waitForIssueResolved = waitForAction(
                issueResolved(device2NoResultsIssueId)
              )
              messageContext.resolveIssues()
              await waitForIssueResolved

              const device1NoResultsIssue = await getIssue(
                knex,
                device1NoResultsIssueId
              )
              const device2NoResultsIssue = await getIssue(
                knex,
                device2NoResultsIssueId
              )

              assert.equal(
                device1NoResultsIssue.issueStatusId,
                activeIssueStatus.id
              )
              assert.equal(
                device2NoResultsIssue.issueStatusId,
                resolvedIssueStatus.id
              )
            }))
        })

        describe('then RESOLVE_ISSUES is dispatched with an issue ID', () => {
          it('the issue should be resolved for the one issue only', () =>
            runTestWithKnex(async knex => {
              const waitForIssueResolved = waitForAction(
                issueResolved(device2NoResultsIssueId)
              )
              messageContext.resolveIssues(device2NoResultsIssueId)
              await waitForIssueResolved

              const device1NoResultsIssue = await getIssue(
                knex,
                device1NoResultsIssueId
              )
              const device2NoResultsIssue = await getIssue(
                knex,
                device2NoResultsIssueId
              )

              assert.equal(
                device1NoResultsIssue.issueStatusId,
                activeIssueStatus.id
              )
              assert.equal(
                device2NoResultsIssue.issueStatusId,
                resolvedIssueStatus.id
              )
            }))
        })
      })

      describe('then a reason is specified for one of the devices being inactive', () => {
        let device1ConfigurationData

        beforeEach(async () =>
          run(async knex => {
            await knex('FactDeviceFlag')
              .where('deviceId', device1.id)
              .update({ noResults: 1 })
            const device1ConfigurationData = JSON.parse(
              device1.configurationData || '{}'
            )
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
        )

        afterEach(async () =>
          run(async knex => {
            await knex('FactDeviceFlag')
              .where('deviceId', device1.id)
              .update({ noResults: 0 })
            await knex('Device')
              .where('id', device1.id)
              .update({
                configurationData: _.isEmpty(device1ConfigurationData)
                  ? null
                  : JSON.stringify(device1ConfigurationData),
              })
          })
        )

        describe('then RESOLVE_ISSUES is dispatched with no issue ID', () => {
          it('the issue should be resolved for the device that has a reason specified only', () =>
            runTestWithKnex(async knex => {
              const waitForIssueResolved = waitForAction(
                issueResolved(device1NoResultsIssueId)
              )
              messageContext.resolveIssues()
              await waitForIssueResolved

              const device1NoResultsIssue = await getIssue(
                knex,
                device1NoResultsIssueId
              )
              const device2NoResultsIssue = await getIssue(
                knex,
                device2NoResultsIssueId
              )

              assert.equal(
                device1NoResultsIssue.issueStatusId,
                resolvedIssueStatus.id
              )
              assert.equal(
                device2NoResultsIssue.issueStatusId,
                activeIssueStatus.id
              )
            }))
        })
      })

      describe('then reasons are specified for both of the devices being inactive', () => {
        let device1ConfigurationData
        let device2ConfigurationData

        beforeEach(async () =>
          run(async knex => {
            await knex('FactDeviceFlag')
              .where('deviceId', device1.id)
              .update({ noResults: 1 })
            const device1ConfigurationData = JSON.parse(
              device1.configurationData || '{}'
            )
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

            await knex('FactDeviceFlag')
              .where('deviceId', device2.id)
              .update({ noResults: 1 })
            const device2ConfigurationData = JSON.parse(
              device2.configurationData || '{}'
            )
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
        )

        afterEach(async () =>
          run(async knex => {
            await knex('FactDeviceFlag')
              .where('deviceId', device1.id)
              .update({ noResults: 0 })
            await knex('Device')
              .where('id', device1.id)
              .update({
                configurationData: _.isEmpty(device1ConfigurationData)
                  ? null
                  : JSON.stringify(device1ConfigurationData),
              })

            await knex('FactDeviceFlag')
              .where('deviceId', device2.id)
              .update({ noResults: 0 })
            await knex('Device')
              .where('id', device2.id)
              .update({
                configurationData: _.isEmpty(device2ConfigurationData)
                  ? null
                  : JSON.stringify(device2ConfigurationData),
              })
          })
        )

        describe('then RESOLVE_ISSUES is dispatched with no issue ID', () => {
          it('the issues for both devices should be resolved', () =>
            runTestWithKnex(async knex => {
              const waitForDevice1IssueResolved = waitForAction(
                issueResolved(device1NoResultsIssueId)
              )
              const waitForDevice2IssueResolved = waitForAction(
                issueResolved(device2NoResultsIssueId)
              )
              messageContext.resolveIssues()
              await Promise.all([
                waitForDevice1IssueResolved,
                waitForDevice2IssueResolved,
              ])

              const device1NoResultsIssue = await getIssue(
                knex,
                device1NoResultsIssueId
              )
              const device2NoResultsIssue = await getIssue(
                knex,
                device2NoResultsIssueId
              )

              assert.equal(
                device1NoResultsIssue.issueStatusId,
                resolvedIssueStatus.id
              )
              assert.equal(
                device2NoResultsIssue.issueStatusId,
                resolvedIssueStatus.id
              )
            }))
        })

        describe('then RESOLVE_ISSUES is dispatched with an issue ID', () => {
          it('only the one issue should be resolved', () =>
            runTestWithKnex(async knex => {
              const waitForIssueResolved = waitForAction(
                issueResolved(device1NoResultsIssueId)
              )
              messageContext.resolveIssues(device1NoResultsIssueId)
              await waitForIssueResolved

              const device1NoResultsIssue = await getIssue(
                knex,
                device1NoResultsIssueId
              )
              const device2NoResultsIssue = await getIssue(
                knex,
                device2NoResultsIssueId
              )

              assert.equal(
                device1NoResultsIssue.issueStatusId,
                resolvedIssueStatus.id
              )
              assert.equal(
                device2NoResultsIssue.issueStatusId,
                activeIssueStatus.id
              )
            }))
        })
      })

      describe('then one then the devices is decommissioned', () => {
        beforeEach(async () =>
          run(async knex => {
            await knex('Device')
              .where('id', device1.id)
              .update({ deviceStatusId: decommissionedDeviceStatus.id })
            await knex('FactDeviceFlag')
              .where('deviceId', device2.id)
              .update({ noResults: 1 })
          })
        )

        afterEach(async () =>
          run(async knex => {
            await knex('Device')
              .where('id', device1.id)
              .update({ deviceStatusId: device1.deviceStatusId })
            await knex('FactDeviceFlag')
              .where('deviceId', device2.id)
              .update({ noResults: 0 })
          })
        )

        describe('then RESOLVE_ISSUES is dispatched with no issue ID', () => {
          it('the issue should be resolved for the decommissioned device only', () =>
            runTestWithKnex(async knex => {
              const waitForIssueResolved = waitForAction(
                issueResolved(device1NoResultsIssueId)
              )
              messageContext.resolveIssues()
              await waitForIssueResolved

              const device1NoResultsIssue = await getIssue(
                knex,
                device1NoResultsIssueId
              )
              const device2NoResultsIssue = await getIssue(
                knex,
                device2NoResultsIssueId
              )

              assert.equal(
                device1NoResultsIssue.issueStatusId,
                resolvedIssueStatus.id
              )
              assert.equal(
                device2NoResultsIssue.issueStatusId,
                activeIssueStatus.id
              )
            }))
        })
      })

      describe('then both of the devices are decommissioned', () => {
        beforeEach(async () =>
          run(async knex => {
            await knex('Device')
              .where('id', device1.id)
              .update({ deviceStatusId: decommissionedDeviceStatus.id })
            await knex('Device')
              .where('id', device2.id)
              .update({ deviceStatusId: decommissionedDeviceStatus.id })
          })
        )

        afterEach(async () =>
          run(async knex => {
            await knex('Device')
              .where('id', device1.id)
              .update({ deviceStatusId: device1.deviceStatusId })
            await knex('Device')
              .where('id', device2.id)
              .update({ deviceStatusId: device2.deviceStatusId })
          })
        )

        describe('then RESOLVE_ISSUES is dispatched with no issue ID', () => {
          it('the issues for both devices should be resolved', () =>
            runTestWithKnex(async knex => {
              const waitForDevice1IssueResolved = waitForAction(
                issueResolved(device1NoResultsIssueId)
              )
              const waitForDevice2IssueResolved = waitForAction(
                issueResolved(device2NoResultsIssueId)
              )
              messageContext.resolveIssues()
              await Promise.all([
                waitForDevice1IssueResolved,
                waitForDevice2IssueResolved,
              ])

              const device1NoResultsIssue = await getIssue(
                knex,
                device1NoResultsIssueId
              )
              const device2NoResultsIssue = await getIssue(
                knex,
                device2NoResultsIssueId
              )

              assert.equal(
                device1NoResultsIssue.issueStatusId,
                resolvedIssueStatus.id
              )
              assert.equal(
                device2NoResultsIssue.issueStatusId,
                resolvedIssueStatus.id
              )
            }))
        })

        describe('then RESOLVE_ISSUES is dispatched with an issue ID', () => {
          it('the issue should still be resolved for the one issue only', () =>
            runTestWithKnex(async knex => {
              const waitForIssueResolved = waitForAction(
                issueResolved(device1NoResultsIssueId)
              )
              messageContext.resolveIssues(device1NoResultsIssueId)
              await waitForIssueResolved

              const device1NoResultsIssue = await getIssue(
                knex,
                device1NoResultsIssueId
              )
              const device2NoResultsIssue = await getIssue(
                knex,
                device2NoResultsIssueId
              )

              assert.equal(
                device1NoResultsIssue.issueStatusId,
                resolvedIssueStatus.id
              )
              assert.equal(
                device2NoResultsIssue.issueStatusId,
                activeIssueStatus.id
              )
            }))
        })
      })
    })
  })
})
