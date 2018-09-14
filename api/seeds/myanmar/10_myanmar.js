module.exports = require('../utils').seed(seed)

const { rowsAsObject } = require('../utils')

async function seed(knex) {
  // check if this seed already ran
  const issueResolutionTrigger = await knex('IssueResolutionTrigger')
    .whereRaw(
      'resolutionConditions->>"$.evaluationParameter" = "resolveIssueStockout"'
    )
    .first()
  if (issueResolutionTrigger) {
    return
  }

  const now = new Date()
  const issueTypes = await rowsAsObject(knex, 'IssueType', 'externalId')

  const { id: partnerId } = await knex('Partner')
    .where({ name: 'Myanmar' })
    .first()

  // ----------------------------------
  // add records into IssueResolutionTrigger for Stockout and StockExpiring issue types
  // ----------------------------------
  // helper function to insert into IssueResolutionTrigger if no record with specified issueTypeId and partnerId
  const addIssueResolutionTrigger = async data => {
    const { issueTypeId, partnerId } = data
    const item = await knex('IssueResolutionTrigger')
      .where({ issueTypeId, partnerId })
      .first()

    if (!item) {
      await knex('IssueResolutionTrigger').insert(data)
    }
  }
  // resolution trigger for Stockout
  await addIssueResolutionTrigger({
    issueTypeId: issueTypes.InventoryStockout.id,
    partnerId,
    resolutionConditions: JSON.stringify({
      evaluationMethod: 'plugin-function',
      evaluationParameter: 'resolveIssueStockout',
    }),
    createdOn: now,
    updatedOn: now,
  })
  // resolution trigger for StockExpiring
  await addIssueResolutionTrigger({
    issueTypeId: issueTypes.InventoryStockExpiring.id,
    partnerId,
    resolutionConditions: JSON.stringify({
      evaluationMethod: 'plugin-function',
      evaluationParameter: 'resolveIssueStockExpiring',
    }),
    createdOn: now,
    updatedOn: now,
  })
}
