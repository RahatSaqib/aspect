const Promise = require('bluebird')
const _ = require('lodash')
const { seedIssueEventTriggersForPartner } = require('./utils')
const {
  allIssueCategoryToId,
  allMessageSeverityToId,
} = require('../src/shared/dictionary')
const { cleanUpIssues } = require('../test/utils/issueUtils')
const { loadPlugin } = require('../src/plugin/registration')

const now = new Date()

// -------------------------------------------------------
// removeOld
// -------------------------------------------------------
async function removeOld(knex) {
  // we added issue type DataCategoryLowError before, so here we need to remove all it's related data from db
  // i.e. from NotificationType, IssueType, etc
  const { id: issueTypeId } = await knex('IssueType')
    .where({
      externalId: 'DataCategoryLowError',
    })
    .first('id')

  // there is data in db seeded in previous seed-files for this issueTypeId -
  // in Notification, [Alert/Email/Sms]Message, Issue tables, so need to delete it
  const issues = await knex('Issue')
    .where({
      issueTypeId,
    })
    .select('id')
  const issueIds = _.filter(_.uniq(_.map(issues, 'id')), id => !_.isNull(id))
  await cleanUpIssues(knex, issueIds)

  // alertTemplateId for this issue type to delete MessageType (see below)
  const { id: alertTemplateId } = await knex('AlertTemplate')
    .where({
      message:
        '{{dataCategoryName}} collection rate {{dataCategoryCollectionRatePercentage}}',
    })
    .first()

  // delete corresponding data from [Notification/Issue/Message]Type tables
  await knex('NotificationType')
    .where('id', '>', 0)
    .where({
      issueTypeId,
    })
    .del()

  await knex('IssueType')
    .where('id', '>', 0)
    .where({
      externalId: 'DataCategoryLowError',
    })
    .del()

  await knex('MessageType')
    .where('id', '>', 0)
    .where({
      alertTemplateId,
    })
    .del()

  await knex('AlertTemplate')
    .where('id', alertTemplateId)
    .del()

  await knex('SmsTemplate')
    .where('id', '>', 0)
    .where({
      message:
        '{{dataCategoryName}} collection rate {{dataCategoryCollectionRatePercentage}}',
    })
    .del()

  await knex('EmailTemplate')
    .where('id', '>', 0)
    .where({
      body:
        '{{dataCategoryName}} collection rate {{dataCategoryCollectionRatePercentage}}',
    })
    .del()
}

