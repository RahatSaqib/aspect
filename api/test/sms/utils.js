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
function createSmsTestContext(auth, fixedPhoneNumber = null) {
  return new SmsTestContext(auth, fixedPhoneNumber)
}

class SmsTestContext {
  constructor(auth, fixedPhoneNumber) {
    this.auth = auth
    this.personId = null
    this.fixedPhoneNumber = fixedPhoneNumber

    _.bindAll(this, ['afterEach', 'beforeEach'])
  }

  async beforeEach() {
    if (!_.isEmpty(this.auth)) {
      const {
        auth: { user },
      } = this
      const { personId } = await knex('User as u')
        .innerJoin('Person as p', 'u.id', 'p.userId')
        .where('u.name', user)
        .first('p.id as personId')
      assert.isOk(personId, `Cannot find user ${user}`)
      this.personId = personId
    }

    // read 1st sms template
    const { id: smsTemplateId } = await knex('SmsTemplate').first('id')
    assert.isOk(smsTemplateId)

    // read 1st Result and coresponding siteId/deviceId
    const {
      id: resultId,
      siteId,
      deviceId,
      partnerId,
    } = await knex('Result').first('id', 'siteId', 'deviceId', 'partnerId')

    const now = new Date()
    const [messageSeverityId] = await knex('MessageSeverity').pluck('id')
    ;[this.messageTypeId] = await knex('MessageType').insert({ smsTemplateId, messageSeverityId })
    const [notificationTypeCategoryId] = await knex('NotificationTypeCategory')
      .where('externalId', 'resultBased')
      .pluck('id')
    const [jobFunctionId] = await knex('JobFunction').where({ partnerId }).andWhere('externalId', 'admin').pluck('id')
    ;[this.notificationTypeId] = await knex('NotificationType').insert({
      notificationTypeCategoryId,
      partnerId,
      jobFunctionId,
      messageTypeId: this.messageTypeId,
      name: 'TEST NOTIFICATION',
      createdOn: now,
      updatedOn: now,
      enabled: true,
    })

    // add sample sms message
    const messageStatusId = await messageStatusToId('Initial')
    ;[this.messageId] = await knex('SmsMessage').insert({
      smsTemplateId,
      messageStatusId,
      personId: this.personId,
      siteId,
      deviceId,
      resultId,
      createdOn: now,
      updatedOn: now,
      phoneNumber: this.fixedPhoneNumber,
    })
    ;[this.notificationId] = await knex('Notification').insert({
      notificationTypeId: this.notificationTypeId,
      resultId,
      personId: this.personId,
      smsMessageId: this.messageId,
      createdOn: now,
    })

    assert.isOk(this.messageId)
  }

  async afterEach() {
    // make sure MQ finished it's job before removing sample message
    await waitForIdle()

    // remove sample message
    if (this.messageId) {
      await knex('Notification').where('id', this.notificationId).delete()
      await knex('SmsMessage').where('id', this.messageId).delete()
      await knex('NotificationType').where('id', this.notificationTypeId).delete()
      await knex('MessageType').where('id', this.messageTypeId).delete()
    }

    await queuePurge()
  }
}

module.exports = {
  createSmsTestContext,
}
