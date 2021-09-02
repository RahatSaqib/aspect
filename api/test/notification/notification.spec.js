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
