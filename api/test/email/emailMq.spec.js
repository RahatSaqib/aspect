// const chai = require('chai')
const { assert, expect } = require('chai')
const { subDays } = require('date-fns')
const excel = require('exceljs')
const { Readable } = require('stream')
const Promise = require('bluebird')

const { createEmailTestContext } = require('./utils')
const { createMessageContext, waitForIdle, waitForAction } = require('../utils/mqUtils')

// get test context with created sample messageId
const context = createEmailTestContext({ user: 'admin' })

// action creators
const { emailMessageCreated, emailMessageReadyForSending, emailMessageProcessed } = require('../../src/email/actions')
const { columnsDeviceErrorHistoryForAttachment } = require('../../src/result/serviceReport')
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

      const actionSent = emailMessageProcessed(messageId)
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
      assert(!msg.body.includes('{{') && !msg.body.includes('}}'), 'Email body template has not been parsed well')
      assert(
        !msg.htmlBody.includes('{{') && !msg.htmlBody.includes('}}'),
        'Email htmlBody template has not been parsed well'
      )
    }))

  it('should send email with CSV attachment', () =>
    runTest(async knex => {
      // get MQ context and messageId of inserted record in EmailMessage
      const {
        messageId,
        emailTemplate,
        result: { deviceId },
      } = context
      const messageContext = await createMessageContext()
      messageContext.bindActionCreators({ emailMessageCreated })

      /**
       * define module name which to inject into RawText of Log entry
       * added in table DeviceOperation (see below)
       */
      const moduleName = 'A2'
      const eventStartedOn = subDays(new Date(), 1)
      const errorCode = {
        assay: '9999',
        systemLog: '1002',
      }
      const errorMessage = {
        assay: 'Description of error with code 9999',
        systemLog: 'Heater Temperature Differential Error',
      }
      /**
       * add attachments props to EmailTemplate
       * (EmailTemplate will be restored in `afterEach` func)
       */
      const reportName = 'error-history'
      await knex('EmailTemplate')
        .update({
          attachments: JSON.stringify([
            {
              type: reportName,
              period: 'last-30-days',
            },
          ]),
        })
        .where('id', emailTemplate.id)
      /**
       * set moduleName and moduleSerial for all results
       * (this will be restored to original values in afterEach() in ./utils.js)
       */
      await Promise.each(context.results, async (r, index) => {
        const updatedValues = {
          // range all endedOn backward from eventStartedOn
          endedOn: subDays(eventStartedOn, 1 + index),
        }

        if (index < 2) {
          updatedValues.moduleName = moduleName
          if (index === 0) {
            /**
             * set values for most recent result
             * it's date is subDays(eventStartedOn, 1)
             */
            // has Assay error
            updatedValues.errorCode = errorCode.assay
            updatedValues.errorNotes = errorMessage.assay
            // reset moduleSerial
            updatedValues.moduleSerial = null
          } else {
            /**
             * set moduleSerial for result before most recent one
             * it's date is subDays(eventStartedOn, 2)
             */
            updatedValues.moduleSerial = `Module Serial - ${index}`
          }
        }
        await knex('Result').where('id', r.id).update(updatedValues)
      })
      /**
       * add record to DeviceOperation with error for current device
       */
      const [deviceOperationId] = await knex('DeviceOperation').insert({
        externalId: new Date().getTime(),
        deviceApiKeyId: knex('Device').where('id', deviceId).first('deviceApiKeyId'),
        occurredOn: eventStartedOn,
        data: JSON.stringify({
          type: 'gx-log',
          details: {
            Errors: [
              {
                Message: errorMessage.systemLog,
                ErrorCode: errorCode.systemLog,
              },
            ],
            RawText: `<SomeError>Error Code ${errorCode.systemLog}, Heater Temperature Differential Error in module ${moduleName}`,
          },
          logLevel: 'SEVERE',
          logFileName: 'C:\\GeneXpert\\log\\XpertCal-2017.10.10_15.49.26.026-0.log',
        }),
      })
      context.deviceOperationsToDelete = [deviceOperationId]

      // message goes through few states - Created, ReadyForSending, Sent
      const actionCreated = emailMessageCreated(messageId)
      const waitForCreated = waitForAction(actionCreated)

      const actionReady = emailMessageReadyForSending(messageId)
      const waitForReadyForSending = waitForAction(actionReady)

      const actionSent = emailMessageProcessed(messageId)
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
      assert(!msg.body.includes('{{') && !msg.body.includes('}}'), 'Email body template has not been parsed well')
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

      /**
       * - decode from base64
       *   (see func generateCsvAttachment() in `shared/io.js` about what/how we encode)
       * - get stream from buffer
       * - restore Excel Worksheet from stream
       */
      const buffer = Buffer.from(attachment.content, 'base64')
      const stream = new Readable({
        read() {
          this.push(buffer)
          this.push(null)
        },
      })
      const workbook = new excel.Workbook()
      const worksheet = await workbook.csv.read(stream)

      /**
       * get cellNumbers for some columns in CSV
       */
      // helper func
      const getHeaderValue = key => {
        const { header } = columnsDeviceErrorHistoryForAttachment.find(column => column.key === key)
        return header
      }
      // values in 1st row for some columns
      const valueSource = getHeaderValue('source')
      const valueModuleName = getHeaderValue('moduleName')
      const valueModuleSerial = getHeaderValue('moduleSerial')
      const valueErrorCode = getHeaderValue('errorCode')
      const valueErrorMessage = getHeaderValue('errorMessage')
      // define column numbers in CSV for some keys from array `columnsDeviceErrorHistoryForAttachment`
      const columnNumber = {
        source: null,
        moduleName: null,
        moduleSerial: null,
        errorCode: null,
        errorMessage: null,
      }
      worksheet
        .getRow(1) // 1st row contains headers in our CSV
        .eachCell({ includeEmpty: true }, (cell, cellNumber) => {
          if (cell.value === valueSource) {
            columnNumber.source = cellNumber
          } else if (cell.value === valueModuleName) {
            columnNumber.moduleName = cellNumber
          } else if (cell.value === valueModuleSerial) {
            columnNumber.moduleSerial = cellNumber
          } else if (cell.value === valueErrorCode) {
            columnNumber.errorCode = cellNumber
          } else if (cell.value === valueErrorMessage) {
            columnNumber.errorMessage = cellNumber
          }
        })
      assert.isNotNull(columnNumber.source)
      assert.isNotNull(columnNumber.moduleName)
      assert.isNotNull(columnNumber.moduleSerial)
      assert.isNotNull(columnNumber.errorCode)
      assert.isNotNull(columnNumber.errorMessage)

      /**
       * now loop through all roows and define 2 variables for Assay and SystemLog errors
       */
      let rowAssayError = null
      let rowSystemLogError = null
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return
        /**
         * see func getDeviceErrorHistoryForAttachment() in `api/src/result/serviceReport.js`
         * for aliases for column 'source' - they are 'Assay' and 'System Log'
         */
        const vSource = row.getCell(columnNumber.source).value
        const vModuleName = row.getCell(columnNumber.moduleName).value
        const vModuleSerial = row.getCell(columnNumber.moduleSerial).value
        const vErrorCode = row.getCell(columnNumber.errorCode).value
        const vErrorMessage = row.getCell(columnNumber.errorMessage).value
        if (
          vSource === 'Assay' &&
          vModuleName === moduleName &&
          +vErrorCode === +errorCode.assay &&
          vErrorMessage === errorMessage.assay &&
          !rowAssayError
        ) {
          rowAssayError = {
            moduleName: vModuleName,
            moduleSerial: vModuleSerial,
            errorCode: vErrorCode,
            errorMessage: vErrorMessage,
          }
        } else if (
          vSource === 'System Log' &&
          vModuleName === moduleName &&
          +vErrorCode === +errorCode.systemLog &&
          vErrorMessage === errorMessage.systemLog &&
          !rowSystemLogError
        ) {
          rowSystemLogError = {
            moduleName: vModuleName,
            moduleSerial: vModuleSerial,
            errorCode: vErrorCode,
            errorMessage: vErrorMessage,
          }
        }
      })
      /**
       * both rows should contain required values
       */
      assert.isNotNull(rowAssayError)
      // we above set needed results to have our moduleName
      assert.equal(rowAssayError.moduleName, moduleName)
      // we null'ed moduleSerial and set errorCode for this assay result
      assert.isNull(rowAssayError.moduleSerial)
      assert.equal(rowAssayError.errorCode, errorCode.assay)
      assert.equal(rowAssayError.errorMessage, errorMessage.assay)

      assert.isNotNull(rowSystemLogError)
      assert.equal(rowSystemLogError.moduleName, moduleName)
      // we null'ed moduleSerial for most recent result with index = 0,
      // so we get moduleSerial from previous result with index = 1
      assert.equal(rowSystemLogError.moduleSerial, 'Module Serial - 1')
      assert.equal(rowSystemLogError.errorCode, errorCode.systemLog)
      assert.equal(rowSystemLogError.errorMessage, errorMessage.systemLog)
    }))
})
