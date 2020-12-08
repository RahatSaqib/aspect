// const chai = require('chai')
const { assert, expect } = require('chai')

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
const { messageStatusToId } = require('../../src/shared/dictionary')

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

      const messageStatusIdSent = await messageStatusToId('Sent')
      const messageStatusIdError = await messageStatusToId('Error')
      const msg = await knex('EmailMessage').where('id', messageId).first()
      // check status id
      if (msg.messageStatusId !== messageStatusIdSent) {
        // if we run out of credits on SendGrid,
        //   this is what we expect to be returned
        //   from the API
        const sendResponse = JSON.parse(msg.sendResponse)
        assert.equal(msg.messageStatusId, messageStatusIdError)
        expect(sendResponse).to.containSubset({
          code: 'EAUTH',
          response: '451 Authentication failed: Maximum credits exceeded',
          responseCode: 451,
          command: 'AUTH PLAIN',
        })
      }
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

  it('should send email with CSV attachment', () =>
    runTest(async knex => {
      // get MQ context and messageId of inserted record in EmailMessage
      const { messageId, emailTemplate } = context
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

      /**
       * add attachment placeholder to body template and update EmailTemplate
       * (EmailTemplate will be restored in `afterEach` func)
       */
      const reportName = 'error-history'
      const attachmentPlaceholder = `<attachment:${reportName}(deviceId, errorCode)>`
      const body = `${emailTemplate.body} ${attachmentPlaceholder}`
      const htmlBody = `${emailTemplate.htmlBody} ${attachmentPlaceholder}`
      await knex('EmailTemplate')
        .update({
          body,
          htmlBody,
        })
        .where('id', emailTemplate.id)

      await waitForCreated

      await waitForReadyForSending

      await waitForSent

      await waitForIdle()

      const messageStatusIdSent = await messageStatusToId('Sent')
      const messageStatusIdError = await messageStatusToId('Error')
      const msg = await knex('EmailMessage').where('id', messageId).first()
      // check status id
      if (msg.messageStatusId !== messageStatusIdSent) {
        // if we run out of credits on SendGrid,
        //   this is what we expect to be returned
        //   from the API
        const sendResponse = JSON.parse(msg.sendResponse)
        assert.equal(msg.messageStatusId, messageStatusIdError)
        expect(sendResponse).to.containSubset({
          code: 'EAUTH',
          response: '451 Authentication failed: Maximum credits exceeded',
          responseCode: 451,
          command: 'AUTH PLAIN',
        })
      }
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

      assert(
        !msg.body.includes(attachmentPlaceholder),
        'Email htmlBody template has not been parsed well'
      )
      assert(
        !msg.htmlBody.includes(attachmentPlaceholder),
        'Email htmlBody template has not been parsed well'
      )

      // is a stringified object
      assert.isNotEmpty(msg.attachments)
      // get object
      const attachments = JSON.parse(msg.attachments)
      // is array
      assert.isArray(attachments)
      // get 1st attachment
      const [attachment] = attachments
      // is object
      assert.isObject(attachment)
      //
      assert.equal(attachment.fileName, `${reportName}.csv`)
      assert.equal(attachment.disposition, 'attachment')
      assert.isOk(attachment.content)
      assert.isOk(attachment.mimeType)
    }))
})
