module.exports = require('../utils').seed(seed, __filename)
const bcrypt = require('bcrypt')
const _ = require('lodash')
const config = require('../../src/config')
const { partnerTypeToId } = require('../../src/shared/dictionary')
const updateReportsAndJobFunctions = require('../common/upsert_reports_and_job_functions')
const upsertPartnerData = require('../common/upsert_partner_data')
const upsertTags = require('../common/upsert_tags')
const { seedIssueEscalationTrigger, upsertIssueResolutionTrigger, rowsAsObject } = require('../utils')
const upsertIssueEventTrigger = require('../common/upsert_issue_event_triggers')
const seedModuleDisabledIssue = require('../common/20200902_add_issue_module_disabled')
const { commonUpserts, upsertGeneXpertDeviceTypeAndAssays, upsertDashboardWidgets } = require('../common')

const geography = require('./fixtures/geography.json')
const partnerData = require('./fixtures/partnerData')
const jobFunctionsFixture = require('./fixtures/jobFunctions')
const { addIssueTypes } = require('../relativeObjectsSeeds')

const saltRounds = parseInt(config.passwordSaltRounds, 10)
const now = new Date()
const {
  partner: { externalId: partnerExternalId },
  adminUserName,
  adminPassword,
  deviceApiToken,
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

  await commonUpserts(knex, partnerId, adminId, geography, partnerAbbreviation, deviceApiToken, null, partnerData)
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
    'assayGXCovid19',
  ])
  const auditDates = _.pick(auditFields, ['createdOn', 'updatedOn'])

  await upsertDashboardWidgets(knex, partnerId)
  await updateReportsAndJobFunctions(knex, jobFunctionsFixture, partnerExternalId)
  await upsertTags(knex, partnerExternalId)
  await upsertIssueEventTrigger(knex, partnerExternalId)
  await addIssueTypes(knex, partnerId, adminId, null)
  await seedIssueEscalationTrigger(knex, { partnerId, pluginName, auditFields })
  const issueTypes = await rowsAsObject(knex, 'IssueType', 'externalId')
  await upsertIssueResolutionTrigger(knex, [
    {
      issueTypeId: issueTypes.NewResultsAvailable.id,
      partnerId,
      resolutionConditions: JSON.stringify({ evaluationMethod: 'issue-age', evaluationParameter: { minutes: 1430 } }),
      ...auditDates,
    },
    {
      issueTypeId: issueTypes.UnusedModules.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveIssueUnusedModules',
        evaluationFilterParameters: { minResults: 20, expectedUsedModules: 4 },
      }),
      ...auditDates,
    },
    {
      issueTypeId: issueTypes.ModuleDisabled.id,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'resolveIssueModuleDisabled',
      }),
      ...auditDates,
    },
  ])
  await seedModuleDisabledIssue(knex, partnerData)
}
