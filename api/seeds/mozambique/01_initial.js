module.exports = require('../utils').seed(seed, __filename)

const { partnerName, deviceApiToken, serverUrl } = require('./fixtures/partnerData')
const jobFunctionsFixture = require('./fixtures/jobFunctions')
const contactsFromGxAlert = require('./fixtures/contactsFromGxAlert.json')
const customFieldsFromGxAlert = require('./fixtures/customFieldsFromGxAlert.json')
const geographyFromGxAlert = require('./fixtures/geography.json')
const sitesFromGxAlert = require('./fixtures/sitesFromGxAlert.json')
const AssayBdMgitAstResultDataSchema = require('../fixtures/AssayBdMgitAstResultDataSchema.json')
const AssayBdMgitGndResultDataSchema = require('../fixtures/AssayBdMgitGndResultDataSchema.json')
const { baseGxAlertMigration, ensureResultTreatmentStatuses } = require('../common')
const { upsertMGITDeviceTypeAndAssays } = require('../commonTB')
const {
  addDeviceCapacities,
  setCapacityForExistingDevices,
  updateReportableInResultCategoryAssay,
} = require('../utils')
const partnerData = require('./fixtures/partnerData')

async function seed(knex) {
  const { patientDataSchema } = await baseGxAlertMigration(
    {
      partner: {
        name: partnerName,
        serverUrl,
      },
      geographyFromGxAlert,
      gxAlertDevice: {
        deviceApiKeyToken: deviceApiToken,
      },
      sitesFromGxAlert,
      jobFunctionsFixture,
      contactsFromGxAlert,
      customFieldsFromGxAlert,
    },
    knex,
    partnerData
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
