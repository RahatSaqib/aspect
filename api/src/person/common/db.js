const Boom = require('@hapi/boom')
const { getPeopleBase } = require('../../shared/utilsPerson')

const getCreateAssignPerson = async (
  knex,
  { countryId, partnerId, geographyId, siteId, name, email, cell, timezone, culture, jobFunctionExternalId }
) => {
  const personQuery = getPeopleBase()
    .where('g.countryId', countryId)
    .groupBy('p.id')
    .first('p.name', 'p.id', 'p.email', 'p.email2', 'p.cell', 'j.id as jobId')
  //
  const personByName = await personQuery.where('p.name', name)
  const personByEmail = await personQuery.where(builder => {
    builder.where('p.email', email).orWhere('p.email2', email)
  })

  let jobId
  let personId
  // ----------
  // person-by-name found
  // ----------
  if (personByName) {
    personId = personByName.id
    ;[{ jobId }] = [personByName]
    // update email if it's missing
    if (email && !personByName.email) {
      await knex('Person').update('email', email).where('id', personId)
    }
    // update cell if it's missing
    if (cell && !personByName.cell) {
      await knex('Person').update('cell', cell).where('id', personId)
    }
  }
  // ----------
  // or person-by-email found
  // ----------
  else if (personByEmail) {
    personId = personByEmail.id
    ;[{ jobId }] = [personByEmail]
    // update cell if it's missing
    if (cell && !personByEmail.cell) {
      await knex('Person').update('cell', cell).where('id', personId)
    }
  }
  // ----------
  // or create person with specified name
  // ----------
  else if (name) {
    /* validates if the tz is included in our db */
    const { timeZone: defaultTimeZone } =
      (await knex('Geography as g')
        .join('Country as c', 'c.id', 'g.countryId')
        .where('g.id', geographyId)
        .first('c.timezone as timeZone')) || (await knex('Country as c').first('c.timezone as timeZone'))
    const { existingTimeZone } = (await knex('TimeZone').where('id', timezone).first('id as existingTimeZone')) || {}
    timezone = existingTimeZone || defaultTimeZone
    ;[personId] = await knex('Person').insert({
      geographyId,
      name: name || null,
      email: email || null,
      cell: cell || null,
      lastPartnerId: partnerId,
      lastCountryId: countryId,
      timezone,
      culture,
      createdOn: new Date(),
      updatedOn: new Date(),
      partnerId,
    })
  }

  /**
   * for this person -
   * - check/create job for 'Lab User' or 'Technician'
   * - assign this person to site, i.e. to JobContext
   */
  if (personId) {
    // create Job for person
    if (!jobId) {
      const jobFunction = await knex('JobFunction').where({ externalId: jobFunctionExternalId }).first('id')
      if (!jobFunction) {
        throw Boom.expectationFailed(`Required job function '${jobFunctionExternalId}' is missing`)
      }

      ;[jobId] = await knex('Job').insert({
        personId,
        jobFunctionId: jobFunction.id,
      })
    }

    // assign contact to site if it is not assigned yet
    const newJobContext = { jobId, siteId }
    const existingJobContext = await knex('JobContext')
      .where(newJobContext)
      .whereNull('assayTypeId')
      .whereNull('assayId')
      .whereNull('deviceTypeId')
      .whereNull('diseaseId')
      .first()
    if (!existingJobContext) {
      await knex('JobContext').insert(newJobContext)
    }
  }

  return personId
}

module.exports = {
  getCreateAssignPerson,
}
