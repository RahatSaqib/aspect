module.exports = require('../../src/db').seed(seed)
const { rowsAsObject } = require('../utils')
const { seedDataCategory } = require('./fixtures/dataCategoryLow')

const now = new Date()

async function seed(knex) {
  const { id: adminId } = await knex('User as u')
    .where({ 'u.name': 'myanmar_admin' })
    .first('u.id')

  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  // Reuse previously seeded "static" data
  const [issueTypes, issueCategories, messageSeverities] = await Promise.all([
    rowsAsObject(knex, 'IssueType', 'externalId'),
    rowsAsObject(knex, 'IssueCategory', 'externalId'),
    rowsAsObject(knex, 'MessageSeverity', 'externalId'),
  ])

  const { id: partnerId } = await knex('Partner')
    .where({ name: 'Myanmar' })
    .first()

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

  const [myanmarCountry] = await knex('Country as c')
    .where({ 'c.a3': 'MMR' })
    .select('c.id', 'c.culture', 'c.timezone')
  const countryId = myanmarCountry.id

  const { id: myanmarGeographyId } = await knex('Geography')
    .where({ countryId })
    .whereNull('stateId', 'lgaId')
    .first()

  // Data Category
  await seedDataCategory(knex, {
    auditFields,
    myanmarGeographyId,
    issueCategoryId: issueCategories.DataHealth.id,
    messageSeverityId: messageSeverities.Alert.id,
  })
}
