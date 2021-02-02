const { assert } = require('chai')

const { createSmsTestContext } = require('./utils')
const {
  createMessageContext,
  waitForIdle,
  waitForAction,
} = require('../utils/mqUtils')

const { knex } = require('../../src/db')
// get test context with created sample messageId
const context = createSmsTestContext({ user: 'admin' })

// action creators
const {
  smsMessageCreated,
  smsMessageReadyForSending,
  smsMessageSent,
} = require('../../src/sms/actions')
const { messageStatusToId } = require('../../src/shared/dictionary')
const logger = require('../../src/shared/logger')

describe('Sending SMS via Message Queue', () => {
  beforeEach(async () => {
    logger.info('before each')
    await context.beforeEach()
  })
  afterEach(async () => {
    await context.afterEach()
    logger.info('after each')
  })

  it('should add record with status=Initial to SmsMessage table to trigger MQ, and return "Sent" for messageStatus', async () => {
    // get MQ context and messageId of inserted record in SmsMessage
    const { messageId } = context
    const messageContext = await createMessageContext()
    messageContext.bindActionCreators({ smsMessageCreated })

    // message goes through few states - Created, ReadyForSending, Sent
    const actionCreated = smsMessageCreated(messageId)
    const waitForCreated = waitForAction(actionCreated)
    messageContext.smsMessageCreated(messageId)
    const actionReady = smsMessageReadyForSending(messageId)
    const waitForReadyForSending = waitForAction(actionReady)

    const actionSent = smsMessageSent(messageId)
    const waitForSent = waitForAction(actionSent)

    // dispatch to MQ a messageId (generated in SmsMessage)

    await waitForCreated

    await waitForReadyForSending

    await waitForSent

    await waitForIdle()

    const messageStatusIdSent = await messageStatusToId('Sent')
    const msg = await knex('SmsMessage').where('id', messageId).first()
    assert.equal(msg.messageStatusId, messageStatusIdSent)
    // make sure generated message does not have unprocessed curly braces {{ }}
    assert(
      !msg.message.includes('{{') && !msg.message.includes('}}'),
      'Sms message template has not been parsed well'
    )
  })
})
