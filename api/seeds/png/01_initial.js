module.exports = require('../utils').seed(seed, __filename)
const bcrypt = require('bcrypt')
const config = require('../../src/config')
const { partnerTypeToId } = require('../../src/shared/dictionary')
const updateReportsAndJobFunctions = require('../common/upsert_reports_and_job_functions')
const upsertPartnerData = require('../common/upsert_partner_data')
const { upsertMessageAndNotificationTypes } = require('../common/upsert_message_and_notification_types')
const upsertTags = require('../common/upsert_tags')
const { upsertFixture } = require('../common/upsert_Fixture')
const upsertIssueEventTrigger = require('../common/upsert_issue_event_triggers')
const seedModuleDisabledIssue = require('../common/20200902_add_issue_module_disabled')
const {
  commonUpserts,
  upsertGeneXpertDeviceTypeAndAssays,
  baseGxAlertMigration,
  upsertDashboardWidgets,
} = require('../common')

const geography = require('./fixtures/geography.json')
const partnerData = require('./fixtures/partnerData')
const sitesFromGxAlert = require('./fixtures/sitesFromGxAlert.json')
const jobFunctionsFixture = require('./fixtures/jobFunctions')
const contactsFromGxAlert = require('./fixtures/contactsFromGxAlert.json')
const notificationTypeCategories = require('../fixtures/NotificationTypeCategory.json')

const saltRounds = parseInt(config.passwordSaltRounds, 10)
const now = new Date()
const {
  partner: { externalId: partnerExternalId, name: partnerName },
  serverUrl,
  adminUserName,
  adminPassword,
  deviceApiToken,
  lowerLevelUserPassword,
  partnerAbbreviation,
} = partnerData

async function seed(knex) {
  const partnerId = await upsertPartnerData(knex, {
    ...partnerData,
    partnerTypeId: await partnerTypeToId('operating'),
  })

  const [adminId] = await knex('User').insert({
    name: adminUserName,
    password: bcrypt.hashSync(adminPassword, saltRounds),
    approved: 1,
    lockedOut: 0,
    failedPasswordAttempts: 0,
    createdOn: now,
  })

  await commonUpserts(
    knex,
    partnerId,
    adminId,
    geography,
    partnerAbbreviation,
    {
      password: lowerLevelUserPassword,
    },
    partnerData
  )

  // GeneXpert
  await upsertGeneXpertDeviceTypeAndAssays(knex, [
    'GxUnknown',
    'GxHcv',
    'GxHiv',
    'GxMtbRif',
    'GxMtbRifUltra',
    'GxHiv1Vl',
    'GxHiv1Qual',
    'GxEbola',
    'GxMtbXdr',
  ])

  await baseGxAlertMigration(
    {
      admin: {
        name: adminUserName,
      },
      partner: {
        name: partnerName,
        externalId: partnerExternalId,
        serverUrl,
      },
      geographyFromGxAlert: geography,
      gxAlertDevice: {
        deviceApiKeyToken: deviceApiToken,
      },
      sitesFromGxAlert,
      jobFunctionsFixture,
      contactsFromGxAlert,
    },
    knex,
    partnerData
  )

  await upsertDashboardWidgets(knex, partnerId)
  await updateReportsAndJobFunctions(knex, jobFunctionsFixture, partnerExternalId)
  await upsertMessageAndNotificationTypes(knex, partnerId, adminId)
  await upsertTags(knex, partnerExternalId)
  await upsertFixture(knex, notificationTypeCategories, 'NotificationTypeCategory')
  await upsertIssueEventTrigger(knex, partnerExternalId)
  await seedModuleDisabledIssue(knex, partnerData)
}
