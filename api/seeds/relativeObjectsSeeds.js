const now = new Date()
const Promise = require('bluebird')
const _ = require('lodash')
const forms = require('./fixtures/forms')
const { insertNewResultPushTemplates } = require('./commonPushNotifications')
const { getBaseIssues } = require('./relatedObjects/issues')
const { getBaseForms } = require('./relatedObjects/forms')
// / This module was meant for adding generic stuff to all folder seeds.
// / The idea is to add functions which the only parameter is the knex object we are using
// / Every function should control which elements should insert and which ones should overpass.
// / All the functions exported in this module are going to be executed in the runSeeds method.
// / last sentence means it is going to be performed for every single seed file if it is not true the final result
// / So we have to return true if the function was performed correctly or false if there was a problem.
// / If the function is false, it's going to be one retry per seed file until everything is ok.

// the idea is to place fixed and static data which shouldn't be executed directly from static data.

async function addIssueTypes(
  knex,
  _partnerId,
  _adminId,
  defaultIssues = [
    'DeviceOffline',
    'DeviceNoResults',
    'InventoryStockExpiring',
    'NewResultsAvailable',
    'ResultReceived',
  ]
) {
  // here is preferible to add an enviroment variable just
  // for defining the admin user name and remove the hardcoded one
  let adminId = _adminId
  let partnerId = _partnerId
  if (!partnerId && !adminId) {
    try {
      // eslint-disable-next-line prefer-const
      ;({ adminId, partnerId } = await knex('User as u')
        .join('Person as p', 'u.id', 'p.userId')
        .join('JobContext as jc', 'p.id', 'jc.personId')
        .join('JobFunction as jf', 'jf.id', 'jc.jobFunctionId')
        .where('jf.name', 'Super Admin')
        .first('u.id as adminId', 'p.lastPartnerId as partnerId'))
      if (!adminId) return false
      if (!partnerId) {
        ;({ partnerId } = await knex('Partner as p').first('id as partnerId'))
      }
    } catch (e) {
      return false
    }
  }
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }
  const insertedIssueTypes = await knex('IssueType').pluck('externalId')
  const issues = await getBaseIssues(auditFields)
  await Promise.each(Object.keys(issues), async elem => {
    if (
      // issue doesn't exist in db
      !insertedIssueTypes.includes(elem) &&
      // defaultIssues is null or contains issue externalId (elem)
      (!defaultIssues || defaultIssues.includes(elem))
    ) {
      let alertTemplateId
      let smsTemplateId
      let emailTemplateId
      let messageTypeId
      let pushNotificationTemplateId
      let webhookTemplateId

      if (issues[elem].AlertTemplate) {
        ;[alertTemplateId] = await knex('AlertTemplate').insert(issues[elem].AlertTemplate)
      }
      if (issues[elem].SmsTemplate) {
        ;[smsTemplateId] = await knex('SmsTemplate').insert(issues[elem].SmsTemplate)
      }
      if (issues[elem].EmailTemplate) {
        ;[emailTemplateId] = await knex('EmailTemplate').insert(issues[elem].EmailTemplate)
      }

      if (issues[elem].PushNotificationTemplate) {
        ;[pushNotificationTemplateId] = await knex('PushNotificationTemplate').insert(
          issues[elem].PushNotificationTemplate
        )
      }
      if (issues[elem].WebhookTemplate) {
        ;[webhookTemplateId] = await knex('WebhookTemplate').insert(issues[elem].WebhookTemplate)
      }
      if (issues[elem].MessageType) {
        ;[messageTypeId] = await knex('MessageType').insert({
          ...issues[elem].MessageType,
          alertTemplateId,
          smsTemplateId,
          emailTemplateId,
          pushNotificationTemplateId,
          webhookTemplateId,
        })
      }
      await knex('IssueType')
        .insert({
          ...issues[elem].issueType,
          defaultMessageTypeId: messageTypeId,
        })
        .onConflict(['externalId'])
        .merge()
    }
  })

  if (!defaultIssues || defaultIssues.indexOf('NewResultsAvailable') >= 0)
    await insertNewResultPushTemplates(knex, adminId, partnerId)
  return true
}

async function addDefaultCustomFieldDefinitions(knex, partnerId, formsNeeded = Object.keys(forms)) {
  const existingSchemas = await knex('FormDefinition').select()
  if (!_.isEmpty(existingSchemas)) {
    return
  }

  const forms = await getBaseForms()
  const insertedForms = await knex('FormDefinition').where({ partnerId }).pluck('externalId')

  await Promise.each(Object.keys(forms), async form => {
    if (insertedForms.indexOf(form) === -1 && formsNeeded.indexOf(form) >= 0) {
      await knex('FormDefinition').insert({
        ...forms[form].formDefinition,
        jsonSchemaFile: forms[form].fileName,
        partnerId,
      })
    }
  })
  return true
}

module.exports = {
  addIssueTypes,
  addDefaultCustomFieldDefinitions,
}
