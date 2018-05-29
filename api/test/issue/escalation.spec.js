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
const { escalateIssues } = require('../../src/issue/actions')
const { types: deviceActionTypes } = require('../../src/device/actions')
const { types: resultActionTypes } = require('../../src/result/actions')

const { assert, expect } = chai

describe.only('Issue Escalation', () => {
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

  async function getIssueNotifications(knex, issueId) {
    ensureMySqlBeforeNestedTablesOptions(knex)
    return knex('Notification')
      .join(
        'NotificationType',
        'Notification.notificationTypeId',
        'NotificationType.id'
      )
      .where('issueId', issueId)
      .options({ nestTables: true })
      .select()
  }

  async function getNotificationType(
    knex,
    partnerId,
    issueTypeId,
    jobFunctionId,
    level,
    notificationTypeName
  ) {
    return knex('NotificationType')
      .where({
        partnerId,
        issueTypeId,
        name: notificationTypeName,
        jobFunctionId,
        level,
      })
      .first()
  }

  async function getJobJunction(knex, partnerId, jobFunctionName) {
    return knex('JobFunction')
      .where({
        partnerId,
        name: jobFunctionName,
      })
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
    await knex('IssueEvent').insert({
      issueEventStatusId: triggeredIssueEventStatus.id,
      issueId,
      data: JSON.stringify({
        type: actionType,
        deviceId: device.id,
      }),
      createdOn: dateIssueRaised,
    })
    return issueId
  }

  async function createNotification(
    knex,
    notificationTypeId,
    issueId,
    personId,
    createdOn
  ) {
    return knex('Notification').insert({
      notificationTypeId,
      issueId,
      personId,
      createdOn,
    })
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
        messageContext.bindActionCreators({ escalateIssues })
      })
    )

    describe('and DeviceOffline issues exist', () => {
      let deviceOfflineIssueType
      let device1
      let device1RegionalOfficer
      let device2
      let device2RegionalOfficer

      before(async () =>
        run(async knex => {
          deviceOfflineIssueType = await getIssueType(knex, 'DeviceOffline')
          const device1Details = await getDevice(knex, {
            partnerId: partner.id,
            countryAbbreviation,
          })
          device1 = device1Details.d
          device1RegionalOfficer = device1Details.regionalOfficer

          const device2Details = await getDevice(knex, {
            partnerId: partner.id,
            countryAbbreviation,
            notIn: [device1.id],
          })
          device2 = device2Details.d
          device2RegionalOfficer = device2Details.regionalOfficer
        })
      )

      describe("which have been open for more than 30 days but haven't been escalated yet", () => {
        const dateIssueRaised = subDays(new Date(), 31)
        let device1OfflineIssueId
        let device2OfflineIssueId

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

        describe('then ESCALATE_ISSUES is dispatched with no issue ID', () => {
          it('all the issues should be escalated', () =>
            runTestWithKnex(async knex => {
              const waitForEscalateIssues = waitForAction(escalateIssues())
              messageContext.escalateIssues()
              await waitForEscalateIssues
              await waitForIdle()

              const device1OfflineIssue = await getIssue(
                knex,
                device1OfflineIssueId
              )
              const device2OfflineIssue = await getIssue(
                knex,
                device2OfflineIssueId
              )

              assert.equal(device1OfflineIssue.level, 2)
              assert.equal(device2OfflineIssue.level, 2)
            }))

          it('notifications should be created for the level that the issue has been escalated to', () =>
            runTestWithKnex(async knex => {
              let notificationsForDevice1Issue = await getIssueNotifications(
                knex,
                device1OfflineIssueId
              )
              assert.isEmpty(notificationsForDevice1Issue)
              let notificationsForDevice2Issue = await getIssueNotifications(
                knex,
                device2OfflineIssueId
              )
              assert.isEmpty(notificationsForDevice2Issue)

              const waitForEscalateIssues = waitForAction(escalateIssues())
              messageContext.escalateIssues()
              await waitForEscalateIssues
              await waitForIdle()

              notificationsForDevice1Issue = await getIssueNotifications(
                knex,
                device1OfflineIssueId
              )
              expect(notificationsForDevice1Issue).to.containSubset([
                {
                  NotificationType: {
                    level: 2,
                  },
                  Notification: {
                    personId: device1RegionalOfficer.id,
                  },
                },
              ])

              notificationsForDevice2Issue = await getIssueNotifications(
                knex,
                device2OfflineIssueId
              )
              expect(notificationsForDevice2Issue).to.containSubset([
                {
                  NotificationType: {
                    level: 2,
                  },
                  Notification: {
                    personId: device2RegionalOfficer.id,
                  },
                },
              ])
            }))
        })

        describe("then ESCALATE_ISSUES is dispatched with one of the issue's ID", () => {
          it('that one issue should be escalated', () =>
            runTestWithKnex(async knex => {
              const waitForEscalateIssues = waitForAction(
                escalateIssues(device1OfflineIssueId)
              )
              messageContext.escalateIssues(device1OfflineIssueId)
              await waitForEscalateIssues
              await waitForIdle()

              const device1OfflineIssue = await getIssue(
                knex,
                device1OfflineIssueId
              )
              const device2OfflineIssue = await getIssue(
                knex,
                device2OfflineIssueId
              )

              assert.equal(device1OfflineIssue.level, 2)
              assert.equal(device2OfflineIssue.level, 1)
            }))
        })
      })

      describe('which have been escalated once, more than 30 days ago', () => {
        const dateIssueRaised = subDays(new Date(), 61)
        const dateIssueEscalated = subDays(new Date(), 31)
        let device1OfflineIssueId
        let device2OfflineIssueId

        beforeEach(async () =>
          run(async knex => {
            const regionalOfficerJobFunction = await getJobJunction(
              knex,
              partner.id,
              'Regional Officer'
            )
            const roNetworkNotificationType = await getNotificationType(
              knex,
              partner.id,
              deviceOfflineIssueType.id,
              regionalOfficerJobFunction.id,
              2,
              'RO Network'
            )
            device1OfflineIssueId = await createAndTriggerIssue(
              knex,
              partner.id,
              device1,
              deviceOfflineIssueType.id,
              deviceActionTypes.DEVICE_OFFLINE,
              2,
              dateIssueRaised
            )
            await createNotification(
              knex,
              roNetworkNotificationType.id,
              device1OfflineIssueId,
              device1RegionalOfficer.id,
              dateIssueEscalated
            )
            device2OfflineIssueId = await createAndTriggerIssue(
              knex,
              partner.id,
              device2,
              deviceOfflineIssueType.id,
              deviceActionTypes.DEVICE_OFFLINE,
              2,
              dateIssueRaised
            )
            await createNotification(
              knex,
              roNetworkNotificationType.id,
              device2OfflineIssueId,
              device2RegionalOfficer.id,
              dateIssueEscalated
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

        describe('then ESCALATE_ISSUES is dispatched with no issue ID', () => {
          it('all the issues should be escalated to the next level', () =>
            runTestWithKnex(async knex => {
              const waitForEscalateIssues = waitForAction(escalateIssues())
              messageContext.escalateIssues()
              await waitForEscalateIssues
              await waitForIdle()

              const device1OfflineIssue = await getIssue(
                knex,
                device1OfflineIssueId
              )
              const device2OfflineIssue = await getIssue(
                knex,
                device2OfflineIssueId
              )

              assert.equal(device1OfflineIssue.level, 3)
              assert.equal(device2OfflineIssue.level, 3)
            }))

          it('a notifications should be created for the level that the issue has been escalated to', () =>
            runTestWithKnex(async knex => {
              let notificationsForDevice1Issue = await getIssueNotifications(
                knex,
                device1OfflineIssueId
              )
              expect(notificationsForDevice1Issue).to.containSubset([
                {
                  NotificationType: {
                    level: 2,
                  },
                  Notification: {
                    personId: device1RegionalOfficer.id,
                  },
                },
              ])
              let notificationsForDevice2Issue = await getIssueNotifications(
                knex,
                device2OfflineIssueId
              )
              expect(notificationsForDevice2Issue).to.containSubset([
                {
                  NotificationType: {
                    level: 2,
                  },
                  Notification: {
                    personId: device2RegionalOfficer.id,
                  },
                },
              ])

              const waitForEscalateIssues = waitForAction(escalateIssues())
              messageContext.escalateIssues()
              await waitForEscalateIssues
              await waitForIdle()

              notificationsForDevice1Issue = await getIssueNotifications(
                knex,
                device1OfflineIssueId
              )
              expect(notificationsForDevice1Issue).to.containSubset([
                {
                  NotificationType: {
                    level: 3,
                  },
                  Notification: {
                    personId: device1RegionalOfficer.id,
                  },
                },
              ])

              notificationsForDevice2Issue = await getIssueNotifications(
                knex,
                device2OfflineIssueId
              )
              expect(notificationsForDevice2Issue).to.containSubset([
                {
                  NotificationType: {
                    level: 3,
                  },
                  Notification: {
                    personId: device2RegionalOfficer.id,
                  },
                },
              ])
            }))
        })
      })

      describe('which have been open for less than 30 days', () => {
        const dateIssueRaised = subDays(new Date(), 29)
        let deviceOfflineIssueId

        beforeEach(async () =>
          run(async knex => {
            deviceOfflineIssueId = await createAndTriggerIssue(
              knex,
              partner.id,
              device1,
              deviceOfflineIssueType.id,
              deviceActionTypes.DEVICE_OFFLINE,
              1,
              dateIssueRaised
            )
          })
        )

        afterEach(async () =>
          run(async knex => {
            await cleanUpIssues(knex, [deviceOfflineIssueId])
          })
        )

        describe('then ESCALATE_ISSUES is dispatched', () => {
          it('the issues should NOT be escalated', () =>
            runTestWithKnex(async knex => {
              const waitForEscalateIssues = waitForAction(escalateIssues())
              messageContext.escalateIssues()
              await waitForEscalateIssues
              await waitForIdle()

              const deviceOfflineIssue = await getIssue(
                knex,
                deviceOfflineIssueId
              )

              assert.equal(deviceOfflineIssue.level, 1)
            }))
        })
      })
    })

    describe('and DeviceNoResults issues exist', () => {
      let deviceNoResultsIssueType
      let device1
      let device1RegionalOfficer
      let device2
      let device2RegionalOfficer

      before(async () =>
        run(async knex => {
          deviceNoResultsIssueType = await getIssueType(knex, 'DeviceNoResults')
          const device1Details = await getDevice(knex, {
            partnerId: partner.id,
            countryAbbreviation,
          })
          device1 = device1Details.d
          device1RegionalOfficer = device1Details.regionalOfficer

          const device2Details = await getDevice(knex, {
            partnerId: partner.id,
            countryAbbreviation,
            notIn: [device1.id],
          })
          device2 = device2Details.d
          device2RegionalOfficer = device2Details.regionalOfficer
        })
      )

      describe("which have been open for more than 7 days but haven't been escalated yet", () => {
        const dateIssueRaised = subDays(new Date(), 8)
        let device1NoResultsIssueId
        let device2NoResultsIssueId

        beforeEach(async () =>
          run(async knex => {
            device1NoResultsIssueId = await createAndTriggerIssue(
              knex,
              partner.id,
              device1,
              deviceNoResultsIssueType.id,
              deviceActionTypes.DEVICE_NO_RESULTS,
              1,
              dateIssueRaised
            )
            device2NoResultsIssueId = await createAndTriggerIssue(
              knex,
              partner.id,
              device2,
              deviceNoResultsIssueType.id,
              deviceActionTypes.DEVICE_NO_RESULTS,
              1,
              dateIssueRaised
            )
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

        describe('then ESCALATE_ISSUES is dispatched with no issue ID', () => {
          it('all the issues should be escalated', () =>
            runTestWithKnex(async knex => {
              const waitForEscalateIssues = waitForAction(escalateIssues())
              messageContext.escalateIssues()
              await waitForEscalateIssues
              await waitForIdle()

              const device1NoResultsIssue = await getIssue(
                knex,
                device1NoResultsIssueId
              )
              const device2NoResultsIssue = await getIssue(
                knex,
                device2NoResultsIssueId
              )

              assert.equal(device1NoResultsIssue.level, 2)
              assert.equal(device2NoResultsIssue.level, 2)
            }))

          it('notifications should be created for the level that the issue has been escalated to', () =>
            runTestWithKnex(async knex => {
              let notificationsForDevice1Issue = await getIssueNotifications(
                knex,
                device1NoResultsIssueId
              )
              assert.isEmpty(notificationsForDevice1Issue)
              let notificationsForDevice2Issue = await getIssueNotifications(
                knex,
                device2NoResultsIssueId
              )
              assert.isEmpty(notificationsForDevice2Issue)

              const waitForEscalateIssues = waitForAction(escalateIssues())
              messageContext.escalateIssues()
              await waitForEscalateIssues
              await waitForIdle()

              notificationsForDevice1Issue = await getIssueNotifications(
                knex,
                device1NoResultsIssueId
              )
              expect(notificationsForDevice1Issue).to.containSubset([
                {
                  NotificationType: {
                    level: 2,
                  },
                  Notification: {
                    personId: device1RegionalOfficer.id,
                  },
                },
              ])

              notificationsForDevice2Issue = await getIssueNotifications(
                knex,
                device2NoResultsIssueId
              )
              expect(notificationsForDevice2Issue).to.containSubset([
                {
                  NotificationType: {
                    level: 2,
                  },
                  Notification: {
                    personId: device2RegionalOfficer.id,
                  },
                },
              ])
            }))
        })

        describe("then ESCALATE_ISSUES is dispatched with one of the issue's ID", () => {
          it('that one issue should be escalated', () =>
            runTestWithKnex(async knex => {
              const waitForEscalateIssues = waitForAction(
                escalateIssues(device1NoResultsIssueId)
              )
              messageContext.escalateIssues(device1NoResultsIssueId)
              await waitForEscalateIssues
              await waitForIdle()

              const device1NoResultsIssue = await getIssue(
                knex,
                device1NoResultsIssueId
              )
              const device2NoResultsIssue = await getIssue(
                knex,
                device2NoResultsIssueId
              )

              assert.equal(device1NoResultsIssue.level, 2)
              assert.equal(device2NoResultsIssue.level, 1)
            }))
        })
      })

      describe('which have been escalated once, more than 7 days ago', () => {
        const dateIssueRaised = subDays(new Date(), 15)
        const dateIssueEscalated = subDays(new Date(), 8)
        let device1NoResultsIssueId
        let device2NoResultsIssueId

        beforeEach(async () =>
          run(async knex => {
            const regionalOfficerJobFunction = await getJobJunction(
              knex,
              partner.id,
              'Regional Officer'
            )
            const roNoResultsNotificationType = await getNotificationType(
              knex,
              partner.id,
              deviceNoResultsIssueType.id,
              regionalOfficerJobFunction.id,
              2,
              'RO No Testing'
            )
            device1NoResultsIssueId = await createAndTriggerIssue(
              knex,
              partner.id,
              device1,
              deviceNoResultsIssueType.id,
              deviceActionTypes.DEVICE_NO_RESULTS,
              2,
              dateIssueRaised
            )
            await createNotification(
              knex,
              roNoResultsNotificationType.id,
              device1NoResultsIssueId,
              device1RegionalOfficer.id,
              dateIssueEscalated
            )
            device2NoResultsIssueId = await createAndTriggerIssue(
              knex,
              partner.id,
              device2,
              deviceNoResultsIssueType.id,
              deviceActionTypes.DEVICE_NO_RESULTS,
              2,
              dateIssueRaised
            )
            await createNotification(
              knex,
              roNoResultsNotificationType.id,
              device2NoResultsIssueId,
              device2RegionalOfficer.id,
              dateIssueEscalated
            )
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

        describe('then ESCALATE_ISSUES is dispatched with no issue ID', () => {
          it('all the issues should be escalated to the next level', () =>
            runTestWithKnex(async knex => {
              const waitForEscalateIssues = waitForAction(escalateIssues())
              messageContext.escalateIssues()
              await waitForEscalateIssues
              await waitForIdle()

              const device1NoResultsIssue = await getIssue(
                knex,
                device1NoResultsIssueId
              )
              const device2NoResultsIssue = await getIssue(
                knex,
                device2NoResultsIssueId
              )

              assert.equal(device1NoResultsIssue.level, 3)
              assert.equal(device2NoResultsIssue.level, 3)
            }))

          it('a notifications should be created for the level that the issue has been escalated to', () =>
            runTestWithKnex(async knex => {
              let notificationsForDevice1Issue = await getIssueNotifications(
                knex,
                device1NoResultsIssueId
              )
              expect(notificationsForDevice1Issue).to.containSubset([
                {
                  NotificationType: {
                    level: 2,
                  },
                  Notification: {
                    personId: device1RegionalOfficer.id,
                  },
                },
              ])
              let notificationsForDevice2Issue = await getIssueNotifications(
                knex,
                device2NoResultsIssueId
              )
              expect(notificationsForDevice2Issue).to.containSubset([
                {
                  NotificationType: {
                    level: 2,
                  },
                  Notification: {
                    personId: device2RegionalOfficer.id,
                  },
                },
              ])

              const waitForEscalateIssues = waitForAction(escalateIssues())
              messageContext.escalateIssues()
              await waitForEscalateIssues
              await waitForIdle()

              notificationsForDevice1Issue = await getIssueNotifications(
                knex,
                device1NoResultsIssueId
              )
              expect(notificationsForDevice1Issue).to.containSubset([
                {
                  NotificationType: {
                    level: 3,
                  },
                  Notification: {
                    personId: device1RegionalOfficer.id,
                  },
                },
              ])

              notificationsForDevice2Issue = await getIssueNotifications(
                knex,
                device2NoResultsIssueId
              )
              expect(notificationsForDevice2Issue).to.containSubset([
                {
                  NotificationType: {
                    level: 3,
                  },
                  Notification: {
                    personId: device2RegionalOfficer.id,
                  },
                },
              ])
            }))
        })
      })

      describe('which have been open for less than 7 days', () => {
        const dateIssueRaised = subDays(new Date(), 6)
        let deviceNoResultsIssueId

        beforeEach(async () =>
          run(async knex => {
            deviceNoResultsIssueId = await createAndTriggerIssue(
              knex,
              partner.id,
              device1,
              deviceNoResultsIssueType.id,
              deviceActionTypes.DEVICE_NO_RESULTS,
              1,
              dateIssueRaised
            )
          })
        )

        afterEach(async () =>
          run(async knex => {
            await cleanUpIssues(knex, [deviceNoResultsIssueId])
          })
        )

        describe('then ESCALATE_ISSUES is dispatched', () => {
          it('the issues should NOT be escalated', () =>
            runTestWithKnex(async knex => {
              const waitForEscalateIssues = waitForAction(escalateIssues())
              messageContext.escalateIssues()
              await waitForEscalateIssues
              await waitForIdle()

              const deviceNoResultsIssue = await getIssue(
                knex,
                deviceNoResultsIssueId
              )

              assert.equal(deviceNoResultsIssue.level, 1)
            }))
        })
      })
    })

    describe('and ModulePowerError issues exist', () => {
      let modulePowerErrorIssueType
      let device1
      let device1RegionalOfficer
      let device2
      let device2RegionalOfficer

      before(async () =>
        run(async knex => {
          modulePowerErrorIssueType = await getIssueType(
            knex,
            'ModulePowerError'
          )
          const device1Details = await getDevice(knex, {
            partnerId: partner.id,
            countryAbbreviation,
          })
          device1 = device1Details.d
          device1RegionalOfficer = device1Details.regionalOfficer

          const device2Details = await getDevice(knex, {
            partnerId: partner.id,
            countryAbbreviation,
            notIn: [device1.id],
          })
          device2 = device2Details.d
          device2RegionalOfficer = device2Details.regionalOfficer
        })
      )

      describe("which have been open for more than 30 days but haven't been escalated yet", () => {
        const dateIssueRaised = subDays(new Date(), 31)
        let device1ModulePowerErrorIssueId
        let device2ModulePowerErrorIssueId

        beforeEach(async () =>
          run(async knex => {
            device1ModulePowerErrorIssueId = await createAndTriggerIssue(
              knex,
              partner.id,
              device1,
              modulePowerErrorIssueType.id,
              resultActionTypes.RESULT_MODULE_POWER_ERROR,
              1,
              dateIssueRaised
            )
            device2ModulePowerErrorIssueId = await createAndTriggerIssue(
              knex,
              partner.id,
              device2,
              modulePowerErrorIssueType.id,
              resultActionTypes.RESULT_MODULE_POWER_ERROR,
              1,
              dateIssueRaised
            )
          })
        )

        afterEach(async () =>
          run(async knex => {
            await cleanUpIssues(knex, [
              device1ModulePowerErrorIssueId,
              device2ModulePowerErrorIssueId,
            ])
          })
        )

        describe('then ESCALATE_ISSUES is dispatched with no issue ID', () => {
          it('all the issues should be escalated', () =>
            runTestWithKnex(async knex => {
              const waitForEscalateIssues = waitForAction(escalateIssues())
              messageContext.escalateIssues()
              await waitForEscalateIssues
              await waitForIdle()

              const device1ModulePowerErrorIssue = await getIssue(
                knex,
                device1ModulePowerErrorIssueId
              )
              const device2ModulePowerErrorIssue = await getIssue(
                knex,
                device2ModulePowerErrorIssueId
              )

              assert.equal(device1ModulePowerErrorIssue.level, 2)
              assert.equal(device2ModulePowerErrorIssue.level, 2)
            }))

          it('notifications should be created for the level that the issue has been escalated to', () =>
            runTestWithKnex(async knex => {
              let notificationsForDevice1Issue = await getIssueNotifications(
                knex,
                device1ModulePowerErrorIssueId
              )
              assert.isEmpty(notificationsForDevice1Issue)
              let notificationsForDevice2Issue = await getIssueNotifications(
                knex,
                device2ModulePowerErrorIssueId
              )
              assert.isEmpty(notificationsForDevice2Issue)

              const waitForEscalateIssues = waitForAction(escalateIssues())
              messageContext.escalateIssues()
              await waitForEscalateIssues
              await waitForIdle()

              notificationsForDevice1Issue = await getIssueNotifications(
                knex,
                device1ModulePowerErrorIssueId
              )
              expect(notificationsForDevice1Issue).to.containSubset([
                {
                  NotificationType: {
                    level: 2,
                  },
                  Notification: {
                    personId: device1RegionalOfficer.id,
                  },
                },
              ])

              notificationsForDevice2Issue = await getIssueNotifications(
                knex,
                device2ModulePowerErrorIssueId
              )
              expect(notificationsForDevice2Issue).to.containSubset([
                {
                  NotificationType: {
                    level: 2,
                  },
                  Notification: {
                    personId: device2RegionalOfficer.id,
                  },
                },
              ])
            }))
        })

        describe("then ESCALATE_ISSUES is dispatched with one of the issue's ID", () => {
          it('that one issue should be escalated', () =>
            runTestWithKnex(async knex => {
              const waitForEscalateIssues = waitForAction(
                escalateIssues(device1ModulePowerErrorIssueId)
              )
              messageContext.escalateIssues(device1ModulePowerErrorIssueId)
              await waitForEscalateIssues
              await waitForIdle()

              const device1ModulePowerErrorIssue = await getIssue(
                knex,
                device1ModulePowerErrorIssueId
              )
              const device2ModulePowerErrorIssue = await getIssue(
                knex,
                device2ModulePowerErrorIssueId
              )

              assert.equal(device1ModulePowerErrorIssue.level, 2)
              assert.equal(device2ModulePowerErrorIssue.level, 1)
            }))
        })
      })

      describe('which have been open for less than 7 days', () => {
        const dateIssueRaised = subDays(new Date(), 6)
        let modulePowerErrorIssueId

        beforeEach(async () =>
          run(async knex => {
            modulePowerErrorIssueId = await createAndTriggerIssue(
              knex,
              partner.id,
              device1,
              modulePowerErrorIssueType.id,
              resultActionTypes.RESULT_MODULE_POWER_ERROR,
              1,
              dateIssueRaised
            )
          })
        )

        afterEach(async () =>
          run(async knex => {
            await cleanUpIssues(knex, [modulePowerErrorIssueId])
          })
        )

        describe('then ESCALATE_ISSUES is dispatched', () => {
          it('the issues should NOT be escalated', () =>
            runTestWithKnex(async knex => {
              const waitForEscalateIssues = waitForAction(escalateIssues())
              messageContext.escalateIssues()
              await waitForEscalateIssues
              await waitForIdle()

              const modulePowerErrorIssue = await getIssue(
                knex,
                modulePowerErrorIssueId
              )

              assert.equal(modulePowerErrorIssue.level, 1)
            }))
        })
      })
    })
  })
})
