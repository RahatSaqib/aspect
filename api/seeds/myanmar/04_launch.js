module.exports = require('../../src/db').seed(seed)
const { rowsAsObject } = require('../utils')

const { seedDataCategory } = require('./fixtures/dataCategoryLow')

const now = new Date()

async function seed(knex) {
  const [myanmarCountry] = await knex('Country as c')
    .where({ 'c.a3': 'MMR' })
    .select('c.id', 'c.culture', 'c.timezone')
  const countryId = myanmarCountry.id

  const { id: myanmarGeographyId } = await knex('Geography')
    .where({ countryId })
    .whereNull('stateId', 'lgaId')
    .first()

  // Create admin user and audit fields
  const { id: adminId } = await knex('User')
    .where({ name: 'myanmar_admin' })
    .first('id')

  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  // Reuse previously seeded "static" data
  const [
    // for seeding DataCategory
    messageSeverities,
    issueCategories,
  ] = await Promise.all([
    rowsAsObject(knex, 'MessageSeverity', 'externalId'),
    rowsAsObject(knex, 'IssueCategory', 'externalId'),
  ])

  // Data Category
  await seedDataCategory(knex, {
    auditFields,
    myanmarGeographyId,
    issueCategoryId: issueCategories.DataHealth.id,
    messageSeverityId: messageSeverities.Alert.id,
  })
}
