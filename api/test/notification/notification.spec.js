const chai = require('chai')
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
  issueStatusToId,
} = require('../../src/shared/dictionary')

const { assert } = chai
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
  let ntNoFilterConditionId
  let messageContext
  const name = 'Result based notification'
  const path = '/api/notification'

  const filterConditionWithAssay = {
    result: [
      {
        assayId: 'DaktariHivVL',
        resultCategoryId: [
          {
            label: 'Detected',
            scope: 'ResultCategories',
            value: 'Detected',
          },
        ],
      },
    ],
    areaItems: [
      {
        label: 'Wayne',
        value: '12',
      },
    ],
    deviceLevelId: 'lga',
  }
  let resultCategory1
  const filterConditionWithJf = {
    result: [
      {
        assayId: 'DaktariHivVL',
        resultCategoryId: [
          {
            label: 'Detected',
            scope: 'ResultCategories',
            value: 'Detected',
          },
        ],
      },
    ],
    areaItems: [
      {
        label: 'Wayne',
        value: '12',
      },
    ],
    jobFunctions: [
      {
        tags: [],
        jobFunctionId: '1',
      },
      {
        tags: [],
        jobFunctionId: '2',
      },
    ],
    deviceLevelId: 'lga',
  }
  const createTestContext = async filterCondition => {
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
    const messageTypes = await knex('MessageType')
      .whereNotNull('smsTemplateId')
      .whereNotNull('emailTemplateId')
      .select()

    const notificationTypeCategoryId = await notificationTypeCategoryToId(
      'resultBased'
    )

    ;[ntNoFilterConditionId] = await knex('NotificationType').insert({
      partnerId: 1,
      name,
      createdOn: new Date(),
      updatedOn: new Date(),
      notificationTypeCategoryId,
      filterCondition: JSON.stringify(filterCondition),
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
      .orWhere({ notificationTypeId: ntNoFilterConditionId })
      .delete()
    await knex('NotificationType').where({ id: ntNoFilterConditionId }).delete()
    results = []
  }

  describe('Filter without JF', () => {
    before(async () => createTestContext(filterConditionWithAssay))
    after(removeTestContext)
    describe('Filter for wayne country and Detected result', () => {
      let insertedResult = null
      before(async () => {
        const result = _.sample(
          _.filter(results, elem => elem.lgaName === 'Wayne')
        )
        ;[insertedResult] = await knex('Result').insert({
          ..._.omit(result, ['id', 'resultCategory1', 'lgaName', 'externalId']),
          resultCategory1,
          externalId: 'MytestsResultID',
        })
        assert.isNotNull(insertedResult)
      })
      after(async () => {
        await Promise.each(
          ['EmailMessage', 'SmsMessage', 'AlertMessage', 'Notification'],
          table => knex(table).where({ resultId: insertedResult }).delete()
        )
        await knex('Result').where({ externalId: 'MytestsResultID' }).delete()
      })
      it('should create a result based notification for particular lga', async () => {
        messageContext.dispatch(resultLogged(insertedResult, 1, 1))
        await waitForIdle(1000)
        const notifications = await knex('Notification')
          .where({ resultId: insertedResult })
          .distinct()
        assert.isAtLeast(notifications.length, 1)
      })
    })
    it('should NOT create a result based notification for result category distinct to detected', async () => {
      const resultId = _.sample(
        _.filter(
          results,
          elem =>
            elem.lgaName === 'Wayne' && elem.resultCategory1 !== resultCategory1
        )
      ).id
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
      const resultId = _.sample(
        _.filter(results, elem => elem.lgaName !== 'Wayne')
      ).id
      assert.isNotNull(resultId)
      messageContext.dispatch(resultLogged(resultId, 1, 1))
      await dispatchAndWaitForAction(resultLogged(resultId, 1, 1))
      await waitForIdle(1000)
      const notifications = await knex('Notification')
        .where({ resultId })
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
        .whereIn(
          'resultId',
          _.map(results, r => r.id)
        )
        .delete()
    )
    it('should create a result based notification for particular jobFunctions', async () => {
      const resultId = _.sample(
        _.filter(
          results,
          elem =>
            elem.lgaName === 'Wayne' && elem.resultCategory1 === resultCategory1
        )
      ).id
      assert.isNotNull(resultId)
      await dispatchAndWaitForAction(resultLogged(resultId, 1, 1))
      await waitForIdle(1000)
      const notifications = await knex('Notification')
        .where({ resultId })
        .distinct()
      assert.equal(notifications.length, 1)
    })
    it('Should create or not  a result based notification filtering by  JobFunction and tags', async () => {
      ;[inserted] = await knex('Tag').insert([
        { partnerId: 1, title: 'oneTag' },
        { partnerId: 1, title: 'secondTag' },
        { partnerId: 1, title: 'thirdTag' },
      ])
      const notificationTypeCategoryId = await notificationTypeCategoryToId(
        'resultBased'
      )
      let resultId = _.sample(
        _.filter(
          results,
          elem =>
            elem.lgaName === 'Wayne' && elem.resultCategory1 === resultCategory1
        )
      ).id
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
      resultId = _.sample(
        _.filter(
          results,
          elem =>
            elem.lgaName === 'Wayne' && elem.resultCategory1 === resultCategory1
        )
      ).id
      assert.isNotNull(resultId)
      const personTags = await knex('Person as p')
        .join('Job as j', 'j.personId', 'p.id')
        .whereIn('j.jobFunctionId', [1])
        .pluck('p.id')
      const person = _.sample(personTags)
      await knex('PersonTag').insert({ personId: person, tagId: inserted })
      messageContext.dispatch(resultLogged(resultId, 1, 1))
      await waitForIdle(1000)
      notifications = await knex('Notification as n')
        .join('NotificationType as nt', 'n.notificationTypeId', 'nt.id')
        .where({
          resultId,
          'nt.notificationTypeCategoryId': notificationTypeCategoryId,
        })
        .distinct()
      assert.equal(notifications.length, 1)
    })
  })

  const filterCondition = {
    result: [
      {
        assayId: 'DaktariHivVL',
        resultCategoryId: [
          {
            label: 'Detected',
            scope: 'ResultCategories',
            value: 'Detected',
          },
        ],
      },
    ],
    sendEmail: true,
    sendSms: true,
    sendWeb: false,
    areaItems: [
      {
        label: 'Wayne',
        value: '12',
      },
    ],
    jobFunctions: [
      {
        tags: [],
        jobFunctionId: '1',
      },
      {
        tags: [],
        jobFunctionId: '2',
      },
    ],
    deviceLevelId: 'lga',
  }

  describe('Checking edit functionality', () => {
    before(async () => createTestContext(filterCondition))
    after(removeTestContext)

    let id
    let data
    let fltrCon

    it('should load result based notification', async () => {
      shared.checkToken(server, path)
      const res = await server
        .get(path)
        .set('Authorization', `Bearer ${shared.token}`)
      assert.equal(res.status, 200)
      const foundRBN = res.body.data.filter(item => item.name === name)
      if (foundRBN && foundRBN.length) {
        id = foundRBN[0].id
        const res = await server
          .get(`${path}/${id}`)
          .set('Authorization', `Bearer ${shared.token}`)
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')
        data = res.body.data
        fltrCon = JSON.parse(data.filterCondition)
        assert.property(data, 'notificationTypeName')
        assert.property(data, 'notificationType')
        assert.property(data, 'name')
        assert.property(data, 'filterCondition')
        assert.property(data, 'emailSubject')
        assert.property(data, 'emailBody')
        assert.property(data, 'smsBody')
        assert.property(data, 'webUrl')
        assert.property(data, 'webBody')
      }
    })

    it('should save result based notification', async () => {
      shared.checkToken(server, path)
      const payload = {
        notificationType: data.notificationType,
        name: data.name,
        emailSubject: '',
        emailBody: '',
        sendEmail: false,
        smsBody: data.smsBody || '',
        sendSms: fltrCon.sendSms,
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
        deviceLevelId: fltrCon.deviceLevelId,
        areaItems: fltrCon.areaItems,
        result: fltrCon.result,
      }
      const res = await server
        .put(`${path}/${id}`)
        .set('Authorization', `Bearer ${shared.token}`)
        .send(payload)

      assert.equal(res.status, 200)
    })
  })
})

describe('Notification routes', () => {
  const path = '/api/notification'

  const now = new Date()
  const sampleIssues = [
    'DeviceOffline',
    'DeviceMaintenance',
    'ModuleFailureError',
  ]

  const ntArr = []

  beforeEach(async () => {
    const issueTypes = await rowsAsObject(knex, 'IssueType', 'externalId')
    await Promise.each(sampleIssues, async issue => {
      const issueType = issueTypes[issue]
      const [ntId] = await knex('NotificationType').insert({
        partnerId: 1,
        issueTypeId: issueType.id,
        name: issueType.name,
        createdOn: now,
        updatedOn: now,
      })

      ntArr.push(ntId)

      await knex('Notification').insert({
        notificationTypeId: ntId,
        createdOn: now,
      })
    })
  })

  afterEach(async () => {
    return Promise.each(ntArr, async ntId => {
      await knex('Notification').where('notificationTypeId', ntId).del()
      await knex('NotificationType').where('id', ntId).del()
    })
  })

  describe('GET /notification', () => {
    shared.checkToken(server, path)

    it('should return a list of notifications when using valid token', async () => {
      const res = await server
        .get(path)
        .set('Authorization', `Bearer ${shared.token}`)

      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')
      assert.property(res.body, 'data')
      assert.typeOf(res.body.data, 'array')
      assert.isAtLeast(res.body.data.length, 3)
      res.body.data.forEach(notification => {
        assert.property(notification, 'name')
        assert.property(notification, 'lastTriggeredOn')
        assert.property(notification, 'totalTriggers')
        assert.property(notification, 'alertCount')
        assert.property(notification, 'contactsCount')
        assert.property(notification, 'contacts')
      })
    })
  })
})
