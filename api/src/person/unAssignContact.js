const _ = require('lodash')
const Boom = require('@hapi/boom')
const { siteContacts, validateContact } = require('./common/db')
const { knex } = require('../db')

async function unAssignContact(request) {
  const { siteId, personDetails, site } = await validateContact(request)

  if (_.isEmpty(personDetails) || _.isEmpty(site)) {
    return Boom.notFound()
  }

  const contact = { id: personDetails.jobContextId, siteId }
  const jcRecord = await knex('JobContext')
    .where(contact)
    .whereNull('assayTypeId')
    .whereNull('assayId')
    .whereNull('deviceTypeId')
    .whereNull('diseaseId')
    .first()
  if (!jcRecord) {
    return Boom.notFound()
  }
  await knex('JobContext').where(contact).del()

  return { ok: true, data: await siteContacts(siteId) }
}

module.exports = {
  unAssignContact,
}
