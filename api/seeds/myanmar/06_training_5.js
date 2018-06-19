module.exports = require('../../src/db').seed(seed)
const { rowsAsObject, seedStockIssues } = require('../utils')

const now = new Date()

async function seed(knex) {
  const { id: partnerId } = await knex('Partner')
    .where({ name: 'Myanmar' })
    .first()
  const issueTypes = await rowsAsObject(knex, 'IssueType', 'externalId')

  // Issue Resolution Triggers
  await knex('IssueResolutionTrigger').insert([
    {
      issueTypeId: issueTypes.DeviceOffline.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'sql-script',
        evaluationParameter:
          './sqlScripts/Myanmar/issues/resolutions/deviceOfflineLUNetwork.sql',
      }),
      createdOn: now,
      updatedOn: now,
    },
  ])

  // Assign ULTRA assay to TB cartridge consumable:
  const { id: assayIdUltra } = await knex('Assay')
    .where('externalId', 'GxMtbRifUltra')
    .first()

  const { id: consumableIdTb } = await knex('Consumable')
    .where('name', 'GeneXpert TB Cartridge')
    .first()

  await knex('ConsumableAssay')
    .where('assayId', assayIdUltra)
    .update('consumableId', consumableIdTb)

  await seedStockIssues(knex)
}
