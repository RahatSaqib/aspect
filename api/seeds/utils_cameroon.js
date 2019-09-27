const _ = require('lodash')

const config = require('../src/config')
const {
  fileContentTypeToId,
  messageSeverityToId,
  issueCategoryToId,
  issueEventStatusToId,
} = require('../src/shared/dictionary')

async function seedCheckTbAppWebHook(knex, { partnerId, auditFields }) {
  const checkTbAppUrl = _.get(config, 'webhook.checktbapp.url')
  const checkTbAppAuthKey = _.get(config, 'webhook.checktbapp.authKey')
  if (checkTbAppUrl && checkTbAppAuthKey) {
    const checkTbAppDateTimeFormat = 'yyyy-MM-dd HH:mm'
    const [checkTbAppWebHookTemplateId] = await knex('WebhookTemplate').insert(
      Object.assign(
        {
          externalId: 'checkTbAppGeneXpert',
          method: 'PUT',
          url: `${checkTbAppUrl}{{urlEncode result.sample.id}}/lab`,
          payload:
            `{{curly true}}"auth_key":"${checkTbAppAuthKey}",` +
            `"mtb_result":{{enclose (defaultTo (mapValue result.category1.id '{"Detected":"MTB DETECTED","Trace Detected":"MTB DETECTED","NotDetected":"MTB NOT DETECTED","Indeterminate":"INDETERMINATE","Invalid":"INVALID","NoResult":"NO RESULT","Error":"ERROR","Negative":"MTB NOT DETECTED","Positive1":"MTB DETECTED","Positive2":"MTB DETECTED","Positive3":"MTB DETECTED","PositiveMTB":"MTB DETECTED","Positive":"MTB DETECTED"}') '') with='"'}},` +
            `"mtb_grade":{{enclose (defaultTo (mapValue result.data.result1Text '{"DETECTED HIGH":"HIGH","MTB DETECTED HIGH":"HIGH","DETECTED MEDIUM":"MEDIUM","MTB DETECTED MEDIUM":"MEDIUM","DETECTED LOW":"LOW","MTB DETECTED LOW":"LOW","DETECTED VERY LOW":"VERY LOW","MTB DETECTED VERY LOW":"VERY LOW"}') '') with='"'}},` +
            `"rif_result":{{enclose (defaultTo (mapValue result.data.result2Text '{"DETECTED":"DETECTED","NEG":"NOT DETECTED","NOT DE":"NOT DETECTED","NOT DETECTED":"NOT DETECTED","POS":"DETECTED","Rif Resistance DETECTED":"DETECTED","Rif Resistance NOT DETECTED":"NOT DETECTED"}') '') with='"'}},` +
            `"test_date":{{enclose (defaultTo (formatDate (offsetToTimeZone result.createdOn 'Africa/Douala') '${checkTbAppDateTimeFormat}') '') with='"'}},` +
            `"deployment_full_name":{{enclose (defaultTo device.name '') with='"'}},` +
            `"cartridge_serial":{{enclose (defaultTo result.consumableSerial '') with='"'}},"operator":{{enclose (defaultTo result.senderOperator '') with='"'}}{{curly}}`,
          fileContentTypeId: await fileContentTypeToId('applicationJson'),
        },
        auditFields
      )
    )

    const messageSeverityAlertId = await messageSeverityToId('Alert')

    const [resultUpdatedMessageTypeId] = await knex('MessageType').insert([
      {
        messageSeverityId: messageSeverityAlertId,
        webhookTemplateId: checkTbAppWebHookTemplateId,
      },
    ])

    const issueCategoryDataHealthId = await issueCategoryToId('DataHealth')

    const [issueTypeResultUpdatedId] = await knex('IssueType').insert({
      name: 'Result Updated',
      externalId: 'ResultUpdated',
      i18nKey: 'issueTypeResultUpdated',
      issueCategoryId: issueCategoryDataHealthId,
    })
    await knex('NotificationType').insert(
      Object.assign(
        {
          name: 'Result Updated',
          partnerId,
          issueTypeId: issueTypeResultUpdatedId,
          level: 1,
          canAcknowledge: 0,
          messageTypeId: resultUpdatedMessageTypeId,
        },
        auditFields
      )
    )

    await knex('IssueEventTrigger').insert({
      partnerId,
      issueTypeId: issueTypeResultUpdatedId,
      issueEventStatusId: await issueEventStatusToId('Triggered'),
      triggerConditions: JSON.stringify({
        action: 'RESULT_UPDATED',
        conditions: {
          evaluationMethod: 'plugin-function',
          evaluationParameter: 'shouldSendResultToCheckTbApp',
        },
      }),
      createdOn: auditFields.createdOn,
      updatedOn: auditFields.updatedOn,
    })

    await knex('IssueResolutionTrigger').insert({
      issueTypeId: issueTypeResultUpdatedId,
      partnerId,
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'shouldResolveResultUpdatedIssue',
      }),
      createdOn: auditFields.createdOn,
      updatedOn: auditFields.updatedOn,
    })
  }
}

module.exports = {
  seedCheckTbAppWebHook,
}
