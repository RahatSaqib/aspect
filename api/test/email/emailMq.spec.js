// const chai = require('chai')
const _ = require('lodash')
const { assert, expect } = require('chai')
const { subDays } = require('date-fns')

const { createEmailTestContext } = require('./utils')
const {
  createMessageContext,
  waitForIdle,
  waitForAction,
} = require('../utils/mqUtils')

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

  it.only('should send email with CSV attachment', () =>
    runTest(async knex => {
      // get MQ context and messageId of inserted record in EmailMessage
      const { messageId, emailTemplate, result } = context
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
       * add attachments props to EmailTemplate
       * (EmailTemplate will be restored in `afterEach` func)
       */
      const reportName = 'error-history'
      await knex('EmailTemplate')
        .update({
          attachments: JSON.stringify([
            {
              name: reportName,
              period: 'last-30-days',
            },
          ]),
        })
        .where('id', emailTemplate.id)
      /**
       * set errorCode for existing Result
       */
      await knex('Result')
        .where('id', result.id)
        .update({
          endedOn: subDays(new Date(), 3),
          errorCode: '9999',
        })
      /**
       * add DeviceOperation with error for current device
       */
      const [deviceOperationId] = await knex('DeviceOperation').insert({
        externalId: new Date().getTime(),
        deviceId: result.deviceId,
        startedOn: subDays(new Date(), 5),
        data: JSON.stringify({
          type: 'gx-log',
          details: {
            Errors: [
              {
                Message: 'Heater Temperature Differential Error',
                ErrorCode: '1002',
              },
            ],
          },
          logLevel: 'SEVERE',
          logFileName:
            'C:\\GeneXpert\\log\\XpertCal-2017.10.10_15.49.26.026-0.log',
        }),
      })
      context.deviceOperationsToDelete = [deviceOperationId]

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

      // is a stringified object
      assert.isNotNull(msg.attachments)
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
