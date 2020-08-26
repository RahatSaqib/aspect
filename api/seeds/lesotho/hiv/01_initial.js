module.exports = require('../../utils').seed(seed, __filename)

const sharedSeed = require('../shared/01_initial')
const {
  adminName,
  adminPassword,
  partnerName,
  gxAlertDeviceApiKey,
} = require('./fixtures/partnerVariables.json')
const { patientData } = require('./fixtures/geneXpertPatientDataSchema.json')

async function seed(knex) {
  await sharedSeed(
    knex,
    patientData,
    adminName,
    adminPassword,
    partnerName,
    gxAlertDeviceApiKey
  )
}
