const _ = require('lodash')

const { run } = require('../../src/db')
const { queuePurge } = require('../utils/mqUtils')
const { waitForIdle } = require('../utils/mqUtils')

function createIssueTestContext() {
  return new IssueTestContext()
}

class IssueTestContext {
  constructor() {
    _.bindAll(this, ['afterEach', 'runTest'])
  }

  runTest(test) {
    return run(async knex => {
      const inventoryItem = await knex('InventoryItem').first(
        'siteId',
        'consumableId'
      )

      this.siteId = inventoryItem.siteId
      this.consumableId = inventoryItem.consumableId
      this.issueEventIds = []

      return test(knex)
    })
  }

  afterEach() {
    return run(async knex => {
      await waitForIdle()

      if (this.issueEventIds.length > 0) {
        await knex('IssueEvent')
          .whereIn('id', this.issueEventIds)
          .delete()
      }

      await queuePurge()
    })
  }
}

module.exports = {
  createIssueTestContext,
}
