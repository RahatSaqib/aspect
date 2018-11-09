module.exports = require('../utils').seed(seed)

const bcrypt = require('bcrypt')
const _ = require('lodash')

const config = require('../../src/config')
const myanmarSites = require('./fixtures/myanmarSites.json')
const dashboardWidget = require('./fixtures/myanmarDashboardWidget.json')

const {
  rowsAsObject,
  getDefaultMessageTypes,
  seedStockIssues,
  seedStockIssuesUpdate,
  getPermissionModules,
  seedIssueEventTriggersForPartner,
} = require('../utils')
const {
  allFeatureToId,

  partnerTypeToId,
} = require('../../src/shared/dictionary')

const { seedUnknownErrorsIssue } = require('../seedUnknownErrorsIssue')
const { seedDataCategory } = require('../dataCategoryLow')

const now = new Date()
const millisInHour = 1000 * 60 * 60

const saltRounds = parseInt(config.passwordSaltRounds, 10)

async function seed(knex) {
  // Skip this seed file if we already have an admin user
  const existingAdminUser = await knex('User')
    .where({ name: 'myanmar_admin' })
    .first('id')
  if (existingAdminUser) {
    return
  }

  // Create admin user and audit fields
  const [adminId] = await knex('User').insert({
    name: 'myanmar_admin',
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
  const defaultMessageTypes = await getDefaultMessageTypes(knex)
  let issueTypes = await rowsAsObject(knex, 'IssueType', 'externalId')

  const maxDaysDeviceNoResults = 14
  const [partnerId] = await knex('Partner').insert({
    name: 'Myanmar',
    partnerTypeId: await partnerTypeToId('Operating'),
    plugin: 'myanmar',
    deviceLogHistoryDays: 365,
    autoAcknowledgeOlderThanDays: 28,
    numberToLeaveUnacknowledged: 15,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults,
  })

  const modules = await getPermissionModules(knex)

  const [myanmarCountry] = await knex('Country as c')
    .where({ 'c.a3': 'MMR' })
    .select('c.id', 'c.culture', 'c.timezone')
  const countryId = myanmarCountry.id

  const { id: myanmarGeographyId } = await knex('Geography')
    .where({ countryId })
    .whereNull('stateId', 'lgaId')
    .first()

  const myanmarStates = await knex('Geography as g')
    .innerJoin('State as s', 's.id', 'g.stateId')
    .where({ 'g.countryId': countryId })
    .whereNull('g.lgaId')
    .select('s.id', 's.name', 's.abbreviation')

  const myanmarLgas = await knex('Geography as g')
    .innerJoin('Lga as l', 'l.id', 'g.lgaId')
    .where({ 'g.countryId': countryId })
    .select('l.id', 'l.name')

  const statesByAbbreviation = myanmarStates.reduce((memo, state) => {
    memo[state.abbreviation] = state
    return memo
  }, {})

  const lgasByName = myanmarLgas.reduce((memo, lga) => {
    memo[lga.name] = lga
    return memo
  }, {})

  // Permissions for Myanmar Admin
  const [adminPersonId] = await knex('Person').insert(
    Object.assign(
      {
        userId: adminId,
        name: 'Myanmar Admin',
        lastPartnerId: partnerId,
        lastCountryId: countryId,
        geographyId: myanmarGeographyId,
        culture: myanmarCountry.culture,
        timezone: myanmarCountry.timezone,
      },
      auditFields
    )
  )

  const [jobFunctionIdAdmin] = await knex('JobFunction').insert({
    name: 'Admin',
    partnerId,
  })

  const [jobFunctionIdRegionalOfficer] = await knex('JobFunction').insert({
    name: 'Regional Officer',
    partnerId,
  })

  const [jobFunctionIdLabUser] = await knex('JobFunction').insert({
    name: 'Lab User',
    partnerId,
  })

  const featureModules = await allFeatureToId()
  await knex('JobFunctionFeature').insert([
    // Admin Permissions
    { jobFunctionId: jobFunctionIdAdmin, featureId: featureModules.site },
    { jobFunctionId: jobFunctionIdAdmin, featureId: featureModules.device },
    { jobFunctionId: jobFunctionIdAdmin, featureId: featureModules.result },
    {
      jobFunctionId: jobFunctionIdAdmin,
      featureId: featureModules.summaryDashboard,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      featureId: featureModules.targetDashboard,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      featureId: featureModules.actionDashboard,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      featureId: featureModules.reportDashboard,
    },
    {
      jobFunctionId: jobFunctionIdAdmin,
      featureId: featureModules.siteFilterDashboard,
    },
    // Regional Officer Permissions
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      featureId: featureModules.summaryDashboard,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      featureId: featureModules.targetDashboard,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      featureId: featureModules.actionDashboard,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      featureId: featureModules.reportDashboard,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      featureId: featureModules.siteFilterDashboard,
    },
    // Lab User Permissions
    {
      jobFunctionId: jobFunctionIdLabUser,
      featureId: featureModules.summaryDashboard,
    },
    {
      jobFunctionId: jobFunctionIdLabUser,
      featureId: featureModules.actionDashboard,
    },
    {
      jobFunctionId: jobFunctionIdLabUser,
      featureId: featureModules.reportDashboard,
    },
    {
      jobFunctionId: jobFunctionIdLabUser,
      featureId: featureModules.siteFilterDashboard,
    },
  ])

  await knex('JobFunctionPermission').insert([
    // Admin Permissions
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.demo.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.device.admin },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.deviceApiKey.admin,
    },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.person.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.result.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.site.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.assay.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.issue.admin },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.inventory.admin,
    },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.task.admin },
    // Regional Officer Permissions
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.device.admin,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.result.admin,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.site.admin,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.issue.admin,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.inventory.admin,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.task.admin,
    },
    // Lab User Permissions
    {
      jobFunctionId: jobFunctionIdLabUser,
      permissionId: modules.device.admin,
    },
    {
      jobFunctionId: jobFunctionIdLabUser,
      permissionId: modules.result.admin,
    },
    {
      jobFunctionId: jobFunctionIdLabUser,
      permissionId: modules.site.admin,
    },
    { jobFunctionId: jobFunctionIdLabUser, permissionId: modules.issue.admin },
    {
      jobFunctionId: jobFunctionIdLabUser,
      permissionId: modules.inventory.admin,
    },
    {
      jobFunctionId: jobFunctionIdLabUser,
      permissionId: modules.task.admin,
    },
  ])

  // Admin Job
  const [jobIdAdmin] = await knex('Job').insert({
    personId: adminPersonId,
    jobFunctionId: jobFunctionIdAdmin,
  })
  await knex('JobContext').insert({
    jobId: jobIdAdmin,
    geographyId: myanmarGeographyId,
  })

  // Regional Officer Jobs and Targets
  const adminRegions = ['AYY', 'KCN', 'MDY']
  let regionNumber = 0
  await Promise.all(
    _.map(adminRegions, async region => {
      regionNumber += 1
      const regionUserName = `myanmar_ro${regionNumber}`
      const { id: regionId } = await knex('Geography')
        .where({
          countryId,
          stateId: statesByAbbreviation[region].id,
        })
        .first()
      const [regionUserId] = await knex('User').insert({
        name: regionUserName,
        password: bcrypt.hashSync(regionUserName, saltRounds),
        approved: 1,
        createdOn: now,
        lockedOut: 0,
        failedPasswordAttempts: 0,
      })
      const [regionPersonId] = await knex('Person').insert(
        Object.assign(
          {
            userId: regionUserId,
            name: `Myanmar Regional Officer ${region}`,
            lastPartnerId: partnerId,
            lastCountryId: countryId,
            geographyId: myanmarGeographyId,
            culture: myanmarCountry.culture,
            timezone: myanmarCountry.timezone,
          },
          auditFields
        )
      )
      const [jobIdRegion] = await knex('Job').insert({
        personId: regionPersonId,
        jobFunctionId: jobFunctionIdRegionalOfficer,
      })
      await knex('JobContext').insert({
        jobId: jobIdRegion,
        geographyId: regionId,
      })
    })
  )

  const siteDatas = []
  await Promise.all(
    _.map(myanmarSites.sites, async site => {
      const { id: siteGeographyId } = await knex('Geography')
        .where({
          countryId,
          stateId: (
            statesByAbbreviation[site.stateAbbreviation] || { id: null }
          ).id,
          lgaId: (lgasByName[site.lgaName] || { id: null }).id,
        })
        .first()

      // sites
      const siteData = Object.assign(
        {
          partnerId,
          geographyId: siteGeographyId,
          name: site.name,
          shortName: site.shortName,
          externalId: site.externalId,
          notes: site.notes,
          city: site.city,
          street1: site.street1,
          street2: site.street2,
          zip: site.zip,
          latitude: site.latitude,
          longitude: site.longitude,
          timezoneId: site.timezoneId,
          hoursStart: site.hoursStart,
          hoursEnd: site.hoursEnd,
        },
        auditFields
      )
      const [siteId] = await knex('Site').insert(siteData)
      siteData.id = siteId
      siteDatas.push(siteData)
    })
  )

  // Lab User Jobs
  let labNumber = 0
  await Promise.all(
    _.map(adminRegions, async region => {
      labNumber += 1
      const labUserName = `myanmar_lab${labNumber}`
      const { siteId, geographyId } = await knex('Site as s')
        .join('Geography as g', 's.geographyId', 'g.id')
        .where({
          's.partnerId': partnerId,
          'g.countryId': countryId,
          'g.stateId': statesByAbbreviation[region].id,
        })
        .first('s.id as siteId', 'g.id as geographyId')
      const [labUserId] = await knex('User').insert({
        name: labUserName,
        password: bcrypt.hashSync(labUserName, saltRounds),
        approved: 1,
        createdOn: now,
        lockedOut: 0,
        failedPasswordAttempts: 0,
      })
      const [labPersonId] = await knex('Person').insert(
        Object.assign(
          {
            userId: labUserId,
            name: `Myanmar Lab User ${region}`,
            lastPartnerId: partnerId,
            lastCountryId: countryId,
            geographyId,
            culture: myanmarCountry.culture,
            timezone: myanmarCountry.timezone,
          },
          auditFields
        )
      )
      const [jobIdLab] = await knex('Job').insert({
        personId: labPersonId,
        jobFunctionId: jobFunctionIdLabUser,
      })
      await knex('JobContext').insert({
        jobId: jobIdLab,
        siteId,
      })
    })
  )

  // Create DashboardWidget
  const statWidgets = []
  await Promise.all(
    _.map(dashboardWidget.stat, async widget => {
      const widgetData = _.pick(widget, [
        'title',
        'titleI18nKey',
        'subTitle',
        'subTitleI18nKey',
        'sqlForIndicator',
        'link',
        'sortOrder',
      ])
      const [widgetId] = await knex('DashboardWidget').insert(widgetData)
      const statWidgetData = _.pick(widget, [
        'icon',
        'sqlForStatUnit',
        'statUnit',
        'statUnitI18nKey',
        'statStatus',
        'statStatusI18nKey',
        'sqlForExtra',
        'extraUnit',
        'extraUnitI18nKey',
        'extraLabel',
        'extraLabelI18nKey',
      ])
      await knex('DashboardWidgetStat').insert(
        Object.assign({ dashboardWidgetId: widgetId }, statWidgetData)
      )
      statWidgets.push(widgetId)
    })
  )

  const targetWidgets = []
  await Promise.all(
    _.map(dashboardWidget.target, async widget => {
      const widgetData = _.pick(widget, [
        'title',
        'titleI18nKey',
        'subTitle',
        'subTitleI18nKey',
        'sqlForIndicator',
        'link',
        'sortOrder',
      ])
      const [widgetId] = await knex('DashboardWidget').insert(widgetData)
      const statWidgetData = _.pick(widget, [
        'sqlForDataCollection',
        'thresholdPercentageDataCollection',
        'targetToken',
      ])
      await knex('DashboardWidgetTarget').insert(
        Object.assign({ dashboardWidgetId: widgetId }, statWidgetData)
      )
      targetWidgets.push(widgetId)
    })
  )

  await Promise.all(
    _.map(statWidgets, async widgetId => {
      await knex('JobFunctionDashboardWidget').insert([
        { jobFunctionId: jobFunctionIdAdmin, widgetId },
        { jobFunctionId: jobFunctionIdRegionalOfficer, widgetId },
        { jobFunctionId: jobFunctionIdLabUser, widgetId },
      ])
    }),
    _.map(targetWidgets, async widgetId => {
      await knex('JobFunctionDashboardWidget').insert([
        { jobFunctionId: jobFunctionIdAdmin, widgetId },
        { jobFunctionId: jobFunctionIdRegionalOfficer, widgetId },
      ])
    })
  )

  // Notifications
  await knex('NotificationType').insert([
    Object.assign(
      {
        name: 'LU Network',
        partnerId,
        issueTypeId: issueTypes.DeviceOffline.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 1,
        canAcknowledge: 1,
        messageTypeId: defaultMessageTypes.DeviceOffline.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'RO Network',
        partnerId,
        issueTypeId: issueTypes.DeviceOffline.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 1,
        messageTypeId: defaultMessageTypes.DeviceOffline.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'RO Escalated Network',
        partnerId,
        issueTypeId: issueTypes.DeviceOffline.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 3,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.DeviceOffline.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU No Testing',
        partnerId,
        issueTypeId: issueTypes.DeviceNoResults.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 1,
        canAcknowledge: 1,
        messageTypeId: defaultMessageTypes.DeviceNoResults.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'RO No Testing',
        partnerId,
        issueTypeId: issueTypes.DeviceNoResults.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 1,
        messageTypeId: defaultMessageTypes.DeviceNoResults.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'RO Escalated No Testing',
        partnerId,
        issueTypeId: issueTypes.DeviceNoResults.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 3,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.DeviceNoResults.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Module Failure',
        partnerId,
        issueTypeId: issueTypes.ModuleFailureError.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 2,
        canAcknowledge: 1,
        messageTypeId: defaultMessageTypes.ModuleFailureError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Module Failure',
        partnerId,
        issueTypeId: issueTypes.ModuleFailureError.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ModuleFailureError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Module Temperature',
        partnerId,
        issueTypeId: issueTypes.ModuleTemperatureError.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 1,
        canAcknowledge: 1,
        messageTypeId: defaultMessageTypes.ModuleTemperatureError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Module Temperature',
        partnerId,
        issueTypeId: issueTypes.ModuleTemperatureError.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ModuleTemperatureError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Module Power',
        partnerId,
        issueTypeId: issueTypes.ModulePowerError.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 1,
        canAcknowledge: 1,
        messageTypeId: defaultMessageTypes.ModulePowerError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Module Power',
        partnerId,
        issueTypeId: issueTypes.ModulePowerError.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ModulePowerError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Machine Temperature',
        partnerId,
        issueTypeId: issueTypes.MachineTemperatureError.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 1,
        canAcknowledge: 1,
        messageTypeId: defaultMessageTypes.MachineTemperatureError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Machine Temperature',
        partnerId,
        issueTypeId: issueTypes.MachineTemperatureError.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.MachineTemperatureError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Machine Power',
        partnerId,
        issueTypeId: issueTypes.MachinePowerError.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 1,
        canAcknowledge: 1,
        messageTypeId: defaultMessageTypes.MachinePowerError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Machine Power',
        partnerId,
        issueTypeId: issueTypes.MachinePowerError.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.MachinePowerError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Module Procedural',
        partnerId,
        issueTypeId: issueTypes.ModuleProceduralError.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 1,
        canAcknowledge: 1,
        messageTypeId: defaultMessageTypes.ModuleProceduralError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Module Procedural',
        partnerId,
        issueTypeId: issueTypes.ModuleProceduralError.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ModuleProceduralError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Machine Procedural',
        partnerId,
        issueTypeId: issueTypes.MachineProceduralError.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 1,
        canAcknowledge: 1,
        messageTypeId: defaultMessageTypes.MachineProceduralError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Machine Procedural',
        partnerId,
        issueTypeId: issueTypes.MachineProceduralError.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.MachineProceduralError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'RO Module',
        partnerId,
        issueTypeId: issueTypes.ModuleProceduralError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ModuleProceduralError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'RO Machine',
        partnerId,
        issueTypeId: issueTypes.MachineProceduralError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.MachineProceduralError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Reagent Health',
        partnerId,
        issueTypeId: issueTypes.ReagentHealthError.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 1,
        canAcknowledge: 1,
        messageTypeId: defaultMessageTypes.ReagentHealthError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Reagent Health',
        partnerId,
        issueTypeId: issueTypes.ReagentHealthError.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ReagentHealthError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'RO Reagent Health',
        partnerId,
        issueTypeId: issueTypes.ReagentHealthError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ReagentHealthError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Stock Level Update',
        partnerId,
        issueTypeId: issueTypes.StockLevelUpdate.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.StockLevelUpdate.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'RO Stock Level Update',
        partnerId,
        issueTypeId: issueTypes.StockLevelUpdate.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 1,
        messageTypeId: defaultMessageTypes.StockLevelUpdate.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Data Category Low',
        partnerId,
        issueTypeId: issueTypes.DataCategoryLowError.id,
        jobFunctionId: jobFunctionIdLabUser,
        level: 1,
        canAcknowledge: 1,
        messageTypeId: defaultMessageTypes.DataCategoryLowError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'RO Data Category Low',
        partnerId,
        issueTypeId: issueTypes.DataCategoryLowError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 1,
        messageTypeId: defaultMessageTypes.DataCategoryLowError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Network - RO View',
        partnerId,
        issueTypeId: issueTypes.DeviceOffline.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.DeviceOffline.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU No Testing - RO View',
        partnerId,
        issueTypeId: issueTypes.DeviceNoResults.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.DeviceNoResults.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Module Failure - RO View',
        partnerId,
        issueTypeId: issueTypes.ModuleFailureError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ModuleFailureError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Module Failure - RO View',
        partnerId,
        issueTypeId: issueTypes.ModuleFailureError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ModuleFailureError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Module Temperature - RO View',
        partnerId,
        issueTypeId: issueTypes.ModuleTemperatureError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ModuleTemperatureError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Module Temperature - RO View',
        partnerId,
        issueTypeId: issueTypes.ModuleTemperatureError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ModuleTemperatureError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Module Power - RO View',
        partnerId,
        issueTypeId: issueTypes.ModulePowerError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ModulePowerError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Module Power - RO View',
        partnerId,
        issueTypeId: issueTypes.ModulePowerError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ModulePowerError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Machine Temperature - RO View',
        partnerId,
        issueTypeId: issueTypes.MachineTemperatureError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.MachineTemperatureError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Machine Temperature - RO View',
        partnerId,
        issueTypeId: issueTypes.MachineTemperatureError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.MachineTemperatureError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Machine Power - RO View',
        partnerId,
        issueTypeId: issueTypes.MachinePowerError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.MachinePowerError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Machine Power - RO View',
        partnerId,
        issueTypeId: issueTypes.MachinePowerError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.MachinePowerError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Module Procedural - RO View',
        partnerId,
        issueTypeId: issueTypes.ModuleProceduralError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ModuleProceduralError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Module Procedural - RO View',
        partnerId,
        issueTypeId: issueTypes.ModuleProceduralError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ModuleProceduralError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Machine Procedural - RO View',
        partnerId,
        issueTypeId: issueTypes.MachineProceduralError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.MachineProceduralError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Machine Procedural - RO View',
        partnerId,
        issueTypeId: issueTypes.MachineProceduralError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.MachineProceduralError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Reagent Health - RO View',
        partnerId,
        issueTypeId: issueTypes.ReagentHealthError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ReagentHealthError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Reagent Health - RO View',
        partnerId,
        issueTypeId: issueTypes.ReagentHealthError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ReagentHealthError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Stock Level Update - RO View',
        partnerId,
        issueTypeId: issueTypes.StockLevelUpdate.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.StockLevelUpdate.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Data Category Low - RO View',
        partnerId,
        issueTypeId: issueTypes.DataCategoryLowError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.DataCategoryLowError.id,
      },
      auditFields
    ),
  ])

  // Fill Issue/AlertMessage/Notification table with some mock data
  const devices = await knex('Device').where({ partnerId })
  const issueStatusActiveId = await getId(knex, 'IssueStatus', 'Active')
  const issueStatusAcknowledgedId = await getId(
    knex,
    'IssueStatus',
    'Acknowledged'
  )
  const issueStatusOkId = await getId(knex, 'IssueStatus', 'OK')
  const messageStatusSentId = await getId(knex, 'MessageStatus', 'Sent')

  const issue = {
    level: 1,
    partnerId,
    createdOn: now,
    updatedOn: now,
  }
  let issueIds = []
  const luIssueTypeIds = [
    issueTypes.DeviceOffline.id,
    issueTypes.DeviceNoResults.id,
    issueTypes.ModuleFailureError.id,
    issueTypes.ModuleTemperatureError.id,
    issueTypes.ModulePowerError.id,
    issueTypes.MachineTemperatureError.id,
    issueTypes.MachinePowerError.id,
    issueTypes.ModuleProceduralError.id,
    issueTypes.MachineProceduralError.id,
    issueTypes.DataCategoryLowError.id,
    issueTypes.StockLevelUpdate.id,
    issueTypes.ReagentHealthError.id,
  ]

  const luAlertMessages = {
    [issueTypes.DeviceOffline.id]: 'Cannot reach network for 12 days',
    [issueTypes.DeviceNoResults.id]: 'No testing for 9 days',
    [issueTypes.ModuleFailureError.id]:
      'Module A1: Critical errors; notify R.O.',
    [issueTypes.ModuleTemperatureError.id]:
      'Temperature errors on Module A2; notify R.O.',
    [issueTypes.ModulePowerError.id]: 'Power errors on Module A3; notify RO',
    [issueTypes.MachineTemperatureError.id]:
      'Temperature errors across machine, conduct troubleshooting',
    [issueTypes.MachinePowerError.id]:
      'Power errors across machine, conduct troubleshooting',
    [issueTypes.ModuleProceduralError.id]:
      'Module A2 errors, conduct troubleshooting',
    [issueTypes.MachineProceduralError.id]:
      'Procedural errors across machine, conduct troubleshooting',
    [issueTypes.DataCategoryLowError.id]: 'HIV Status collection rate 89%',
    [issueTypes.StockLevelUpdate.id]: 'Stock Level',
    [issueTypes.ReagentHealthError.id]: 'Cartridge-specific errors exceed 5%',
  }

  const deviceIds = await knex('Device as d')
    .select('j.personId', 'd.id as deviceId')
    .join('JobContext as jc', 'jc.siteId', 'd.siteId')
    .join('Job as j', 'jc.jobId', 'j.id')
    .where({ jobFunctionId: jobFunctionIdLabUser })
    .union(function() {
      this.select('j.personId', 'd.id as deviceId')
        .from('Device as d')
        .leftJoin('Geography as g1', 'd.geographyId', 'g1.id')
        .leftJoin('Geography as g2', 'g2.stateId', 'g1.stateId')
        .join('JobContext as jc', 'jc.geographyId', 'g2.id')
        .join('Job as j', 'jc.jobId', 'j.id')
        .where({ partnerId, jobFunctionId: jobFunctionIdRegionalOfficer })
    })
    .orderBy('deviceId')
    .reduce((memo, row) => {
      if (!memo[row.deviceId]) {
        memo[row.deviceId] = {}
      }
      memo[row.deviceId][row.personId] = row.deviceId
      return memo
    }, {})

  await Promise.all(
    _.map(devices, async device => {
      await Promise.all(
        _.map(luIssueTypeIds, async issueTypeId => {
          const issueStatusId =
            issueTypeId === issueTypes.StockLevelUpdate.id
              ? issueStatusOkId
              : issueStatusActiveId
          const [issueId] = await knex('Issue').insert(
            Object.assign(
              {
                issueTypeId,
                issueStatusId,
                deviceId: device.id,
                siteId: device.siteId,
                geographyId: device.geographyId,
              },
              issue
            )
          )
          if (issueStatusId === issueStatusAcknowledgedId) {
            await knex('IssueStatusLog').insert({
              issueId,
              issueStatusId: issueStatusActiveId,
              changedOn: now,
              createdOn: now,
              createdBy: adminId,
            })
          }
          if (issueStatusId !== issueStatusActiveId) {
            await knex('IssueStatusLog').insert({
              issueId,
              issueStatusId,
              changedOn: new Date(+now + millisInHour),
              createdOn: new Date(+now + millisInHour - 1000),
              createdBy: adminId,
            })
          }
          issueIds.push(issueId)
        })
      )
    })
  )

  const luPolicies = await knex('NotificationType as nt')
    .join('MessageType as mt', 'nt.messageTypeId', 'mt.id')
    .join('Issue as i', 'i.issueTypeId', 'nt.issueTypeId')
    .join('Job as j', 'j.jobFunctionId', 'nt.jobFunctionId')
    .join('JobContext as jc', 'jc.jobId', 'j.id')
    .join('AlertTemplate as at', 'at.id', 'mt.alertTemplateId')
    .where({ 'nt.partnerId': partnerId })
    .whereIn('i.id', issueIds)
    .where('nt.level', 1)
    .where('nt.jobFunctionId', jobFunctionIdLabUser)
    .select(
      'nt.id as notificationTypeId',
      'nt.jobFunctionId',
      'j.personId',
      'i.id as issueId',
      'i.issueTypeId',
      'i.siteId',
      'i.deviceId',
      'i.resultId',
      'mt.alertTemplateId'
    )

  await Promise.all(
    _.map(luPolicies, async policy => {
      const deviceId = deviceIds[policy.deviceId][policy.personId]
      if (deviceId) {
        const [alertMessageId] = await knex('AlertMessage').insert(
          Object.assign(
            {
              messageStatusId: messageStatusSentId,
              message: luAlertMessages[policy.issueTypeId],
              createdOn: now,
              updatedOn: now,
            },
            _.pick(policy, [
              'alertTemplateId',
              'personId',
              'siteId',
              'deviceId',
              'resultId',
            ])
          )
        )

        await knex('Notification').insert(
          Object.assign(
            {
              createdOn: now,
              alertMessageId,
            },
            _.pick(policy, ['notificationTypeId', 'issueId', 'personId'])
          )
        )
      }
    })
  )

  // add issues for RO
  const roIssueTypeIds = [
    issueTypes.DeviceOffline.id,
    issueTypes.DeviceNoResults.id,
    issueTypes.ModuleProceduralError.id,
    issueTypes.MachineProceduralError.id,
    issueTypes.StockLevelUpdate.id,
    issueTypes.DataCategoryLowError.id,
    issueTypes.ReagentHealthError.id,
  ]

  const roAlertMessages = {
    [issueTypes.DeviceOffline.id]:
      'No contact for 12 days. If there is a reason for being inactive, add the reason',
    [issueTypes.DeviceNoResults.id]: 'No testing for 9 days',
    [issueTypes.ModuleProceduralError.id]:
      'Module Temperature Issue for 2 days',
    [issueTypes.MachineProceduralError.id]: 'Machine Power Issue for 7 days',
    [issueTypes.StockLevelUpdate.id]: 'Stock Level',
    [issueTypes.DataCategoryLowError.id]: 'HIV Status collection rate 92%',
    [issueTypes.ReagentHealthError.id]: 'Cartridge-specific errors exceed 5%',
  }

  issue.level = 2
  issueIds = []
  await Promise.all(
    _.map(devices, async device => {
      await Promise.all(
        _.map(roIssueTypeIds, async issueTypeId => {
          const issueStatusId =
            issueTypeId === issueTypes.StockLevelUpdate.id
              ? issueStatusOkId
              : issueStatusActiveId
          const [issueId] = await knex('Issue').insert(
            Object.assign(
              {
                issueTypeId,
                issueStatusId,
                deviceId: device.id,
                siteId: device.siteId,
                geographyId: device.geographyId,
              },
              issue
            )
          )
          if (issueStatusId === issueStatusAcknowledgedId) {
            await knex('IssueStatusLog').insert({
              issueId,
              issueStatusId: issueStatusActiveId,
              changedOn: now,
              createdOn: now,
              createdBy: adminId,
            })
          }
          if (issueStatusId !== issueStatusActiveId) {
            await knex('IssueStatusLog').insert({
              issueId,
              issueStatusId,
              changedOn: new Date(+now + millisInHour),
              createdOn: new Date(+now + millisInHour - 1000),
              createdBy: adminId,
            })
          }
          issueIds.push(issueId)
        })
      )
    })
  )

  const roPolicies = await knex('NotificationType as nt')
    .join('MessageType as mt', 'nt.messageTypeId', 'mt.id')
    .join('Issue as i', 'i.issueTypeId', 'nt.issueTypeId')
    .join('Job as j', 'j.jobFunctionId', 'nt.jobFunctionId')
    .join('JobContext as jc', 'jc.jobId', 'j.id')
    .join('AlertTemplate as at', 'at.id', 'mt.alertTemplateId')
    .where({ 'nt.partnerId': partnerId })
    .whereIn('i.id', issueIds)
    .whereRaw('(nt.level < 3 or nt.issueTypeId = ?)', [
      issueTypes.ReagentHealthError.id,
    ])
    .where('nt.jobFunctionId', jobFunctionIdRegionalOfficer)
    .select(
      'nt.id as notificationTypeId',
      'nt.name as notificationTypeName',
      'nt.jobFunctionId',
      'j.personId',
      'i.id as issueId',
      'i.issueTypeId',
      'i.siteId',
      'i.deviceId',
      'i.resultId',
      'mt.alertTemplateId'
    )

  await Promise.all(
    _.map(roPolicies, async policy => {
      const deviceId = deviceIds[policy.deviceId][policy.personId]
      if (deviceId) {
        const message = policy.notificationTypeName.endsWith('RO View')
          ? luAlertMessages[policy.issueTypeId]
          : roAlertMessages[policy.issueTypeId]
        const [alertMessageId] = await knex('AlertMessage').insert(
          Object.assign(
            {
              messageStatusId: messageStatusSentId,
              message,
              createdOn: now,
              updatedOn: now,
            },
            _.pick(policy, [
              'alertTemplateId',
              'personId',
              'siteId',
              'deviceId',
              'resultId',
            ])
          )
        )

        await knex('Notification').insert(
          Object.assign(
            {
              createdOn: now,
              alertMessageId,
            },
            _.pick(policy, ['notificationTypeId', 'issueId', 'personId'])
          )
        )
      }
    })
  )

  await seedStockIssues(knex)
  await seedStockIssuesUpdate(knex, 'Myanmar')
  await seedUnknownErrorsIssue(knex, 'Myanmar', 'myanmar_admin')
  await seedIssueEventTriggersForPartner(knex, partnerId, {
    issueTypeWhitelist: ['DeviceMaintenance'],
  })
  issueTypes = await rowsAsObject(knex, 'IssueType', 'externalId')

  // Issue Escalation Triggers
  await knex('IssueEscalationTrigger').insert([
    {
      issueTypeId: issueTypes.DeviceOffline.id,
      partnerId,
      escalateToLevel: 2,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 30 },
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.DeviceOffline.id,
      partnerId,
      escalateToLevel: 3,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'sql-script',
        evaluationParameter:
          './src/plugin/partner/Myanmar/sqlScripts/shouldEscalateL2NotificationAfter30Days.sql',
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.DeviceNoResults.id,
      partnerId,
      escalateToLevel: 2,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 7 },
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.DeviceNoResults.id,
      partnerId,
      escalateToLevel: 3,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'sql-script',
        evaluationParameter:
          './src/plugin/partner/Myanmar/sqlScripts/shouldEscalateL2NotificationAfter7Days.sql',
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.ModulePowerError.id,
      partnerId,
      escalateToLevel: 2,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 30 },
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.ModuleTemperatureError.id,
      partnerId,
      escalateToLevel: 2,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 90 },
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.MachineTemperatureError.id,
      partnerId,
      escalateToLevel: 2,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 30 },
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.MachinePowerError.id,
      partnerId,
      escalateToLevel: 2,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 30 },
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.ModuleFailureError.id,
      partnerId,
      escalateToLevel: 2,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 90 },
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.ReagentHealthError.id,
      partnerId,
      escalateToLevel: 2,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 30 },
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.ModuleProceduralError.id,
      partnerId,
      escalateToLevel: 2,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 30 },
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.MachineProceduralError.id,
      partnerId,
      escalateToLevel: 2,
      escalationConditions: JSON.stringify({
        evaluationMethod: 'issue-age',
        evaluationParameter: { days: 30 },
      }),
      createdOn: now,
      updatedOn: now,
    },
  ])

  // Issue Resolution Triggers
  await knex('IssueResolutionTrigger').insert([
    {
      issueTypeId: issueTypes.DeviceOffline.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'sql-script',
        evaluationParameter:
          './src/plugin/partner/Myanmar/sqlScripts/shouldResolveDeviceOffline.sql',
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.DeviceNoResults.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'sql-script',
        evaluationParameter:
          './src/plugin/partner/Myanmar/sqlScripts/shouldResolveDeviceNoResults.sql',
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.ModuleFailureError.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveModuleFailureError',
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.ModuleTemperatureError.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveModuleTemperatureError',
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.MachineTemperatureError.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveMachineTemperatureError',
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.ModulePowerError.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveModulePowerError',
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.MachinePowerError.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveMachinePowerError',
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.ModuleProceduralError.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveModuleProceduralError',
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.MachineProceduralError.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveMachineProceduralError',
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.ModuleUnknownError.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveModuleUnknownError',
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.MachineUnknownError.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveMachineUnknownError',
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.ReagentHealthError.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveReagentHealthError',
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.InventoryStockout.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveIssueStockout',
      }),
      createdOn: now,
      updatedOn: now,
    },
    {
      issueTypeId: issueTypes.InventoryStockExpiring.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveIssueStockExpiring',
      }),
      createdOn: now,
      updatedOn: now,
    },
  ])

  await seedDataCategory(knex, 'Myanmar')
}

async function getId(knex, table, externalId) {
  const { id } = await knex(table)
    .where({ externalId })
    .first('id')
  return id
}
