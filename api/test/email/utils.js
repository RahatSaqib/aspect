const _ = require('lodash')
const chai = require('chai')
const dictionary = require('../../src/shared/dictionary')
const { run } = require('../../src/db')
const { queuePurge } = require('../utils/mqUtils')

const { assert } = chai

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
      const { auth: { user } } = this
      const { userId } = await knex('User')
        .where({ name: user })
        .first('id as userId')
      assert.isOk(userId, `Cannot find user ${user}`)
      this.userId = userId

      // read 1st email template
      const { id: emailTemplateId } = await knex('EmailTemplate').first('id')
      assert.isOk(emailTemplateId)

      // read 1st Result and coresponding siteId/deviceId
      const { id: resultId, siteId, deviceId } = await knex('Result').first(
        'id',
        'siteId',
        'deviceId'
      )

      const messageStatusId = (await dictionary.messageStatusToId()).Initial

      // add sample email message
      const now = new Date()
      this.messageId = await knex('EmailMessage').insert(
        {
          emailTemplateId,
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
      // remove sample message
      if (this.messageId) {
        await knex('EmailMessage')
          .where('id', this.messageId)
          .delete()
      }

      await queuePurge()
    })
  }
}

module.exports = {
  createEmailTestContext,
}
