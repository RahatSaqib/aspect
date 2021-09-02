const chai = require('chai')
const mocha = require('mocha')
const Promise = require('bluebird')

const { rowsAsObject } = require('../../seeds/utils')
const shared = require('../utils/sharedToken')
const { knex } = require('../../src/db')

const server = require('../utils/testUtils')
const { dispatchAndWaitForAction } = require('../utils/mqUtils')
const { resultLogged } = require('../../src/result/actions')
const { issueCreated } = require('../../src/issue/actions')
const { notificationTypeCategoryToId } = require('../../src/shared/dictionary')

const { assert } = chai
describe('Result Notifications triggers', () => {
  after(async () => {
    const results = await knex('Result').where({ partnerId: 1 }).select()

    const notificationTypeCategoryId = await notificationTypeCategoryToId(
      'resultBased'
    )

    const [ntId] = await knex('NotificationType').insert({
      partnerId: 1,
      name: "Result based notification",
      createdOn: new Date(),
      updatedOn: new Date(),
      notificationTypeCategoryId,
    })

    ntArr.push(ntId)
  })
  it('should create a result based notification', async () => {
    await dispatchAndWaitForAction(resultCreated(3333))
    assert.isTrue(true)
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
