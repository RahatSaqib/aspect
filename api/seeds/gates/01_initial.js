module.exports = require('../../src/db').seed(seed)

const config = require('../../src/config')
const _ = require('lodash')
const bcrypt = require('bcrypt')
const permissions = require('./fixtures/permissions.json')
const geography = require('./fixtures/geography.json')
const features = require('./fixtures/features.json')
const { seedStaticData } = require('../utils')

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

  // Create partner types
  await knex('PartnerType').insert({
    name: 'Funding',
  })
  await knex('PartnerType').insert({
    name: 'Implementing',
  })

  await knex('PartnerType').insert({
    name: 'Operating',
  })

  // Categories of devices (lab, connectivity...)
  const [deviceTypeCategoryLab] = await knex('DeviceTypeCategory').insert({
    name: 'Lab',
    hasConnectivity: 0,
    hasResults: 1,
  })

  await knex('DeviceTypeCategory').insert({
    name: 'Router',
    hasConnectivity: 1,
    hasResults: 0,
  })

  await knex('DeviceTypeCategory').insert({
    name: 'Integrated',
    hasConnectivity: 1,
    hasResults: 1,
  })

  await knex('DeviceTypeCategory').insert({
    name: 'Client',
    hasConnectivity: 0,
    hasResults: 0,
  })

  await knex('DeviceTypeCategory').insert({
    name: 'Information System',
    hasConnectivity: 0,
    hasResults: 1,
  })

  // DeviceStatus
  await knex('DeviceStatus').insert({
    name: 'Provisioned',
    i18nKey: 'deviceStatusProvisioned',
    token: 'provisioned',
  })
  await knex('DeviceStatus').insert({
    name: 'Assigned',
    i18nKey: 'deviceStatusAssigned',
    token: 'assigned',
  })
  await knex('DeviceStatus').insert({
    name: 'Approved',
    i18nKey: 'deviceStatusApproved',
    token: 'approved',
  })
  await knex('DeviceStatus').insert({
    name: 'Decommissioned',
    i18nKey: 'deviceStatusDecommissioned',
    token: 'decommissioned',
  })

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

  // Assay Types
  await knex('AssayType').insert({
    name: 'HIV Qual',
    i18nKey: 'assayTypeHivQual',
  })

  // Result source
  await knex('ResultSource').insert({
    name: 'Diagnostic Device',
    i18nKey: 'resultSourceDiagnostic',
    externalId: 'DiagnosticDevice',
  })

  await knex('ResultSource').insert({
    name: 'Other System',
    i18nKey: 'resultSourceOtherSystem',
    externalId: 'OtherSystem',
  })

  await knex('ResultSource').insert({
    name: 'Entered by Hand',
    i18nKey: 'resultSourceEnteredByHand',
    externalId: 'EnteredByHand',
  })

  await knex('ResultSource').insert({
    name: 'Generated',
    i18nKey: 'resultSourceGenerated',
    externalId: 'Generated',
  })

  // Result types
  await knex('ResultType').insert({
    name: 'Patient',
    i18nKey: 'resultTypePatient',
    externalId: 'Patient',
  })

  await knex('ResultType').insert({
    name: 'EQA',
    i18nKey: 'resultTypeEqa',
    externalId: 'EQA',
  })

  await knex('ResultType').insert({
    name: 'Training',
    i18nKey: 'resultTypeTraining',
    externalId: 'Training',
  })

  await knex('ResultType').insert({
    name: 'Calibration',
    i18nKey: 'resultTypeCalibration',
    externalId: 'Calibration',
  })

  await knex('ResultType').insert({
    name: 'Study/Research',
    i18nKey: 'resultTypeStudy',
    externalId: 'Study',
  })

  // result categories
  await knex('ResultCategory').insert({
    name: 'Detected',
    i18nKey: 'ResultCategoryDetected',
    externalId: 'Detected',
  })

  await knex('ResultCategory').insert({
    name: 'Trace Detected',
    i18nKey: 'ResultCategoryTraceDetected',
    externalId: 'Trace Detected',
  })

  await knex('ResultCategory').insert({
    name: 'Not Detected',
    i18nKey: 'resultCategoryNotDetected',
    externalId: 'NotDetected',
  })

  await knex('ResultCategory').insert({
    name: 'Indeterminate',
    i18nKey: 'resultCategoryIndeterminate',
    externalId: 'Indeterminate',
  })

  await knex('ResultCategory').insert({
    name: 'Invalid',
    i18nKey: 'resultCategoryInvalid',
    externalId: 'Invalid',
  })

  await knex('ResultCategory').insert({
    name: 'No Result',
    i18nKey: 'resultCategoryNoResult',
    externalId: 'NoResult',
  })

  await knex('ResultCategory').insert({
    name: 'Error',
    i18nKey: 'resultCategoryError',
    externalId: 'Error',
  })

  await knex('ResultCategory').insert({
    name: 'Success',
    i18nKey: 'resultCategorySuccess',
    externalId: 'Success',
  })

  await knex('ResultCategory').insert({
    name: 'Collect New Sample',
    i18nkey: 'resultCategoryCollectNewSample',
    externalId: 'CollectNewSample',
  })

  await knex('ResultCategory').insert({
    name: 'Discordant',
    i18nkey: 'resultCategoryDiscordant',
    externalId: 'Discordant',
  })

  await knex('ResultCategory').insert({
    name: 'LessThan1000',
    i18nkey: 'resultCategoryLessThan1000',
    externalId: 'LessThan1000',
  })

  await knex('ResultCategory').insert({
    name: 'MoreThan1000',
    i18nkey: 'resultCategoryMoreThan1000',
    externalId: 'MoreThan1000',
  })

  await knex('ResultCategory').insert({
    name: 'Rejected',
    i18nkey: 'resultCategoryRejected',
    externalId: 'Rejected',
  })

  await knex('ResultCategory').insert({
    name: 'Missing',
    i18nkey: 'resultCategoryMissing',
    externalId: 'Missing',
  })

  await knex('ResultCategory').insert({
    name: 'Unknown',
    i18nkey: 'resultCategoryUnknown',
    externalId: 'Unknown',
  })

  // Result Workflow Status
  await knex('ResultWorkflowStatus').insert({
    name: 'OK',
    i18nkey: 'ResultWorkflowStatusOK',
    externalId: 'OK',
  })
  await knex('ResultWorkflowStatus').insert({
    name: 'Error',
    i18nkey: 'ResultWorkflowStatusError',
    externalId: 'Error',
  })
  await knex('ResultWorkflowStatus').insert({
    name: 'Ordered',
    i18nkey: 'ResultWorkflowStatusOrdered',
    externalId: 'Ordered',
  })
  await knex('ResultWorkflowStatus').insert({
    name: 'In Progress',
    i18nkey: 'ResultWorkflowStatusInProgress',
    externalId: 'InProgress',
  })
  await knex('ResultWorkflowStatus').insert({
    name: 'Processed',
    i18nkey: 'ResultWorkflowStatusProcessed',
    externalId: 'Processed',
  })
  await knex('ResultWorkflowStatus').insert({
    name: 'Validated',
    i18nkey: 'ResultWorkflowStatusValidated',
    externalId: 'Validated',
  })
  await knex('ResultWorkflowStatus').insert({
    name: 'Ready for delivery',
    i18nkey: 'ResultWorkflowStatusDeliverable',
    externalId: 'Deliverable',
  })
  await knex('ResultWorkflowStatus').insert({
    name: 'Delivered',
    i18nkey: 'ResultWorkflowStatusDelivered',
    externalId: 'Delivered',
  })
  await knex('ResultWorkflowStatus').insert({
    name: 'Acknowledged',
    i18nkey: 'ResultWorkflowStatusAcknowledged',
    externalId: 'Acknowledged',
  })

  await knex('ResultWorkflowStatus').insert({
    name: 'Flagged',
    i18nkey: 'ResultWorkflowStatusFlagged',
    externalId: 'Flagged',
  })

  await knex('ResultWorkflowStatus').insert({
    name: 'Purged',
    i18nkey: 'ResultWorkflowStatusPurged',
    externalId: 'Purged',
  })

  // Units
  await knex('Unit').insert({
    name: 'Piece',
    shortName: 'pc',
  })

  await knex('Unit').insert({
    name: 'Liter',
    shortName: 'l',
  })

  await knex('Unit').insert({
    name: 'Milliliter',
    shortName: 'ml',
  })

  await knex('Unit').insert({
    name: 'Milligram',
    shortName: 'mg',
  })

  await knex('Unit').insert({
    name: 'Gram',
    shortName: 'g',
  })

  await knex('Unit').insert({
    name: 'Kilogram',
    shortName: 'kg',
  })

  await knex('Unit').insert({
    name: 'Ounce',
    shortName: 'oz',
  })

  // Consumable Reasons
  await knex('ConsumableReason').insert({
    name: 'Asserted Zero Inventory',
    i18nKey: 'ConsumableReason_AssertedZeroInventory',
    decrease: 0,
    reset: 1,
  })

  await knex('ConsumableReason').insert({
    name: 'Test Conducted',
    i18nKey: 'ConsumableReason_TestConducted',
    decrease: 1,
    reset: 0,
  })

  await knex('ConsumableReason').insert({
    name: 'Transfer Sent',
    i18nKey: 'ConsumableReason_TransferSent',
    decrease: 1,
    reset: 0,
  })

  await knex('ConsumableReason').insert({
    name: 'Transfer Received',
    i18nKey: 'ConsumableReason_TransferReceived',
    decrease: 0,
    reset: 0,
  })

  await knex('ConsumableReason').insert({
    name: 'Expired',
    i18nKey: 'ConsumableReason_Expired',
    decrease: 1,
    reset: 0,
  })

  await knex('ConsumableReason').insert({
    name: 'Imported',
    i18nKey: 'ConsumableReason_Imported',
    decrease: 0,
    reset: 1,
  })

  await knex('ConsumableReason').insert({
    name: 'Stolen',
    i18nKey: 'ConsumableReason_Stolen',
    decrease: 1,
    reset: 0,
  })

  await knex('ConsumableReason').insert({
    name: 'Lost',
    i18nKey: 'ConsumableReason_Lost',
    decrease: 1,
    reset: 0,
  })

  await knex('ConsumableReason').insert({
    name: 'Captured',
    i18nKey: 'ConsumableReason_Captured',
    decrease: 0,
    reset: 1,
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

  await knex('SampleType').insert({
    name: 'DBS',
    i18nKey: 'sampleTypeDBS',
    externalId: 'DBS',
  })

  await knex('SampleType').insert({
    name: 'Plasma',
    i18nKey: 'sampleTypePlasma',
    externalId: 'Plasma',
  })

  await knex('SampleType').insert({
    name: 'Other',
    i18nKey: 'sampleTypeOther',
    externalId: 'Other',
  })

  // Messages
  await knex('MessageStatus').insert([
    {
      name: 'Initial',
      externalId: 'Initial',
      i18nKey: 'messageStatusInitial',
    },
    {
      name: 'Pending',
      externalId: 'Pending',
      i18nKey: 'messageStatusPending',
    },
    {
      name: 'Sent',
      externalId: 'Sent',
      i18nKey: 'messageStatusSent',
    },
    {
      name: 'Error',
      externalId: 'Error',
      i18nKey: 'messageStatusError',
    },
  ])

  await knex('MessageSeverity').insert([
    {
      name: 'Alert',
      externalId: 'Alert',
      i18nKey: 'messageSeverityAlert',
    },
    {
      name: 'Recommendation',
      externalId: 'Recommendation',
      i18nKey: 'messageSeverityRecommendation',
    },
  ])

  // Issues
  await knex('IssueCategory').insert([
    {
      name: 'Device Health',
      externalId: 'DeviceHealth',
      i18nKey: 'issueCategoryDeviceHealth',
    },
    {
      name: 'Reagent Health',
      externalId: 'ReagentHealth',
      i18nKey: 'issueCategoryReagentHealth',
    },
    {
      name: 'Data Health',
      externalId: 'DataHealth',
      i18nKey: 'issueCategoryDataHealth',
    },
    {
      name: 'Connectivity Health',
      externalId: 'ConnectivityHealth',
      i18nKey: 'issueCategoryConnectivityHealth',
    },
  ])

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

  await knex('IssueEventStatus').insert([
    {
      externalId: 'Triggered',
    },
    {
      externalId: 'Resolved',
    },
  ])
}
