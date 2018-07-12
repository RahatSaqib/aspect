module.exports = require('../../src/db').seed(seed)

const config = require('../../src/config')
const _ = require('lodash')
const bcrypt = require('bcrypt')
const permissions = require('./fixtures/permissions.json')
const geography = require('./fixtures/geography.json')
const features = require('./fixtures/features.json')
const { seedStaticData, rowsAsObject } = require('../utils')

const now = new Date()

const saltRounds = parseInt(config.passwordSaltRounds, 10)

async function seed(knex) {
  // Skip this seed file if we already have an admin user
  const existingAdminUser = await knex('User')
    .where({ name: 'admin' })
    .first('id')
  if (existingAdminUser) {
    return
  }

  await seedStaticData(knex)
  const [deviceTypeCategories] = await Promise.all([
    rowsAsObject(knex, 'DeviceTypeCategory', 'name'),
  ])

  // Create admin user and audit fields
  const [adminId] = await knex('User').insert({
    name: 'admin',
    password: bcrypt.hashSync('Cqpb76x6', saltRounds),
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

  // Categories of devices (lab, connectivity...)
  const deviceTypeCategoryLab = deviceTypeCategories.Lab.id

  // Device Types
  const commCareConfigurationDataSchema = JSON.stringify({
    requirePrinter: {
      title: 'Require printer',
      type: 'string',
    },
    firmwareUpdateRequired: {
      title: 'Firmware update required',
      type: 'string',
    },
  })

  const commCareDeviceOperationSchema = JSON.stringify({
    longitude: {
      title: 'Longitude',
      type: 'number',
      prefix: '',
      suffix: '',
      decimals: 10,
    },
    latitude: {
      title: 'Latitude',
      type: 'number',
      prefix: '',
      suffix: '',
      decimals: 10,
    },
  })

  await knex('DeviceType').insert({
    externalId: 'CommCareApp',
    name: 'CommCare App',
    manufacturer: 'CommCare',
    plugin: 'commcare',
    deviceTypeCategoryId: deviceTypeCategoryLab,
    configurationDataSchema: commCareConfigurationDataSchema,
    deviceOperationSchema: commCareDeviceOperationSchema,
  })

  // Create permissions
  const modules = {}

  await Promise.all(
    _.map(permissions.modules, module => {
      const moduleData = {}
      modules[module.name] = moduleData
      _.map(module.activities, async activity => {
        const [permissionId] = await knex('Permission').insert({
          module: module.name,
          activity,
        })
        moduleData[activity] = permissionId
      })
    })
  )

  await Promise.all(
    _.map(features.modules, feature =>
      knex('Feature').insert({ module: feature.name })
    )
  )

  // Create geographic hierarchy
  const countries = {}
  const geographies = []
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
      countryData.states = {}

      const [countryGeographyId] = await knex('Geography').insert({
        countryId,
      })
      countryData.geographyId = countryGeographyId

      await Promise.all(
        _.map(country.states || [], async state => {
          const stateData = _.pick(state, ['abbreviation', 'name'])
          const [stateId] = await knex('State').insert(stateData)
          stateData.id = stateId
          const stateKey = state.abbreviation || state.name
          countryData.states[stateKey] = stateData
          stateData.lgas = {}

          const [stateGeographyId] = await knex('Geography').insert({
            countryId,
            stateId,
          })
          stateData.geographyId = stateGeographyId

          await Promise.all(
            _.map(state.lgas || [], async lga => {
              const lgaData = _.pick(lga, ['name'])

              const [lgaId] = await knex('Lga').insert(lgaData)
              lgaData.id = lgaId
              stateData.lgas[lga.name] = lgaData
              lgaData.sites = {}

              const geoData = { countryId, stateId, lgaId }
              const [geographyId] = await knex('Geography').insert(geoData)
              lgaData.geographyId = geographyId
              geographies.push(Object.assign({ id: geographyId }, geoData))
            })
          )
        })
      )
    })
  )

  // Users
  const userIds = {}
  const personIds = {}
  const adminName = 'Admin'
  userIds[adminName] = adminId
  const [personId] = await knex('Person').insert(
    Object.assign(
      {
        userId: adminId,
        name: adminName,
        timezone: countries.ZA.timezone,
        culture: countries.ZA.culture,
        geographyId: countries.ZA.geographyId,
      },
      auditFields
    )
  )
  personIds[adminName.toLowerCase()] = personId

  // Issues
  const { id: issueStatusSeverityIdLow } = await knex('IssueStatusSeverity')
    .where('externalId', 'Low')
    .first()

  const { id: issueStatusSeverityIdMedium } = await knex('IssueStatusSeverity')
    .where('externalId', 'Medium')
    .first()

  const { id: issueStatusSeverityIdHigh } = await knex('IssueStatusSeverity')
    .where('externalId', 'High')
    .first()

  await knex('IssueStatus').insert([
    {
      name: 'Inactive',
      externalId: 'Inactive',
      i18nKey: 'issueStatusInactive',
      issueStatusSeverityId: issueStatusSeverityIdLow,
      sortOrder: 5,
    },
    {
      name: 'Active',
      externalId: 'Active',
      i18nKey: 'issueStatusActive',
      issueStatusSeverityId: issueStatusSeverityIdHigh,
      sortOrder: 0,
    },
    {
      name: 'Acknowledged',
      externalId: 'Acknowledged',
      i18nKey: 'issueStatusAcknowledged',
      issueStatusSeverityId: issueStatusSeverityIdMedium,
      sortOrder: 4,
    },
    {
      name: 'OK',
      externalId: 'OK',
      i18nKey: 'issueStatusOK',
      issueStatusSeverityId: issueStatusSeverityIdLow,
      sortOrder: 5,
    },
    {
      name: 'Due Soon',
      externalId: 'DueSoon',
      i18nKey: 'issueStatusDueSoon',
      issueStatusSeverityId: issueStatusSeverityIdMedium,
      sortOrder: 3,
    },
    {
      name: 'Due Now',
      externalId: 'DueNow',
      i18nKey: 'issueStatusDueNow',
      issueStatusSeverityId: issueStatusSeverityIdHigh,
      sortOrder: 2,
    },
    {
      name: 'Overdue',
      externalId: 'Overdue',
      i18nKey: 'issueStatusOverdue',
      issueStatusSeverityId: issueStatusSeverityIdHigh,
      sortOrder: 1,
    },
    {
      name: 'Resolved',
      externalId: 'Resolved',
      i18nKey: 'issueStatusResolved',
      issueStatusSeverityId: issueStatusSeverityIdLow,
      sortOrder: 5,
    },
  ])
}
