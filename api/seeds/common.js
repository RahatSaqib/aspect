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
  countryAbbreviation,
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
  const { culture, timezone, id: countryId, geographyId } = countries[
    countryAbbreviation
  ]
  const [adminPersonId] = await knex('Person').insert({
    userId: adminId,
    name: 'Admin',
    lastPartnerId: partnerId,
    lastCountryId: countryId,
    geographyId,
    culture,
    timezone,
    ...auditFields,
  })

  const [jobFunctionIdAdmin] = await knex('JobFunction').insert({
    name: 'Admin',
    partnerId,
  })
  await insertJobFunctionPermission(knex, jobFunctionIdAdmin, [
    modules.browse.view,
    modules.result.admin,
    modules.assay.admin,
    modules.device.admin,
    modules.treatmentStatus.admin,
  ])

  await insertJobFeatures(knex, jobFunctionIdAdmin, [
    features.device,
    features.result,
    features.site,
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
  await insertJobFunctionPermission(knex, jobFunctionIdRegionalOfficer, [
    modules.browse.view,
    modules.result.admin,
    modules.assay.view,
    modules.device.view,
    modules.site.view,
  ])
  await insertJobFeatures(knex, jobFunctionIdRegionalOfficer, [
    features.device,
    features.result,
    features.site,
  ])

  const [jobFunctionIdLabUser] = await knex('JobFunction').insert({
    name: 'Lab User',
    partnerId,
  })
  await insertJobFunctionPermission(knex, jobFunctionIdLabUser, [
    modules.browse.view,
    modules.result.admin,
    modules.assay.view,
    modules.device.view,
    modules.site.view,
    modules.treatmentStatus.admin,
  ])
  await insertJobFeatures(knex, jobFunctionIdLabUser, [
    features.device,
    features.result,
    features.site,
  ])
  if (deviceApiToken)
    await insertGxAlertDevice(
      knex,
      countryId,
      partnerId,
      auditFields,
      deviceApiToken
    )
}
async function insertJobFunctionPermission(
  knex,
  jobFunctionId,
  jobPermissions
) {
  const JobFunctionPermission = _.map(jobPermissions, permissionId =>
    Object.assign(
      {},
      {
        jobFunctionId,
        permissionId,
      }
    )
  )
  return knex('JobFunctionPermission').insert(JobFunctionPermission)
}
async function insertJobFeatures(knex, jobFunctionId, jobFeatures) {
  const JobFunctionFeature = _.map(jobFeatures, featureId =>
    Object.assign(
      {},
      {
        jobFunctionId,
        featureId,
      }
    )
  )
  return knex('JobFunctionFeature').insert(JobFunctionFeature)
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
  const site = {
    ...auditFields,
    name: 'GxAlert Site',
    shortName: 'GxA Site',
    externalId: 'gxalert',
    partnerId,
    geographyId: countryGeographyId,
    createdOn: new Date(),
    updatedOn: new Date(),
  }
  const gxAlertSiteId = await knex('Site').insert(site)

  // insert GxAlert device
  const gxAlertDeviceId = await knex('Device').insert({
    ...auditFields,
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

  await knex('DeviceApiKey').insert({
    token: deviceApiToken,
    revoked: 0,
    partnerId,
    geographyId: countryGeographyId,
    deviceId: gxAlertDeviceId,
    ...auditFields,
  })
}

module.exports = {
  commonInserts,
  insertGxAlertDevice,
  insertJobFunctionPermission,
  insertJobFeatures,
}
