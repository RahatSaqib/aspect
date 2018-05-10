module.exports = require('../../src/db').seed(seed)

const ADMIN_PW = '8v5TMxkpzP'
const RO_PW = 'u4W9wupFBA'

const bcrypt = require('bcrypt')
const _ = require('lodash')

const config = require('../../src/config')
const dashboardWidget = require('./fixtures/dashboardWidget.json')

const now = new Date()

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
    password: bcrypt.hashSync(ADMIN_PW, saltRounds),
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
  const [
    partnerTypes,
    deviceTypes,
    deviceStatuses,
    issueTypes,
    defaultMessageTypes,
  ] = await Promise.all([
    rowsAsObject(knex, 'PartnerType', 'name'),
    rowsAsObject(knex, 'DeviceType', 'externalId'),
    rowsAsObject(knex, 'DeviceStatus', 'token'),
    rowsAsObject(knex, 'IssueType', 'externalId'),
    getDefaultMessageTypes(knex),
  ])

  const [partnerId] = await knex('Partner').insert({
    name: 'Myanmar',
    partnerTypeId: partnerTypes.Operating.id,
    deviceLogHistoryDays: 365,
    autoAcknowledgeOlderThanDays: 28,
    numberToLeaveUnacknowledged: 15,
    maxDaysDeviceOffline: 7,
  })

  const modules = await knex('Permission').reduce((memo, row) => {
    if (!memo[row.module]) {
      memo[row.module] = {}
    }
    memo[row.module][row.activity] = row.id
    return memo
  }, {})

  await knex('Feature').insert({ module: 'targetDashboard' })
  await knex('Feature').insert({ module: 'actionDashboard' })
  await knex('Feature').insert({ module: 'reportDashboard' })
  await knex('Feature').insert({ module: 'siteFilterDashboard' })

  const featureModules = await knex('Feature').reduce((memo, row) => {
    memo[row.module] = row.id
    return memo
  }, {})

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

  // create site for GxAlert device
  const gxAlertSiteId = await knex('Site').insert(
    Object.assign({}, auditFields, {
      name: 'GxAlert Site',
      shortName: 'GxA Site',
      externalId: 'gxalert',
      partnerId,
      geographyId: myanmarGeographyId,
      createdOn: new Date(),
      updatedOn: new Date(),
    })
  )

  // insert GxAlert device
  const gxAlertDeviceId = await knex('Device').insert(
    Object.assign({}, auditFields, {
      name: 'GxAlert',
      deviceTypeId: deviceTypes.GxAlert.id,
      deviceStatusId: deviceStatuses.approved.id,
      partnerId,
      geographyId: myanmarGeographyId,
      siteId: gxAlertSiteId,
      createdOn: new Date(),
      updatedOn: new Date(),
      lastPingOn: new Date(),
      lastSeenOn: new Date(),
    })
  )

  await knex('DeviceApiKey').insert(
    Object.assign(
      {
        token: 'ukpjat39531egjy4pc20',
        revoked: 0,
        partnerId,
        geographyId: myanmarGeographyId,
        deviceId: gxAlertDeviceId,
      },
      auditFields
    )
  )

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
    {
      jobFunctionId: jobFunctionIdLabUser,
      permissionId: modules.issue.admin,
    },
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

  // Create a regional officer login and targets for every region
  const targetTokens = ['Total', 'MDR', 'Smear', 'HIV', 'Children']
  await Promise.all(
    _.map(myanmarStates, async state => {
      const regionUserName = `${state.name
        .replace(/\W/gi, '')
        .toLowerCase()
        .trim()}_ro`
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
      const [regionPersonId] = await knex('Person').insert(
        Object.assign(
          {
            userId: regionUserId,
            name: `Myanmar Regional Officer ${state.name}`,
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
        evaluationParameter:
          './sqlScripts/Myanmar/issues/escalations/deviceOfflineLevel3ROEscalatedNetwork.sql',
      }),
      createdOn: now,
      updatedOn: now,
    },
  ])
}

function rowsAsObject(knex, table, column = 'name') {
  return knex(table).reduce((memo, row) => {
    memo[row[column]] = row
    return memo
  }, {})
}

function getDefaultMessageTypes(knex) {
  return knex('MessageType as mt')
    .join('IssueType as it', 'it.defaultMessageTypeId', 'mt.id')
    .select('it.externalId as issueTypeExternalId', 'mt.*')
    .reduce((memo, row) => {
      memo[row.issueTypeExternalId] = row
      return memo
    }, {})
}
