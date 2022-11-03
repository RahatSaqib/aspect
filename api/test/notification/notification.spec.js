const chai = require('chai')
const { subDays } = require('date-fns')
const Promise = require('bluebird')
const _ = require('lodash')
const shared = require('../utils/sharedToken')
const { knex } = require('../../src/db')
const config = require('../../src/config')
const server = require('../utils/testUtils')
const { dispatchAndWaitForAction, waitForIdle, createMessageContext } = require('../utils/mqUtils')
const { resultLogged } = require('../../src/result/actions')
const { issueCreated } = require('../../src/issue/actions')
const {
  notificationTypeCategoryToId,
  resultCategoryToId,
  deviceApprovalToId,
  issueStatusToId,
} = require('../../src/shared/dictionary')

const { assert } = chai

const {
  filterConditionWithAssay,
  filterConditionWithJf,
  baseFilterCondition,
  filterConditionWithJfForDevice,
  filterConditionWithJfForDeviceNotWayneCounty,
} = require('./filterConditions')

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
    const device = await knex('Device').where('name', 'Daktari Wayne, OH').first()
    ;[insertedIssueId] = await knex('Issue').insert({
      partnerId: device.partnerId,
      deviceId: device.id,
      siteId: device.siteId,
      geographyId: device.geographyId,
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
    let managerId

    beforeEach(async () => {
      ;[adminId] = await knex('Person').where({ email: config.admin.email }).pluck('id')

      const [managerJobFunctionId] = await knex('JobFunction').where({ externalId: 'manager' }).pluck('id')
      ;[managerId] = await knex('Person').where({ email: config.manager.email }).pluck('id')

      const [adminJobFunctionId] = await knex('JobFunction').where({ externalId: 'admin' }).pluck('id')

      // Notify to the person called "Admin" - Send notification
      // Notify to a person assigned to the job function "Manager" - Send notification
      // Notify to a person assigned to the job function "Admin" - DO NOT send notification (the admin user was included as person)
      // ==> ONLY TWO NOTIFICATIONS WILL BE SENT
      const filterConditions = {
        ..._.omit(filterConditionWithJfForDevice, 'jobFunctions'),
        persons: [{ personId: `${adminId}` }],
        jobFunctions: [{ jobFunctionId: `${managerJobFunctionId}` }, { jobFunctionId: `${adminJobFunctionId}` }],
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
      const notificationToJobFunction = notifications.filter(n => n.personId === managerId)
      assert.isNotEmpty(notificationToPerson)
      assert.isNotEmpty(notificationToJobFunction)
      assert.equal(notifications.length, 2)
    })
  })
})

