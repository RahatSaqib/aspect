module.exports = require('../utils').seed(seed, __filename)

const jobFunctions = require('./fixtures/jobFunctions.json')
const contactsFromGxAlert = require('./fixtures/contactsFromGxAlert.json')
const customFieldsFromGxAlert = require('./fixtures/customFieldsFromGxAlert.json')
const geographyFromGxAlert = require('./fixtures/geography.json')
const sitesFromGxAlert = require('./fixtures/sitesFromGxAlert.json')
const {
  baseGxAlertMigration,
  ensureResultTreatmentStatuses,
} = require('../common')
const { updateReportableInResultCategoryAssay } = require('../utils')

async function seed(knex) {
  await baseGxAlertMigration(
    {
      partner: {
        name: 'Mozambique',
        serverUrl: 'https://mozambique.aspect.id:9443',
      },
      geographyFromGxAlert,
      gxAlertDevice: {
        deviceApiKeyToken: 'dwumjc2a7ke5w6a1c0e0',
      },
      sitesFromGxAlert,
      jobFunctions,
      contactsFromGxAlert,
      customFieldsFromGxAlert,
    },
    knex
  )
  await ensureResultTreatmentStatuses(knex)
  await updateReportableInResultCategoryAssay(knex)
}
