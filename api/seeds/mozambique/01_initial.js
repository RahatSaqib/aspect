module.exports = require('../utils').seed(seed, __filename)

const jobFunctions = require('./fixtures/jobFunctions.json')
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
      jobFunctions,
      contactsFromGxAlert,
      customFieldsFromGxAlert,
    },
    knex
  )
  await ensureResultTreatmentStatuses(knex)
  await updateReportableInResultCategoryAssay(knex)

  const mgitPatientDataSchema = {
    ...patientDataSchema,
    xpertMtbRifResult: {
      title: 'XPERT MTB RIF Result',
      type: 'string',
      order: 8,
    },
    dateStartedOnTreatment: {
      title: 'Date Started on TX',
      type: 'string',
      order: 9,
    },
    baselineCulture: {
      title: 'Baseline Culture',
      type: 'string',
      order: 10,
    },
    lpaFl: {
      title: 'LPA FL',
      type: 'string',
      order: 5,
    },
    lpaSl: {
      title: 'LPA SL',
      type: 'string',
      order: 11,
    },
    mgitSire: {
      title: 'MGIT SIRE',
      type: 'string',
      order: 12,
    },
  }
  const assayBdMgitAstResultDataSchema = {
    ...AssayBdMgitAstResultDataSchema,
    dateLjGrowth: {
      list: false,
      order: 18,
      type: 'date',
      title: 'Date LJ Growth',
    },
    ljGrowthClCount: {
      list: false,
      order: 19,
      type: 'number',
      title: 'CL Count',
    },
    ljGrowthZn: {
      list: false,
      order: 20,
      type: 'number',
      title: 'LJ Growth ZN',
    },
    mgitTurbidity: {
      list: false,
      order: 21,
      type: 'string',
      title: 'Turbidity',
    },
    ba: {
      list: false,
      order: 22,
      type: 'string',
      title: 'B/A',
    },
    actionTaken: {
      list: false,
      order: 23,
      type: 'string',
      title: 'Action Taken',
    },
    doneBy: {
      list: false,
      order: 24,
      type: 'string',
      title: 'Done By',
    },
  }
  const assayBdMgitGndResultDataSchema = {
    ...AssayBdMgitGndResultDataSchema,
    dateInoculated: {
      list: false,
      order: 12,
      type: 'date',
      title: 'Date Inoculated',
    },
    dateFlaggedScanned: {
      list: false,
      order: 13,
      type: 'date',
      title: 'Date Flagged Positive/Scanned Out',
    },
    dateLjGrowth: {
      list: false,
      order: 14,
      type: 'date',
      title: 'Date LJ Growth',
    },
    ljGrowthClCount: {
      list: false,
      order: 15,
      type: 'number',
      title: 'CL Count',
    },
    ljGrowthZn: {
      list: false,
      order: 16,
      type: 'number',
      title: 'LJ Growth ZN',
    },
    mgitTurbidity: {
      list: false,
      order: 17,
      type: 'string',
      title: 'Turbidity',
    },
    ba: {
      list: false,
      order: 18,
      type: 'string',
      title: 'B/A',
    },
    actionTaken: {
      list: false,
      order: 19,
      type: 'string',
      title: 'Action Taken',
    },
    doneBy: {
      list: false,
      order: 20,
      type: 'string',
      title: 'Done By',
    },
  }
  await upsertMGITDeviceTypeAndAssays(
    knex,
    mgitPatientDataSchema,
    assayBdMgitGndResultDataSchema,
    assayBdMgitAstResultDataSchema
  )

  await addDeviceCapacities(knex)
  await setCapacityForExistingDevices(knex)
}
