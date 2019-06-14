const _ = require('lodash')
const chai = require('chai')
const Promise = require('bluebird')

const { messageStatusToId } = require('../../src/shared/dictionary')
const { run } = require('../../src/db')

const { assert } = chai

// ------------------------------------------------------
// alert context
// ------------------------------------------------------
function createAlertTestContext(auth) {
  return new TaskContextTest(auth)
}

class TaskContextTest {
  constructor(auth) {
    this.auth = auth
    this.messageId = []
    this.issueId = []
    this.insertedid = []

    _.bindAll(this, ['afterEach', 'beforeEach'])
  }

  beforeEach() {
    return run(async knex => {
      const {
        auth: { user },
      } = this
      const { userId } = await knex('User')
        .where({ name: user })
        .first('id as userId')
      assert.isOk(userId, `Cannot find user ${user}`)
      this.userId = userId

      // read 1st alert template
      const { id: alertTemplateId } = await knex('AlertTemplate')
        .where('id', 1)
        .first('id')
      assert.isOk(alertTemplateId)

      // read 1st Result and coresponding siteId/deviceId
      const issues = _.times(100, () => ({
        issueTypeId: 5,
        issueStatusId: 2,
        partnerId: 4,
        geographyId: 100,
        siteId: 3,
        deviceId: 4,
        level: 1,
        createdOn: new Date(),
        updatedOn: new Date(),
      }))

      assert.isOk(issues)

      const messageStatusId = await messageStatusToId('Initial')

      await Promise.each(issues, async elem => {
        // add sample alert message
        const issueId = await knex('Issue')
          .insert(issues)
          .returning('id')
        const now = new Date()
        this.insertedid = await knex('AlertMessage')
          .returning('id')
          .insert({
            alertTemplateId,
            messageStatusId,
            message: 'Test message',
            personId: userId,
            siteId: '3',
            deviceId: elem.deviceId,
            createdOn: now,
            updatedOn: now,
          })
        await knex('Notification').insert(
          Object.assign({
            createdOn: now,
            alertMessageId: this.insertedid,
            issueId,
            personId: userId,
            notificationTypeId: 1,
          })
        )
        this.issueId.push(issueId[0])
        assert.isOk(this.insertedid)
        this.messageId.push(this.insertedid[0])
      })
    })
  }

  getMessageId() {
    return _.last(this.messageId)
  }

  afterEach() {
    return run(async knex => {
      // remove sample message
      if (this.messageId) {
        await knex('Notification')
          .whereIn('alertMessageId', this.messageId)
          .delete()
        await knex('AlertMessage')
          .whereIn('id', this.messageId)
          .delete()
        await knex('Issue')
          .whereIn('id', this.issueId)
          .delete()
      }

      this.messageId = []
    })
  }
}

module.exports = {
  createAlertTestContext,
}
