module.exports = require('../utils').seed(seed, __filename)

const jobFunctionsFixture = require('./fixtures/jobFunctions')
const contactsFromGxAlert = require('./fixtures/contactsFromGxAlert.json')
const customFieldsFromGxAlert = require('./fixtures/customFieldsFromGxAlert.json')
const geographyFromGxAlert = require('./fixtures/geography.json')
const sitesFromGxAlert = require('./fixtures/sitesFromGxAlert.json')
const AssayBdMgitAstResultDataSchema = require('../fixtures/AssayBdMgitAstResultDataSchema.json')
const AssayBdMgitGndResultDataSchema = require('../fixtures/AssayBdMgitGndResultDataSchema.json')
const {
  baseGxAlertMigration,
  ensureResultTreatmentStatuses,
} = require('../common')
const { upsertMGITDeviceTypeAndAssays } = require('../commonTB')
const {
  addDeviceCapacities,
  setCapacityForExistingDevices,
  updateReportableInResultCategoryAssay,
} = require('../utils')

async function seed(knex) {
  const { patientDataSchema } = await baseGxAlertMigration(
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
      jobFunctionsFixture,
      contactsFromGxAlert,
      customFieldsFromGxAlert,
    },
    knex
  )
  await ensureResultTreatmentStatuses(knex)
  await updateReportableInResultCategoryAssay(knex)

  await upsertMGITDeviceTypeAndAssays(
    knex,
    patientDataSchema,
    AssayBdMgitGndResultDataSchema,
    AssayBdMgitAstResultDataSchema
  )

  await addDeviceCapacities(knex)
  await setCapacityForExistingDevices(knex)
}
