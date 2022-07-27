const { assert } = require('chai')

const { createPushNotificationTestContext } = require('./utils')
const { createMessageContext, waitForIdle, waitForAction } = require('../utils/mqUtils')

// get test context with created sample messageId
const context = createPushNotificationTestContext({ user: 'admin' })

// action creators
const {
  pushNotificationMessageCreated,
  pushNotificationMessageReadyForSending,
  pushNotificationMessageSent,
} = require('../../src/pushNotification/actions')
const { messageStatusToId } = require('../../src/shared/dictionary')

describe('Sending push notification via Message Queue', () => {
  const { runTest } = context

  afterEach(context.afterEach)

  it('should add record with status=Initial to PushNotificationMessage table to trigger MQ, and return "Sent" for messageStatus', () =>
    runTest(async knex => {
      // get MQ context and messageId of inserted record in PushNotificationMessage
      const { messageId } = context
      const messageContext = await createMessageContext()
      messageContext.bindActionCreators({ pushNotificationMessageCreated })

      // message goes through few states - Created, ReadyForSending, Sent
      const actionCreated = pushNotificationMessageCreated(messageId)
      const waitForCreated = waitForAction(actionCreated)

      const actionReady = pushNotificationMessageReadyForSending(messageId)
      const waitForReadyForSending = waitForAction(actionReady)

      const actionSent = pushNotificationMessageSent(messageId)
      const waitForSent = waitForAction(actionSent)

      // dispatch to MQ a messageId (generated in PushNotificationMessage)
      messageContext.pushNotificationMessageCreated(messageId)

      await waitForCreated

      await waitForReadyForSending

      await waitForSent

      await waitForIdle()

      const messageStatusIdSent = await messageStatusToId('Sent')
      const msg = await knex('PushNotificationMessage').where('id', messageId).first()
      assert.equal(msg.messageStatusId, messageStatusIdSent)
      // make sure generated message does not have unprocessed curly braces {{ }}
      assert(
        !msg.body.includes('{{') && !msg.body.includes('}}') && !msg.body.includes('issue.data'),
        'Push notification message template has not been parsed well'
      )
    }))
})
