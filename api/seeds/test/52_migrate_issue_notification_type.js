module.exports = require('../utils').seed(seed, __filename)
const Promise = require('bluebird')

async function seed(knex) {
  const notificationTypes = await knex('NotificationType as nt')
    .innerJoin('NotificationTypeCategory as ntc', 'ntc.id', 'nt.notificationTypeCategoryId')
    .where('ntc.externalId', 'issueBased')
    .whereNotNull('nt.jobfunctionId')
    .select('nt.id as notificationTypeId', 'nt.jobfunctionId as jobfunctionId')

  await Promise.each(notificationTypes, async ({ notificationTypeId, jobfunctionId }) =>
    knex('NotificationType')
      .where('id', notificationTypeId)
      .update({
        filterCondition: JSON.stringify({
          jobFunctions: [
            {
              tags: [],
              jobFunctionId: jobfunctionId,
            },
          ],
        }),
        jobfunctionId: null,
      })
  )
}
