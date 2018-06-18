const chai = require('chai')
const _ = require('lodash')
const { subDays } = require('date-fns')
const { run } = require('../../src/db')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')
const {
  createMessageContext,
  waitForIdle,
  waitForAction,
} = require('../utils/mqUtils')
const { resolveIssues } = require('../../src/issue/actions')
const { types: deviceActionTypes } = require('../../src/device/actions')

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

  async function getDevice(knex, { countryAbbreviation, partnerId, notIn }) {
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
      .where('c.abbreviation', countryAbbreviation)
      .andWhere(function() {
        this.where('d.partnerId', partnerId)
          .andWhere('labUserJobFunction.name', 'Lab User')
          .andWhere('regionalOfficerJobFunction.name', 'Regional Officer')
        if (!_.isEmpty(notIn)) {
          this.andWhere(function() {
            this.whereNotIn('d.id', notIn)
          })
        }
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

  async function createAndTriggerIssue(
    knex,
    partnerId,
    device,
    issueTypeId,
    actionType,
    level,
    dateIssueRaised
  ) {
    const activeIssueStatus = await getIssueStatus(knex, 'Active')
    const triggeredIssueEventStatus = await getIssueEventStatus(
      knex,
      'Triggered'
    )
    const issueId = await knex('Issue').insert({
      issueTypeId,
      issueStatusId: activeIssueStatus.id,
      partnerId,
      geographyId: device.geographyId,
      deviceId: device.id,
      level,
      createdOn: dateIssueRaised,
      updatedOn: dateIssueRaised,
    })
    await createIssueEvent(
      knex,
      device.id,
      issueId,
      triggeredIssueEventStatus.id,
      actionType,
      dateIssueRaised
    )
    return issueId
  }

  async function createIssueEvent(
    knex,
    deviceId,
    issueId,
    issueEventStatusId,
    actionType,
    createdOn,
    options
  ) {
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

    let partner
    let messageContext

    before(async () =>
      run(async knex => {
        partner = await getPartner(knex, partnerName)
        messageContext = await createMessageContext()
        messageContext.bindActionCreators({ resolveIssues })
      })
    )

    describe('and DeviceOffline issues exist for offline devices', () => {
      let deviceOfflineIssueType
      let device1
      let device2
      const dateIssueRaised = subDays(new Date(), 1)
      let device1OfflineIssueId
      let device2OfflineIssueId
      let activeIssueStatus
      let resolvedIssueStatus
      let triggeredIssueEventStatus
      let decommissionedDeviceStatus
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

          activeIssueStatus = await getIssueStatus(knex, 'Active')
          resolvedIssueStatus = await getIssueStatus(knex, 'Resolved')
          triggeredIssueEventStatus = await getIssueEventStatus(
            knex,
            'Triggered'
          )
          decommissionedDeviceStatus = await getDeviceStatus(
            knex,
            'decommissioned'
          )
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
          device1OfflineIssueId = await createAndTriggerIssue(
            knex,
            partner.id,
            device1,
            deviceOfflineIssueType.id,
            deviceActionTypes.DEVICE_OFFLINE,
            1,
            dateIssueRaised
          )
          device2OfflineIssueId = await createAndTriggerIssue(
            knex,
            partner.id,
            device2,
            deviceOfflineIssueType.id,
            deviceActionTypes.DEVICE_OFFLINE,
            1,
            dateIssueRaised
          )
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
            await waitForIdle()

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
            await waitForIdle()

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
              const waitForResolveIssues = waitForAction(resolveIssues())
              messageContext.resolveIssues()
              await waitForResolveIssues
              await waitForIdle()

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
              const waitForResolveIssues = waitForAction(resolveIssues())
              messageContext.resolveIssues()
              await waitForResolveIssues
              await waitForIdle()

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
              const waitForResolveIssue = waitForAction(
                resolveIssues(device1OfflineIssueId)
              )
              messageContext.resolveIssues(device1OfflineIssueId)
              await waitForResolveIssue
              await waitForIdle()

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
            maintenanceReasonEventId = await createIssueEvent(
              knex,
              device1.id,
              device1OfflineIssueId,
              triggeredIssueEventStatus.id,
              'DEVICE_MAINTENANCE',
              new Date(),
              { data: { reason: 'Flaky data connection' } }
            )
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
              const waitForResolveIssues = waitForAction(resolveIssues())
              messageContext.resolveIssues()
              await waitForResolveIssues
              await waitForIdle()

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
            maintenanceReasonEventId1 = await createIssueEvent(
              knex,
              device1.id,
              device1OfflineIssueId,
              triggeredIssueEventStatus.id,
              'DEVICE_MAINTENANCE',
              new Date(),
              { data: { reason: 'Flaky data connection' } }
            )
            await knex('FactDeviceFlag')
              .where('deviceId', device2.id)
              .update({ offline: 1 })
            maintenanceReasonEventId2 = await createIssueEvent(
              knex,
              device2.id,
              device2OfflineIssueId,
              triggeredIssueEventStatus.id,
              'DEVICE_MAINTENANCE',
              new Date(),
              { data: { reason: 'Not really sure why' } }
            )
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
              const waitForResolveIssues = waitForAction(resolveIssues())
              messageContext.resolveIssues()
              await waitForResolveIssues
              await waitForIdle()

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
              const waitForResolveIssue = waitForAction(
                resolveIssues(device1OfflineIssueId)
              )
              messageContext.resolveIssues(device1OfflineIssueId)
              await waitForResolveIssue
              await waitForIdle()

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
              const waitForResolveIssues = waitForAction(resolveIssues())
              messageContext.resolveIssues()
              await waitForResolveIssues
              await waitForIdle()

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
              const waitForResolveIssues = waitForAction(resolveIssues())
              messageContext.resolveIssues()
              await waitForResolveIssues
              await waitForIdle()

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
              const waitForResolveIssue = waitForAction(
                resolveIssues(device1OfflineIssueId)
              )
              messageContext.resolveIssues(device1OfflineIssueId)
              await waitForResolveIssue
              await waitForIdle()

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
  })
})
