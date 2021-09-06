const chai = require('chai')
const Promise = require('bluebird')
const _ = require('lodash')
const { rowsAsObject } = require('../../seeds/utils')
const shared = require('../utils/sharedToken')
const { knex } = require('../../src/db')

const server = require('../utils/testUtils')
const { dispatchAndWaitForAction } = require('../utils/mqUtils')
const { resultLogged } = require('../../src/result/actions')
const { issueCreated } = require('../../src/issue/actions')
const { notificationTypeCategoryToId } = require('../../src/shared/dictionary')
const { resultConditionsMet } = require('../../src/notification/service')

const { assert } = chai
// describe.only('Issue based Notifications triggers', () => {
//   let issues = []
//   before(async () => {
//     issues = await knex('Issue as i')
//       .where({ partnerId: 1 })
//       .whereNotExists(
//         knex('Notification as n').whereRaw('n.issueId = i.id').select()
//       )
//       .select()
//     assert.isAtLeast(issues.length, 1)
//     const messageTypes = await knex('MessageType')
//       .whereNotNull('smsTemplateId')
//       .select()

//     const notificationTypeCategoryId = await notificationTypeCategoryToId(
//       'issueBased'
//     )

//     await knex('NotificationType').insert({
//       partnerId: 1,
//       name: 'Random issue based notification',
//       createdOn: new Date(),
//       updatedOn: new Date(),
//       notificationTypeCategoryId,
//       messageTypeId: _.sample(messageTypes).id,
//     })
//   })
//   after(async () => {
//     await knex('Notification')
//       .whereIn(
//         'issueId',
//         _.map(issues, r => r.id)
//       )
//       .delete()
//     await knex('NotificationType')
//       .where({ name: 'Random issue based notification' })
//       .delete()
//   })
//   it('should create a issue based notification without special triggers conditions', async () => {
//     const issueId = _.sample(issues).id
//     await dispatchAndWaitForAction(issueCreated(issueId))
//     const notifications = await knex('Notification').where({ issueId }).select()
//     assert.equal(notifications.length, 1)
//   })
// })

describe.only('Query generator for filtering conditions', () => {
  const filterConditionExample = {
    result: [
      {
        assayId: 'abbottM2000DBSHivVL',
        resultCategoryId: [
          {
            label: 'Indeterminate',
            scope: 'ResultCategories',
            value: 'Indeterminate',
          },
          {
            label: 'Error',
            scope: 'ResultCategories',
            value: 'Error',
          },
        ],
      },
      {
        assayId: 'GxMtbRif',
        resultCategoryId: [
          {
            label: 'MTB Detected RIF Not Detected',
            scope: 'ResultCategoryGroups',
            value: 'GxMtbRifMtbDetectedRifNotDetected',
          },
          {
            label: 'MTB Invalid',
            scope: 'ResultCategoryGroups',
            value: 'GxMtbRifMtbInvalid',
          },
        ],
      },
    ],
    areaItems: '',
    jobFunctions: [
      {
        tags: [],
        checked: true,
        jobFunctionId: '1',
      },
    ],
    deviceLevelId: 'national',
  }
  const filterConditionExample2 = {
    result: [
      {
        assayId: 'assayBdMgitGnd',
        resultCategoryId: [
          {
            label: 'Success',
            scope: 'ResultCategories',
            value: 'Success',
          },
          {
            label: 'Unknown',
            scope: 'ResultCategories',
            value: 'Unknown',
          },
        ],
      },
    ],
    areaItems: [
      {
        label: 'Idaho',
        value: '46',
      },
      {
        label: 'Nebraska',
        value: '62',
      },
    ],
    jobFunctions: [
      {
        tags: [],
        checked: true,
        jobFunctionId: '1',
      },
    ],
    deviceLevelId: 'state',
  }
  it('Should generate a proper query filter for ResultCategoryGroup', async () => {
    const query = knex('Result as r').modify(
      resultConditionsMet,
      filterConditionExample,
      { result: 'r' }
    )
    assert.isTrue(
      _.includes(
        query.toString(),
        "where (`a`.`externalId` = 'abbottM2000DBSHivVL' and (`rca`.`externalId` in ('Indeterminate', 'Error') or `rca2`.`externalId` in ('Indeterminate', 'Error'))) or (`a`.`externalId` = 'GxMtbRif' and `rcg`.`externalId` in ('GxMtbRifMtbDetectedRifNotDetected', 'GxMtbRifMtbInvalid')"
      )
    )
  })
  it('Should generate a proper query filter for ResultCategory', async () => {
    const query = knex('Result as r').modify(
      resultConditionsMet,
      filterConditionExample2,
      { result: 'r' }
    )
    assert.isTrue(
      _.includes(
        query.toString(),
        "(`a`.`externalId` = 'assayBdMgitGnd' and (`rca`.`externalId` in ('Success', 'Unknown') or `rca2`.`externalId` in ('Success', 'Unknown')))"
      )
    )
  })
})
describe('Result Notifications triggers', () => {
  let results = []
  let ntId
  before(async () => {
    results = await knex('Result as r')
      .where({ partnerId: 1 })
      .whereNotExists(
        knex('Notification as n').whereRaw('n.resultId = r.id').select()
      )
      .select()

    const messageTypes = await knex('MessageType')
      .whereNotNull('smsTemplateId')
      .select()

    const notificationTypeCategoryId = await notificationTypeCategoryToId(
      'resultBased'
    )

    ;[ntId] = await knex('NotificationType').insert({
      partnerId: 1,
      name: 'Result based notification',
      createdOn: new Date(),
      updatedOn: new Date(),
      notificationTypeCategoryId,
      messageTypeId: _.sample(messageTypes).id,
    })
  })
  after(async () => {
    await knex('Notification')
      .whereIn(
        'resultId',
        _.map(results, r => r.id)
      )
      .delete()
    await knex('NotificationType').where({ id: ntId }).delete()
  })
  it('should create a result based notification without trigger conditions', async () => {
    const resultId = _.sample(results).id
    await dispatchAndWaitForAction(resultLogged(resultId, 1, 1))
    const notifications = await knex('Notification')
      .where({ resultId })
      .select()
    console.log(notifications)
    assert.equal(notifications.length, 1)
  })
})
describe.only('Notification routes', () => {
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
