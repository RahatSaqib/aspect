const _ = require('lodash')
const chai = require('chai')
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
    this.insertedid = []

    _.bindAll(this, ['afterEach', 'beforeEach'])
  }

  beforeEach() {
    return run(async knex => {
      const { auth: { user } } = this
      const { userId } = await knex('User')
        .where({ name: user })
        .first('id as userId')
      assert.isOk(userId, `Cannot find user ${user}`)
      this.userId = userId

      // read 1st alert template
      const { id: alertTemplateId } = await knex('AlertTemplate').first('id')
      assert.isOk(alertTemplateId)

      // read 1st Result and coresponding siteId/deviceId
      const results = await knex('Issue')
        .where('siteid', 3)
        //  .where('deviceid', 2)
        .select('id', 'deviceId')

      const messageStatusId = await messageStatusToId('Initial')

      _.forEach(results, async elem => {
        // add sample alert message
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

            issueId: elem.id,
            personId: userId,
            notificationTypeId: 1,
          })
        )
        assert.isOk(this.insertedid)
        this.messageId.push(this.insertedid[0])
      })
    })
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
      }
      this.messageId = []
    })
  }
}

module.exports = {
  createAlertTestContext,
}
