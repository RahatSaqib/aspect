module.exports = require('../utils').seed(seed, __filename, {
  seedsFolder: 'philippines',
  staticDataFiles: ['AssayType'],
})
const { upsertGeneXpertDeviceTypeAndAssays } = require('../common')

async function seed(knex) {
  // Create admin user and audit fields
  const patientDataSchema = require('./fixtures/dataSchemas/patientDataSchema.json')
  const mtbRifResultDataSchema = require('./fixtures/dataSchemas/geneXpertResultDataSchemaMtbRif.json')
  await upsertGeneXpertDeviceTypeAndAssays(
    knex,
    ['GxMtbRif'],
    patientDataSchema,
    mtbRifResultDataSchema
  )
  const mtbRifUltraResultDataSchema = require('./fixtures/dataSchemas/geneXpertResultDataSchemaMtbRifUltra.json')
  await upsertGeneXpertDeviceTypeAndAssays(
    knex,
    ['GxMtbRifUltra'],
    patientDataSchema,
    mtbRifUltraResultDataSchema
  )
}
