module.exports = require('../utils').seed(seed)

const { rowsAsObject } = require('../utils')
const { seedDataCategory } = require('../dataCategoryLow')

async function seed(knex) {
  await seedReagentHealthResolution(knex)
  await seedDataCategory(knex, 'Myanmar')
}

async function seedReagentHealthResolution(knex) {
  const issueTypes = await rowsAsObject(knex, 'IssueType', 'externalId')

  const reagentHealthResolution = await knex('IssueResolutionTrigger')
    .where({
      issueTypeId: issueTypes.ReagentHealthError.id,
    })
    .first()

  if (reagentHealthResolution != null) {
    return
  }

  const now = new Date()
  const { id: partnerId } = await knex('Partner')
    .where({ name: 'Myanmar' })
    .first()

  await knex('IssueResolutionTrigger').insert({
    issueTypeId: issueTypes.ReagentHealthError.id,
    partnerId,
    resolutionConditions: JSON.stringify({
      evaluationMethod: 'plugin-function',
      evaluationParameter: 'resolveReagentHealthError',
    }),
    createdOn: now,
    updatedOn: now,
  })
}
