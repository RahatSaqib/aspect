module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')
const Promise = require('bluebird')
const bcrypt = require('bcrypt')
const config = require('../../src/config')
const utils = require('../utils')
const geography = require('./fixtures/geography.json')
const {
  allFeatureToId,
  partnerTypeToId,
  deviceStatusToId,
  allDeviceTypeCategoryToId,
} = require('../../src/shared/dictionary')

const saltRounds = parseInt(config.passwordSaltRounds, 10)

async function seed(knex) {
  utils.hasSeededStaticData = true

  // Create admin user and audit fields
  const now = new Date()
  const [adminId] = await knex('User').insert({
    name: 'admin',
    password: bcrypt.hashSync('q04TvNf7', saltRounds),
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
  const [modules, features] = await Promise.all([
    utils.getPermissionModules(knex),
    allFeatureToId(),
  ])

  const [partnerId] = await knex('Partner').insert({
    name: 'Cameroon',
    partnerTypeId: await partnerTypeToId('Operating'),
    deviceLogHistoryDays: 365,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults: 14,
    serverUrl: 'https://cameroon.aspect.id',
  })

  const countries = {}
  await Promise.all(
    _.map(geography.countries, async country => {
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
  )
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
  const { cameroonGeographyId } = await knex('Geography')
    .where({ countryId })
    .whereNull('stateId', 'lgaId')
    .first('id as cameroonGeographyId')
  const site = Object.assign({}, auditFields, {
    name: 'GxAlert Site',
    shortName: 'GxA Site',
    externalId: 'gxalert',
    partnerId,
    geographyId: cameroonGeographyId,
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
      geographyId: cameroonGeographyId,
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
        token: 'ukpjat39531egjy4pc20',
        revoked: 0,
        partnerId,
        geographyId: cameroonGeographyId,
        deviceId: gxAlertDeviceId,
      },
      auditFields
    )
  )
}
