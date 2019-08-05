const _ = require('lodash')
const Promise = require('bluebird')

const utils = require('./utils')

const {
  allFeatureToId,
  deviceStatusToId,
  allDeviceTypeCategoryToId,
} = require('../src/shared/dictionary')

async function commonInserts(
  knex,
  partnerId,
  adminId,
  geography,
  deviceApiToken = null
) {
  const now = new Date()
  utils.hasSeededStaticData = true
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  // Reuse previously seeded "static" data
  const [modules, features] = await Promise.all([
    utils.getPermissionModules(knex),
    allFeatureToId(),
  ])
  const countries = {}
  await Promise.each(geography.countries, async country => {
    const countryData = _.pick(country, [
      'abbreviation',
      'name',
      'a3',
      'culture',
      'countryCode',
      'stateLabel',
      'lgaLabel',
      'timezone',
      'portNumber',
      'exportColumns',
      'inventoryDaysThreshold',
      'monthStartsOnDay',
    ])
    const [countryId] = await knex('Country').insert(countryData)
    countryData.id = countryId
    countries[country.abbreviation] = countryData
    const [countryGeographyId] = await knex('Geography').insert({
      countryId,
    })
    countryData.geographyId = countryGeographyId
  })

  const { culture, timezone, id: countryId, geographyId } = countries.CR

  const [adminPersonId] = await knex('Person').insert(
    Object.assign(
      {
        userId: adminId,
        name: 'Admin',
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
  await knex('JobFunctionPermission').insert([
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.browse.view },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.result.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.assay.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.device.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.site.admin },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.treatmentStatus.admin,
    },
  ])
  await knex('JobFunctionFeature').insert([
    { jobFunctionId: jobFunctionIdAdmin, featureId: features.device },
    { jobFunctionId: jobFunctionIdAdmin, featureId: features.result },
    { jobFunctionId: jobFunctionIdAdmin, featureId: features.site },
  ])

  const [jobIdAdmin] = await knex('Job').insert([
    { personId: adminPersonId, jobFunctionId: jobFunctionIdAdmin },
  ])
  await knex('JobContext').insert({
    jobId: jobIdAdmin,
    geographyId,
  })

  const [jobFunctionIdRegionalOfficer] = await knex('JobFunction').insert({
    name: 'Regional Officer',
    partnerId,
  })
  await knex('JobFunctionPermission').insert([
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.browse.view,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.result.admin,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.assay.view,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.device.view,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.site.view,
    },
  ])
  await knex('JobFunctionFeature').insert([
    { jobFunctionId: jobFunctionIdRegionalOfficer, featureId: features.device },
    { jobFunctionId: jobFunctionIdRegionalOfficer, featureId: features.result },
    { jobFunctionId: jobFunctionIdRegionalOfficer, featureId: features.site },
  ])

  const [jobFunctionIdLabUser] = await knex('JobFunction').insert({
    name: 'Lab User',
    partnerId,
  })
  await knex('JobFunctionPermission').insert([
    { jobFunctionId: jobFunctionIdLabUser, permissionId: modules.browse.view },
    { jobFunctionId: jobFunctionIdLabUser, permissionId: modules.result.admin },
    { jobFunctionId: jobFunctionIdLabUser, permissionId: modules.assay.view },
    { jobFunctionId: jobFunctionIdLabUser, permissionId: modules.device.view },
    { jobFunctionId: jobFunctionIdLabUser, permissionId: modules.site.view },
    {
      jobFunctionId: jobFunctionIdLabUser,
      permissionId: modules.treatmentStatus.admin,
    },
  ])
  await knex('JobFunctionFeature').insert([
    { jobFunctionId: jobFunctionIdLabUser, featureId: features.device },
    { jobFunctionId: jobFunctionIdLabUser, featureId: features.result },
    { jobFunctionId: jobFunctionIdLabUser, featureId: features.site },
  ])
  if (deviceApiToken)
    insertGxAlertDevice(knex, countryId, partnerId, auditFields, deviceApiToken)
}

async function insertGxAlertDevice(
  knex,
  countryId,
  partnerId,
  auditFields,
  deviceApiToken
) {
  const {
    'Information System': deviceTypeCategoryInformationSystem,
  } = await allDeviceTypeCategoryToId()
  const [deviceTypeId] = await knex('DeviceType')
    .insert({
      externalId: 'GxAlert',
      name: 'GxAlert',
      manufacturer: 'SystemOne',
      plugin: 'gxalert',
      deviceTypeCategoryId: deviceTypeCategoryInformationSystem,
    })
    .returning('Id')
  const { countryGeographyId } = await knex('Geography')
    .where({ countryId })
    .whereNull('stateId', 'lgaId')
    .first('id as countryGeographyId')
  const site = Object.assign({}, auditFields, {
    name: 'GxAlert Site',
    shortName: 'GxA Site',
    externalId: 'gxalert',
    partnerId,
    geographyId: countryGeographyId,
    createdOn: new Date(),
    updatedOn: new Date(),
  })
  const gxAlertSiteId = await knex('Site').insert(site)

  // insert GxAlert device
  const gxAlertDeviceId = await knex('Device').insert(
    Object.assign({}, auditFields, {
      name: 'GxAlert',
      deviceStatusId: await deviceStatusToId('approved'),
      partnerId,
      geographyId: countryGeographyId,
      siteId: gxAlertSiteId,
      createdOn: new Date(),
      updatedOn: new Date(),
      lastPingOn: new Date(),
      lastSeenOn: new Date(),
      deviceTypeId,
    })
  )

  await knex('DeviceApiKey').insert(
    Object.assign(
      {
        token: deviceApiToken,
        revoked: 0,
        partnerId,
        geographyId: countryGeographyId,
        deviceId: gxAlertDeviceId,
      },
      auditFields
    )
  )
}

module.exports = {
  commonInserts,
  insertGxAlertDevice,
}
