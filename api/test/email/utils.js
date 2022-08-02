const _ = require('lodash')
const chai = require('chai')
const Promise = require('bluebird')

const { messageStatusToId } = require('../../src/shared/dictionary')
const { run } = require('../../src/db')
const { queuePurge } = require('../utils/mqUtils')

const { assert } = chai
const { waitForIdle } = require('../utils/mqUtils')

// ------------------------------------------------------
// email context
// ------------------------------------------------------
function createEmailTestContext(auth) {
  return new EmailTestContext(auth)
}

class EmailTestContext {
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

      this.deviceOperationsToDelete = null
      // read 1st email template
      this.emailTemplate = await knex('EmailTemplate').orderBy('id').first()
      const { id: emailTemplateId } = this.emailTemplate
      assert.isOk(emailTemplateId)

      // read 1st Result and corresponding siteId/deviceId
      this.result = await knex('Result').first()
      const { id: resultId, siteId, deviceId } = this.result

      // read all results for this deviceId
      this.results = await knex('Result').where({ deviceId }).select()

      const messageStatusId = await messageStatusToId('Initial')

      // add sample email message
      const now = new Date()
      const [messageId] = await knex('EmailMessage').insert({
        emailTemplateId,
        messageStatusId,
        personId: userId,
        siteId,
        deviceId,
        resultId,
        createdOn: now,
        updatedOn: now,
      })
      this.messageId = messageId

      assert.isOk(this.messageId)

      return test(knex)
    })
  }

  afterEach() {
    return run(async knex => {
      // make sure MQ finished it's job before removing sample message
      await waitForIdle()

      if (this.emailTemplate) {
        await knex('EmailTemplate')
          .update({
            attachments: this.emailTemplate.attachments,
          })
          .where('id', this.emailTemplate.id)
      }
      // remove sample message
      if (this.messageId) {
        await knex('EmailMessage').where('id', this.messageId).delete()
      }
      // restore some fields in results of current deviceId
      await Promise.each(this.results, async result => {
        await knex('Result').where('id', result.id).update({
          moduleName: result.moduleName,
          moduleSerial: result.moduleSerial,
          endedOn: result.endedOn,
          errorCode: result.errorCode,
        })
      })

      if (this.deviceOperationsToDelete && this.deviceOperationsToDelete.length > 0) {
        await knex('DeviceOperation').whereIn('id', this.deviceOperationsToDelete).del()
      }

      await queuePurge()
    })
  }
}

module.exports = {
  createEmailTestContext,
}
