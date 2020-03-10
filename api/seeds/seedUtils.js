const now = new Date()
const Promise = require('bluebird')
const _ = require('lodash')
const { insertNewResultPushTemplates } = require('./commonPushNotifications')
const { getBaseIssues } = require('./fixtures/issues')
// / This module was meant for adding generic stuff to all folder seeds.
// / The idea is to add functions which the only parameter is the knex object we are using
// / Every function should control which elements should insert and which ones should overpass.
// / All the functions exported in this module are going to be executed in the runSeeds method.
// / last sentence means it is going to be performed for every single seed file if it is not true the final result
// / So we have to return true if the function was performed correctly or false if there was a problem.
// / If the function is false, it's going to be one retry per seed file until everything is ok.

// the idea is to place fixed and static data which shouldn't be executed directly from static data.

async function addIssuesAndNotifications(knex) {
  // here is preferible to add an enviroment variable just
  // for defining the admin user name and remove the hardcoded one

  // eslint-disable-next-line prefer-const
  let { adminId, partnerId } = await knex('User as u')
    .leftJoin('Person as p', 'u.id', 'p.userId')
    .where('u.name', 'admin')
    .first('u.id as adminId', 'p.lastPartnerId as partnerId')
  if (!adminId) return false
  if (!partnerId) {
    ;({ partnerId } = await knex('Partner as p').first('id as partnerId'))
  }
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }
  const insertedIssueTypes = _.map(
    await knex('IssueType').select('externalId'),
    elem => elem.externalId
  )
  const issues = await getBaseIssues(auditFields)
  await Promise.each(Object.keys(issues), async elem => {
    if (insertedIssueTypes.indexOf(elem) === -1) {
      let alertTemplateId
      let smsTemplateId
      let emailTemplateId
      let messageTypeId

      if (issues[elem].AlertTemplate) {
        ;[alertTemplateId] = await knex('AlertTemplate').insert(
          issues[elem].AlertTemplate
        )
      }
      if (issues[elem].SmsTemplate) {
        ;[smsTemplateId] = await knex('SmsTemplate').insert(
          issues[elem].SmsTemplate
        )
      }
      if (issues[elem].EmailTemplate) {
        ;[emailTemplateId] = await knex('EmailTemplate').insert(
          issues[elem].EmailTemplate
        )
      }
      if (issues[elem].MessageType) {
        ;[messageTypeId] = await knex('MessageType').insert({
          ...issues[elem].MessageType,
          alertTemplateId,
          smsTemplateId,
          emailTemplateId,
        })
      }
      await knex('IssueType').insert({
        ...issues[elem].issueType,
        defaultMessageTypeId: messageTypeId,
      })
    }
  })
  await insertNewResultPushTemplates(knex, adminId, partnerId)
  return true
}

module.exports = {
  addIssuesAndNotifications,
}
