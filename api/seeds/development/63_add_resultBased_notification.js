module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')
const {
  assayToId,
  notificationTypeCategoryToId,
  messageStatusToId,
  resultTypeToId,
} = require('../../src/shared/dictionary')
const { partnerName } = require('./fixtures/partnerData')
const { getConstraints, addConstraints } = require('../../src/auth/constraints')
const { getPeopleBase } = require('../../src/shared/utilsPerson')

async function seed(knex) {
  const now = new Date()

  const { id: partnerId } = await knex('Partner').where('name', partnerName).first()
  const notificationTypeCategoryId = await notificationTypeCategoryToId('resultBased')
  const messageStatusId = await messageStatusToId('Sent')
  const {
    id: messageTypeId,
    emailTemplateId,
    smsTemplateId,
  } = await knex('MessageType').whereNotNull('emailTemplateId').whereNotNull('smsTemplateId').first()
  const credentials = {
    scope: ['notification', 'person'],
    name: 'admin',
    permissions: ['notification', 'person'],
  }
  const dataConstraints = await getConstraints(credentials)
  const { id: personId } = await getPeopleBase()
    .modify(addConstraints, dataConstraints, { geography: 'g', site: 's' })
    .where(qb => {
      qb.whereNull('p.partnerId').orWhere('p.partnerId', partnerId)
    })
    .first('p.id', 'p.name', 'st.name as stateName', 'st.id as stateId')
  const jobFunctionIds = await knex('JobFunction as jf')
    .innerJoin('Partner as p', 'jf.partnerId', 'p.id')
    .modify(addConstraints, dataConstraints, { partner: 'p' })
    .pluck('jf.id')
    .limit(2)

  const resultTypeId = await resultTypeToId('Patient')
  const assayId = await assayToId('assayBdMgitAst')
  const resultIds = await knex('Result').where({ partnerId, assayId, resultTypeId }).limit(2).pluck('id')

  await Promise.all(
    _.map(resultIds, async (resultId, index) => {
      const name =
        index === 0
          ? 'Result-based notification 1 - for concrete person'
          : 'Result-based notification 2 - for job functions'
      const filterConditionBase = {
        result: [
          {
            assayId: 'assayBdMgitAst',
            resultCategoryId: [
              {
                label: 'Detected',
                scope: 'ResultCategories',
                value: 'Detected',
              },
            ],
          },
        ],
        sendEmail: true,
        sendSms: true,
        sendWeb: false,
        deviceLevelId: 'national',
      }
      const filterCondition = JSON.stringify(
        index === 0
          ? {
              ...filterConditionBase,
              persons: [{ personId: `${personId}`, checked: true }],
            }
          : {
              ...filterConditionBase,
              jobFunctions: jobFunctionIds.map(jobFunctionId => ({
                tags: [],
                checked: true,
                jobFunctionId: `${jobFunctionId}`,
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
