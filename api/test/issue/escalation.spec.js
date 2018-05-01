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

const { assert, expect } = chai

describe('Issue Escalation', () => {
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

  describe('For Myanmar', () => {
    const partnerName = 'Myanmar'
    const countryAbbreviation = 'MM'

    let partner
    let deviceOfflineIssueType
    let activeIssueStatus
    let triggeredIssueEventStatus
    let messageContext

    before(async () =>
      run(async knex => {
        partner = await getPartner(knex, partnerName)
        deviceOfflineIssueType = await getIssueType(knex, 'DeviceOffline')
        activeIssueStatus = await getIssueStatus(knex, 'Active')
        triggeredIssueEventStatus = await getIssueEventStatus(knex, 'Triggered')
        messageContext = await createMessageContext()
        messageContext.bindActionCreators({ escalateIssues })
      })
    )

    describe('and DeviceOffline issues exist', () => {
      let device1
      let device1LabUser
      let device1RegionalOfficer
      let device2
      let device2LabUser
      let device2RegionalOfficer

      before(async () =>
        run(async knex => {
          const device1Details = await getDevice(knex, {
            partnerId: partner.id,
            countryAbbreviation,
          })
          device1 = device1Details.d
          device1LabUser = device1Details.labUser
          device1RegionalOfficer = device1Details.regionalOfficer

          const device2Details = await getDevice(knex, {
            partnerId: partner.id,
            countryAbbreviation,
            notIn: [device1.id],
          })
          device2 = device2Details.d
          device2LabUser = device2Details.labUser
          device2RegionalOfficer = device2Details.regionalOfficer
        })
      )

      async function createDeviceOfflineIssue(knex, device, dateIssueRaised) {
        const deviceOfflineIssueId = await knex('Issue').insert({
          issueTypeId: deviceOfflineIssueType.id,
          issueStatusId: activeIssueStatus.id,
          partnerId: partner.id,
          geographyId: device.geographyId,
          deviceId: device.id,
          level: 1,
          createdOn: dateIssueRaised,
          updatedOn: dateIssueRaised,
        })
        await knex('IssueEvent').insert({
          issueEventStatusId: triggeredIssueEventStatus.id,
          issueId: deviceOfflineIssueId,
          data: JSON.stringify({
            type: 'DEVICE_OFFLINE',
            deviceId: device1.id,
          }),
          createdOn: dateIssueRaised,
        })
        return deviceOfflineIssueId
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

      describe("which have been open for more than 30 days but haven't been escalated yet", () => {
        const dateIssueRaised = subDays(new Date(), 31)
        let device1OfflineIssueId
        let device2OfflineIssueId

        beforeEach(async () =>
          run(async knex => {
            device1OfflineIssueId = await createDeviceOfflineIssue(
              knex,
              device1,
              dateIssueRaised
            )
            device2OfflineIssueId = await createDeviceOfflineIssue(
              knex,
              device2,
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

          it('a notifications should be created for the level that the issue has been escalated to', () =>
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

      describe('which have been open for less than 30 days', () => {
        const dateIssueRaised = subDays(new Date(), 29)
        let deviceOfflineIssueId

        beforeEach(async () =>
          run(async knex => {
            deviceOfflineIssueId = await createDeviceOfflineIssue(
              knex,
              device1,
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
  })
})
