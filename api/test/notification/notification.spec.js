const chai = require('chai')
const { subDays } = require('date-fns')
const Promise = require('bluebird')
const _ = require('lodash')
const { rowsAsObject } = require('../../seeds/utils')
const shared = require('../utils/sharedToken')
const { knex } = require('../../src/db')

const server = require('../utils/testUtils')
const {
  dispatchAndWaitForAction,
  waitForIdle,
  createMessageContext,
  updateSubscription,
} = require('../utils/mqUtils')
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
} = require('./fitlerCondtions')

describe('Issue based Notifications triggers', () => {
  let insertedIssueId = null
  before(async () => {
    const issueTypes = await knex('IssueType').pluck('id')
    const resultSample = await knex('Result').first()
    const messageTypes = await knex('MessageType')
      .whereNotNull('smsTemplateId')
      .select()

    const notificationTypeCategoryId = await notificationTypeCategoryToId(
      'issueBased'
    )
    const createdOn = new Date()
    const updatedOn = new Date()
    const issueTypeId = _.sample(issueTypes)

    await knex('NotificationType').insert({
      partnerId: resultSample.partnerId,
      name: 'Random issue based notification',
      createdOn,
      updatedOn,
      notificationTypeCategoryId,
      issueTypeId,
      messageTypeId: _.sample(messageTypes).id,
    })
    const issueStatusId = await issueStatusToId('Active')
      ;[insertedIssueId] = await knex('Issue').insert({
        partnerId: resultSample.partnerId,
        deviceId: resultSample.deviceId,
        siteId: resultSample.siteId,
        issueStatusId,
        issueTypeId,
        createdOn,
        updatedOn,
      })
  })
  after(async () => {
    await knex('Notification').where('issueId', insertedIssueId).delete()
    await knex('Issue').where({ id: insertedIssueId }).delete()
    await knex('NotificationType')
      .where({ name: 'Random issue based notification' })
      .delete()
  })
  it('should create a issue based notification without special filter conditions', async () => {
    let notifications = await knex('Notification')
      .where({ issueId: insertedIssueId })
      .select()
    assert.equal(notifications.length, 0)
    await dispatchAndWaitForAction(issueCreated(insertedIssueId))
    await waitForIdle(1000)
    notifications = await knex('Notification')
      .where({ issueId: insertedIssueId })
      .select()
    assert.equal(notifications.length, 1)
  })
})

