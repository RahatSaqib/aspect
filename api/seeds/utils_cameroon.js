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
    const [checkTbAppWebHookTemplateId] = await knex('WebhookTemplate').insert({
      externalId: 'checkTbAppGeneXpert',
      method: 'PUT',
      url: `${checkTbAppUrl}{{urlEncode result.sample.id}}/lab`,
      payload:
        `{{curly true}}` +
        `"auth_key":"${checkTbAppAuthKey}",` +
        `"mtb_result":{{enclose (defaultTo (mapValue result.category1.id '{"Detected":"detected","Trace Detected":"trace","NotDetected":"not_detected","Indeterminate":"error_invalid","Invalid":"error_invalid","NoResult":"not_done","Error":"error_invalid","Negative":"not_detected","Positive1":"not_detected","Positive2":"detected","Positive3":"detected","PositiveMTB":"detected","Positive":"detected"}') '') with='"'}},` +
        `"mtb_grade":{{enclose (defaultTo (mapValue (extractValueFromRegexCaptureGroup result.data.resultText '(DETECTED HIGH|DÉTECTÉ ÉLEVÉ|DETECTED MEDIUM|DÉTECTÉ MOYEN|DETECTED LOW|DÉTECTÉ BAS|DETECTED VERY LOW|DÉTECTÉ TRÈS BAS)') '{"DETECTED HIGH":"high","DÉTECTÉ ÉLEVÉ":"high","DETECTED MEDIUM":"medium","DÉTECTÉ MOYEN":"medium","DETECTED LOW":"low","DÉTECTÉ BAS":"low","DETECTED VERY LOW":"very_low","DÉTECTÉ TRÈS BAS":"very_low"}') '') with='"'}},` +
        `{{#if (eq (defaultTo (mapValue result.category1.id '{"NotDetected":"mtbNotDetected","Negative":"mtbNotDetected"}') '') 'mtbNotDetected')}}` +
        `"rif_result":"not_detected",` +
        `{{else}}` +
        `"rif_result":{{enclose (defaultTo (mapValue result.category2.id '{"Detected":"detected","NotDetected":"not_detected","Indeterminate":"indeterminate","Susceptible":"not_detected","Resistant":"detected","Negative":"not_detected","Positive":"detected","Positive1":"detected","Positive2":"detected","Positive3":"detected"}') 'indeterminate') with='"'}},` +
        `{{/if}}` +
        `"test_date":{{enclose (defaultTo (formatDate (offsetToTimeZone result.createdOn 'Africa/Douala') '${checkTbAppDateTimeFormat}') '') with='"'}},` +
        `"deployment_full_name":{{enclose (defaultTo device.name '') with='"'}},` +
        `"cartridge_serial":{{enclose (defaultTo result.consumableSerial '') with='"'}},` +
        `"operator":{{enclose (defaultTo result.senderOperator '') with='"'}}` +
        `{{curly}}`,
      fileContentTypeId: await fileContentTypeToId('applicationJson'),
      ...auditFields,
    })

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
    await knex('NotificationType').insert({
      name: 'Result Updated',
      partnerId,
      issueTypeId: issueTypeResultUpdatedId,
      level: 1,
      canAcknowledge: 0,
      messageTypeId: resultUpdatedMessageTypeId,
      ...auditFields,
    })

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
