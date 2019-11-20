module.exports = require('../utils').seed(seed, __filename, {
  seedsFolder: 'philippines',
  staticDataFiles: ['AssayType'],
})
const { upsertGeneXpertDeviceTypeAndAssays } = require('../common')

async function seed(knex) {
  // Create admin user and audit fields
  const patientDataSchema = require('./fixtures/geneXpertDevice/geneXpertPatientDataSchema.json')
  const resultDataSchema = require('./fixtures/geneXpertDevice/geneXpertResultDataSchema.json')
  await upsertGeneXpertDeviceTypeAndAssays(
    knex,
    ['GxMtbRif', 'GxMtbRifUltra'],
    patientDataSchema,
    resultDataSchema
  )
}
