const _ = require('lodash')
const addDays = require('date-fns/addDays')
const chai = require('chai')
const {
  pushNotification: { testDeviceTokenId },
} = require('../../src/config')
const { messageStatusToId } = require('../../src/shared/dictionary')
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
      const { userId } = await knex('User')
        .where({ name: user })
        .first('id as userId')
      assert.isOk(userId, `Cannot find user ${user}`)
      this.userId = userId

      // read 1st push notification template
      const { id: pushNotificationTemplateId } = await knex(
        'PushNotificationTemplate'
      ).first('id')
      assert.isOk(pushNotificationTemplateId)

      // read 1st Result and coresponding siteId/deviceId
      const { id: resultId, siteId, deviceId } = await knex('Result').first(
        'id',
        'siteId',
        'deviceId'
      )

      const messageStatusId = await messageStatusToId('Initial')

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

      // add sample push notification message
      this.messageId = await knex('PushNotificationMessage').insert(
        {
          pushNotificationTemplateId,
          messageStatusId,
          personId: userId,
          siteId,
          deviceId,
          resultId,
          createdOn: now,
          updatedOn: now,
        },
        'id'
      )

      assert.isOk(this.messageId)

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

      // remove sample message
      if (this.messageId) {
        await knex('PushNotificationMessage')
          .where('id', this.messageId)
          .delete()
      }

      await queuePurge()
    })
  }
}

module.exports = {
  createPushNotificationTestContext,
}
