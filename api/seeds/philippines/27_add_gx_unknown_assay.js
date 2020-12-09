module.exports = require('../utils').seed(seed, __filename)
const { upsertGeneXpertDeviceTypeAndAssays } = require('../common')

async function seed(knex) {
  // Create admin user and audit fields
  const patientDataSchema = require('./fixtures/dataSchemas/patientDataSchema.json')
  const mtbRifResultDataSchema = require('./fixtures/dataSchemas/geneXpertResultDataSchemaMTBRif.json')
  await upsertGeneXpertDeviceTypeAndAssays(
    knex,
    ['GxMtbRif', 'GxMtbRifUltra', 'GxUnknown'],
    patientDataSchema,
    mtbRifResultDataSchema
  )
}
