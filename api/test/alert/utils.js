const _ = require('lodash')
const chai = require('chai')
const { messageStatusToId } = require('../../src/shared/dictionary')
const { run } = require('../../src/db')
const { queuePurge, waitForIdle } = require('../utils/mqUtils')

const { assert } = chai

// ------------------------------------------------------
// alert context
// ------------------------------------------------------
function createAlertTestContext(auth) {
  return new AlertTestContext(auth)
}

class AlertTestContext {
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

      // read 1st alert template
      const { id: alertTemplateId } = await knex('AlertTemplate')
        .whereRaw('message LIKE ?', ['%{{numberOfDays%'])
        .first('id')
      assert.isOk(alertTemplateId)

      // read 1st Result and corresponding siteId/deviceId
      const { id: resultId, siteId, deviceId } = await knex('Result').first('id', 'siteId', 'deviceId')

      const initialMessageStatusId = await messageStatusToId('Initial')

      // add sample alert message
      const now = new Date()
      ;[this.messageId] = await knex('AlertMessage').insert({
        alertTemplateId,
        messageStatusId: initialMessageStatusId,
        personId: userId,
        siteId,
        deviceId,
        resultId,
        createdOn: now,
        updatedOn: now,
      })

      assert.isOk(this.messageId)

      return test(knex)
    })
  }

  afterEach() {
    return run(async knex => {
      // make sure MQ finished it's job before removing sample message
      await waitForIdle()

      // remove sample message
      if (this.messageId) {
        await knex('AlertMessage').where('id', this.messageId).delete()
      }

      await queuePurge()
    })
  }
}

module.exports = {
  createAlertTestContext,
}
