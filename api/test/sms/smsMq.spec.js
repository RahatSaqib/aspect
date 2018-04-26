const { assert } = require('chai')

const { createSmsTestContext } = require('./utils')
const {
  createMessageContext,
  waitForIdle,
  waitForAction,
} = require('../utils/mqUtils')

// get test context with created sample messageId
const context = createSmsTestContext({ user: 'admin' })

// action creators
const {
  smsMessageCreated,
  smsMessageReadyForSending,
  smsMessageSent,
} = require('../../src/sms/actions')
const dictionary = require('../../src/shared/dictionary')

describe('Sending SMS via Message Queue', () => {
  const { runTest } = context

  // beforeEach(context.beforeEach)
  afterEach(context.afterEach)

  it('should add record with status=Initial to SmsMessage table to trigger MQ, and return "Sent" for messageStatus', () =>
    runTest(async knex => {
      // get MQ context and messageId of inserted record in SmsMessage
      const { messageId } = context
      const messageContext = await createMessageContext()
      messageContext.bindActionCreators({ smsMessageCreated })

      // message goes through few states - Created, ReadyForSending, Sent
      const actionCreated = smsMessageCreated(messageId)
      const waitForCreated = waitForAction(actionCreated)

      const actionReady = smsMessageReadyForSending(messageId)
      const waitForReadyForSending = waitForAction(actionReady)

      const actionSent = smsMessageSent(messageId)
      const waitForSent = waitForAction(actionSent)

      // dispatch to MQ a messageId (generated in SmsMessage)
      messageContext.smsMessageCreated(messageId)

      await waitForCreated

      await waitForReadyForSending

      await waitForSent

      await waitForIdle()

      const messageStatusIdSent = (await dictionary.messageStatusToId()).Sent
      const msg = await knex('SmsMessage')
        .where('id', messageId)
        .first()
      assert.equal(msg.messageStatusId, messageStatusIdSent)
      // make sure generated message does not have unprocessed curly braces {{ }}
      assert(
        !msg.message.includes('{{') && !msg.message.includes('}}'),
        'Sms message template has not been parsed well'
      )
    }))
})
