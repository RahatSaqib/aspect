const _ = require('lodash')
const chai = require('chai')
const { messageStatusToId } = require('../../src/shared/dictionary')
const { knex } = require('../../src/db')
const { queuePurge } = require('../utils/mqUtils')

const { assert } = chai
const { waitForIdle } = require('../utils/mqUtils')

// ------------------------------------------------------
// sms context
// ------------------------------------------------------
function createSmsTestContext(auth) {
  return new SmsTestContext(auth)
}

class SmsTestContext {
  constructor(auth) {
    this.auth = auth

    _.bindAll(this, ['afterEach', 'beforeEach'])
  }

  async beforeEach() {
    const {
      auth: { user },
    } = this
    const { userId } = await knex('User')
      .where({ name: user })
      .first('id as userId')
    assert.isOk(userId, `Cannot find user ${user}`)
    this.userId = userId

    // read 1st sms template
    const { id: smsTemplateId } = await knex('SmsTemplate').first('id')
    assert.isOk(smsTemplateId)

    // read 1st Result and coresponding siteId/deviceId
    const { id: resultId, siteId, deviceId } = await knex('Result').first(
      'id',
      'siteId',
      'deviceId'
    )

    const messageStatusId = await messageStatusToId('Initial')

    // add sample sms message
    const now = new Date()
    ;[this.messageId] = await knex('SmsMessage').insert({
      smsTemplateId,
      messageStatusId,
      personId: userId,
      siteId,
      deviceId,
      resultId,
      createdOn: now,
      updatedOn: now,
    })

    assert.isOk(this.messageId)
  }

  async afterEach() {
    // make sure MQ finished it's job before removing sample message
    await waitForIdle()

    // remove sample message
    if (this.messageId) {
      await knex('SmsMessage').where('id', this.messageId).delete()
    }

    await queuePurge()
  }
}

module.exports = {
  createSmsTestContext,
}
