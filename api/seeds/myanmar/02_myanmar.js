module.exports = require('../utils').seed(seed, __filename)

const RO_PW = 'u4W9wupFBA'

const bcrypt = require('bcrypt')
const _ = require('lodash')
const { addIssueTypes } = require('../relativeObjectsSeeds')
const partnerData = require('./fixtures/partnerData')
const { upsertJobFunction } = require('../common')
const config = require('../../src/config')
const dashboardWidget = require('./fixtures/dashboardWidget')
const { rowsAsObject, getDefaultMessageTypes, getPermissionModules } = require('../utils')
const { deviceApprovalToId, deviceTypeToId, partnerTypeToId } = require('../../src/shared/dictionary')
const upsertPartnerData = require('../common/upsert_partner_data')

const now = new Date()

const saltRounds = parseInt(config.passwordSaltRounds, 10)

const { adminUserName, adminPassword, deviceApiToken } = partnerData

async function seed(knex) {
  // Skip this seed file if we already have an admin user
  const existingAdminUser = await knex('User').where({ name: adminUserName }).first('id')
  if (existingAdminUser) {
    return
  }

  // Create admin user and audit fields
  const [adminId] = await knex('User').insert({
    name: adminUserName,
    password: bcrypt.hashSync(adminPassword, saltRounds),
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

  const partnerId = await upsertPartnerData(knex, {
    ...partnerData,
    partnerTypeId: await partnerTypeToId('operating'),
  })

  await addIssueTypes(knex, partnerId, adminId, null)
  // Reuse previously seeded "static" data
  const defaultMessageTypes = await getDefaultMessageTypes(knex)
  const [myanmarCountry] = await knex('Country as c').where({ 'c.a3': 'MMR' }).select('c.id', 'c.culture', 'c.timezone')
  const countryId = myanmarCountry.id

  const { id: myanmarGeographyId } = await knex('Geography').where({ countryId }).whereNull('stateId', 'lgaId').first()

  const myanmarStates = await knex('Geography as g')
    .innerJoin('State as s', 's.id', 'g.stateId')
    .where({ 'g.countryId': countryId })
    .whereNull('g.lgaId')
    .select('s.id', 's.name', 's.abbreviation')

  // create site for GxAlert device
  const [gxAlertSiteId] = await knex('Site').insert({
    ...auditFields,
    name: 'GxAlert Site',
    shortName: 'GxA Site',
    externalId: 'gxalert',
    partnerId,
    geographyId: myanmarGeographyId,
    createdOn: new Date(),
    updatedOn: new Date(),
  })

  // insert GxAlert device
  const [gxAlertDeviceId] = await knex('Device').insert({
    ...auditFields,
    name: 'GxAlert',
    deviceTypeId: await deviceTypeToId('GxAlert'),
    deviceApprovalId: await deviceApprovalToId('approved'),
    partnerId,
    geographyId: myanmarGeographyId,
    siteId: gxAlertSiteId,
    createdOn: new Date(),
    updatedOn: new Date(),
    lastPingOn: new Date(),
    lastSeenOn: new Date(),
  })

  await knex('DeviceApiKey').insert({
    token: deviceApiToken,
    revoked: 0,
    partnerId,
    geographyId: myanmarGeographyId,
    deviceId: gxAlertDeviceId,
    ...auditFields,
  })

  // Permissions for Myanmar Admin
  const [adminPersonId] = await knex('Person').insert({
    userId: adminId,
    name: 'Myanmar Admin',
    lastPartnerId: partnerId,
    lastCountryId: countryId,
    geographyId: myanmarGeographyId,
    culture: myanmarCountry.culture,
    timezone: myanmarCountry.timezone,
    ...auditFields,
  })
  const modules = await getPermissionModules(knex)
  const jobFunctionIdAdmin = await upsertJobFunction(knex, 'Admin', partnerId, [
    modules.demo.edit,
    modules.site.edit,
    modules.result.edit,
    modules.dashboard.result,
    modules.device.edit,
    modules.reporter.edit,
    modules.assay.edit,
    modules.deviceApiKey.edit,
    modules.dashboard.summary,
    modules.inventory.edit,
    modules.person.edit,
    modules.dashboard.action,
    modules.dashboard.report,
    modules.dashboard.siteFilter,
    modules.dashboard.actionInventoryLevelUpdate,
    modules.dashboard.target,
  ])

  const jobFunctionIdRegionalOfficer = await upsertJobFunction(knex, 'Regional Officer', partnerId, [
    modules.device.edit,
    modules.result.edit,
    modules.site.edit,
    modules.assay.view,
    modules.issue.edit,
    modules.actionDashboard.edit,
    modules.inventory.edit,
    modules.dashboard.summary,
    modules.dashboard.action,
    modules.dashboard.report,
    modules.dashboard.siteFilter,
    modules.dashboard.actionInventoryLevelUpdate,
    modules.dashboard.target,
  ])

  const jobFunctionIdLabUser = await upsertJobFunction(knex, 'Lab User', partnerId, [
    modules.result.edit,
    modules.site.edit,
    modules.assay.view,
    modules.issue.edit,
    modules.inventory.edit,
    modules.device.edit,
    modules.dashboard.summary,
    modules.dashboard.action,
    modules.dashboard.report,
    modules.dashboard.actionInventoryLevelUpdate,
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

  // Create a regional officer login and targets for every region
  const targetTokens = ['Total', 'MDR', 'Smear', 'HIV', 'Children']
  await Promise.all(
    _.map(myanmarStates, async state => {
      const regionUserName = `${state.name.replace(/\W/gi, '').toLowerCase().trim()}_ro`
      const { id: regionId } = await knex('Geography')
        .where({
          countryId,
          stateId: state.id,
        })
        .first()
      const [regionUserId] = await knex('User').insert({
        name: regionUserName,
        password: bcrypt.hashSync(RO_PW, saltRounds),
        approved: 1,
        createdOn: now,
        lockedOut: 0,
        failedPasswordAttempts: 0,
      })
      const [regionPersonId] = await knex('Person').insert({
        userId: regionUserId,
        name: `Myanmar Regional Officer ${state.name}`,
        lastPartnerId: partnerId,
        lastCountryId: countryId,
        geographyId: myanmarGeographyId,
        culture: myanmarCountry.culture,
        timezone: myanmarCountry.timezone,
        ...auditFields,
      })
      const [jobIdRegion] = await knex('Job').insert({
        personId: regionPersonId,
        jobFunctionId: jobFunctionIdRegionalOfficer,
      })
      await knex('JobContext').insert({
        jobId: jobIdRegion,
        geographyId: regionId,
      })
      await Promise.all(
        _.map(targetTokens, async token => {
          const targetValue = 850 + Math.floor(Math.random() * 200 - 100)
          await knex('Target').insert({
            geographyId: regionId,
            targetToken: token,
            targetValue,
          })
        })
      )
    })
  )

  // Create DashboardWidget
  const statWidgets = []
  await Promise.all(
    _.map(dashboardWidget.stat, async widget => {
      const widgetData = _.pick(widget, [
        'title',
        'titleI18nKey',
        'externalId',
        'subTitle',
        'subTitleI18nKey',
        'sqlForIndicator',
        'link',
        'sortOrder',
        'description',
        'descriptionI18nKey',
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
      await knex('DashboardWidgetStat').insert({
        dashboardWidgetId: widgetId,
        ...statWidgetData,
      })
      statWidgets.push(widgetId)
    })
  )

  const targetWidgets = []
  await Promise.all(
    _.map(dashboardWidget.target, async widget => {
      const widgetData = _.pick(widget, [
        'title',
        'titleI18nKey',
        'externalId',
        'subTitle',
        'subTitleI18nKey',
        'sqlForIndicator',
        'link',
        'sortOrder',
        'description',
        'descriptionI18nKey',
      ])
      const [widgetId] = await knex('DashboardWidget').insert(widgetData)
      const statWidgetData = _.pick(widget, [
        'sqlForDataCollection',
        'thresholdPercentageDataCollection',
        'targetToken',
      ])
      await knex('DashboardWidgetTarget').insert({
        dashboardWidgetId: widgetId,
        ...statWidgetData,
      })
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
  const issueTypes = await rowsAsObject(knex, 'IssueType', 'externalId')

  // Notifications
  await knex('NotificationType').insert([
    {
      name: 'LU Network',
      partnerId,
      issueTypeId: issueTypes.DeviceOffline.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 1,
      canAcknowledge: 1,
      messageTypeId: defaultMessageTypes.DeviceOffline.id,
      ...auditFields,
    },
    {
      name: 'RO Network',
      partnerId,
      issueTypeId: issueTypes.DeviceOffline.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 2,
      canAcknowledge: 1,
      messageTypeId: defaultMessageTypes.DeviceOffline.id,
      ...auditFields,
    },
    {
      name: 'RO Escalated Network',
      partnerId,
      issueTypeId: issueTypes.DeviceOffline.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 3,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.DeviceOffline.id,
      ...auditFields,
    },
    {
      name: 'LU No Testing',
      partnerId,
      issueTypeId: issueTypes.DeviceNoResults.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 1,
      canAcknowledge: 1,
      messageTypeId: defaultMessageTypes.DeviceNoResults.id,
      ...auditFields,
    },
    {
      name: 'RO No Testing',
      partnerId,
      issueTypeId: issueTypes.DeviceNoResults.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 2,
      canAcknowledge: 1,
      messageTypeId: defaultMessageTypes.DeviceNoResults.id,
      ...auditFields,
    },
    {
      name: 'RO Escalated No Testing',
      partnerId,
      issueTypeId: issueTypes.DeviceNoResults.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 3,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.DeviceNoResults.id,
      ...auditFields,
    },
    {
      name: 'LU Module Failure',
      partnerId,
      issueTypeId: issueTypes.ModuleFailureError.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 2,
      canAcknowledge: 1,
      messageTypeId: defaultMessageTypes.ModuleFailureError.id,
      ...auditFields,
    },
    {
      name: 'LU Escalated Module Failure',
      partnerId,
      issueTypeId: issueTypes.ModuleFailureError.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 2,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.ModuleFailureError.id,
      ...auditFields,
    },
    {
      name: 'LU Module Temperature',
      partnerId,
      issueTypeId: issueTypes.ModuleTemperatureError.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 1,
      canAcknowledge: 1,
      messageTypeId: defaultMessageTypes.ModuleTemperatureError.id,
      ...auditFields,
    },
    {
      name: 'LU Escalated Module Temperature',
      partnerId,
      issueTypeId: issueTypes.ModuleTemperatureError.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 2,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.ModuleTemperatureError.id,
      ...auditFields,
    },
    {
      name: 'LU Module Power',
      partnerId,
      issueTypeId: issueTypes.ModulePowerError.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 1,
      canAcknowledge: 1,
      messageTypeId: defaultMessageTypes.ModulePowerError.id,
      ...auditFields,
    },
    {
      name: 'LU Escalated Module Power',
      partnerId,
      issueTypeId: issueTypes.ModulePowerError.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 2,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.ModulePowerError.id,
      ...auditFields,
    },
    {
      name: 'LU Machine Temperature',
      partnerId,
      issueTypeId: issueTypes.MachineTemperatureError.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 1,
      canAcknowledge: 1,
      messageTypeId: defaultMessageTypes.MachineTemperatureError.id,
      ...auditFields,
    },
    {
      name: 'LU Escalated Machine Temperature',
      partnerId,
      issueTypeId: issueTypes.MachineTemperatureError.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 2,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.MachineTemperatureError.id,
      ...auditFields,
    },
    {
      name: 'LU Machine Power',
      partnerId,
      issueTypeId: issueTypes.MachinePowerError.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 1,
      canAcknowledge: 1,
      messageTypeId: defaultMessageTypes.MachinePowerError.id,
      ...auditFields,
    },
    {
      name: 'LU Escalated Machine Power',
      partnerId,
      issueTypeId: issueTypes.MachinePowerError.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 2,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.MachinePowerError.id,
      ...auditFields,
    },
    {
      name: 'LU Module Generic',
      partnerId,
      issueTypeId: issueTypes.ModuleGenericError.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 1,
      canAcknowledge: 1,
      messageTypeId: defaultMessageTypes.ModuleGenericError.id,
      ...auditFields,
    },
    {
      name: 'LU Escalated Module Generic',
      partnerId,
      issueTypeId: issueTypes.ModuleGenericError.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 2,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.ModuleGenericError.id,
      ...auditFields,
    },
    {
      name: 'LU Machine Generic',
      partnerId,
      issueTypeId: issueTypes.MachineGenericError.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 1,
      canAcknowledge: 1,
      messageTypeId: defaultMessageTypes.MachineGenericError.id,
      ...auditFields,
    },
    {
      name: 'LU Escalated Machine Generic',
      partnerId,
      issueTypeId: issueTypes.MachineGenericError.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 2,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.MachineGenericError.id,
      ...auditFields,
    },
    {
      name: 'RO Module',
      partnerId,
      issueTypeId: issueTypes.ModuleGenericError.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 1,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.ModuleGenericError.id,
      ...auditFields,
    },
    {
      name: 'RO Machine',
      partnerId,
      issueTypeId: issueTypes.MachineGenericError.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 1,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.MachineGenericError.id,
      ...auditFields,
    },
    {
      name: 'LU Reagent Health',
      partnerId,
      issueTypeId: issueTypes.ReagentHealthError.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 1,
      canAcknowledge: 1,
      messageTypeId: defaultMessageTypes.ReagentHealthError.id,
      ...auditFields,
    },
    {
      name: 'LU Escalated Reagent Health',
      partnerId,
      issueTypeId: issueTypes.ReagentHealthError.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 2,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.ReagentHealthError.id,
      ...auditFields,
    },
    {
      name: 'RO Reagent Health',
      partnerId,
      issueTypeId: issueTypes.ReagentHealthError.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 3,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.ReagentHealthError.id,
      ...auditFields,
    },
    {
      name: 'LU Stock Level Update',
      partnerId,
      issueTypeId: issueTypes.StockLevelUpdate.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 1,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.StockLevelUpdate.id,
      ...auditFields,
    },
    {
      name: 'RO Stock Level Update',
      partnerId,
      issueTypeId: issueTypes.StockLevelUpdate.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 1,
      canAcknowledge: 0,
      messageTypeId: defaultMessageTypes.StockLevelUpdate.id,
      ...auditFields,
    },
    {
      name: 'LU Data Category Low',
      partnerId,
      issueTypeId: issueTypes.DataCategoryLowError.id,
      jobFunctionId: jobFunctionIdLabUser,
      level: 1,
      canAcknowledge: 1,
      messageTypeId: defaultMessageTypes.DataCategoryLowError.id,
      ...auditFields,
    },
    {
      name: 'RO Data Category Low',
      partnerId,
      issueTypeId: issueTypes.DataCategoryLowError.id,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      level: 1,
      canAcknowledge: 1,
      messageTypeId: defaultMessageTypes.DataCategoryLowError.id,
      ...auditFields,
    },
  ])

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
        evaluationParameter: './sqlScripts/Myanmar/issues/escalations/deviceOfflineLevel3ROEscalatedNetwork.sql',
      }),
      createdOn: now,
      updatedOn: now,
    },
  ])
}
