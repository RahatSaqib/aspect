const chai = require('chai')
const _ = require('lodash')
const { subDays } = require('date-fns')
const Promise = require('bluebird')
const { run } = require('../../src/db')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')
const {
  createMessageContext,
  waitForIdle,
  waitForAction,
} = require('../utils/mqUtils')
const { escalateIssues } = require('../../src/issue/actions')

const { assert } = chai

describe('Issue Escalation', () => {
  async function getPartner(knex, partnerName) {
    return knex('Partner')
      .where('name', partnerName)
      .first()
  }

  async function getDevice(knex, { countryAbbreviation, partnerId, notIn }) {
    return knex('Device as d')
      .join('Geography as g', 'd.geographyId', 'g.id')
      .join('Country as c', 'g.countryId', 'c.id')
      .where('c.abbreviation', countryAbbreviation)
      .andWhere(function() {
        this.where('d.partnerId', partnerId)
        if (!_.isEmpty(notIn)) {
          this.andWhere(function() {
            this.whereNotIn('d.id', notIn)
          })
        }
      })
      .first('d.*')
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
      let device2

      before(async () =>
        run(async knex => {
          device1 = await getDevice(knex, {
            partnerId: partner.id,
            countryAbbreviation,
          })
          device2 = await getDevice(knex, {
            partnerId: partner.id,
            countryAbbreviation,
            notIn: [device1.id],
          })
        })
      )

      async function createDeviceOfflineIssue(knex, device, dateIssueRaised) {
        const deviceOfflineIssueId = await knex('Issue').insert({
          issueTypeId: deviceOfflineIssueType.id,
          issueStatusId: activeIssueStatus.id,
          partnerId: partner.id,
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