describe('Result Notifications triggers', () => {
  let results = []
  let ntId
  let messageContext
  const name = 'Result based notification'
  const path = '/api/notification'
  let resultCategory1

  const createTestContext = async filterCondition => {
    const messageTypes = await knex('MessageType')
      .whereNotNull('smsTemplateId')
      .whereNotNull('emailTemplateId')
      .select()

    const notificationTypeCategoryId = await notificationTypeCategoryToId(
      'resultBased'
    )

      ;[ntId] = await knex('NotificationType').insert({
        partnerId: 1,
        name,
        createdOn: new Date(),
        updatedOn: new Date(),
        notificationTypeCategoryId,
        filterCondition: filterCondition ? JSON.stringify(filterCondition) : null,
        messageTypeId: _.sample(messageTypes).id,
      })
    messageContext = await createMessageContext()

    await updateSubscription('notification')
  }
  const removeTestContext = async () => {
    await Promise.each(
      ['EmailMessage', 'SmsMessage', 'AlertMessage', 'Notification'],
      table =>
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
      .join('Lga as l', 'g.lgaId', 'l.id')
      .where({ partnerId: 1 })
      .whereNotExists(
        knex('Notification as n').whereRaw('n.resultId = r.id').select()
      )
      .distinct('r.*', 'l.name as lgaName')
    assert.isAtLeast(results.length, 1)
    const result = _.sample(_.filter(results, elem => elem.lgaName === 'Wayne'))
      ;[insertedResultDetected] = await knex('Result').insert({
        ..._.omit(result, [
          'id',
          'resultCategory1',
          'lgaName',
          'externalId',
          'endedOn',
        ]),
        resultCategory1,
        externalId: 'MytestsResultID',
        endedOn: new Date(),
      })
      ;[insertedResultUnknow] = await knex('Result').insert({
        ..._.omit(result, [
          'id',
          'resultCategory1',
          'lgaName',
          'externalId',
          'endedOn',
        ]),
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
    await Promise.each(
      ['EmailMessage', 'SmsMessage', 'AlertMessage', 'Notification'],
      table =>
        knex(table)
          .whereIn('resultId', [
            insertedResultDetected,
            insertedResultUnknow,
            notWayneResult,
          ])
          .delete()
    )
    await knex('Result')
      .whereIn('id', [
        insertedResultDetected,
        insertedResultUnknow,
        notWayneResult,
      ])
      .delete()
  })
  describe('Filter without JF', () => {
    before(async () => createTestContext(filterConditionWithAssay))
    after(removeTestContext)
    describe('Filter for wayne country and Detected result', () => {
      it('should NOT create a result based notification for particular lga BUT with unapproved Device', async () => {
        let notifications = await knex('Notification')
          .whereIn('resultId', [insertedResultDetected])
          .distinct()
        const qtyOfNotifications = notifications.length
        assert.isAtLeast(notifications.length, 0)
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
        notifications = await knex('Notification')
          .whereIn('resultId', [insertedResultDetected])
          .distinct()
        assert.equal(qtyOfNotifications, notifications.length)
        await knex('Device')
          .update({
            deviceApprovalId: await deviceApprovalToId('approved'),
          })
          .where({
            id: device.id,
          })
      })
      it('should create a result based notification for particular lga', async () => {
        messageContext.dispatch(resultLogged(insertedResultDetected, 1, 1))
        await waitForIdle(1000)
        const notifications = await knex('Notification')
          .whereIn('resultId', [insertedResultDetected])
          .distinct()
        assert.isAtLeast(notifications.length, 1)
      })
    })
    it('should NOT create a result based notification for result category distinct to detected', async () => {
      const resultId = insertedResultUnknow
      assert.isNotNull(resultId)
      messageContext.dispatch(resultLogged(resultId, 1, 1))
      await dispatchAndWaitForAction(resultLogged(resultId, 1, 1))
      await waitForIdle(1000)
      const notifications = await knex('Notification')
        .where({ resultId })
        .select()
      assert.isEmpty(notifications)
    })
    it('should NOT create a result based notification for a different LGA than wayne', async () => {
      const resultId = notWayneResult
      assert.isNotNull(resultId)
      await dispatchAndWaitForAction(resultLogged(resultId, 1, 1))
      await waitForIdle(1000)
      const notifications = await knex('Notification')
        .where({ resultId })
        .select()
      assert.isEmpty(notifications)
    })
    it('should NOT create a result based notification because the endedon is older than 30 days', async () => {
      const sampleResult = _.sample(
        _.filter(
          results,
          elem =>
            elem.lgaName === 'Wayne' && elem.resultCategory1 === resultCategory1
        )
      )
      assert.isNotNaN(sampleResult)
      assert.isTrue(sampleResult.endedOn < subDays(new Date(), 30))
      await dispatchAndWaitForAction(resultLogged(sampleResult.id, 1, 1))
      await waitForIdle(1000)
      const notifications = await knex('Notification')
        .where({ resultId: sampleResult.id })
        .select()
      assert.isEmpty(notifications)
    })
  })

  describe('Filter by JF', () => {
    let inserted
    before(async () => createTestContext(filterConditionWithJf))
    after(async () => {
      await removeTestContext()
      await knex('PersonTag').where('TagId', '>=', inserted).delete()
      await knex('Tag')
        .whereIn('title', ['oneTag', 'secondTag', 'thirdTag'])
        .delete()
    })
    afterEach(async () =>
      knex('Notification')
        .whereIn('resultId', [
          insertedResultDetected,
          insertedResultUnknow,
          notWayneResult,
        ])
        .delete()
    )
    it('should create a result based notification for particular jobFunctions', async () => {
      const resultId = insertedResultDetected
      assert.isNotNull(resultId)
      await dispatchAndWaitForAction(resultLogged(resultId, 1, 1))
      await waitForIdle(1000)
      const notifications = await knex('Notification')
        .where({ resultId, notificationTypeId: ntId })
        .distinct()
      assert.equal(notifications.length, 1)
    })
    it('Should create or not a result based notification filtering by JobFunction and tags', async () => {
      ;[inserted] = await knex('Tag').insert([
        { partnerId: 1, title: 'oneTag' },
        { partnerId: 1, title: 'secondTag' },
        { partnerId: 1, title: 'thirdTag' },
      ])
      const notificationTypeCategoryId = await notificationTypeCategoryToId(
        'resultBased'
      )
      const resultId = insertedResultDetected
      messageContext.dispatch(resultLogged(resultId, 1, 1))
      let notifications = await knex('Notification')
        .where({ resultId })
        .distinct()
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
      messageContext = await createMessageContext()
      await updateSubscription('notification')
      await waitForIdle(1000)
      const personTags = await knex('Person as p')
        .join('Job as j', 'j.personId', 'p.id')
        .whereIn('j.jobFunctionId', [1])
        .pluck('p.id')
      const person = _.sample(personTags)
      await knex('PersonTag').insert({ personId: person, tagId: inserted })
      messageContext.dispatch(resultLogged(resultId, 1, 1))
      await waitForIdle(1000)
      notifications = await knex('Notification as n')
        .where({
          resultId,
          notificationTypeId: ntId,
          // 'nt.notificationTypeCategoryId': notificationTypeCategoryId,
        })
        .distinct()
      assert.equal(notifications.length, 1)
    })
  })

  describe('No filtering', () => {
    before(async () => createTestContext({
      jobFunctions: [
        {
          tags: [],
          jobFunctionId: '1',
        }
      ],
    }))
    after(async () => removeTestContext())
    afterEach(async () =>
      Promise.each(
        ['EmailMessage', 'SmsMessage', 'AlertMessage', 'WebhookMessage', 'Notification'],
        table =>
          knex(table)
            .whereIn('resultId', [
              insertedResultDetected,
              insertedResultUnknow,
              notWayneResult,
            ])
            .delete()
      )
    )
    it('Should create a result based notification', async () => {
      const resultId = insertedResultDetected
      assert.isNotNull(resultId)
      await dispatchAndWaitForAction(resultLogged(resultId, 1, 1))
      await waitForIdle(1000)
      const notifications = await knex('Notification')
        .where({ resultId, notificationTypeId: ntId })
        .distinct()
      assert.equal(notifications.length, 1)
    })

    it('Should not create a disabled result based notification', async () => {
      await knex('NotificationType')
        .where({ id: ntId })
        .update({ enabled: false })
      const resultId = insertedResultDetected
      assert.isNotNull(resultId)
      await dispatchAndWaitForAction(resultLogged(resultId, 1, 1))
      await waitForIdle(1000)
      const notifications = await knex('Notification')
        .where({ resultId, notificationTypeId: ntId })
        .distinct()
      assert.equal(notifications.length, 0)
    })
  })
})
describe('Notification routes', () => {
  const path = '/api/notification'
  let ntId
  let notificationType

  beforeEach(async () => {
    shared.checkToken(server, path)
    const messageType = await knex('MessageType').select().first()
    ;[ntId] = await knex('NotificationType').insert({
      partnerId: 1,
      name: 'A notification',
      createdOn: new Date(),
      updatedOn: new Date(),
      notificationTypeCategoryId: await notificationTypeCategoryToId('resultBased'),
      filterCondition: JSON.stringify({}),
      messageTypeId: messageType.id,
    })
  })

  afterEach(async () => knex('NotificationType').where('id', ntId).del())

  it('GET', async () => {
    const res = await server
      .get(path)
      .set('Authorization', `Bearer ${shared.token}`)

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
      assert.property(notification, 'contactsCount')
      assert.property(notification, 'contacts')
    })
  })

  it('GET /id', async () => {
    const res = await server
      .get(`${path}/${ntId}`)
      .set('Authorization', `Bearer ${shared.token}`)
    
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

  it('PUT', async () => {
    shared.checkToken(server, path)
    const payload = {
      notificationType: notificationType.notificationType,
      name: notificationType.name,
      emailSubject: '',
      emailBody: '',
      sendEmail: false,
      smsBody: baseFilterCondition.smsBody || '',
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
      deviceLevelId: baseFilterCondition.deviceLevelId,
      areaItems: baseFilterCondition.areaItems,
      result: baseFilterCondition.result,
    }
    
    const res = await server
      .put(`${path}/${ntId}`)
      .set('Authorization', `Bearer ${shared.token}`)
      .send(payload)

    assert.equal(res.status, 200)
  })
})
