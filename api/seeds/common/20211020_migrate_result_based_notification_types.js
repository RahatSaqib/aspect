const Promise = require('bluebird')
const isNil = require('lodash/isNil')

module.exports = async (knex, partnerName) => {
  const [partnerId] = await knex('Partner').where({ name: partnerName }).pluck('id')
  const [resultBasedId] = await knex('NotificationTypeCategory').where({ externalId: 'resultBased' }).pluck('id')
  const [resultReceivedIssueTypeId] = await knex('IssueType').where({ externalId: 'ResultReceived' }).pluck('id')
  const assays = await knex('Assay')
  const resultCategories = await knex('ResultCategory')
  const resultCategoryIdByExternalId = {}
  resultCategories.forEach(rc => {
    resultCategoryIdByExternalId[rc.externalId] = rc.id
  })

  const [adminId] = await knex('Person as p')
    .innerJoin('Job as j', 'p.id', 'j.personId')
    .innerJoin('JobFunction as jf', 'j.jobFunctionId', 'jf.id')
    .where('p.lastPartnerId', partnerId)
    .andWhere('jf.externalId', 'admin')
    .pluck('p.id')

  const notificationTypes = await knex('NotificationType as nt')
    .innerJoin('MessageType as mt', 'nt.messageTypeId', 'mt.id')
    .leftJoin('Notification as n', 'nt.id', 'n.notificationTypeId')
    .where({
      partnerId,
      issueTypeId: resultReceivedIssueTypeId,
    })
    .select([
      'nt.*',
      knex.raw('mt.emailTemplateId IS NOT NULL as sendEmail'),
      knex.raw('mt.smsTemplateId IS NOT NULL as sendSms'),
      knex.raw('mt.webhookTemplateId IS NOT NULL as sendWeb'),
      knex.raw('COUNT(n.id) as numberOfSentNotifications'),
    ])
    .groupBy(['nt.id', 'mt.id'])

  const now = new Date()

  // Iterate and migrate notification types
  await Promise.each(notificationTypes, async notificationType => {
    // Create the new notification type
    const {
      id,
      issueTypeId,
      jobFunctionId,
      level,
      sendSms,
      sendEmail,
      sendWeb,
      numberOfSentNotifications,
      ...restProps
    } = notificationType
    let issueEscalationTrigger
    const filterCondition = {
      jobFunctions: [
        {
          tags: [],
          checked: true,
          jobFunctionId,
        },
      ],
      sendSms,
      sendEmail,
      sendWeb,
    }

    // If it corresponds to an escalation level > 1, then the notification has filters
    if (level > 1) {
      ;[issueEscalationTrigger] = await knex('IssueEscalationTrigger')
        .where({
          partnerId,
          escalateToLevel: level,
          issueTypeId,
        })
        .pluck('escalationConditions')

      if (issueEscalationTrigger) {
        const { evaluationMethod, evaluationParameter } = JSON.parse(issueEscalationTrigger)

        if (evaluationMethod === 'result-category') {
          let { resultCategory1, resultCategory2 } = evaluationParameter
          const { assays: evaluatedAssays } = evaluationParameter

          filterCondition.result = []

          await Promise.each(evaluatedAssays, async assayExternalId => {
            const assay = assays.find(a => a.externalId === assayExternalId)

            if (isNil(assay)) throw new Error(`Unknown assay external id ${assayExternalId}`)

            const { id: assayId, resultCategory1Label } = assay

            const scopedResultCategories = []

            // resultcategory1 and resultcategory2 empty => assay is the only condition
            // resultcategory1 not-empty and resultcategory2 empty => all the category groups including resultCategory1, or only resultCategory1
            // resultcategory1 not-empty and resultcategory2 not-empty => all the category groups of resultCateogry1 and resultCategory2
            // resultcategory1 empty and resultcategory2 not-empty => all the category groups of resultcategory2 or throw error

            if (resultCategory1.length === 0) resultCategory1 = [null]

            if (resultCategory2.length === 0) resultCategory2 = [null]

            await Promise.each(resultCategory1, async rc1ExternalId => {
              await Promise.each(resultCategory2, async rc2ExternalId => {
                const resultCategory1Id = rc1ExternalId != null ? resultCategoryIdByExternalId[rc1ExternalId] : null
                const resultCategory2Id = rc2ExternalId != null ? resultCategoryIdByExternalId[rc2ExternalId] : null

                const resultCategoryGroups = await knex('ResultCategoryGroup')
                  .where({ assayId })
                  .modify(q => {
                    if (resultCategory1Id !== null) {
                      q.andWhere('resultCategory1Id', resultCategory1Id)
                    }
                    if (resultCategory2Id !== null) {
                      q.andWhere('resultCategory2Id', resultCategory2Id)
                    }
                  })

                if (resultCategoryGroups.length > 0) {
                  // If result category groups exist, then add all of them as scoped categories
                  resultCategoryGroups.forEach(rcg =>
                    scopedResultCategories.push({
                      label: rcg.name,
                      scope: 'ResultCategoryGroups',
                      value: rcg.externalId,
                    })
                  )
                } else if (resultCategory1Id !== null && resultCategory2Id === null) {
                  // Else if result category 1 was defined in the old condition, then add it as a scoped category
                  const resultCategory1 = await knex('ResultCategory as rc')
                    .innerJoin('ResultCategoryAssay as rca', 'rc.id', 'rca.resultCategoryId')
                    .where('rc.id', resultCategory1Id)
                    .andWhere('rca.assayId', assayId)
                    .select('rc.*')

                  scopedResultCategories.push({
                    label: resultCategory1Label,
                    scope: 'ResultCategories',
                    value: resultCategory1.externalId,
                  })
                } else {
                  /* eslint-disable no-console */
                  console.error(
                    `No result category group defined for the result category 1 ${rc1ExternalId}, result category 2 '${rc2ExternalId}', and assay '${assayExternalId}'. The filter condition will be skipped.`
                  )
                }
              })
            })

            filterCondition.result.push({
              assayId,
              resultCategoryId: scopedResultCategories,
            })
          })
        }
        // ... ignoring all the other possible evaluation-methods (plugin-function, issue-age, sql-script, etc)
      }
    }

    const migratedNotificationType = {
      ...restProps,
      createdOn: now,
      updatedOn: now,
      createdBy: adminId,
      updatedBy: adminId,
      notificationTypeCategoryId: resultBasedId,
      filterCondition: JSON.stringify(filterCondition),
    }

    await knex('NotificationType').insert(migratedNotificationType)
    if (numberOfSentNotifications > 0) await knex('NotificationType').where({ id }).update({ enabled: false })
    else await knex('NotificationType').where({ id }).del()
  })
}