// -------------------------------------------------------
// seedDataCategory
// -------------------------------------------------------
async function seedDataCategory(knex, partnerName) {
  // remove old data seeded in previous seed files
  await removeOld(knex)

  // get partnerId and adminId
  const { id: partnerId } = await knex('Partner')
    .where({ name: partnerName })
    .first()
  const { id: adminId } = await knex('User')
    .where({ name: 'admin' })
    .first()
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  // --------------------
  // helper function
  const insert = async (tableName, whereClause, insertClause, index) => {
    let item = knex(tableName).where(whereClause)
    item = _.isNil(index)
      ? await item.first()
      : await item
          .limit(1)
          .offset(index)
          .first()

    if (!item) {
      const [id] = await knex(tableName).insert(insertClause || whereClause)
      item = await knex(tableName)
        .where({ id })
        .first()
    }
    return item
  }

  // ----------------------------------------------------------------------
  // JobFunction
  // ----------------------------------------------------------------------
  const { id: jobFunctionIdRegionalOfficer } = await insert('JobFunction', {
    name: 'Regional Officer',
    partnerId,
  })
  const { id: jobFunctionIdLabUser } = await insert('JobFunction', {
    name: 'Lab User',
    partnerId,
  })

  // ----------------------------------------------------------------------
  // reed dataCategories
  // ----------------------------------------------------------------------
  const pluginName = partnerName.toLowerCase()
  const plugin = await loadPlugin([pluginName], 'dataCategories')
  const { dataCategories = [] } = plugin

  const issueCategories = await allIssueCategoryToId()
  // ----------------------------------------------------------------------
  // process each data category
  // ----------------------------------------------------------------------
  await Promise.each(
    dataCategories,
    // for each category seed all tables from issue workflow
    async ({ externalId: categoryToken }, index) => {
      // -------------------------------
      // message templates
      // -------------------------------
      const messageBase = `Data category '{{issue.data.categoryName}}' for {{issue.data.periodName}} is low ({{issue.data.percentage}}%)`
      const message = `{{site.name}}: ${messageBase}`
      const html = `<em>{{site.name}}:</em> data category '{{issue.data.categoryName}}' for {{issue.data.periodName}} is low ({{issue.data.percentage}}%)`
      const messageSeverities = await allMessageSeverityToId()
      // insert templates
      const { id: alertTemplateId } = await insert(
        'AlertTemplate',
        {
          message: messageBase,
        },
        {
          message: messageBase,
          ...auditFields,
        },
        index
      )
      const { id: smsTemplateId } = await insert(
        'SmsTemplate',
        {
          message,
        },
        {
          message,
          ...auditFields,
        },
        index
      )
      const { id: emailTemplateId } = await insert(
        'EmailTemplate',
        {
          subject: message,
        },
        {
          subject: message,
          body: message,
          htmlBody: html,
          ...auditFields,
        },
        index
      )
      // -------------------------------
      // MessageType
      // -------------------------------
      const { id: defaultMessageTypeId } = await insert('MessageType', {
        messageSeverityId: messageSeverities.Alert,
        alertTemplateId,
        smsTemplateId,
        emailTemplateId,
      })
      // -------------------------------
      // IssueType
      // -------------------------------
      const { id: issueTypeId } = await insert(
        'IssueType',
        {
          externalId: `DataCategoryLowFor${categoryToken}`,
        },
        {
          name: `Data Category Low for ${categoryToken}`,
          externalId: `DataCategoryLowFor${categoryToken}`,
          i18nKey: `issueDataCategoryLowFor${categoryToken}`,
          issueCategoryId: issueCategories.DataHealth,
          defaultMessageTypeId,
        }
      )

      // common
      const commonProps = {
        partnerId,
        issueTypeId,
        createdOn: now,
        updatedOn: now,
      }
      // -------------------------------
      // NotificationType
      // -------------------------------
      const messageTypeId = defaultMessageTypeId
      // helper function
      const addNotificationType = async props => {
        await insert('NotificationType', props, {
          ...commonProps,
          ...auditFields,
          ...props,
        })
      }
      // add 3 notification types
      await addNotificationType({
        name: `LU Data Category '${categoryToken}' Low`,
        jobFunctionId: jobFunctionIdLabUser,
        level: 1,
        canAcknowledge: 1,
        messageTypeId,
      })
      await addNotificationType({
        name: `RO Data Category '${categoryToken}' Low`,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 1,
        messageTypeId,
      })
      await addNotificationType({
        name: `LU Data Category '${categoryToken}' Low - RO View`,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId,
      })
      // -------------------------------
      // IssueEscalationTrigger
      // -------------------------------
      await insert(
        'IssueEscalationTrigger',
        {
          escalateToLevel: 2,
          escalationConditions: JSON.stringify({
            evaluationMethod: 'issue-age',
            evaluationParameter: { days: 30 },
          }),
        },
        {
          ...commonProps,
          escalateToLevel: 2,
          escalationConditions: JSON.stringify({
            evaluationMethod: 'issue-age',
            evaluationParameter: { days: 30 },
          }),
        }
      )
      // -------------------------------
      // IssueResolutionTrigger
      // -------------------------------
      await insert(
        'IssueResolutionTrigger',
        {
          resolutionConditions: JSON.stringify({
            evaluationMethod: 'plugin-function',
            evaluationParameter: 'resolveDataCategoryLow',
          }),
        },
        {
          ...commonProps,
          resolutionConditions: JSON.stringify({
            evaluationMethod: 'plugin-function',
            evaluationParameter: 'resolveDataCategoryLow',
          }),
        }
      )
    }
  )

  // ----------------------------------------------------------------------
  // IssueEventTrigger - make sure table is up-to-date after latest changes in IssueEventTrigger.json
  // ----------------------------------------------------------------------
  await seedIssueEventTriggersForPartner(knex, partnerId, {
    issueTypeWhitelist: ['DeviceMaintenance'],
  })
}

module.exports = {
  seedDataCategory,
}
