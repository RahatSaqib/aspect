module.exports = require('../utils').seed(seed, __filename)

const { getPartnerByExternalId, upsertJobFunctionForApi } = require('../utils')
const { JOB_FUNCTION_EXTERNAL_ID_FOR_API, WEBHOOK_SERVERS } = require('../../src/shared/constants')
const { adminUserName, partner } = require('./fixtures/partnerData')

async function seed(knex) {
  const now = new Date()
  const { adminId } = await knex('User as u')
    .join('Person as p', 'p.userId', 'u.id')
    .where({ 'u.name': adminUserName })
    .first('u.id as adminId')
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  const { id: partnerId } = await getPartnerByExternalId(knex, partner.externalId)
  /**
   * make sure new JobFunction for API jobs is available
   */
  await upsertJobFunctionForApi(knex, partnerId)

  const { id: jobFunctionId } = await knex('JobFunction')
    .where('externalId', JOB_FUNCTION_EXTERNAL_ID_FOR_API)
    .first('id')

  const { id: notificationTypeCategoryId } = await knex('NotificationTypeCategory')
    .where('externalId', 'resultBased')
    .first('id')

  /**
   * WebhookTemplate
   */
  let { id: webhookTemplateId } =
    (await knex('WebhookTemplate').where('externalId', WEBHOOK_SERVERS.CepheidC360).first('id')) || {}
  if (!webhookTemplateId) {
    const { id: fileContentTypeId } = await knex('FileContentType').where('externalId', 'formUrlEncoded').first('id')
    ;[webhookTemplateId] = await knex('WebhookTemplate').insert({
      method: 'POST',
      externalId: WEBHOOK_SERVERS.CepheidC360,
      urlBase: 'http://localhost:8080/api',
      url: '/',
      headers: JSON.stringify({
        toLogin: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        toRefreshToken: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        toPushResult: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Bearer {{accessToken}}',
        },
      }),
      params: JSON.stringify({
        toLogin: {
          method: 'POST',
          url: '/auth',
          payload: {
            clientId: '1084285d-6005-4dec-a7a3-ee12e41be100',
            clientType: 'web',
            clientName: 'Aspect API Webhook',
            name: 'admin',
            password: 'Pa$$w0rd',
          },
        },
        toRefreshToken: {
          method: 'POST',
          url: '/auth/refresh',
          payload: {
            clientId: '1084285d-6005-4dec-a7a3-ee12e41be100',
            clientType: 'web',
            token: '{{refreshToken}}',
          },
        },
        toPushResult: {
          method: 'POST',
          url: '/auth/refresh',
          payload: {
            clientId: '1084285d-6005-4dec-a7a3-ee12e41be100',
            clientType: 'web',
            token: '{{refreshToken}}',
          },
        },
        isValid: false,
        accessToken: '',
        refreshToken: '',
        expiresOn: null,
      }),
      fileContentTypeId,
      ...auditFields,
    })
  }
  /**
   * MessageType
   */
  let { id: messageTypeId } =
    (await knex('MessageType').where('webhookTemplateId', webhookTemplateId).first('id')) || {}
  if (!messageTypeId) {
    ;[messageTypeId] = await knex('MessageType').insert({
      messageSeverityId: 1,
      webhookTemplateId,
    })
  }
  /**
   * NotificationType
   */
  let { id: notificationTypeId } =
    (await knex('NotificationType')
      .where({
        notificationTypeCategoryId, // resultBased
        partnerId,
        jobFunctionId, // for API
        name: WEBHOOK_SERVERS.CepheidC360,
      })
      .first('id')) || {}

  if (!notificationTypeId) {
    ;[notificationTypeId] = await knex('NotificationType').insert({
      notificationTypeCategoryId,
      partnerId,
      jobFunctionId,
      name: WEBHOOK_SERVERS.CepheidC360,
      messageTypeId,
      level: 1,
      canAcknowledge: 0,
      sendToContactsWithMatchingTags: 0,
      enabled: 1,
      ...auditFields,
      /**
       * check if need to add `filterCondition` for different use cases, like
       * {
       *  "result": [
       *    {
       *      "assayId": "GxMtbRif",
       *      "resultCategoryId": [
       *        {"label": "MTB Detected", "scope": "ResultCategoryGroups", "value": "GxMtbRifMtbDetected"},
       *        {"label": "MTB Detected RIF Detected", "scope": "ResultCategoryGroups", "value": "GxMtbRifMtbDetectedRifDetected"},
       *        {"label": "MTB Detected RIF Not Detected", "scope": "ResultCategoryGroups", "value": "GxMtbRifMtbDetectedRifNotDetected"}
       *     ]
       *   }
       *  ],
       *  "enabled": true,
       *  "persons": [{"checked": true, "personId": 1491}],
       *  "jobFunctions": [{"tags": [], "checked": true, "jobFunctionId": 3}],
       *  "deviceLevelId": "national",
       *  "sendToPatient": false,
       *  "resultBasedScope": "created"
       * }
       */
    })
  }
}
