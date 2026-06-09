const chai = require('chai')
const Promise = require('bluebird')
const _ = require('lodash')
const shared = require('../utils/sharedToken')
const { knex } = require('../../src/db')
const config = require('../../src/config')
const server = require('../utils/testUtils')
const { dispatchAndWaitForAction, waitForIdle, createMessageContext } = require('../utils/mqUtils')
const { issueCreated } = require('../../src/issue/actions')
const { notificationTypeCategoryToId, issueStatusToId } = require('../../src/shared/dictionary')

const { assert } = chai

const { filterConditionWithJfForDevice, filterConditionWithJfForDeviceNotWayneCounty } = require('./filterConditions')

describe('Issue based Notifications triggers', () => {
  let insertedNotificationTypeId = null
  let messageContext = null
  let insertedIssueId = null
  let issueTypeId = null
  const createTestContext = async filterCondition => {
    const messageTypes = await knex('MessageType')
      .whereNotNull('smsTemplateId')
      .whereNotNull('emailTemplateId')
      .select()

    const notificationTypeCategoryId = await notificationTypeCategoryToId('issueBased')

    const createdOn = new Date()
    const updatedOn = new Date()
    const issueStatusId = await issueStatusToId('Active')

    ;({ issueTypeId } = await knex('IssueType').where('externalId', '=', 'DeviceOffline').first('id as issueTypeId'))
    ;[insertedNotificationTypeId] = await knex('NotificationType').insert({
      partnerId: 1,
      name: 'some random issue notification',
      createdOn: new Date(),
      updatedOn: new Date(),
      notificationTypeCategoryId,
      filterCondition: filterCondition ? JSON.stringify(filterCondition) : null,
      messageTypeId: _.sample(messageTypes).id,
      issueTypeId,
    })

    messageContext = await createMessageContext()
    // the cache should be reseted just for the test and because we are manually inserting data directly into the db.
    await server.post('/api/notification/clearcache').set('Authorization', `Bearer${shared.token}`)
    // Device names are now generated (${acronym}${id}); look up by Wayne LGA name instead.
    const { partnerId, deviceId, siteId, geographyId } = await knex('Device as d')
      .join('Site as s', 'd.siteId', 's.id')
      .join('Geography as g', 's.geographyId', 'g.id')
      .join('Lga as l', 'g.lgaId', 'l.id')
      .where('l.name', 'Wayne')
      .whereNotNull('d.siteId')
      .first('d.partnerId', 'd.id as deviceId', 'd.siteId as siteId', 's.geographyId')
    ;[insertedIssueId] = await knex('Issue').insert({
      partnerId,
      deviceId,
      siteId,
      geographyId,
      issueStatusId,
      issueTypeId,
      createdOn,
      updatedOn,
    })
  }
  const removeTestContext = async () => {
    await Promise.each(['EmailMessage', 'SmsMessage', 'AlertMessage'], table =>
      knex(table)
        .whereIn(
          'id',
          knex.raw(
            '(?)',
            knex('Notification').where({ notificationTypeId: insertedNotificationTypeId }).pluck(`${table}Id`)
          )
        )
        .delete()
    )
    await knex('Notification')
      .whereIn('issueId', [insertedIssueId])
      .orWhere({ notificationTypeId: insertedNotificationTypeId })
      .delete()
    await knex('Issue').where({ id: insertedIssueId }).delete()
    await knex('NotificationType').where({ id: insertedNotificationTypeId }).delete()
    // await server.post('/api/notification/clearcache').set('Authorization', `Bearer${shared.token}`)
  }
  describe('Empty Filter conditions', async () => {
    before(async () => createTestContext({}))
    after(async () => removeTestContext())

    it("should NOT create a issue based notification without special filter conditions, because there isn't anyone to be notified", async () => {
      let notifications = await knex('Notification').where({ issueId: insertedIssueId }).select()
      assert.equal(notifications.length, 0)
      const { id: issueTypeId } = await knex('IssueType').where('externalId', '=', 'DeviceOffline').first()
      await messageContext.dispatch(issueCreated(insertedIssueId, issueTypeId))
      await waitForIdle(1000)
      notifications = await knex('Notification').where({ issueId: insertedIssueId }).select()

      assert.equal(notifications.length, 0)
    })
  })
  describe('Filter with JF for Wayne County', () => {
    before(async () => createTestContext(filterConditionWithJfForDevice))
    after(removeTestContext)

    it('should create a notification for particular lga, wayne oh', async () => {
      messageContext.dispatch(issueCreated(insertedIssueId, issueTypeId))
      await waitForIdle(2000)
      const notifications = await knex('Notification').whereIn('issueId', [insertedIssueId]).distinct()
      assert.isAtLeast(notifications.length, 1)
    })
  })

  describe('Filter with JF for not Wayne County', () => {
    before(async () => createTestContext(filterConditionWithJfForDeviceNotWayneCounty))
    after(removeTestContext)

    it('should NOT create a notification for particular lga, wayne oh', async () => {
      messageContext.dispatch(issueCreated(insertedIssueId, issueTypeId))
      await waitForIdle(2000)
      const notifications = await knex('Notification').whereIn('issueId', [insertedIssueId]).distinct()
      assert.isAtLeast(notifications.length, 0)
    })
  })
  describe('Filter by Person', () => {
    let adminId
    let regionalAdminId

    beforeEach(async () => {
      ;[adminId] = await knex('Person').where({ email: config.admin.email }).pluck('id')

      const [regionalAdminJobFunctionId] = await knex('JobFunction').where({ externalId: 'regionalAdmin' }).pluck('id')
      ;[regionalAdminId] = await knex('Person').where({ email: config.manager.email }).pluck('id')

      const [superAdminJobFunctionId] = await knex('JobFunction').where({ externalId: 'superAdmin' }).pluck('id')

      // Notify to the person called "Admin" - Send notification
      // Notify to a person assigned to the job function "Manager" - Send notification
      // Notify to a person assigned to the job function "Admin" - DO NOT send notification (the admin user was included as person)
      // ==> ONLY TWO NOTIFICATIONS WILL BE SENT
      const filterConditions = {
        ..._.omit(filterConditionWithJfForDevice, 'jobFunctions'),
        persons: [{ personId: adminId }],
        jobFunctions: [{ jobFunctionId: regionalAdminJobFunctionId }, { jobFunctionId: superAdminJobFunctionId }],
      }
      await createTestContext(filterConditions)
    })

    afterEach(removeTestContext)

    it('should create a notification for particular person and job function', async () => {
      await dispatchAndWaitForAction(issueCreated(insertedIssueId, issueTypeId))
      await waitForIdle(1000)
      const notifications = await knex('Notification')
        .where({ issueId: insertedIssueId, notificationTypeId: insertedNotificationTypeId })
        .distinct('issueId', 'notificationTypeId', 'personId')
      const notificationToPerson = notifications.filter(n => n.personId === adminId)
      const notificationToJobFunction = notifications.filter(n => n.personId === regionalAdminId)
      assert.isNotEmpty(notificationToPerson)
      assert.isNotEmpty(notificationToJobFunction)
      assert.equal(notifications.length, 2)
    })
  })
})
