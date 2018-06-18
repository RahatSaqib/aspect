const { assert } = require('chai')

const { createAlertTestContext } = require('./utils')
const {
  createMessageContext,
  waitForIdle,
  waitForAction,
} = require('../utils/mqUtils')

// get test context with created sample messageId
const context = createAlertTestContext({ user: 'admin' })

// action creators
const {
  alertMessageCreated,
  alertMessageSent,
} = require('../../src/alert/actions')
const dictionary = require('../../src/shared/dictionary')
const { processDynamicMessage } = require('../../src/stringTemplate/service')

describe('Sending Alert via Message Queue', () => {
  const { runTest } = context

  // beforeEach(context.beforeEach)
  afterEach(context.afterEach)

  it('should add record with status=Initial to AlertMessage table to trigger MQ, and return "Sent" for messageStatus', () =>
    runTest(async knex => {
      // get MQ context and messageId of inserted record in AlertMessage
      const { messageId } = context
      const messageContext = await createMessageContext()
      messageContext.bindActionCreators({ alertMessageCreated })

      // message goes through few states - Created, Sent
      const actionCreated = alertMessageCreated(messageId)
      const waitForCreated = waitForAction(actionCreated)

      const actionSent = alertMessageSent(messageId)
      const waitForSent = waitForAction(actionSent)

      // dispatch to MQ a messageId (generated in AlertMessage)
      messageContext.alertMessageCreated(messageId)

      await waitForCreated
      await waitForSent
      await waitForIdle()

      const messageStatusIdSent = (await dictionary.messageStatusToId()).Sent
      const msg = await knex('AlertMessage')
        .where('id', messageId)
        .first()
      assert.equal(msg.messageStatusId, messageStatusIdSent)
      // make sure generated message does not have unprocessed curly braces {{ }}
      const message = processDynamicMessage(msg.message)
      assert(
        !message.includes('{{') && !message.includes('}}'),
        'Alert message template has not been parsed well'
      )
    }))
})
