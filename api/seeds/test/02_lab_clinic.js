/* eslint no-await-in-loop: 0 */
module.exports = require('../utils').seed(seed, __filename)

const bcrypt = require('bcrypt')
const _ = require('lodash')
const { subMonths } = require('date-fns')

const config = require('../../src/config')

const {
  getPermissionModules,
  assignAllFeaturesToJobFunctionIds,
} = require('../utils')
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
  const existingAdminUser = await knex('User')
    .where({ name: 'reporter_admin' })
    .first('id')
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
  const [malawiCountry] = await knex('Country as c')
    .where({ 'c.a3': 'MWI' })
    .select('c.id', 'c.culture', 'c.timezone')

  const { culture, timezone, id: countryId } = malawiCountry

  const { id: geographyId } = await knex('Geography')
    .where({ countryId })
    .first()

  // Permissions for Reporter Admin
  const [adminPersonId] = await knex('Person').insert(
    Object.assign(
      {
        userId: adminId,
        name: 'Reporter Admin',
        lastPartnerId: partnerId,
        lastCountryId: countryId,
        geographyId,
        culture,
        timezone,
      },
      auditFields
    )
  )

  const [jobFunctionIdAdmin] = await knex('JobFunction').insert({
    name: 'Admin',
    partnerId,
  })

  const [jobFunctionIdLabAdmin] = await knex('JobFunction').insert({
    name: 'Lab Admin',
    partnerId,
  })

  await assignAllFeaturesToJobFunctionIds(knex, [
    jobFunctionIdLabAdmin,
    jobFunctionIdAdmin,
  ])

  await knex('JobFunctionPermission').insert([
    {
      jobFunctionId: jobFunctionIdLabAdmin,
      permissionId: modules.device.admin,
    },
    {
      jobFunctionId: jobFunctionIdLabAdmin,
      permissionId: modules.result.admin,
    },
    {
      jobFunctionId: jobFunctionIdLabAdmin,
      permissionId: modules.site.admin,
    },
    {
      jobFunctionId: jobFunctionIdLabAdmin,
      permissionId: modules.assay.admin,
    },
    {
      jobFunctionId: jobFunctionIdLabAdmin,
      permissionId: modules.browse.view,
    },
  ])

  await knex('JobFunctionPermission').insert([
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.demo.admin },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.deviceApiKey.admin,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.device.admin,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.person.admin,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.result.admin,
    },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.site.admin },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.assay.admin,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.inventory.admin,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.notification.admin,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.issue.admin,
    },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.task.admin },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.report.admin,
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

  const [jobIdAdmin] = await knex('Job').insert([
    { personId: adminPersonId, jobFunctionId: jobFunctionIdAdmin },
  ])
  await knex('JobContext').insert({ jobId: jobIdAdmin, geographyId })

  // Results section
  const {
    Detected: resultCategoryDetectedId,
    NotDetected: resultCategoryNotDetectedId,
    Indeterminate: resultCategoryIndeterminateId,
    Error: resultCategoryErrorId,
    LessThan40: resultCategoryLessThan40Id,
    LessThan550: resultCategoryLessThan550Id,
    LessThan1000: resultCategoryLessThan1000Id,
    MoreThan40: resultCategoryMoreThan40Id,
    MoreThan550: resultCategoryMoreThan550Id,
    MoreThan1000: resultCategoryMoreThan1000Id,
    CollectNewSample: resultCategoryCollectNewSampleId,
  } = await allResultCategoryToId()

  // Reuse previously seeded "static" data
  const { id: assayIdAbbottM2000Eid } = await knex('Assay')
    .where('externalId', 'abbottM2000HIVEID')
    .first()

  const { id: assayIdChaiEid } = await knex('Assay')
    .where('name', 'CHAI EID')
    .first()

  const { id: assayIdAbbottM2000PlasmaHivVl } = await knex('Assay')
    .where('externalId', 'abbottM2000PlasmaHivVL')
    .first()

  const { id: assayIdAbbottM2000DBSHivVl } = await knex('Assay')
    .where('externalId', 'abbottM2000DBSHivVL')
    .first()

  const { id: assayIdChaiHivVl } = await knex('Assay')
    .where('name', 'CHAI HIV VL')
    .first()

  // EID results:
  // assign categories to assay
  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryNotDetectedId,
    assayId: assayIdAbbottM2000Eid,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryDetectedId,
    assayId: assayIdAbbottM2000Eid,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryIndeterminateId,
    assayId: assayIdAbbottM2000Eid,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryErrorId,
    assayId: assayIdAbbottM2000Eid,
  })

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
    resultCategoryId: resultCategoryDetectedId,
    assayId: assayIdAbbottM2000PlasmaHivVl,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryNotDetectedId,
    assayId: assayIdAbbottM2000PlasmaHivVl,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryLessThan40Id,
    assayId: assayIdAbbottM2000PlasmaHivVl,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryMoreThan40Id,
    assayId: assayIdAbbottM2000PlasmaHivVl,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryErrorId,
    assayId: assayIdAbbottM2000PlasmaHivVl,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryDetectedId,
    assayId: assayIdAbbottM2000DBSHivVl,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryNotDetectedId,
    assayId: assayIdAbbottM2000DBSHivVl,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryLessThan550Id,
    assayId: assayIdAbbottM2000DBSHivVl,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryMoreThan550Id,
    assayId: assayIdAbbottM2000DBSHivVl,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryErrorId,
    assayId: assayIdAbbottM2000DBSHivVl,
  })

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