describe('Result Notifications triggers', () => {
  let results = []
  let ntId
  let messageContext
  const name = 'Result based notification'
  let resultCategory1

  const createTestContext = async filterCondition => {
    const messageTypes = await knex('MessageType')
      .whereNotNull('smsTemplateId')
      .whereNotNull('emailTemplateId')
      .select()

    const notificationTypeCategoryId = await notificationTypeCategoryToId('resultBased')

    ;[ntId] = await knex('NotificationType').insert({
      partnerId: 1,
      name,
      createdOn: new Date(),
      updatedOn: new Date(),
      notificationTypeCategoryId,
      filterCondition: filterCondition ? JSON.stringify(filterCondition) : null,
      messageTypeId: _.sample(messageTypes).id,
    })
    const { notificationsPerType } = await knex('NotificationType')
      .where({ partnerId: 1, notificationTypeCategoryId })
      .count('* as notificationsPerType')
      .first()
    assert.equal(notificationsPerType, 1)
    messageContext = await createMessageContext()
    // the cache should be reseted just for the test and because we are manually inserting data directly into the db.
    await server.post('/api/notification/clearcache').set('Authorization', `Bearer${shared.token}`)
  }
  const removeTestContext = async () => {
    await Promise.each(['EmailMessage', 'SmsMessage', 'AlertMessage', 'Notification'], table =>
      knex(table)
        .whereIn(
          'resultId',
          _.map(results, r => r.id)
        )
        .delete()
    )
    await knex('Notification')
      .whereIn(
        'resultId',
        _.map(results, r => r.id)
      )
      .orWhere({ notificationTypeId: ntId })
      .delete()
    await knex('NotificationType').where({ id: ntId }).delete()
    results = []
  }
  let insertedResultDetected = null
  let insertedResultUnknow = null
  let notWayneResult = null
  before(async () => {
    resultCategory1 = await resultCategoryToId('Detected')
    results = await knex('Result as r')
      .join('Geography as g', 'r.geographyId', 'g.id')
      .join('Device as d', 'd.id', 'r.deviceId')
      .join('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
      .join('Lga as l', 'g.lgaId', 'l.id')
      .where({ 'r.partnerId': 1, 'dt.externalId': 'DaktariVirology' })
      .whereNotExists(knex('Notification as n').whereRaw('n.resultId = r.id').select())
      .distinct('r.*', 'l.name as lgaName')
    assert.isAtLeast(results.length, 1)
    const result = _.sample(_.filter(results, elem => elem.lgaName === 'Wayne'))
    ;[insertedResultDetected] = await knex('Result').insert({
      ..._.omit(result, ['id', 'resultCategory1', 'lgaName', 'externalId', 'endedOn']),
      resultCategory1,
      externalId: 'MytestsResultID',
      endedOn: new Date(),
    })
    ;[insertedResultUnknow] = await knex('Result').insert({
      ..._.omit(result, ['id', 'resultCategory1', 'lgaName', 'externalId', 'endedOn']),
      resultCategory1: await resultCategoryToId('Unknown'),
      externalId: 'MytestsResultID2',
      endedOn: new Date(),
    })
    notWayneResult = await knex('Result').insert({
      ..._.omit(_.sample(_.filter(results, elem => elem.lgaName !== 'Wayne')), [
        'id',
        'resultCategory1',
        'lgaName',
        'externalId',
        'endedOn',
      ]),
      resultCategory1: await resultCategoryToId('Detected'),
      externalId: 'MytestsResultID3',
      endedOn: new Date(),
    })
    assert.isNotNull(insertedResultDetected)
    assert.isNotNull(insertedResultUnknow)
  })
  after(async () => {
    const resultsId = await knex('Result')
      .whereIn('externalId', ['MytestsResultID', 'MytestsResultID2', 'MytestsResultID3', 'MyPatienttestsResultID'])
      .pluck('id')
    await Promise.each(['EmailMessage', 'SmsMessage', 'AlertMessage', 'Notification'], table =>
      knex(table)
        .whereIn('resultId', [insertedResultDetected, insertedResultUnknow, notWayneResult, ...resultsId])
        .delete()
    )
    await knex('Result')
      .whereIn('id', [insertedResultDetected, insertedResultUnknow, notWayneResult, ...resultsId])

      .delete()
  })
  describe('Filter without JF', () => {
    before(async () => createTestContext(filterConditionWithAssay))
    after(removeTestContext)
    describe('Filter for wayne country and Detected result', () => {
      it('should NOT create a result based notification for particular lga BUT with unapproved Device', async () => {
        let notifications = await knex('Notification').whereIn('resultId', [insertedResultDetected]).distinct()
        const qtyOfNotifications = notifications.length
        assert.equal(notifications.length, 0)
        const device = await knex('Device as d')
          .join('Result as r', 'r.deviceId', 'd.id')
          .where('r.id', insertedResultDetected)
          .first('d.*')
        await knex('Device')
          .update({
            deviceApprovalId: await deviceApprovalToId('decommissioned'),
          })
          .where({ id: device.id })

        messageContext.dispatch(resultLogged(insertedResultDetected, 1, 1))
        await waitForIdle(1000)
        notifications = await knex('Notification').whereIn('resultId', [insertedResultDetected]).distinct()
        assert.equal(qtyOfNotifications, notifications.length)
        await knex('Device')
          .update({
            deviceApprovalId: await deviceApprovalToId('approved'),
          })
          .where({
            id: device.id,
          })
      })
      it('should NOT create a result based notification for particular lga', async () => {
        messageContext.dispatch(resultLogged(insertedResultDetected, 1, 1))
        await waitForIdle(2000)
        const notifications = await knex('Notification').whereIn('resultId', [insertedResultDetected]).distinct()
        assert.isAtLeast(notifications.length, 0)
      })
    })
    it('should NOT create a result based notification for result category distinct to detected', async () => {
      const resultId = insertedResultUnknow
      assert.isNotNull(resultId)
      messageContext.dispatch(resultLogged(resultId, 1, 1))
      await dispatchAndWaitForAction(resultLogged(resultId, 1, 1))
      await waitForIdle(1000)
      const notifications = await knex('Notification').where({ resultId }).select()
      assert.isEmpty(notifications)
    })
    it('should NOT create a result based notification for a different LGA than wayne', async () => {
      const resultId = notWayneResult
      assert.isNotNull(resultId)
      await dispatchAndWaitForAction(resultLogged(resultId, 1, 1))
      await waitForIdle(1000)
      const notifications = await knex('Notification').where({ resultId }).select()
      assert.isEmpty(notifications)
    })
    it('should NOT create a result based notification because the endedon is older than 30 days', async () => {
      const sampleResult = _.sample(
        _.filter(results, elem => elem.lgaName === 'Wayne' && elem.resultCategory1 === resultCategory1)
      )
      assert.isNotNaN(sampleResult)
      assert.isTrue(sampleResult.endedOn < subDays(new Date(), 30))
      await dispatchAndWaitForAction(resultLogged(sampleResult.id, 1, 1))
      await waitForIdle(1000)
      const notifications = await knex('Notification').where({ resultId: sampleResult.id }).select()
      assert.isEmpty(notifications)
    })
  })

  describe('Filter by JF', () => {
    let inserted = null
    before(async () => createTestContext(filterConditionWithJf))
    after(async () => {
      await removeTestContext()
      await knex('PersonTag').where('TagId', '>=', inserted).delete()
      await knex('Tag').whereIn('title', ['oneTag', 'secondTag', 'thirdTag']).delete()
    })

    afterEach(async () =>
      knex('Notification').whereIn('resultId', [insertedResultDetected, insertedResultUnknow, notWayneResult]).delete()
    )
    it('should create a result based notification for particular jobFunctions', async () => {
      const resultId = insertedResultDetected
      assert.isNotNull(resultId)

      const notificationsBefore = await knex('Notification')
        .where({ resultId, notificationTypeId: ntId })
        .distinct('resultId', 'notificationTypeId', 'personId')
      assert.equal(notificationsBefore.length, 0)
      await dispatchAndWaitForAction(resultLogged(resultId, 1, 1))
      await waitForIdle(3000)
      const notifications = await knex('Notification')
        .where({ resultId, notificationTypeId: ntId })
        .distinct('resultId', 'notificationTypeId', 'personId')
      assert.equal(notifications.length, 1, 'Only one notification should exists')
    })

    it('Should create or not a result based notification filtering by JobFunction and tags', async () => {
      ;[inserted] = await knex('Tag').insert([
        { partnerId: 1, title: 'oneTag' },
        { partnerId: 1, title: 'secondTag' },
        { partnerId: 1, title: 'thirdTag' },
      ])
      const notificationTypeCategoryId = await notificationTypeCategoryToId('resultBased')
      const resultId = insertedResultDetected
      messageContext.dispatch(resultLogged(resultId, 1, 1))
      let notifications = await knex('Notification').where({ resultId }).distinct()
      assert.equal(notifications.length, 0)
      await knex('NotificationType')
        .update({
          filterCondition: JSON.stringify({
            ...filterConditionWithJf,
            jobFunctions: [
              {
                tags: [{ label: 'oneTag', value: inserted }],
                jobFunctionId: '1',
              },
              {
                tags: [{ label: 'secondTag', value: inserted + 1 }],
                jobFunctionId: '2',
              },
            ],
          }),
        })
        .where({ notificationTypeCategoryId })

      const personTags = await knex('Person as p')
        .join('Job as j', 'j.personId', 'p.id')
        .whereIn('j.jobFunctionId', [1])
        .pluck('p.id')
      const person = _.sample(personTags)
      await knex('PersonTag').insert({ personId: person, tagId: inserted })
      messageContext.dispatch(resultLogged(resultId, 1, 1))
      await waitForIdle(3000)
      notifications = await knex('Notification as n')
        .where({
          resultId,
          notificationTypeId: ntId,
        })
        .distinct('resultId', 'notificationTypeId', 'personId')
      assert.equal(notifications.length, 1)
    })
  })

  describe('SMS notification timezone test', () => {
    const inserted = null
    let smsTemplateId = null
    let messageTypeId = null
    let backupResult = null
    let backupSample = null
    before(async () => {
      await createTestContext({
        ...filterConditionWithJf,
        sendSms: true,
      })
      ;[smsTemplateId] = await knex('SmsTemplate').insert({
        message:
          'A new Rif case detected on {{site.name}} GeneXpert site started on {{result.startedOn}} and tested on {{result.endedOn}}. Sample collected on {{result.sample.collectedOn}}.',
        createdBy: 1,
        updatedBy: 1,
        phoneNumber: '{{ person.cell }}',
      })
      ;[messageTypeId] = await knex('MessageType').insert({
        messageSeverityId: 2,
        alertTemplateId: null,
        smsTemplateId,
        webhookTemplateId: null,
        pushNotificationTemplateId: null,
      })
      backupResult = await knex('Result').where('id', insertedResultDetected).first()
      backupSample = await knex('Sample').where('id', backupResult.sampleId).first()
      await knex('Result').where('id', insertedResultDetected).update({
        startedOn: '2021-09-10 12:21:25.000',
        endedOn: '2099-09-14 20:58:17.000',
      })
      await knex('Sample').where('id', backupResult.sampleId).update({
        collectedOn: '2021-08-25 14:24:01.000',
      })
      await knex('NotificationType').where('id', ntId).update({ messageTypeId })
    })
    after(async () => {
      await removeTestContext()
      await knex('PersonTag').where('TagId', '>=', inserted).delete()
      await knex('Tag').whereIn('title', ['oneTag', 'secondTag', 'thirdTag']).delete()
      await knex('MessageType').where('id', messageTypeId).delete()
      await knex('SmsMessage').where('smsTemplateId', smsTemplateId).delete()
      await knex('SmsTemplate').where('id', smsTemplateId).delete()
      await knex('Result').where('id', insertedResultDetected).update(backupResult)
      await knex('Sample').where('id', backupResult.sampleId).update(backupSample)
    })

    afterEach(async () =>
      knex('Notification').whereIn('resultId', [insertedResultDetected, insertedResultUnknow, notWayneResult]).delete()
    )
    it('should create a result based notification for particular jobFunctions', async () => {
      const resultId = insertedResultDetected
      assert.isNotNull(resultId)
      const notificationsBefore = await knex('Notification')
        .where({ resultId, notificationTypeId: ntId })
        .distinct('resultId', 'notificationTypeId', 'personId')
      assert.equal(notificationsBefore.length, 0)
      await dispatchAndWaitForAction(resultLogged(resultId, 1, 1))
      await waitForIdle(3000)
      const notifications = await knex('Notification').where({ resultId, notificationTypeId: ntId }).select()
      const smsMessages = await knex('SmsMessage').where({ smsTemplateId }).select()
      assert.equal(notifications.length, 1, 'Only one notification should exists')
      assert.equal(smsMessages.length, 1, 'Only one sms message should exists')
      assert.equal(
        smsMessages[0].message,
        'A new Rif case detected on Wayne County Ohio GeneXpert site started on Fri Sep 10 2021 08:21:25 GMT-4 and tested on Mon Sep 14 2099 16:58:17 GMT-4. Sample collected on Wed Aug 25 2021 10:24:01 GMT-4.',
        'All the dates should be localized GMT-4 (New York)'
      )
    })
  })

  describe('Filter by Person', () => {
    let adminId
    let managerId
    let jobToRemoveId

    beforeEach(async () => {
      ;[adminId] = await knex('Person').where({ email: config.admin.email }).pluck('id')
      const adminJob = await knex('Job').where({ personId: adminId }).first()
      const adminJobContext = await knex('JobContext').where({ jobId: adminJob.id }).first()

      const [managerJobFunctionId] = await knex('JobFunction').where({ externalId: 'manager' }).pluck('id')
      ;[managerId] = await knex('Person')
        .where({ email: config.manager.email || null })
        .pluck('id')

      const [adminJobFunctionId] = await knex('JobFunction').where({ externalId: 'admin' }).pluck('id')

      // Add an extra job to the Admin user - the system should send notifications by person, and not by job
      ;[jobToRemoveId] = await knex('Job').insert({ ..._.omit(adminJob, 'id'), jobFunctionId: managerJobFunctionId })
      await knex('JobContext').insert({ ..._.omit(adminJobContext, 'id'), jobId: jobToRemoveId })

      // Notify to the person called "Admin" with job Admin - Send notification
      // Notify to the person called "Admin" with job Manager - DO NOT send notification
      // Notify to a person assigned to the job function "Manager" - Send notification
      // Notify to a person assigned to the job function "Admin" - DO NOT send notification (the admin user was included as person)
      // ==> ONLY TWO NOTIFICATIONS WILL BE SENT
      const filterConditions = {
        ...filterConditionWithAssay,
        persons: [{ personId: `${adminId}` }],
        jobFunctions: [{ jobFunctionId: `${managerJobFunctionId}` }, { jobFunctionId: `${adminJobFunctionId}` }],
      }
      await createTestContext(filterConditions)
    })

    afterEach(async () => {
      // Remove the extra job added to the Admin user
      await knex('JobContext').where({ jobId: jobToRemoveId }).delete()
      await knex('Job').where({ id: jobToRemoveId }).delete()
      await removeTestContext()
    })

    it('should create a result based notification for particular person and job function', async () => {
      const resultId = insertedResultDetected
      await dispatchAndWaitForAction(resultLogged(resultId, 1, 1))
      await waitForIdle(3000)
      const notifications = await knex('Notification').where({ resultId, notificationTypeId: ntId })
      const notificationToPerson = notifications.filter(n => n.personId === adminId)
      const notificationToJobFunction = notifications.filter(n => n.personId === managerId)
      assert.equal(notificationToPerson.length, 1)
      assert.equal(notificationToJobFunction.length, 1)
      assert.equal(notifications.length, 2)
    })
  })

  describe('No filtering', () => {
    before(async () =>
      createTestContext({
        jobFunctions: [
          {
            tags: [],
            jobFunctionId: '1',
          },
        ],
      })
    )
    after(async () => removeTestContext())
    afterEach(async () =>
      Promise.each(['EmailMessage', 'SmsMessage', 'AlertMessage', 'WebhookMessage', 'Notification'], table =>
        knex(table).whereIn('resultId', [insertedResultDetected, insertedResultUnknow, notWayneResult]).delete()
      )
    )
    it('Should create a result based notification', async () => {
      const resultId = insertedResultDetected
      assert.isNotNull(resultId)
      await dispatchAndWaitForAction(resultLogged(resultId, 1, 1))
      await waitForIdle(2000)
      const notifications = await knex('Notification')
        .where({ resultId, notificationTypeId: ntId })
        .distinct('resultId', 'notificationTypeId', 'personId')
      assert.equal(notifications.length, 1)
    })

    it('Should not create a disabled result based notification', async () => {
      await knex('NotificationType').where({ id: ntId }).update({ enabled: false })
      const resultId = insertedResultDetected
      assert.isNotNull(resultId)
      await dispatchAndWaitForAction(resultLogged(resultId, 1, 1))
      await waitForIdle(1000)
      const notifications = await knex('Notification')
        .where({ resultId, notificationTypeId: ntId })
        .distinct('resultId', 'notificationTypeId', 'personId')
      assert.equal(notifications.length, 0)
    })
  })
  describe('Send to Patient email and sms', () => {
    beforeEach(async () => {
      resultCategory1 = await resultCategoryToId('Detected')
      results = await knex('Result as r')
        .join('Geography as g', 'r.geographyId', 'g.id')
        .join('Lga as l', 'g.lgaId', 'l.id')
        .where({ partnerId: 1 })
        .whereNotExists(knex('Notification as n').whereRaw('n.resultId = r.id').select())
        .distinct('r.*', 'l.name as lgaName')
      assert.isAtLeast(results.length, 1)
      const result = _.sample(_.filter(results, elem => elem.lgaName === 'Wayne'))
      const patientData = JSON.parse(result.patientData)
      patientData.phone = config.admin.cell
      patientData.email = config.admin.email
      await knex('Result').insert({
        ..._.omit(result, ['id', 'resultCategory1', 'lgaName', 'externalId', 'endedOn', 'patientData']),
        resultCategory1,
        patientData: JSON.stringify(patientData),
        externalId: 'MyPatienttestsResultID',
        endedOn: new Date(),
      })
      const filterConditions = {
        ...filterConditionWithAssay,
        sendToPatient: true,
        sendEmail: true,
        sendSms: true,
      }

      await createTestContext(filterConditions)
    })

    afterEach(removeTestContext)

    it('sms and email to a non-person contact', async () => {
      const { id: resultId } = await knex('Result').where('externalId', 'MyPatienttestsResultID').first()
      const notificationsBefore = await knex('Notification')
        .where({ resultId, notificationTypeId: ntId })
        .distinct('resultId', 'notificationTypeId', 'personId', 'emailMessageId', 'smsMessageId')
      assert.equal(notificationsBefore.length, 0)
      await dispatchAndWaitForAction(resultLogged(resultId, 1, 1))
      await waitForIdle(5000)
      const notifications = await knex('Notification').where({ resultId, notificationTypeId: ntId }).select()
      assert.equal(notifications.length, 1)
      const [notification] = notifications
      assert.isNotNull(notification.emailMessageId)
      assert.isNotNull(notification.smsMessageId)
    })
  })
})

describe('Notification routes', () => {
  const path = '/api/notification'
  let ntId
  let notificationType
  let personId
  let basePayload
  before(() => {
    shared.checkToken(server, path)
  })
  beforeEach(async () => {
    const messageType = await knex('MessageType').select().first()
    ;[personId] = await knex('Person').where({ name: 'Admin' }).pluck('id')
    ;[ntId] = await knex('NotificationType').insert({
      partnerId: 1,
      name: 'A notification',
      createdOn: new Date(),
      updatedOn: new Date(),
      notificationTypeCategoryId: await notificationTypeCategoryToId('resultBased'),
      filterCondition: JSON.stringify({
        persons: [{ personId: `${personId}`, checked: true }],
        jobFunctions: [
          {
            jobFunctionId: '1',
            checked: true,
            tags: [],
          },
        ],
      }),
      messageTypeId: messageType.id,
    })
    basePayload = {
      notificationType: 'resultBased',
      name: '_____',
      emailSubject: '',
      emailBody: '',
      sendEmail: false,
      smsBody: 'A body',
      sendSms: baseFilterCondition.sendSms,
      webUrl: '',
      webBody: '',
      sendWeb: false,
      jobFunctions: [
        {
          jobFunctionId: '1',
          checked: true,
          tags: [],
        },
      ],
      persons: [
        {
          personId: `${personId}`,
          checked: true,
        },
      ],
      deviceLevelId: baseFilterCondition.deviceLevelId,
      areaItems: baseFilterCondition.areaItems,
      result: baseFilterCondition.result,
    }
  })

  afterEach(async () => knex('NotificationType').where('id', ntId).del())

  it('GET - With filterConditions', async () => {
    const res = await server.get(path).set('Authorization', `Bearer ${shared.token}`)

    assert.equal(res.status, 200)
    assert.typeOf(res.body, 'Object')
    assert.property(res.body, 'data')
    assert.typeOf(res.body.data, 'array')
    assert.isAtLeast(res.body.data.length, 1)
    res.body.data.forEach(notification => {
      assert.property(notification, 'name')
      assert.property(notification, 'lastTriggeredOn')
      assert.property(notification, 'totalTriggers')
      assert.property(notification, 'alertCount')
      assert.property(notification, 'personsCount')
      assert.property(notification, 'persons')
      assert.property(notification, 'jobFunctionsCount')
      assert.property(notification, 'jobFunctions')
    })
    const [{ persons, personsCount }] = res.body.data.filter(n => n.id === ntId)
    assert.equal(persons, 'Admin')
    assert.equal(personsCount, 1)
  })

  it('GET - With jobFunctionId', async () => {
    const res = await server.get(path).set('Authorization', `Bearer ${shared.token}`)

    assert.equal(res.status, 200)
    assert.typeOf(res.body, 'Object')
    assert.property(res.body, 'data')
    assert.typeOf(res.body.data, 'array')
    assert.isAtLeast(res.body.data.length, 1)

    const [{ jobFunctions, jobFunctionsCount }] = res.body.data.filter(n => n.id === ntId)
    assert.equal(jobFunctions, 'Admin')
    assert.equal(jobFunctionsCount, 1)
  })

  it('GET /id', async () => {
    const res = await server.get(`${path}/${ntId}`).set('Authorization', `Bearer ${shared.token}`)

    assert.typeOf(res.body, 'Object')
    assert.property(res.body, 'data')
    assert.typeOf(res.body.data, 'Object')
    assert.equal(res.status, 200)

    notificationType = res.body.data
    assert.property(notificationType, 'notificationTypeName')
    assert.property(notificationType, 'notificationType')
    assert.property(notificationType, 'name')
    assert.property(notificationType, 'filterCondition')
    assert.property(notificationType, 'emailSubject')
    assert.property(notificationType, 'emailBody')
    assert.property(notificationType, 'smsBody')
    assert.property(notificationType, 'webUrl')
    assert.property(notificationType, 'webBody')
  })

  it('PUT - Unexisting person, should return error 400', async () => {
    before(() => {
      shared.checkToken(server, path)
    })

    const res = await server
      .put(`${path}/${ntId}`)
      .set('Authorization', `Bearer ${shared.token}`)
      .send({
        ...basePayload,
        persons: [
          {
            personId: '99999999999',
            checked: true,
          },
        ],
      })

    assert.equal(res.status, 400)
    assert.equal(res.body.message, 'Attempt to set unexisting person to notification')
  })

  it('PUT - Unexisting job function, should return error 400', async () => {
    const res = await server
      .put(`${path}/${ntId}`)
      .set('Authorization', `Bearer ${shared.token}`)
      .send({
        ...basePayload,
        jobFunctions: [
          {
            jobFunctionId: '99999999999',
            checked: true,
          },
        ],
      })

    assert.equal(res.status, 400)
    assert.equal(res.body.message, 'Attempt to set unexisting job function to notification')
  })

  it('PUT - Existing person but without assigned job, should return error 400', async () => {
    const personWithoutJob = await knex('Person as p')
      .leftJoin('Job as j', 'p.id', 'j.personId')
      .whereNull('j.id')
      .first('p.*')
    const res = await server
      .put(`${path}/${ntId}`)
      .set('Authorization', `Bearer ${shared.token}`)
      .send({
        ...basePayload,
        persons: [
          {
            personId: `${personWithoutJob.id}`,
            checked: true,
          },
        ],
      })

    assert.equal(res.status, 400)
    assert.equal(res.body.message, 'Attempt to set to notifications persons without assigned jobs')
  })

  it('PUT - Correct payload, filterCondition should be updated properly', async () => {
    const res = await server.put(`${path}/${ntId}`).set('Authorization', `Bearer ${shared.token}`).send(basePayload)

    assert.equal(res.status, 200)

    const { filterCondition } = await knex('NotificationType').where({ id: ntId }).first()
    assert.deepEqual(JSON.parse(filterCondition), {
      persons: [
        {
          personId: `${personId}`,
          checked: true,
        },
      ],
      jobFunctions: [
        {
          jobFunctionId: '1',
          checked: true,
          tags: [],
        },
      ],
      deviceLevelId: baseFilterCondition.deviceLevelId,
      areaItems: [
        {
          label: 'Wayne',
          value: '12',
        },
      ],
      sendEmail: false,
      sendSms: true,
      sendWeb: false,
      result: baseFilterCondition.result,
      enabled: true,
      cronRecurrency: null,
      issueTypeId: null,
    })
  })
})

describe('Notification - View Logs', () => {
  const now = new Date()
  let resultId
  let emailMessageId
  let notificationTypeId
  let notificationId
  const partnerId = 1
  beforeEach(async () => {
    const messageType = await knex('MessageType').select().first()
    const { id: messageStatusId } = await knex('MessageStatus').where('externalId', 'Sent').first()
    ;[{ id: resultId }] = [await knex('Result').where({ partnerId }).first()]
    const { id: emailTemplateId } = await knex('EmailTemplate').first()

    /**
     * insert testing data
     */
    ;[emailMessageId] = await knex('EmailMessage').insert({
      emailTemplateId,
      messageStatusId,
      createdOn: now,
      updatedOn: now,
    })
    ;[notificationTypeId] = await knex('NotificationType').insert({
      partnerId,
      name: 'A notification',
      createdOn: now,
      updatedOn: now,
      notificationTypeCategoryId: await notificationTypeCategoryToId('resultBased'),
      messageTypeId: messageType.id,
    })
    ;[notificationId] = await knex('Notification').insert({
      notificationTypeId,
      resultId,
      emailMessageId,
      createdOn: now,
    })
  })

  afterEach(async () => {
    /**
     * delete testing data
     */
    await knex('Notification').where('id', notificationId).del()
    await knex('NotificationType').where('id', notificationTypeId).del()
    await knex('EmailMessage').where('id', emailMessageId).del()
  })

  it('GET - notification logs', async () => {
    const path = `/api/notification/history/${notificationTypeId}`
    const res = await server.get(path).set('Authorization', `Bearer ${shared.token}`)
    assert.equal(res.status, 200)
    assert.typeOf(res.body, 'Object')
    assert.property(res.body, 'data')
    assert.property(res.body, 'ok')
    assert.equal(res.body.ok, true)

    const { data } = res.body
    assert.typeOf(data, 'array')
    assert.equal(data.length, 1)

    const [item] = data
    assert.property(item, 'date')
    assert.property(item, 'issueId')
    assert.property(item, 'resultId')
    assert.property(item, 'emailSent')
    assert.property(item, 'smsSent')
    assert.property(item, 'webhookSent')
    assert.equal(item.emailSent, 1)
    assert.equal(item.smsSent, 0)
    assert.equal(item.webhookSent, 0)
  })
})
