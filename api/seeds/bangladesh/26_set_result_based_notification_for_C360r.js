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
      url: '',
      headers: JSON.stringify({
        toLogin: {
          /**
           * this is a Basic<BASE64(CLIENT_ID:CLIENT_SECRET) OAuth 2.0 type.
           * to get this value - run btoa('client_id:client_secret') in browser console.
           * See client_id and client_secret in LastPass > Shared-SystemOne IT > Cepheid C360
           */
          Authorization:
            'Basic NTN1MjBlbWVrdTJqZm5jbG9sMTJ1NTRjanI6Z2oyNjM4YWxuOTE4cTB2dWpiOWQ3djRmbGZhZjQ1N2M1cWIzYmlvNmgwM3IwaDVnaW9z',
        },
        toRefreshToken: {
          Authorization:
            'Basic NTN1MjBlbWVrdTJqZm5jbG9sMTJ1NTRjanI6Z2oyNjM4YWxuOTE4cTB2dWpiOWQ3djRmbGZhZjQ1N2M1cWIzYmlvNmgwM3IwaDVnaW9z',
        },
        toPushResult: {
          Authorization: 'Bearer {{accessToken}}',
        },
      }),
      params: JSON.stringify({
        toLogin: {
          method: 'POST',
          url: 'https://auth-datareceiver-dev.stg.c360.cepheid.com/oauth2/token',
          payload: {
            grant_type: 'client_credentials',
            client_id: '53u20emeku2jfnclol12u54cjr',
          },
        },
        toRefreshToken: {
          method: 'POST',
          url: 'https://auth-datareceiver-dev.stg.c360.cepheid.com/oauth2/token',
          payload: {
            grant_type: 'client_credentials',
            client_id: '53u20emeku2jfnclol12u54cjr',
          },
        },
        toPushResult: {
          method: 'POST',
          url: 'https://datareceiver-dev.stg.c360.cepheid.com/datareceiver/api/v1/{{instrumentSerialNumber}}/instrumentTests',
          payload: {},
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
