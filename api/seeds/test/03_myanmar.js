module.exports = require('../utils').seed(seed, __filename)

const bcrypt = require('bcrypt')
const _ = require('lodash')
const Promise = require('bluebird')
const config = require('../../src/config')
const myanmarSites = require('./fixtures/myanmarSites.json')
const dashboardWidget = require('./fixtures/myanmarDashboardWidget')
const { upsertJobFunction } = require('../common')
const { rowsAsObject, getPermissionModules, seedNotificationTypes, seedIssues } = require('../utils')
const { addIssueTypes } = require('../relativeObjectsSeeds')
const { deviceApprovalToId, deviceTypeToId, partnerTypeToId } = require('../../src/shared/dictionary')
const { insertSite } = require('../../src/site/common/db')

const now = new Date()
const millisInHour = 1000 * 60 * 60

const saltRounds = parseInt(config.passwordSaltRounds, 10)

async function seed(knex) {
  // Skip this seed file if we already have an admin user
  const existingAdminUser = await knex('User').where({ name: 'myanmar_admin' }).first('id')
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

  const maxDaysDeviceNoResults = 14
  const [partnerId] = await knex('Partner').insert({
    name: 'MoHS',
    externalId: 'mohs',
    partnerTypeId: await partnerTypeToId('operating'),
    deviceLogHistoryDays: 365,
    autoAcknowledgeOlderThanDays: 28,
    numberToLeaveUnacknowledged: 15,
    maxDaysDeviceOffline: 7,
    maxDaysDeviceNoResults,
    serverUrl: 'https://myanmar.aspect.id',
  })

  const modules = await getPermissionModules(knex)

  const [myanmarCountry] = await knex('Country as c').where({ 'c.a3': 'MMR' }).select('c.id', 'c.culture', 'c.timezone')
  const countryId = myanmarCountry.id

  const { id: myanmarGeographyId } = await knex('Geography').where({ countryId }).whereNull('stateId', 'lgaId').first()

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

  const jobFunctionIdSuperAdmin = await upsertJobFunction(knex, 'Super Admin', partnerId)

  const jobFunctionIdRegionalOfficer = await upsertJobFunction(knex, 'Regional Officer', partnerId)

  const jobFunctionIdLabUser = await upsertJobFunction(knex, 'Lab User', partnerId)

  const jobFunctionIds = {
    jobFunctionIdSuperAdmin,
    jobFunctionIdLabUser,
    jobFunctionIdRegionalOfficer,
  }
  const baseProps = {
    partnerId,
    jobFunctionIds,
    auditFields,
    issueTypeWhitelist: ['DeviceMaintenance', 'ModuleReplaced'],
  }

  await knex('JobFunctionPermission').insert([
    // Admin Permissions
    { jobFunctionId: jobFunctionIdSuperAdmin, permissionId: modules.demo.edit },
    {
      jobFunctionId: jobFunctionIdSuperAdmin,
      permissionId: modules.device.edit,
    },
    {
      jobFunctionId: jobFunctionIdSuperAdmin,
      permissionId: modules.deviceApiKey.edit,
    },
    {
      jobFunctionId: jobFunctionIdSuperAdmin,
      permissionId: modules.person.edit,
    },
    {
      jobFunctionId: jobFunctionIdSuperAdmin,
      permissionId: modules.result.edit,
    },
    { jobFunctionId: jobFunctionIdSuperAdmin, permissionId: modules.site.edit },
    {
      jobFunctionId: jobFunctionIdSuperAdmin,
      permissionId: modules.assay.edit,
    },
    {
      jobFunctionId: jobFunctionIdSuperAdmin,
      permissionId: modules.issue.edit,
    },
    {
      jobFunctionId: jobFunctionIdSuperAdmin,
      permissionId: modules.inventory.edit,
    },
    { jobFunctionId: jobFunctionIdSuperAdmin, permissionId: modules.task.edit },
    {
      jobFunctionId: jobFunctionIdSuperAdmin,
      permissionId: modules.dashboard.actionInventoryLevelUpdate,
    },
    {
      jobFunctionId: jobFunctionIdSuperAdmin,
      permissionId: modules.dashboard.summary,
    },
    {
      jobFunctionId: jobFunctionIdSuperAdmin,
      permissionId: modules.dashboard.report,
    },
    {
      jobFunctionId: jobFunctionIdSuperAdmin,
      permissionId: modules.dashboard.siteFilter,
    },
    // Regional Officer Permissions
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.device.edit,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.result.edit,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.site.edit,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.issue.edit,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.inventory.edit,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.task.edit,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.dashboard.report,
    },
    {
      jobFunctionId: jobFunctionIdRegionalOfficer,
      permissionId: modules.dashboard.actionInventoryLevelUpdate,
    },
    // Lab User Permissions
    {
      jobFunctionId: jobFunctionIdLabUser,
      permissionId: modules.device.edit,
    },
    {
      jobFunctionId: jobFunctionIdLabUser,
      permissionId: modules.result.edit,
    },
    {
      jobFunctionId: jobFunctionIdLabUser,
      permissionId: modules.site.edit,
    },
    {
      jobFunctionId: jobFunctionIdLabUser,
      permissionId: modules.issue.edit,
    },
    {
      jobFunctionId: jobFunctionIdLabUser,
      permissionId: modules.inventory.edit,
    },
    {
      jobFunctionId: jobFunctionIdLabUser,
      permissionId: modules.task.edit,
    },
    {
      jobFunctionId: jobFunctionIdLabUser,
      permissionId: modules.dashboard.summary,
    },
    {
      jobFunctionId: jobFunctionIdLabUser,
      permissionId: modules.dashboard.actionInventoryLevelUpdate,
    },
    {
      jobFunctionId: jobFunctionIdLabUser,
      permissionId: modules.dashboard.report,
    },
    {
      jobFunctionId: jobFunctionIdLabUser,
      permissionId: modules.dashboard.siteFilter,
    },
  ])

  // Admin JobContext
  await knex('JobContext').insert({
    personId: adminPersonId,
    jobFunctionId: jobFunctionIdSuperAdmin,
    geographyId: myanmarGeographyId,
  })

  // Regional Officer Jobs and Targets
  const adminRegions = ['AYY', 'KCN', 'MDY']
  await Promise.each(adminRegions, async (region, regionNumber) => {
    const regionUserName = `myanmar_ro${regionNumber + 1}`
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
    const [regionPersonId] = await knex('Person').insert({
      userId: regionUserId,
      name: `Myanmar Regional Officer ${region}`,
      lastPartnerId: partnerId,
      lastCountryId: countryId,
      geographyId: myanmarGeographyId,
      cell: config.admin.cell,
      culture: myanmarCountry.culture,
      timezone: myanmarCountry.timezone,
      ...auditFields,
    })
    await knex('JobContext').insert({
      personId: regionPersonId,
      jobFunctionId: jobFunctionIdRegionalOfficer,
      geographyId: regionId,
    })
  })

  await Promise.each(myanmarSites.sites, async site => {
    const { id: siteGeographyId } = await knex('Geography')
      .where({
        countryId,
        stateId: (statesByAbbreviation[site.stateAbbreviation] || { id: null }).id,
        lgaId: (lgasByName[site.lgaName] || { id: null }).id,
      })
      .first()

    // sites
    const siteData = {
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
      ...auditFields,
    }
    const [siteId] = await insertSite(knex, siteData)
    siteData.id = siteId

    await Promise.each(site.devices, async deviceSeed => {
      const device = {
        partnerId,
        siteId,
        defaultReportableSiteId: siteId,
        deviceTypeId: await deviceTypeToId('CepheidGeneXpert'),
        deviceApprovalId: await deviceApprovalToId('approved'),
        name: deviceSeed.name,
        shortName: deviceSeed.shortName,
        macAddress: deviceSeed.macAddress,
        serial: deviceSeed.serial,
        hostId: deviceSeed.hostId,
        culture: deviceSeed.culture,
        timezone: deviceSeed.timezone,
        notes: deviceSeed.notes,
        lastSeenOn: now,
      }
      await knex('Device').insert(device)
    })
  })

  // Lab User Jobs
  await Promise.each(adminRegions, async (region, labNumber) => {
    const labUserName = `myanmar_lab${labNumber + 1}`
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
    const [labPersonId] = await knex('Person').insert({
      userId: labUserId,
      name: `Myanmar Lab User ${region}`,
      lastPartnerId: partnerId,
      lastCountryId: countryId,
      geographyId,
      cell: config.admin.cell,
      culture: myanmarCountry.culture,
      timezone: myanmarCountry.timezone,
      canLogIn: true,
      ...auditFields,
    })
    await knex('JobContext').insert({
      personId: labPersonId,
      jobFunctionId: jobFunctionIdLabUser,
      siteId,
    })
  })

  // Create DashboardWidget
  const statWidgets = []
  await Promise.each(dashboardWidget.stat, async widget => {
    const widgetData = _.pick(widget, [
      'title',
      'titleI18nKey',
      'subTitle',
      'subTitleI18nKey',
      'sqlForIndicator',
      'link',
      'sortOrder',
      'externalId',
      'description',
      'descriptionI18nKey',
      'dashboards',
    ])
    widgetData.dashboards = JSON.stringify(widgetData.dashboards || { home: {} })

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

  const targetWidgets = []
  await Promise.each(dashboardWidget.target, async widget => {
    const widgetData = _.pick(widget, [
      'title',
      'titleI18nKey',
      'subTitle',
      'subTitleI18nKey',
      'sqlForIndicator',
      'link',
      'sortOrder',
      'externalId',
      'description',
      'descriptionI18nKey',
      'dashboards',
    ])
    widgetData.dashboards = JSON.stringify(widgetData.dashboards || { home: {} })

    const [widgetId] = await knex('DashboardWidget').insert(widgetData)
    const statWidgetData = _.pick(widget, ['sqlForDataCollection', 'thresholdPercentageDataCollection', 'targetToken'])
    await knex('DashboardWidgetTarget').insert({
      dashboardWidgetId: widgetId,
      ...statWidgetData,
    })
    targetWidgets.push(widgetId)
  })

  await Promise.each(statWidgets, async widgetId => {
    await knex('JobFunctionDashboardWidget').insert([
      { jobFunctionId: jobFunctionIdSuperAdmin, widgetId },
      { jobFunctionId: jobFunctionIdRegionalOfficer, widgetId },
      { jobFunctionId: jobFunctionIdLabUser, widgetId },
    ])
  })
  await Promise.each(targetWidgets, async widgetId => {
    await knex('JobFunctionDashboardWidget').insert([
      { jobFunctionId: jobFunctionIdSuperAdmin, widgetId },
      { jobFunctionId: jobFunctionIdRegionalOfficer, widgetId },
    ])
  })
  await addIssueTypes(knex, partnerId, adminId, null)
  // Notification Types
  await seedNotificationTypes(knex, baseProps)

  // Fill Issue/AlertMessage/Notification table with some mock data
  const devices = await knex('Device as d')
    .join('Site as s', 'd.siteId', 's.id')
    .where('d.partnerId', partnerId)
    .select('d.*', 's.geographyId')
  const issueStatusActiveId = await getId(knex, 'IssueStatus', 'Active')
  const issueStatusAcknowledgedId = await getId(knex, 'IssueStatus', 'Acknowledged')
  const issueStatusOkId = await getId(knex, 'IssueStatus', 'OK')
  const messageStatusSentId = await getId(knex, 'MessageStatus', 'Sent')

  const issue = {
    level: 1,
    partnerId,
    createdOn: now,
    updatedOn: now,
  }
  const issueTypes = await rowsAsObject(knex, 'IssueType', 'externalId')

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
    [issueTypes.ModuleFailureError.id]: 'Module A1: Critical errors; notify R.O.',
    [issueTypes.ModuleTemperatureError.id]: 'Temperature errors on Module A2; notify R.O.',
    [issueTypes.ModulePowerError.id]: 'Power errors on Module A3; notify RO',
    [issueTypes.MachineTemperatureError.id]: 'Temperature errors across machine, conduct troubleshooting',
    [issueTypes.MachinePowerError.id]: 'Power errors across machine, conduct troubleshooting',
    [issueTypes.ModuleProceduralError.id]: 'Module A2 errors, conduct troubleshooting',
    [issueTypes.MachineProceduralError.id]: 'Procedural errors across machine, conduct troubleshooting',
    [issueTypes.DataCategoryLowError.id]: 'HIV Status collection rate 89%',
    [issueTypes.StockLevelUpdate.id]: 'Stock Level',
    [issueTypes.ReagentHealthError.id]: 'Cartridge-specific errors exceed 5%',
  }

  const deviceIds = await knex('Device as d')
    .select('jc.personId', 'd.id as deviceId')
    .join('JobContext as jc', 'jc.siteId', 'd.siteId')
    .where({ jobFunctionId: jobFunctionIdLabUser })
    .union(function () {
      this.select('jc.personId', 'd.id as deviceId')
        .from('Device as d')
        .leftJoin('Site as s', 'd.siteId', 's.id')
        .leftJoin('Geography as g1', 's.geographyId', 'g1.id')
        .leftJoin('Geography as g2', 'g2.stateId', 'g1.stateId')
        .join('JobContext as jc', 'jc.geographyId', 'g2.id')
        .where('d.partnerId', partnerId)
        .where({ jobFunctionId: jobFunctionIdRegionalOfficer })
    })
    .then(items =>
      _.orderBy(items, ['deviceId']).reduce((memo, row) => {
        if (!memo[row.deviceId]) {
          memo[row.deviceId] = {}
        }
        memo[row.deviceId][row.personId] = row.deviceId
        return memo
      }, {})
    )

  await Promise.each(devices, async device => {
    await Promise.each(luIssueTypeIds, async issueTypeId => {
      const issueStatusId = issueTypeId === issueTypes.StockLevelUpdate.id ? issueStatusOkId : issueStatusActiveId
      const [issueId] = await knex('Issue').insert({
        issueTypeId,
        issueStatusId,
        deviceId: device.id,
        siteId: device.siteId,
        geographyId: device.geographyId,
        ...issue,
      })
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
  })

  const luPolicies = await knex('NotificationType as nt')
    .join('MessageType as mt', 'nt.messageTypeId', 'mt.id')
    .join('Issue as i', 'i.issueTypeId', 'nt.issueTypeId')
    .join('JobContext as jc', 'jc.jobFunctionId', 'nt.jobFunctionId')
    .join('AlertTemplate as at', 'at.id', 'mt.alertTemplateId')
    .where({ 'nt.partnerId': partnerId })
    .whereIn('i.id', issueIds)
    .where('nt.level', 1)
    .where('nt.jobFunctionId', jobFunctionIdLabUser)
    .select(
      'nt.id as notificationTypeId',
      'nt.jobFunctionId',
      'jc.personId',
      'i.id as issueId',
      'i.issueTypeId',
      'i.siteId',
      'i.deviceId',
      'i.resultId',
      'mt.alertTemplateId'
    )

  await Promise.each(luPolicies, async policy => {
    const deviceId = deviceIds[policy.deviceId][policy.personId]
    if (deviceId) {
      const [alertMessageId] = await knex('AlertMessage').insert({
        messageStatusId: messageStatusSentId,
        message: luAlertMessages[policy.issueTypeId],
        createdOn: now,
        updatedOn: now,
        ..._.pick(policy, ['alertTemplateId', 'personId', 'siteId', 'deviceId', 'resultId']),
      })

      await knex('Notification').insert({
        createdOn: now,
        alertMessageId,
        ..._.pick(policy, ['notificationTypeId', 'issueId', 'personId']),
      })
    }
  })

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
    [issueTypes.DeviceOffline.id]: 'No contact for 12 days. If there is a reason for being inactive, add the reason',
    [issueTypes.DeviceNoResults.id]: 'No testing for 9 days',
    [issueTypes.ModuleProceduralError.id]: 'Module Temperature Issue for 2 days',
    [issueTypes.MachineProceduralError.id]: 'Machine Power Issue for 7 days',
    [issueTypes.StockLevelUpdate.id]: 'Stock Level',
    [issueTypes.DataCategoryLowError.id]: 'HIV Status collection rate 92%',
    [issueTypes.ReagentHealthError.id]: 'Cartridge-specific errors exceed 5%',
  }

  issue.level = 2
  issueIds = []
  await Promise.each(devices, async device => {
    await Promise.each(roIssueTypeIds, async issueTypeId => {
      const issueStatusId = issueTypeId === issueTypes.StockLevelUpdate.id ? issueStatusOkId : issueStatusActiveId
      const [issueId] = await knex('Issue').insert({
        issueTypeId,
        issueStatusId,
        deviceId: device.id,
        siteId: device.siteId,
        geographyId: device.geographyId,
        ...issue,
      })
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
  })

  const roPolicies = await knex('NotificationType as nt')
    .join('MessageType as mt', 'nt.messageTypeId', 'mt.id')
    .join('Issue as i', 'i.issueTypeId', 'nt.issueTypeId')
    .join('JobContext as jc', 'jc.jobFunctionId', 'nt.jobFunctionId')
    .join('AlertTemplate as at', 'at.id', 'mt.alertTemplateId')
    .where({ 'nt.partnerId': partnerId })
    .whereIn('i.id', issueIds)
    .whereRaw('(nt.level < 3 or nt.issueTypeId = ?)', [issueTypes.ReagentHealthError.id])
    .where('nt.jobFunctionId', jobFunctionIdRegionalOfficer)
    .select(
      'nt.id as notificationTypeId',
      'nt.name as notificationTypeName',
      'nt.jobFunctionId',
      'jc.personId',
      'i.id as issueId',
      'i.issueTypeId',
      'i.siteId',
      'i.deviceId',
      'i.resultId',
      'mt.alertTemplateId'
    )

  await Promise.each(roPolicies, async policy => {
    const deviceId = deviceIds[policy.deviceId][policy.personId]
    if (deviceId) {
      const message = policy.notificationTypeName.endsWith('RO View')
        ? luAlertMessages[policy.issueTypeId]
        : roAlertMessages[policy.issueTypeId]
      const [alertMessageId] = await knex('AlertMessage').insert({
        messageStatusId: messageStatusSentId,
        message,
        createdOn: now,
        updatedOn: now,
        ..._.pick(policy, ['alertTemplateId', 'personId', 'siteId', 'deviceId', 'resultId']),
      })

      await knex('Notification').insert({
        createdOn: now,
        alertMessageId,
        ..._.pick(policy, ['notificationTypeId', 'issueId', 'personId']),
      })
    }
  })

  await seedIssues(knex, baseProps)
}

async function getId(knex, table, externalId) {
  const { id } = await knex(table).where({ externalId }).first('id')
  return id
}
