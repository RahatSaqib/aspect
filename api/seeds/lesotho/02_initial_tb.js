module.exports = require('../utils').seed(seed, __filename)
const bcrypt = require('bcrypt')
const _ = require('lodash')
const config = require('../../src/config')
const { partnerTypeToId } = require('../../src/shared/dictionary')
const updateReportsAndJobFunctions = require('../common/upsert_reports_&_job_functions')
const upsertPartnerData = require('../common/upsert_partner_data')
const { upsertMessageAndNotificationTypes } = require('../common/upsert_message_and_notification_types')
const upsertTags = require('../common/upsert_tags')
const {
  addDeviceCapacities,
  setCapacityForExistingDevices,
  seedIssueEscalationTrigger,
  seedIssueResolutionTrigger,
  upsertIssueResolutionTrigger,
} = require('../utils')
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
const partnerData = require('./fixtures/partnerData_tb')
// const sitesFromGxAlert = require('./fixtures/sitesFromGxAlert.json')
const jobFunctionsFixture = require('./fixtures/jobFunctions')
const { addIssueTypes } = require('../relativeObjectsSeeds')
// const contactsFromGxAlert = require('./fixtures/contactsFromGxAlert.json')
// const notificationTypeCategories = require('../fixtures/NotificationTypeCategory.json')

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
  partnerPlugin: pluginName,
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
    deviceApiToken,
    {
      password: lowerLevelUserPassword,
    },
    partnerData
  )
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

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
  const auditDates = _.pick(auditFields, ['createdOn', 'updatedOn'])

  //   await baseGxAlertMigration(
  //     {
  //       admin: {
  //         name: adminUserName,
  //       },
  //       partner: {
  //         name: partnerName,
  //         externalId: partnerExternalId,
  //         serverUrl,
  //       },
  //       geographyFromGxAlert: geography,
  //       gxAlertDevice: {
  //         deviceApiKeyToken: deviceApiToken,
  //       },
  //     //   sitesFromGxAlert,
  //       jobFunctionsFixture,
  //     //   contactsFromGxAlert,
  //     },
  //     knex,
  //     partnerData
  //   )

  await upsertDashboardWidgets(knex, partnerId)
  await updateReportsAndJobFunctions(knex, jobFunctionsFixture, partnerExternalId)
  await addDeviceCapacities(knex)
  await setCapacityForExistingDevices(knex)
  // await upsertMessageAndNotificationTypes(knex, partnerId, adminId)
  await upsertTags(knex, partnerExternalId)
  //   await upsertFixture(knex, notificationTypeCategories, 'NotificationTypeCategory')
  await upsertIssueEventTrigger(knex, partnerExternalId)
  await addIssueTypes(knex, partnerId, adminId, null)
  await seedIssueEscalationTrigger(knex, { partnerId, pluginName, auditFields })
  await upsertIssueResolutionTrigger(knex, [
    // Module

    {
      issueTypeId: 6,
      partnerId,
      resolutionConditions: pluginName
        ? JSON.stringify({
            evaluationMethod: 'sql-script',
            evaluationParameter: `./src/plugin/partner/${_.upperFirst(
              pluginName
            )}/sqlScripts/shouldResolveDeviceOffline.sql`,
          })
        : JSON.stringify({
            evaluationMethod: 'plugin-function',
            evaluationParameter: 'resolveDeviceOfflineError',
          }),
      ...auditDates,
    },
    // Machine
    {
      issueTypeId: 21,
      partnerId,
      resolutionConditions: pluginName
        ? JSON.stringify({
            evaluationMethod: 'sql-script',
            evaluationParameter: `./src/plugin/partner/${_.upperFirst(
              pluginName
            )}/sqlScripts/shouldResolveDeviceOffline.sql`,
          })
        : JSON.stringify({
            evaluationMethod: 'plugin-function',
            evaluationParameter: 'resolveDeviceOfflineError',
          }),
      ...auditDates,
    },
    {
      issueTypeId: 55,
      partnerId,
      resolutionConditions: pluginName
        ? JSON.stringify({
            evaluationMethod: 'sql-script',
            evaluationParameter: `./src/plugin/partner/${_.upperFirst(
              pluginName
            )}/sqlScripts/shouldResolveDeviceOffline.sql`,
          })
        : JSON.stringify({
            evaluationMethod: 'plugin-function',
            evaluationParameter: 'resolveDeviceOfflineError',
          }),
      ...auditDates,
    },
    {
      issueTypeId: 56,
      partnerId,
      resolutionConditions: pluginName
        ? JSON.stringify({
            evaluationMethod: 'sql-script',
            evaluationParameter: `./src/plugin/partner/${_.upperFirst(
              pluginName
            )}/sqlScripts/shouldResolveDeviceOffline.sql`,
          })
        : JSON.stringify({
            evaluationMethod: 'plugin-function',
            evaluationParameter: 'resolveDeviceOfflineError',
          }),
      ...auditDates,
    },
  ])
  await seedModuleDisabledIssue(knex, partnerData)
}
