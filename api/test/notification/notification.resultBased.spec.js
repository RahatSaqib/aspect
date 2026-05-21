const chai = require('chai')
const { subDays } = require('date-fns')
const Promise = require('bluebird')
const _ = require('lodash')
const shared = require('../utils/sharedToken')
const { knex } = require('../../src/db')
const config = require('../../src/config')
const server = require('../utils/testUtils')
const { dispatchAndWaitForAction, waitForIdle, createMessageContext } = require('../utils/mqUtils')
const { resultReadyForNotification } = require('../../src/result/actions')
const { notificationTypeCategoryToId, resultCategoryToId, deviceApprovalToId } = require('../../src/shared/dictionary')

const { assert } = chai

const { filterConditionWithAssay, filterConditionWithJf } = require('./filterConditions')

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
      filterCondition: filterCondition ? JSON.stringify({ ...filterCondition, resultBasedScope: 'any' }) : null,
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
  let notWayneLgaResultId = null
  let wayneLgaResultId = null
  let wayneLgaId = null
  const wayneLgaName = 'Wayne'
  before(async () => {
    ;[wayneLgaId] = await knex('Geography as g')
      .join('Lga as lga', 'lga.id', 'g.lgaId')
      .join('State as s', 's.id', 'g.stateId')
      .where('lga.name', 'Wayne')
      .andWhere('s.name', 'Ohio')
      .pluck('lga.id')
    resultCategory1 = await resultCategoryToId('Detected')
    results = await knex('Result as r')
      .join('Site as s', 'r.siteId', 's.id')
      .join('Geography as g', 's.geographyId', 'g.id')
      .join('Device as d', 'd.id', 'r.deviceId')
      .join('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
      .join('Lga as l', 'g.lgaId', 'l.id')
      .where({ 'r.partnerId': 1, 'dt.externalId': 'DaktariVirology' })
      .whereNotExists(knex('Notification as n').whereRaw('n.resultId = r.id').select())
      .distinct('r.*', 'l.name as lgaName', 'l.id as lgaId')
    assert.isAtLeast(results.length, 1)
    const fieldsToNotReplicate = ['lgaName', 'lgaId', 'id']
    const wayneLgaResult = _.sample(_.filter(results, elem => elem.lgaId === wayneLgaId))
    ;[insertedResultDetected] = await knex('Result').insert({
      ..._.omit(wayneLgaResult, fieldsToNotReplicate),
      resultCategory1,
      externalId: 'MytestsResultID',
      endedOn: new Date(),
    })
    ;[insertedResultUnknow] = await knex('Result').insert({
      ..._.omit(wayneLgaResult, fieldsToNotReplicate),
      resultCategory1: await resultCategoryToId('Unknown'),
      externalId: 'MytestsResultID2',
      endedOn: new Date(),
    })
    notWayneLgaResultId = await knex('Result').insert({
      ..._.omit(_.sample(_.filter(results, elem => elem.lgaId !== wayneLgaId)), fieldsToNotReplicate),
      resultCategory1: await resultCategoryToId('Detected'),
      externalId: 'MytestsResultID3',
      endedOn: new Date(),
    })
    wayneLgaResultId = await knex('Result').insert({
      ..._.omit(_.sample(_.filter(results, elem => elem.lgaId === wayneLgaId)), fieldsToNotReplicate),
      resultCategory1: await resultCategoryToId('Detected'),
      externalId: 'My test from Wayne',
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
        .whereIn('resultId', [
          insertedResultDetected,
          insertedResultUnknow,
          notWayneLgaResultId,
          wayneLgaResultId,
          ...resultsId,
        ])
        .delete()
    )
    await knex('Result')
      .whereIn('id', [
        insertedResultDetected,
        insertedResultUnknow,
        notWayneLgaResultId,
        wayneLgaResultId,
        ...resultsId,
      ])

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

        messageContext.dispatch(resultReadyForNotification(insertedResultDetected, false))
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
        messageContext.dispatch(resultReadyForNotification(insertedResultDetected, false))
        await waitForIdle(2000)
        const notifications = await knex('Notification').whereIn('resultId', [insertedResultDetected]).distinct()
        assert.isAtLeast(notifications.length, 0)
      })
    })
    it('should NOT create a result based notification for result category distinct to detected', async () => {
      const resultId = insertedResultUnknow
      assert.isNotNull(resultId)
      messageContext.dispatch(resultReadyForNotification(resultId, false))
      await dispatchAndWaitForAction(resultReadyForNotification(resultId, false))
      await waitForIdle(1000)
      const notifications = await knex('Notification').where({ resultId }).select()
      assert.isEmpty(notifications)
    })
    it('should NOT create a result based notification for a different LGA than wayne', async () => {
      const resultId = notWayneLgaResultId
      assert.isNotNull(resultId)
      await dispatchAndWaitForAction(resultReadyForNotification(resultId, false))
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
      await dispatchAndWaitForAction(resultReadyForNotification(sampleResult.id, false))
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
      knex('Notification')
        .whereIn('resultId', [insertedResultDetected, insertedResultUnknow, notWayneLgaResultId])
        .delete()
    )
    it('should create a result based notification for particular jobFunctions', async () => {
      const resultId = insertedResultDetected
      assert.isNotNull(resultId)

      const notificationsBefore = await knex('Notification')
        .where({ resultId, notificationTypeId: ntId })
        .distinct('resultId', 'notificationTypeId', 'personId')
      assert.equal(notificationsBefore.length, 0)
      await messageContext.dispatch(resultReadyForNotification(resultId, false))
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
      messageContext.dispatch(resultReadyForNotification(resultId, false))
      let notifications = await knex('Notification').where({ resultId }).distinct()
      assert.equal(notifications.length, 0)
      const [superAdminJobFunctionId] = await knex('JobFunction').where({ externalId: 'superAdmin' }).pluck('id')
      const [labUserJobFunctionId] = await knex('JobFunction').where({ externalId: 'labUser' }).pluck('id')
      await knex('NotificationType')
        .update({
          filterCondition: JSON.stringify({
            ...filterConditionWithJf,
            jobFunctions: [
              {
                tags: [{ label: 'oneTag', value: inserted }],
                jobFunctionId: superAdminJobFunctionId,
              },
              {
                tags: [{ label: 'secondTag', value: inserted + 1 }],
                jobFunctionId: labUserJobFunctionId,
              },
            ],
            resultBasedScope: 'any',
          }),
        })
        .where({ notificationTypeCategoryId })

      const personTags = await knex('Person as p')
        .join('JobContext as jc', 'jc.personId', 'p.id')
        .whereIn('jc.jobFunctionId', [1])
        .pluck('p.id')
      const person = _.sample(personTags)
      await knex('PersonTag').insert({ personId: person, tagId: inserted })
      await messageContext.dispatch(resultReadyForNotification(resultId, false))
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

  describe('Result notification Summary placeholder test', () => {
    const inserted = null
    let smsTemplateId = null
    let messageTypeId = null
    let backupResult = null
    let backupSample = null
    before(async () => {
      await createTestContext({
        ...filterConditionWithJf,
        result: [
          {
            assayId: 'GxMtbRifUltra',
            resultCategoryId: [
              {
                label: 'MTB Detected Drug Resistance Detected',
                scope: 'ResultCategoryGroups',
                value: 'GxMtbRifUltraMtbDetectedRifDetected',
              },
            ],
          },
        ],
        sendSms: true,
      })
      ;[smsTemplateId] = await knex('SmsTemplate').insert({
        message: 'A new {{result.resultSummary}} test case',
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
      await knex('Result')
        .where('id', insertedResultDetected)
        .update({
          assayId: knex('Assay').where('externalId', 'GxMtbRifUltra').select('id'),
          resultCategory1: knex('ResultCategory').where('externalId', 'Detected').select('id'),
          resultCategory2: knex('ResultCategory').where('externalId', 'Detected').select('id'),
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
      knex('Notification')
        .whereIn('resultId', [insertedResultDetected, insertedResultUnknow, notWayneLgaResultId])
        .delete()
    )
    it('should create a result based notification for particular jobFunctions', async () => {
      const resultId = insertedResultDetected
      assert.isNotNull(resultId)
      const notificationsBefore = await knex('Notification')
        .where({ resultId, notificationTypeId: ntId })
        .distinct('resultId', 'notificationTypeId', 'personId')
      assert.equal(notificationsBefore.length, 0)
      await dispatchAndWaitForAction(resultReadyForNotification(resultId, false))
      await waitForIdle(3000)
      const notifications = await knex('Notification').where({ resultId, notificationTypeId: ntId }).select()
      const smsMessages = await knex('SmsMessage').where({ smsTemplateId }).select()
      assert.equal(notifications.length, 1, 'Only one notification should exists')
      assert.equal(smsMessages.length, 1, 'Only one sms message should exists')
      assert.equal(
        smsMessages[0].message,
        'A new MTB+ Rif+ test case',
        'The resultSummary placeholder should be the correct one'
      )
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
      knex('Notification')
        .whereIn('resultId', [insertedResultDetected, insertedResultUnknow, notWayneLgaResultId])
        .delete()
    )
    it('should create a result based notification for particular jobFunctions', async () => {
      const resultId = insertedResultDetected
      assert.isNotNull(resultId)
      const notificationsBefore = await knex('Notification')
        .where({ resultId, notificationTypeId: ntId })
        .distinct('resultId', 'notificationTypeId', 'personId')
      assert.equal(notificationsBefore.length, 0)
      await dispatchAndWaitForAction(resultReadyForNotification(resultId, false))
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

  describe('XDR result detected resistance – placeholder notification test', () => {
    let smsTemplateId = null
    let messageTypeId = null
    let backupResult = null
    before(async () => {
      await createTestContext({
        ...filterConditionWithJf,
        result: [
          {
            assayId: 'GxMtbXdr',
            resultCategoryId: [
              {
                label: 'MTB Detected Drug Resistance Detected',
                scope: 'ResultCategoryGroups',
                value: 'GxMtbXdrMtbDetectedXdrDetected',
              },
            ],
          },
        ],
        sendSms: true,
      })
      ;[smsTemplateId] = await knex('SmsTemplate').insert({
        message:
          'result for this patient is {{result.category1.id}}, {{result.category2.id}} to {{result.detected.resistances}}',
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
      await knex('Result')
        .where('id', insertedResultDetected)
        .update({
          assayId: knex('Assay').where('externalId', 'GxMtbXdr').select('id'),
          resultCategory1: knex('ResultCategory').where('externalId', 'Detected').select('id'),
          resultCategory2: knex('ResultCategory').where('externalId', 'Detected').select('id'),
          resultData: JSON.stringify({
            allResistances: {
              AMK: 'NotDetected',
              CAP: 'NotDetected',
              ETH: 'Detected',
              FLQ: 'NotDetected',
              INH: 'Detected',
              KAN: 'NotDetected',
            },
          }),
        })
      await knex('NotificationType').where('id', ntId).update({ messageTypeId })
    })
    after(async () => {
      await removeTestContext()
      await knex('MessageType').where('id', messageTypeId).delete()
      await knex('SmsMessage').where('smsTemplateId', smsTemplateId).delete()
      await knex('SmsTemplate').where('id', smsTemplateId).delete()
      await knex('Result').where('id', insertedResultDetected).update(backupResult)
    })

    afterEach(async () => knex('Notification').whereIn('resultId', [insertedResultDetected]).delete())
    it('should create a result based notification for one xdr result', async () => {
      const resultId = insertedResultDetected
      assert.isNotNull(resultId)
      const notificationsBefore = await knex('Notification')
        .where({ resultId, notificationTypeId: ntId })
        .distinct('resultId', 'notificationTypeId', 'personId')
      assert.equal(notificationsBefore.length, 0)
      await dispatchAndWaitForAction(resultReadyForNotification(resultId, false))
      await waitForIdle(3000)
      const notifications = await knex('Notification').where({ resultId, notificationTypeId: ntId }).select()
      const smsMessages = await knex('SmsMessage').where({ smsTemplateId }).select()
      assert.equal(notifications.length, 1, 'Only one notification should exists')
      assert.equal(smsMessages.length, 1, 'Only one sms message should exists')
      assert.equal(
        smsMessages[0].message,
        'result for this patient is Detected, Detected to ETH, INH',
        'The placeholder must be correct'
      )
    })
  })

  describe('Filter by Person', () => {
    let adminId
    let regionalAdminId
    let jobContextToRemoveId

    beforeEach(async () => {
      ;[adminId] = await knex('Person').where({ email: config.admin.email }).pluck('id')
      const adminJobContext = await knex('JobContext').where({ personId: adminId }).first()

      ;[regionalAdminId] = await knex('Person')
        .where({ email: config.manager.email || null })
        .pluck('id')

      const [superAdminJobFunctionId] = await knex('JobFunction').where({ externalId: 'superAdmin' }).pluck('id')
      const [regionalAdminJobFunctionId] = await knex('JobFunction').where({ externalId: 'regionalAdmin' }).pluck('id')

      // Add an extra job to the Admin user - the system should send notifications by person, and not by job
      ;[jobContextToRemoveId] = await knex('JobContext').insert(_.omit(adminJobContext, 'id'))

      // Notify to the person called "Admin" with job Admin - Send notification
      // Notify to the person called "Admin" with job Regional Admin - DO NOT send notification
      // Notify to a person assigned to the job function "Regional Admin" - Send notification
      // Notify to a person assigned to the job function "Admin" - DO NOT send notification (the admin user was included as person)
      // ==> ONLY TWO NOTIFICATIONS WILL BE SENT
      const filterConditions = {
        ...filterConditionWithAssay,
        persons: [{ personId: adminId }],
        jobFunctions: [{ jobFunctionId: regionalAdminJobFunctionId }, { jobFunctionId: superAdminJobFunctionId }],
      }
      await createTestContext(filterConditions)
    })

    afterEach(async () => {
      // Remove the extra job added to the Admin user
      await knex('JobContext').where({ id: jobContextToRemoveId }).delete()
      await removeTestContext()
    })

    it('should create a result based notification for particular person and job function', async () => {
      const resultId = insertedResultDetected
      await dispatchAndWaitForAction(resultReadyForNotification(resultId, false))
      await waitForIdle(3000)
      const notifications = await knex('Notification').where({ resultId, notificationTypeId: ntId })
      const notificationToPerson = notifications.filter(n => n.personId === adminId)
      const notificationToJobFunction = notifications.filter(n => n.personId === regionalAdminId)
      assert.equal(notificationToPerson.length, 1)
      assert.equal(notificationToJobFunction.length, 1)
      assert.equal(notifications.length, 2)
    })
  })

  describe('Filter by Area Items', () => {
    before(async () => {
      const [superAdminJobFunctionId] = await knex('JobFunction').where({ externalId: 'superAdmin' }).pluck('id')
      await createTestContext({
        deviceLevelId: 'lga',
        areaItems: [
          {
            label: wayneLgaName,
            value: wayneLgaId,
          },
        ],
        jobFunctions: [
          {
            tags: [],
            jobFunctionId: superAdminJobFunctionId,
          },
        ],
      })
    })
    after(async () => removeTestContext())
    afterEach(async () =>
      Promise.each(['EmailMessage', 'SmsMessage', 'AlertMessage', 'WebhookMessage', 'Notification'], table =>
        knex(table).whereIn('resultId', [wayneLgaResultId]).delete()
      )
    )
    it('Should create a result based notification', async () => {
      const resultId = wayneLgaResultId
      assert.isNotNull(resultId)
      await dispatchAndWaitForAction(resultReadyForNotification(resultId, false))
      await waitForIdle(2000)
      const notifications = await knex('Notification')
        .where({ resultId, notificationTypeId: ntId })
        .distinct('resultId', 'notificationTypeId', 'personId')
      assert.equal(notifications.length, 1)
    })
  })

  describe('No filtering', () => {
    before(async () =>
      createTestContext({
        jobFunctions: [
          {
            tags: [],
            jobFunctionId: 1,
          },
        ],
      })
    )
    after(async () => removeTestContext())
    afterEach(async () =>
      Promise.each(['EmailMessage', 'SmsMessage', 'AlertMessage', 'WebhookMessage', 'Notification'], table =>
        knex(table).whereIn('resultId', [insertedResultDetected, insertedResultUnknow, notWayneLgaResultId]).delete()
      )
    )
    it('Should create a result based notification', async () => {
      const resultId = insertedResultDetected
      assert.isNotNull(resultId)
      await dispatchAndWaitForAction(resultReadyForNotification(resultId, false))
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
      await dispatchAndWaitForAction(resultReadyForNotification(resultId, false))
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
        .join('Site as s', 'r.siteId', 's.id')
        .join('Geography as g', 's.geographyId', 'g.id')
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

    it.skip('sms and email to a non-person contact', async () => {
      const { id: resultId } = await knex('Result').where('externalId', 'MyPatienttestsResultID').first()
      const notificationsBefore = await knex('Notification')
        .where({ resultId, notificationTypeId: ntId })
        .distinct('resultId', 'notificationTypeId', 'personId', 'emailMessageId', 'smsMessageId')
      assert.equal(notificationsBefore.length, 0)
      await dispatchAndWaitForAction(resultReadyForNotification(resultId, false))
      await waitForIdle(5000)
      const notifications = await knex('Notification').where({ resultId, notificationTypeId: ntId }).select()
      assert.equal(notifications.length, 1)
      const [notification] = notifications
      assert.isNotNull(notification.emailMessageId)
      assert.isNotNull(notification.smsMessageId)
    })
  })
})
