const _ = require('lodash')
const chai = require('chai')
// const { messageStatusToId } = require('../../src/shared/dictionary')
const { run } = require('../../src/db')
const { queuePurge, waitForIdle } = require('../utils/mqUtils')

const { assert } = chai

function createNotificationTestContext(server, auth) {
  return new NotificationTestContext(server, auth)
}

class NotificationTestContext {
  constructor(auth) {
    this.auth = auth

    _.bindAll(this, ['afterEach', 'runTest'])
  }

  runTest(test) {
    return run(async knex => {
      const {
        auth: { user },
      } = this
      const { partnerId } = await knex('User as u')
        .innerJoin('Person as p', 'p.userId', 'u.id')
        .where('u.name', user)
        .first('p.lastPartnerId as partnerId ')

      assert.isOk(partnerId, `Cannot find ${user}'s partnerId`)
      this.partnerId = partnerId

      const now = new Date()
      ;[this.ntId] = await knex('NotificationType').insert({
        partnerId: this.partnerId,
        issueTypeId: 2,
        name: 'Results Delayed',
        createdOn: now,
        updatedOn: now,
      })

      assert.isOk(this.ntId)

      return test(knex)
    })
  }

  afterEach() {
    return run(async knex => {
      await waitForIdle()
      if (this.ntId) {
        await knex('NotificationType as nt').where('id', this.ntId).delete()
      }
      await queuePurge()
    })
  }
}

module.exports = {
  createNotificationTestContext,
}
