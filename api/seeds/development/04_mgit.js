module.exports = require('../utils').seed(seed)

const config = require('../../src/config')
const bcrypt = require('bcrypt')
const _ = require('lodash')
const { getPermissionModules } = require('../utils')
const {
  allAssayTypeToId,
  partnerTypeToId,
  deviceTypeCategoryToId,
  resultSourceToId,
} = require('../../src/shared/dictionary')

const saltRounds = parseInt(config.passwordSaltRounds, 10)

async function seed(knex) {
  // Skip this seed file if we already have an admin user
  const existingAdminUser = await knex('User')
    .where({ name: 'mgit' })
    .first('id')
  if (existingAdminUser) {
    return
  }

  // Create admin user and audit fields
  const now = new Date()
  const [adminId] = await knex('User').insert({
    name: 'mgit',
    password: bcrypt.hashSync('test07', saltRounds),
    approved: 1,
    createdOn: now,
    lockedOut: 0,
    failedPasswordAttempts: 0,
  })
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  // Reuse previously seeded "static" data
  const [partnerId] = await knex('Partner').insert({
    name: 'MGIT',
    partnerTypeId: await partnerTypeToId('Operating'),
    deviceLogHistoryDays: 365,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults: 14,
  })

  // MGIT Device Type
  const [deviceTypeId] = await knex('DeviceType').insert({
    externalId: 'BDMGIT',
    name: 'MGIT',
    manufacturer: 'Becton Dickinson',
    deviceTypeCategoryId: await deviceTypeCategoryToId('Lab'),
  })

  const {
    'TB G&D': assayTypeTBGNDId,
    'TB AST': assayTypeTBASTId,
  } = await allAssayTypeToId()
  const resultSourceDiagnosticId = await resultSourceToId('DiagnosticDevice')

  await knex('Assay').insert({
    name: 'MGIT G&D',
    i18nKey: 'assayBDMGITBND',
    externalId: 'GND',
    assayTypeId: assayTypeTBGNDId,
    deviceTypeId,
    resultSourceId: resultSourceDiagnosticId,
    resultCategory1Label: 'Status',
    resultDataSchema: JSON.stringify({
      growthUnits: {
        title: 'Growth Units',
        type: 'string',
        order: 1,
      },
      protocolLength: {
        title: 'Protocol Length',
        type: 'string',
        order: 2,
      },
    }),
    patientDataSchema: JSON.stringify({}),
  })

  await knex('Assay').insert({
    name: 'MGIT AST',
    i18nKey: 'assayBDMGITAST',
    externalId: 'AST',
    assayTypeId: assayTypeTBASTId,
    deviceTypeId,
    resultSourceId: resultSourceDiagnosticId,
    resultCategory1Label: 'Status',
    resultDataSchema: JSON.stringify({
      growthUnits: {
        title: 'Growth Units',
        type: 'string',
        order: 1,
      },
      treatment: {
        title: 'Treatment',
        type: 'string',
        order: 2,
      },
      concentration: {
        title: 'Concentration',
        type: 'string',
        order: 3,
      },
    }),
    patientDataSchema: JSON.stringify({}),
  })

  const modules = await getPermissionModules(knex)
  const featureModules = await knex('Feature').select('id')

  const [usCountry] = await knex('Country as c')
    .where({ 'c.a3': 'USA' })
    .select('c.id', 'c.culture', 'c.timezone')

  const { culture, timezone, id: countryId } = usCountry

  const { id: geographyId } = await knex('Geography')
    .where({ countryId })
    .whereNull('stateId')
    .whereNull('lgaId')
    .first()

  // Permissions for MGIT Admin
  const [adminPersonId] = await knex('Person').insert(
    Object.assign(
      {
        userId: adminId,
        name: 'MGIT Admin',
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
  await Promise.all(
    _.map(featureModules, async ({ id: featureId }) => {
      await knex('JobFunctionFeature').insert([
        {
          jobFunctionId: jobFunctionIdAdmin,
          featureId,
        },
      ])
    })
  )

  await knex('JobFunctionPermission').insert([
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.demo.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.device.admin },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.deviceApiKey.admin,
    },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.result.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.person.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.site.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.assay.admin },
  ])

  const [jobIdAdmin] = await knex('Job').insert([
    { personId: adminPersonId, jobFunctionId: jobFunctionIdAdmin },
  ])
  await knex('JobContext').insert({ jobId: jobIdAdmin, geographyId })

  // sites
  const sites = []
  for (const siteNum of ['1', '2', '3']) {
    const siteData = Object.assign(
      {
        partnerId,
        geographyId,
        name: `Site ${siteNum}`,
        shortName: `Site ${siteNum}`,
        externalId: `site${siteNum}`,
      },
      auditFields
    )
    sites.push(knex('Site').insert(siteData))
  }
  await Promise.all(sites)
}
