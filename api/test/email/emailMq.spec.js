// const chai = require('chai')
const { assert } = require('chai')

const { createEmailTestContext } = require('./utils')
const {
  createMessageContext,
  waitForIdle,
  waitForAction,
} = require('../utils/mqUtils')

// const { assert } = chai

// get test context with created sample messageId
const context = createEmailTestContext({ user: 'admin' })

// action creators
const {
  emailMessageCreated,
  emailMessageReadyForSending,
  emailMessageSent,
} = require('../../src/email/actions')
const dictionary = require('../../src/shared/dictionary')

describe('Sending Email via Message Queue', () => {
  const { runTest } = context

  afterEach(context.afterEach)

  it('should add record with status=Initial to EmailMessage table to trigger MQ, and return "Sent" for messageStatus', () =>
    runTest(async knex => {
      // get MQ context and messageId of inserted record in EmailMessage
      const { messageId } = context
      const messageContext = await createMessageContext()
      messageContext.bindActionCreators({ emailMessageCreated })

      // message goes through few states - Created, ReadyForSending, Sent
      const actionCreated = emailMessageCreated(messageId)
      const waitForCreated = waitForAction(actionCreated)

      const actionReady = emailMessageReadyForSending(messageId)
      const waitForReadyForSending = waitForAction(actionReady)

      const actionSent = emailMessageSent(messageId)
      const waitForSent = waitForAction(actionSent)

      // dispatch to MQ a messageId (generated in EmailMessage)
      messageContext.emailMessageCreated(messageId)

      await waitForCreated

      await waitForReadyForSending

      await waitForSent

      await waitForIdle()

      const messageStatusIdSent = (await dictionary.messageStatusToId()).Sent
      const msg = await knex('EmailMessage')
        .where('id', messageId)
        .first()
      // check status id
      assert.equal(msg.messageStatusId, messageStatusIdSent)
      // make sure generated message does not have unprocessed curly braces {{ }}
      assert(
        !msg.subject.includes('{{') && !msg.subject.includes('}}'),
        'Email subject template has not been parsed well'
      )
      assert(
        !msg.body.includes('{{') && !msg.body.includes('}}'),
        'Email body template has not been parsed well'
      )
      assert(
        !msg.htmlBody.includes('{{') && !msg.htmlBody.includes('}}'),
        'Email htmlBody template has not been parsed well'
      )
    }))
})
