/* eslint no-await-in-loop: 0 */
module.exports = require('../utils').seed(seed)

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

  /* TODO Add configuration schema once UI supports and we synchronize correctly
  // define configurationData object
  const reporterConfigurationDataSchema = JSON.stringify({
    requirePrinter: {
      title: 'Require printer',
      type: 'string'
    },
    adminPassword: {
      title: 'Admin password',
      type: 'string'
    },
    firmwareUpdateRequired: {
      title: 'Firmware update required',
      type: 'string'
    },
    userPins: {
      title: 'Pins',
      type: 'object',
      i18nKey: 'User Pins',
      properties: {
        user1Pin: {
          title: 'user1Pin',
          type: 'string'
        },
        user1Name: {
          title: 'user1Name',
          type: 'string'
        },
        user1Assays: {
          title: 'user1Assays',
          type: 'array'
        },
        user2Pin: {
          title: 'user2Pin',
          type: 'string'
        },
        user2Name: {
          title: 'user2Name',
          type: 'string'
        },
        user2Assays: {
          title: 'user2Assays',
          type: 'array'
        },
        user3Pin: {
          title: 'user3Pin',
          type: 'string'
        },
        user3Name: {
          title: 'user3Name',
          type: 'string'
        },
        user3Assays: {
          title: 'user3Assays',
          type: 'array'
        },
        user4Pin: {
          title: 'user4Pin',
          type: 'string'
        },
        user4Name: {
          title: 'user4Name',
          type: 'string'
        },
        user4Assays: {
          title: 'user4Assays',
          type: 'array'
        },
        user5Pin: {
          title: 'user5Pin',
          type: 'string'
        },
        user5Name: {
          title: 'user5Name',
          type: 'string'
        },
        user5Assays: {
          title: 'user5Assays',
          type: 'array'
        },
        adminPin: {
          title: 'adminPin',
          type: 'string'
        },
        adminName: {
          title: 'adminName',
          type: 'string'
        },
        adminAssays: {
          title: 'adminAssays',
          type: 'array'
        }
      }
    }
  })
*/

  // Reporter Device Type
  const [deviceTypeIdReporter] = await knex('DeviceType').insert({
    externalId: 'AspectReporter',
    name: 'Aspect Reporter',
    manufacturer: 'SystemOne',
    deviceTypeCategoryId: await deviceTypeCategoryToId('Client'),
    // configurationDataSchema: reporterConfigurationDataSchema
  })

  const resultSourceGeneratedId = await resultSourceToId('Generated')

  await knex('Assay').insert({
    name: 'Reporter HIV VL',
    i18nKey: 'AssayReporterHivVl',
    externalId: 'HivVl',
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
    i18nKey: 'AssayReporterEid',
    externalId: 'EID',
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
    { jobFunctionId: jobFunctionIdLabAdmin, permissionId: modules.site.admin },
    { jobFunctionId: jobFunctionIdLabAdmin, permissionId: modules.assay.admin },
    { jobFunctionId: jobFunctionIdLabAdmin, permissionId: modules.browse.view },
  ])

  await knex('JobFunctionPermission').insert([
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.demo.admin },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.deviceApiKey.admin,
    },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.device.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.person.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.result.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.site.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.assay.admin },
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
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.report.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.browse.view },
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
    LessThan1000: resultCategoryLessThan1000Id,
    MoreThan1000: resultCategoryMoreThan1000Id,
    CollectNewSample: resultCategoryCollectNewSampleId,
  } = await allResultCategoryToId()

  // Reuse previously seeded "static" data
  const { id: assayIdEid } = await knex('Assay')
    .where('name', 'CHAI EID')
    .first()

  const { id: assayIdHivVl } = await knex('Assay')
    .where('name', 'CHAI HIV VL')
    .first()

  // EID results:
  // assign categories to assay
  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryNotDetectedId,
    assayId: assayIdEid,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryDetectedId,
    assayId: assayIdEid,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryIndeterminateId,
    assayId: assayIdEid,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryErrorId,
    assayId: assayIdEid,
  })

  // HIV VL results:
  // assign categories to assay
  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryLessThan1000Id,
    assayId: assayIdHivVl,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryMoreThan1000Id,
    assayId: assayIdHivVl,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryCollectNewSampleId,
    assayId: assayIdHivVl,
  })

  await knex('ResultCategoryAssay').insert({
    resultCategoryId: resultCategoryErrorId,
    assayId: assayIdHivVl,
  })
}
