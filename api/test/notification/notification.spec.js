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
} = require('../../src/shared/dictionary')
const { resultConditionsMet } = require('../../src/notification/service')

const { assert } = chai
describe('Issue based Notifications triggers', () => {
  let issues = []
  before(async () => {
    issues = await knex('Issue as i')
      .where({ partnerId: 4 })
      .whereNotExists(
        knex('Notification as n').whereRaw('n.issueId = i.id').select()
      )
      .select()
    assert.isAtLeast(issues.length, 1)
    const messageTypes = await knex('MessageType')
      .whereNotNull('smsTemplateId')
      .select()

    const notificationTypeCategoryId = await notificationTypeCategoryToId(
      'issueBased'
    )
    await knex('NotificationType').insert({
      partnerId: 1,
      name: 'Random issue based notification',
      createdOn: new Date(),
      updatedOn: new Date(),
      notificationTypeCategoryId,
      messageTypeId: _.sample(messageTypes).id,
    })
  })
  after(async () => {
    await knex('Notification')
      .whereIn(
        'issueId',
        _.map(issues, r => r.id)
      )
      .delete()
    await knex('NotificationType')
      .where({ name: 'Random issue based notification' })
      .delete()
  })
  it('should create a issue based notification without special filter conditions', async () => {
    const issueId = _.sample(issues).id
    await dispatchAndWaitForAction(issueCreated(issueId))
    const notifications = await knex('Notification').where({ issueId }).select()
    assert.isAtLeast(notifications.length, 1)
  })
})

describe.only('Result Notifications triggers', () => {
  let results = []
  let ntNoFilterConditionId
  let ntResultFilterConditionId
  let messageContext
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
      .select()

    const notificationTypeCategoryId = await notificationTypeCategoryToId(
      'resultBased'
    )

    ;[ntNoFilterConditionId] = await knex('NotificationType').insert({
      partnerId: 1,
      name: 'Result based notification',
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
    await knex('Notification')
      .whereIn(
        'resultId',
        _.map(results, r => r.id)
      )
      .delete()
    await knex('NotificationType').where({ id: ntNoFilterConditionId }).delete()
    results = []
  }
  describe('Filter without JF', () => {
    before(async () => createTestContext(filterConditionWithAssay))
    after(removeTestContext)
    it('should create a result based notification for particular lga', async () => {
      const resultId = _.sample(
        _.filter(
          results,
          elem =>
            elem.lgaName === 'Wayne' && elem.resultCategory1 === resultCategory1
        )
      ).id
      assert.isNotNull(resultId)
      messageContext.dispatch(resultLogged(resultId, 1, 1))
      await dispatchAndWaitForAction(resultLogged(resultId, 1, 1))
      await waitForIdle(1000)
      const notifications = await knex('Notification')
        .where({ resultId })
        .distinct()
      assert.equal(notifications.length, 1)
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
  describe.only('Filter by JF', () => {
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
      messageContext.dispatch(resultLogged(resultId, 1, 1))
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

      await knex('NotificationType')
        .where({ id: ntNoFilterConditionId })
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
      await updateSubscription('notification')

      const resultId = _.sample(
        _.filter(
          results,
          elem =>
            elem.lgaName === 'Wayne' && elem.resultCategory1 === resultCategory1
        )
      ).id
      assert.isNotNull(resultId)
      messageContext.dispatch(resultLogged(resultId, 1, 1))
      // const personTags = await knex('Person as p')
      //   .join('Job as j', 'j.personId', 'p.id')
      //   .whereIn('j.jobFunctionId', [1])
      //   .pluck('p.id')
      // const person = _.sample(personTags)
      // await knex('PersonTag').insert({ personId: person, tagId: inserted })
      await waitForIdle(1000)
      const notifications = await knex('Notification')
        .where({ resultId })
        .distinct()
      assert.equal(notifications.length, 0)
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
