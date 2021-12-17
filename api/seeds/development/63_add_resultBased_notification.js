module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')
const {
  assayToId,
  notificationTypeCategoryToId,
  messageStatusToId,
  resultTypeToId,
} = require('../../src/shared/dictionary')
const {
  adminName,
  partnerName,
  jobFunctionsToNotify,
} = require('./fixtures/partnerVariables')

async function seed(knex) {
  const now = new Date()

  const { id: partnerId } = await knex('Partner')
    .where('name', partnerName)
    .first()
  const notificationTypeCategoryId = await notificationTypeCategoryToId(
    'resultBased'
  )
  const messageStatusId = await messageStatusToId('Sent')
  const {
    id: messageTypeId,
    emailTemplateId,
    smsTemplateId,
  } = await knex('MessageType')
    .whereNotNull('emailTemplateId')
    .whereNotNull('smsTemplateId')
    .first()
  const { id: personId } = await knex('Person as p')
    .innerJoin('User as u')
    .where('u.name', adminName)
    .first('p.id')
  const jobFunctionIds = await knex('JobFunction')
    .whereIn('externalId', jobFunctionsToNotify)
    .where({
      partnerId,
    })
    .pluck('id')
  const resultTypeId = await resultTypeToId('Patient')
  const assayId = await assayToId('assayBdMgitAst')
  const resultIds = await knex('Result')
    .where({ partnerId, assayId, resultTypeId })
    .limit(2)
    .pluck('id')

  await Promise.all(
    _.map(resultIds, async (resultId, index) => {
      const name =
        index === 0
          ? 'Result-based notification 1 - for concrete person'
          : 'Result-based notification 2 - for job functions'
      const filterCondition = JSON.stringify(
        index === 0
          ? {
              persons: [{ personId: `${personId}`, checked: true }],
            }
          : {
              jobFunctions: jobFunctionIds.map(jobFunctionId => ({
                jobFunctionId,
              })),
            }
      )
      const [notificationTypeId] = await knex('NotificationType').insert({
        partnerId,
        name,
        createdOn: new Date(),
        updatedOn: new Date(),
        notificationTypeCategoryId,
        filterCondition,
        messageTypeId,
      })
      const [emailMessageId] = await knex('EmailMessage').insert({
        emailTemplateId,
        messageStatusId,
        personId,
        resultId: resultIds[0],
        createdOn: now,
        updatedOn: now,
      })
      const [smsMessageId] = await knex('SmsMessage').insert({
        smsTemplateId,
        messageStatusId,
        personId,
        resultId,
        createdOn: now,
        updatedOn: now,
      })
      await knex('Notification').insert({
        notificationTypeId,
        resultId,
        emailMessageId,
        smsMessageId,
        createdOn: now,
      })
    })
  )
}
