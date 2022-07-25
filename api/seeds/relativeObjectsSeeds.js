const now = new Date()
const Promise = require('bluebird')
const _ = require('lodash')
const forms = require('./fixtures/forms')
const timeZones = require('./fixtures/TimeZone').data
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
  defaultIssues = ['DeviceOffline', 'DeviceNoResults', 'InventoryStockExpiring', 'NewResultsAvailable']
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
        .join('Job as j', 'p.id', 'j.personId')
        .join('JobFunction as jf', 'j.jobFunctionId', 'jf.id')
        .where('jf.name', 'admin')
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
  const insertedIssueTypes = _.map(await knex('IssueType').select('externalId'), elem => elem.externalId)
  const issues = await getBaseIssues(auditFields)
  await Promise.each(Object.keys(issues), async elem => {
    // if defaultissues is null all are inserted
    if (insertedIssueTypes.indexOf(elem) === -1 && (!defaultIssues || defaultIssues.indexOf(elem) >= 0)) {
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
      await knex('IssueType').insert({
        ...issues[elem].issueType,
        defaultMessageTypeId: messageTypeId,
      })
    }
  })

  if (!defaultIssues || defaultIssues.indexOf('NewResultsAvailable') >= 0)
    await insertNewResultPushTemplates(knex, adminId, partnerId)
  return true
}

async function addForms(knex, _partnerId, formsNeeded = Object.keys(forms)) {
  const existingSchemas = await knex('FormDefinitionSchema').select()
  if (!_.isEmpty(existingSchemas)) {
    return
  }

  let partnerId = _partnerId
  if (!partnerId) {
    try {
      // eslint-disable-next-line prefer-const
      ;({ partnerId } = await knex('User as u')
        .join('Person as p', 'u.id', 'p.userId')
        .join('Job as j', 'p.id', 'j.personId')
        .join('JobFunction as jf', 'j.jobFunctionId', 'jf.id')
        .where('jf.name', 'admin')
        .first('p.lastPartnerId as partnerId'))
      if (!partnerId) {
        ;({ partnerId } = await knex('Partner as p').first('id as partnerId'))
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('Error inserting forms', e)
      return false
    }
  }
  const forms = await getBaseForms()
  const insertedForms = await knex('FormDefinition').where({ partnerId }).pluck('externalId')

  await Promise.each(Object.keys(forms), async form => {
    if (insertedForms.indexOf(form) === -1 && formsNeeded.indexOf(form) >= 0) {
      const formDefinitionSchemaId =
        _.get(
          _.find(existingSchemas, elem => elem.jsonSchemaFile === forms[form].fileName),
          'id'
        ) ||
        (
          await knex('FormDefinitionSchema').insert({
            jsonSchemaFile: forms[form].fileName,
          })
        )[0]
      await knex('FormDefinition').insert({
        ...forms[form].formDefinition,
        formDefinitionSchemaId,
        partnerId,
      })
    }
  })
  return true
}

async function addTimeZones(knex) {
  const [{ qty }] = await knex('TimeZone as t').count('t.id as qty')
  if (qty === 0) {
    try {
      await knex('TimeZone').insert(timeZones)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('error inserting TimeZones', e)
      return false
    }
  }
  return true
}

module.exports = {
  addTimeZones,
  addIssueTypes,
  addForms,
}
