module.exports = require('../utils').seed(seed, __filename, {
  seedsFolder: 'philippines',
  staticDataFiles: ['AssayType'],
})
const { upsertGeneXpertDeviceTypeAndAssays } = require('../common')

async function seed(knex) {
  // Create admin user and audit fields
  const patientDataSchema = require('./fixtures/dataSchemas/patientDataSchema.json')
  const resultDataSchema = require('./fixtures/dataSchemas/geneXpertResultDataSchema.json')
  await upsertGeneXpertDeviceTypeAndAssays(
    knex,
    ['GxMtbRif', 'GxMtbRifUltra'],
    patientDataSchema,
    resultDataSchema
  )
}
