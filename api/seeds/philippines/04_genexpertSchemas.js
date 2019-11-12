module.exports = require('../utils').seed(seed, __filename, {
  seedsFolder: 'philippines',
  staticDataFiles: ['AssayType'],
})
const { upsertGeneXpertDeviceTypeAndAssays } = require('../common')
const { readJson } = require('fs-extra')

const fixturesPath = `${__dirname}/fixtures/`
const geneXpertDevicePath = `${fixturesPath}geneXpertDevice/`

async function seed(knex) {
  // Create admin user and audit fields
  const patientDataSchema = await readJson(
    `${geneXpertDevicePath}/geneXpertPatientDataSchema.json`
  )
  const resultDataSchema = await readJson(
    `${geneXpertDevicePath}/geneXpertResultDataSchema.json`
  )
  await upsertGeneXpertDeviceTypeAndAssays(
    knex,
    ['GxMtbRif', 'GxMtbRifUltra'],
    patientDataSchema,
    resultDataSchema
  )
}
