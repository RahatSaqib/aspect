const _ = require('lodash')
const addDays = require('date-fns/addDays')
const chai = require('chai')
const {
  pushNotification: { testDeviceTokenId },
} = require('../../src/config')
const { messageStatusToId, issueTypeToId, issueStatusToId } = require('../../src/shared/dictionary')
const { run } = require('../../src/db')
const { queuePurge } = require('../utils/mqUtils')

const { assert } = chai
const { waitForIdle } = require('../utils/mqUtils')

// ------------------------------------------------------
// push notification context
// ------------------------------------------------------
function createPushNotificationTestContext(auth) {
  return new PushNotificationTestContext(auth)
}

class PushNotificationTestContext {
  constructor(auth) {
    this.auth = auth

    _.bindAll(this, ['afterEach', 'runTest'])
  }

  runTest(test) {
    return run(async knex => {
      const {
        auth: { user },
      } = this
      const { userId } = await knex('User').where({ name: user }).first('id as userId')
      assert.isOk(userId, `Cannot find user ${user}`)
      this.userId = userId

      // read 1st push notification template
      const { id: pushNotificationTemplateId } = await knex('PushNotificationTemplate').first('id')
      assert.isOk(pushNotificationTemplateId)

      // read 1st Result and coresponding siteId/deviceId
      const { siteId, deviceId, partnerId, geographyId } = await knex('Result').first(
        'id',
        'siteId',
        'deviceId',
        'partnerId',
        'geographyId'
      )

      const issueTypeId = await issueTypeToId('NewResultsAvailable')
      const issueStatusId = await issueStatusToId('Active')
      const messageStatusId = await messageStatusToId('Initial')
      const { id: notificationTypeId } = await knex('NotificationType')
        .where('name', 'New Results Available')
        .first('id')

      // create app-entry for user in RefreshToken table:
      const now = new Date()
      await knex('RefreshToken').insert({
        userId,
        clientId: '12345678-1234-5678-91011-abcdefghijk',
        clientName: 'Funky Phone',
        token: 'faketokenz',
        deviceTokenId: testDeviceTokenId,
        expires: addDays(now, 30),
        revoked: 0,
        createdOn: now,
        clientType: 'reporter_app',
        updatedOn: now,
      })

      // add issue
      ;[this.issueId] = await knex('Issue').insert({
        issueTypeId,
        issueStatusId,
        partnerId,
        geographyId,
        siteId,
        deviceId,
        level: 1,
        createdOn: now,
        updatedOn: now,
        data: JSON.stringify({ numberOfResults: 1 }),
      })

      assert.isOk(this.issueId)

      // add sample push notification message
      ;[this.messageId] = await knex('PushNotificationMessage').insert({
        pushNotificationTemplateId,
        messageStatusId,
        personId: userId,
        siteId,
        deviceId,
        createdOn: now,
        updatedOn: now,
      })

      assert.isOk(this.messageId)

      // add notification
      ;[this.notificationId] = await knex('Notification').insert({
        notificationTypeId,
        issueId: this.issueId,
        personId: userId,
        pushNotificationMessageId: this.messageId,
        createdOn: now,
      })

      assert.isOk(this.notificationId)

      return test(knex)
    })
  }

  afterEach() {
    return run(async knex => {
      // make sure MQ finished it's job before removing sample message
      await waitForIdle()

      // remove refresh token
      await knex('RefreshToken')
        .where({
          clientId: '12345678-1234-5678-91011-abcdefghijk',
        })
        .delete()

      // remove notification
      if (this.notificationId) {
        await knex('Notification').where('id', this.notificationId).delete()
      }

      // remove message
      if (this.messageId) {
        await knex('PushNotificationMessage').where('id', this.messageId).delete()
      }

      // remove issue
      if (this.issueId) {
        await knex('Issue').where('id', this.issueId).delete()
      }

      await queuePurge()
    })
  }
}

module.exports = {
  createPushNotificationTestContext,
}
