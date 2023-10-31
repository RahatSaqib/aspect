const _ = require('lodash')
const Boom = require('@hapi/boom')
const { knex } = require('../db')
const { siteContacts, validateContact } = require('./common/db')

async function assignContact(request) {
  const { siteId, personDetails, site } = await validateContact(request)

  if (_.isEmpty(personDetails) || _.isEmpty(site)) {
    return Boom.notFound()
  }

  let { jobId } = personDetails

  if (!jobId) {
    const { id: jobFunctionIdDefault } = await knex('JobFunction').where({ name: 'Lab User' }).first('id')
    ;[jobId] = await knex('Job').insert({
      personId: personDetails.id,
      jobFunctionId: jobFunctionIdDefault,
    })
  }

  const newJobContext = { jobId, siteId }

  const existingJobContext = await knex('JobContext')
    .where(newJobContext)
    .whereNull('assayTypeId')
    .whereNull('assayId')
    .whereNull('deviceTypeId')
    .whereNull('diseaseId')
    .first()
  if (existingJobContext) {
    return Boom.conflict('Contact is already assigned to site')
  }
  const response = await knex('JobContext').insert(newJobContext)
  if (response) return { ok: true, data: await siteContacts(siteId) }
}

module.exports = {
  assignContact,
}
