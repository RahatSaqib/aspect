const _ = require('lodash')
const chai = require('chai')
const Promise = require('bluebird')

const { messageStatusToId } = require('../../src/shared/dictionary')
const { run } = require('../../src/db')

const { assert } = chai

// ------------------------------------------------------
// alert context
// ------------------------------------------------------
function createAlertTestContext(auth) {
  return new TaskContextTest(auth)
}

class TaskContextTest {
  constructor(auth) {
    this.auth = auth
    this.messageIds = []
    this.issueIds = []

    _.bindAll(this, ['afterEach', 'beforeEach'])
  }

  beforeEach() {
    return run(async knex => {
      const {
        auth: { user },
      } = this
      const { userId } = await knex('User').where({ name: user }).first('id as userId')
      assert.isOk(userId, `Cannot find user ${user}`)
      this.userId = userId

      // read 1st alert template
      const { id: alertTemplateId } = await knex('AlertTemplate').where('id', 1).first('id')
      assert.isOk(alertTemplateId)

      const { issueTypeId } = await knex('IssueType')
        .where({
          externalId: 'DataCategoryLowForOther',
        })
        .first('id as issueTypeId')

      // read 1st Result and corresponding siteId/deviceId
      const issues = _.times(100, () => ({
        issueTypeId,
        issueStatusId: 2,
        partnerId: 4,
        geographyId: 100,
        siteId: 3,
        deviceId: 4,
        level: 1,
        createdOn: new Date(),
        updatedOn: new Date(),
      }))

      assert.isOk(issues)

      const messageStatusId = await messageStatusToId('Initial')

      await Promise.each(issues, async elem => {
        // add sample alert message
        const [issueId] = await knex('Issue').insert(elem)
        const now = new Date()
        const [alertMessageId] = await knex('AlertMessage').insert({
          alertTemplateId,
          messageStatusId,
          message: 'Test message',
          personId: userId,
          siteId: '3',
          deviceId: elem.deviceId,
          createdOn: now,
          updatedOn: now,
        })
        await knex('Notification').insert({
          createdOn: now,
          alertMessageId,
          issueId,
          personId: userId,
          notificationTypeId: 1,
        })
        assert.isOk(alertMessageId)
        this.issueIds.push(issueId)
        this.messageIds.push(alertMessageId)
      })
    })
  }

  getMessageId() {
    return _.last(this.messageIds)
  }

  afterEach() {
    return run(async knex => {
      // remove sample message
      if (this.messageIds.length > 0) {
        await knex('Notification').whereIn('alertMessageId', this.messageIds).delete()
        await knex('AlertMessage').whereIn('id', this.messageIds).delete()
        await knex('Issue').whereIn('id', this.issueIds).delete()
      }

      this.messageIds = []
    })
  }
}

module.exports = {
  createAlertTestContext,
}
