/* eslint no-await-in-loop: 0 */
module.exports = require('../utils').seed(seed, __filename)

const bcrypt = require('bcrypt')
const _ = require('lodash')
const { subMonths } = require('date-fns')
const { upsertJobFunction } = require('../common')
const config = require('../../src/config')
const { getPermissionModules } = require('../utils')
const {
  allResultCategoryToId,
  assayTypeToId,
  partnerTypeToId,
  deviceTypeCategoryToId,
  resultSourceToId,
} = require('../../src/shared/dictionary')

const saltRounds = parseInt(config.passwordSaltRounds, 10)

const now = new Date()

async function seed(knex) {
  // Skip this seed file if we already have an admin user
  const existingAdminUser = await knex('User').where({ name: 'reporter_admin' }).first('id')
  if (existingAdminUser) {
    return
  }
  // Create admin user and audit fields
  const [adminId] = await knex('User').insert({
    name: 'reporter_admin',
    password: bcrypt.hashSync('test07', saltRounds),
    approved: 1,
    createdOn: now,
    lockedOut: 0,
    failedPasswordAttempts: 0,
  })
  const auditFields = {
    createdOn: subMonths(now, 30),
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  // Reuse previously seeded "static" data
  const [partnerId] = await knex('Partner').insert({
    name: 'Reporter',
    partnerTypeId: await partnerTypeToId('Operating'),
    plugin: 'malawi',
    deviceLogHistoryDays: 365,
    autoAcknowledgeOlderThanDays: 28,
    numberToLeaveUnacknowledged: 15,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults: 14,
  })

  // Reporter Device Type
  const [deviceTypeIdReporter] = await knex('DeviceType').insert({
    externalId: 'AspectReporter',
    name: 'Aspect Reporter',
    manufacturer: 'SystemOne',
    deviceTypeCategoryId: await deviceTypeCategoryToId('Client'),
  })

  const resultSourceGeneratedId = await resultSourceToId('Generated')

  await knex('Assay').insert({
    name: 'Reporter HIV VL',
    abbreviation: 'Reporter HIV VL',
    i18nKey: 'AssayReporterHivVl',
    externalId: 'ReporterHivVL',
    assayTypeId: await assayTypeToId('HIV VL'),
    deviceTypeId: deviceTypeIdReporter,
    resultSourceId: resultSourceGeneratedId,
    resultCategory1Label: 'HIV',
    resultCategory1i18nKey: 'resultCategoryHivVl',
    resultDataSchema: JSON.stringify({
      resultText: {
        title: 'Result',
        type: 'string',
      },
      interpretation: {
        title: 'Interpretation',
        type: 'string',
      },
    }),
    patientDataSchema: JSON.stringify({
      name: {
        title: 'Client Name',
        type: 'string',
        order: 1,
      },
      surname: {
        title: 'Client Surname',
        type: 'string',
        order: 2,
      },
      artNumber: {
        title: 'ART #',
        type: 'string',
        order: 4,
      },
      age: {
        title: 'Age (months)',
        type: 'string',
        order: 3,
      },
      dateOfBirth: {
        title: 'Date of Birth',
        type: 'string',
        order: 4,
      },
      gender: {
        title: 'Gender',
        type: 'string',
        order: 5,
      },
      provider: {
        title: 'Provider',
        type: 'string',
        order: 7,
      },
      phone: {
        title: 'Phone #',
        type: 'string',
        order: 8,
      },
    }),
  })

  await knex('Assay').insert({
    name: 'Reporter EID',
    abbreviation: 'Reporter EID',
    i18nKey: 'AssayReporterEid',
    externalId: 'ReporterEID',
    assayTypeId: await assayTypeToId('EID'),
    deviceTypeId: deviceTypeIdReporter,
    resultSourceId: resultSourceGeneratedId,
    resultCategory1Label: 'EID',
    resultCategory1i18nKey: 'resultCategoryEid',
    resultDataSchema: JSON.stringify({
      resultText: {
        title: 'Result',
        type: 'string',
      },
      interpretation: {
        title: 'Interpretation',
        type: 'string',
      },
    }),
    patientDataSchema: JSON.stringify({
      name: {
        title: 'Client Name',
        type: 'string',
        order: 1,
      },
      surname: {
        title: 'Client Surname',
        type: 'string',
        order: 2,
      },
      age: {
        title: 'Age (months)',
        type: 'string',
        order: 3,
      },
      dateOfBirth: {
        title: 'Date of Birth',
        type: 'string',
        order: 4,
      },
      gender: {
        title: 'Gender',
        type: 'string',
        order: 5,
      },
      hccNumber: {
        title: 'HCC #',
        type: 'string',
        order: 6,
      },
      motherName: {
        title: 'Mother Name',
        type: 'string',
        order: 7,
      },
      motherSurname: {
        title: 'Mother Surname',
        type: 'string',
        order: 8,
      },
      phone: {
        title: 'Phone #',
        type: 'string',
        order: 9,
      },
    }),
  })

  const modules = await getPermissionModules(knex)

  // Create clinics for every state in Malawi
  const [malawiCountry] = await knex('Country as c').where({ 'c.a3': 'MWI' }).select('c.id', 'c.culture', 'c.timezone')

  const { culture, timezone, id: countryId } = malawiCountry

  const { id: geographyId } = await knex('Geography').where({ countryId }).first()

  // Permissions for Reporter Admin
  const [adminPersonId] = await knex('Person').insert({
    userId: adminId,
    name: 'Reporter Admin',
    lastPartnerId: partnerId,
    lastCountryId: countryId,
    geographyId,
    culture,
    timezone,
    ...auditFields,
  })

  const jobFunctionIdAdmin = await upsertJobFunction(knex, 'Admin', partnerId)

  const jobFunctionIdLabAdmin = await upsertJobFunction(knex, 'Lab Admin', partnerId)

  await knex('JobFunctionPermission').insert([
    {
      jobFunctionId: jobFunctionIdLabAdmin,
      permissionId: modules.device.edit,
    },
    {
      jobFunctionId: jobFunctionIdLabAdmin,
      permissionId: modules.result.edit,
    },
    {
      jobFunctionId: jobFunctionIdLabAdmin,
      permissionId: modules.site.edit,
    },
    {
      jobFunctionId: jobFunctionIdLabAdmin,
      permissionId: modules.assay.edit,
    },
    {
      jobFunctionId: jobFunctionIdLabAdmin,
      permissionId: modules.browse.view,
    },
  ])

  await knex('JobFunctionPermission').insert([
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.demo.edit },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.deviceApiKey.edit,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.device.edit,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.person.edit,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.result.edit,
    },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.site.edit },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.assay.edit,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.inventory.edit,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.notification.edit,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.issue.edit,
    },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.task.edit },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.report.edit,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.browse.view,
    },
  ])

  // add widgets
  const widgets = await knex('DashboardWidget').select('id', 'title')
  await knex('JobFunctionDashboardWidget').insert([
    {
      jobFunctionId: jobFunctionIdLabAdmin,
      widgetId: _.find(widgets, { title: 'Results' }).id,
    },
    {
      jobFunctionId: jobFunctionIdLabAdmin,
      widgetId: _.find(widgets, { title: 'Contacts' }).id,
    },
    {
      jobFunctionId: jobFunctionIdLabAdmin,
      widgetId: _.find(widgets, { title: 'Devices' }).id,
    },
    {
      jobFunctionId: jobFunctionIdLabAdmin,
      widgetId: _.find(widgets, { title: 'Sites' }).id,
    },

    {
      jobFunctionId: jobFunctionIdAdmin,
      widgetId: _.find(widgets, { title: 'Results' }).id,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      widgetId: _.find(widgets, { title: 'Contacts' }).id,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      widgetId: _.find(widgets, { title: 'Devices' }).id,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      widgetId: _.find(widgets, { title: 'Sites' }).id,
    },
  ])

  const [jobIdAdmin] = await knex('Job').insert([{ personId: adminPersonId, jobFunctionId: jobFunctionIdAdmin }])
  await knex('JobContext').insert({ jobId: jobIdAdmin, geographyId })

  // Results section
  const {
    Detected: resultCategoryDetectedId,
    NotDetected: resultCategoryNotDetectedId,
    Indeterminate: resultCategoryIndeterminateId,
    Error: resultCategoryErrorId,
    LessThan1000: resultCategoryLessThan1000Id,
    MoreThan1000: resultCategoryMoreThan1000Id,
    CollectNewSample: resultCategoryCollectNewSampleId,
  } = await allResultCategoryToId()

  // Reuse previously seeded "static" data
  const { id: assayIdChaiEid } = await knex('Assay').where('name', 'CHAI EID').first()

  const { id: assayIdChaiHivVl } = await knex('Assay').where('name', 'CHAI HIV VL').first()

  // EID results:
  // assign categories to assay
  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryNotDetectedId,
    assayId: assayIdChaiEid,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryDetectedId,
    assayId: assayIdChaiEid,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryIndeterminateId,
    assayId: assayIdChaiEid,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryErrorId,
    assayId: assayIdChaiEid,
  })

  // HIV VL results:
  // assign categories to assay
  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryLessThan1000Id,
    assayId: assayIdChaiHivVl,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryMoreThan1000Id,
    assayId: assayIdChaiHivVl,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryCollectNewSampleId,
    assayId: assayIdChaiHivVl,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryErrorId,
    assayId: assayIdChaiHivVl,
  })
}
