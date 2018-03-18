module.exports = require('../../src/db').seed(seed)

const config = require('../../src/config')
const bcrypt = require('bcrypt')
const _ = require('lodash')

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
  const partnerTypes = await rowsAsObject(knex, 'PartnerType')
  const [partnerId] = await knex('Partner').insert({
    name: 'MGIT',
    partnerTypeId: partnerTypes.Operating.id,
    deviceLogHistoryDays: 365,
    maxDaysDeviceOffline: 7,
  })
  const deviceTypeCategories = await rowsAsObject(knex, 'DeviceTypeCategory')
  const assayTypes = await rowsAsObject(knex, 'AssayType')
  const resultSources = await rowsAsObject(knex, 'ResultSource', 'externalId')

  // MGIT Device Type
  const [deviceTypeId] = await knex('DeviceType').insert({
    externalId: 'BDMGIT',
    name: 'MGIT',
    manufacturer: 'Becton Dickinson',
    deviceTypeCategoryId: deviceTypeCategories.Lab.id,
  })

  await knex('Assay').insert({
    name: 'MGIT G&D',
    i18nKey: 'assayBDMGITBND',
    externalId: 'GND',
    assayTypeId: assayTypes['TB G&D'].id,
    deviceTypeId,
    resultSourceId: resultSources.DiagnosticDevice.id,
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
    assayTypeId: assayTypes['TB AST'].id,
    deviceTypeId,
    resultSourceId: resultSources.DiagnosticDevice.id,
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

  const modules = await knex('Permission').reduce((memo, row) => {
    if (!memo[row.module]) {
      memo[row.module] = {}
    }
    memo[row.module][row.activity] = row.id
    return memo
  }, {})

  const featureModules = await knex('Feature').reduce((memo, row) => {
    if (!memo[row.module]) {
      memo[row.module] = {}
    }
    memo[row.module][Boolean(row.enable)] = row.id
    return memo
  }, {})

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
    _.map(featureModules, async (module, key) => {
      await knex('JobFunctionFeature').insert([
        {
          jobFunctionId: jobFunctionIdAdmin,
          featureId: featureModules[key].true,
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
    // dasboard permissions - admin
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.summaryDashboard.admin,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.resultDashboard.admin,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.inventoryItemDashboard.admin,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.deviceDashboard.admin,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.siteDashboard.admin,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.operationalDashboard.admin,
    },
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
        shortname: `Site ${siteNum}`,
        externalId: `site${siteNum}`,
      },
      auditFields
    )
    sites.push(knex('Site').insert(siteData))
  }
  await Promise.all(sites)
}

function rowsAsObject(knex, table, column = 'name') {
  return knex(table).reduce((memo, row) => {
    memo[row[column]] = row
    return memo
  }, {})
}
