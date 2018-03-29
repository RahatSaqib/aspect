module.exports = require('../../src/db').seed(seed)

const config = require('../../src/config')
const bcrypt = require('bcrypt')
const _ = require('lodash')

const saltRounds = parseInt(config.passwordSaltRounds, 10)

async function seed(knex) {
  // Skip this seed file if we already have an admin user
  const existingAdminUser = await knex('User')
    .where({ name: 'blusense' })
    .first('id')
  if (existingAdminUser) {
    return
  }

  // Create admin user and audit fields
  const now = new Date()
  const [adminId] = await knex('User').insert({
    name: 'blusense',
    password: bcrypt.hashSync('blu2017', saltRounds),
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
    name: 'BluSense',
    partnerTypeId: partnerTypes.Operating.id,
    deviceLogHistoryDays: 365,
    maxDaysDeviceOffline: 7,
  })
  const deviceTypeCategories = await rowsAsObject(knex, 'DeviceTypeCategory')
  const resultSources = await rowsAsObject(knex, 'ResultSource', 'externalId')
  const assayTypes = await rowsAsObject(knex, 'AssayType')

  // BluSense Device Type
  const [deviceTypeId] = await knex('DeviceType').insert({
    externalId: 'BluSenseBluBox',
    name: 'BluBox',
    manufacturer: 'BluSense',
    deviceTypeCategoryId: deviceTypeCategories.Lab.id,
  })

  await knex('Assay').insert({
    name: 'BluSense Dengue',
    i18nKey: 'assayBlusenseDengue',
    externalId: 'Dengue',
    assayTypeId: assayTypes.Dengue.id,
    deviceTypeId,
    resultSourceId: resultSources.DiagnosticDevice.id,
    resultCategory1Label: 'Status',
    resultDataSchema: JSON.stringify({
      resultText: {
        title: 'Result Text',
        type: 'string',
      },
    }),
    patientDataSchema: JSON.stringify({
      name: {
        type: 'string',
        order: 1,
        title: 'Client Name',
      },
      surname: {
        type: 'string',
        order: 2,
        title: 'Client Surname',
      },
      gender: {
        type: 'string',
        order: 3,
        title: 'Gender',
      },
    }),
  })

  await knex('Assay').insert({
    name: 'BluSense Zika',
    i18nKey: 'assayBlusenseZika',
    externalId: 'Zika',
    assayTypeId: assayTypes.Zika.id,
    deviceTypeId,
    resultSourceId: resultSources.DiagnosticDevice.id,
    resultCategory1Label: 'Status',
    resultDataSchema: JSON.stringify({
      resultText: {
        title: 'Result Text',
        type: 'string',
      },
    }),
    patientDataSchema: JSON.stringify({
      name: {
        type: 'string',
        order: 1,
        title: 'Client Name',
      },
      surname: {
        type: 'string',
        order: 2,
        title: 'Client Surname',
      },
      gender: {
        type: 'string',
        order: 3,
        title: 'Gender',
      },
    }),
  })

  const modules = await knex('Permission').reduce((memo, row) => {
    if (!memo[row.module]) {
      memo[row.module] = {}
    }
    memo[row.module][row.activity] = row.id
    return memo
  }, {})

  const featureModules = await knex('Feature').select('id')

  // Create clinics for every state in Malawi
  const [usCountry] = await knex('Country as c')
    .where({ 'c.a3': 'USA' })
    .select('c.id', 'c.culture', 'c.timezone')

  const { culture, timezone, id: countryId } = usCountry

  const { id: geographyId } = await knex('Geography')
    .where({ countryId })
    .whereNull('stateId')
    .whereNull('lgaId')
    .first()

  // Permissions for BluSense Admin
  const [adminPersonId] = await knex('Person').insert(
    Object.assign(
      {
        userId: adminId,
        name: 'BluSense Admin',
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
