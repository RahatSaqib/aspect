module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  const users = ['ed', 'jim', 'jon', 'steve']
  const personIds = {}

  const partnerIdOne = await knex('Partner').where({ name: 'Partner One' }).first('id')
  const partnerIdTwo = await knex('Partner').where({ name: 'Partner Two' }).first('id')

  const jobFunctionLabManager = await knex('JobFunction')
    .where({
      externalId: 'labManager',
      partnerId: partnerIdTwo.id,
    })
    .first('id')

  const jobFunctionClinical = await knex('JobFunction')
    .where({
      externalId: 'clinician',
      partnerId: partnerIdOne.id,
    })
    .first('id')

  const jobFunctionRegionalAdmin = await knex('JobFunction')
    .where({
      externalId: 'regionalAdmin',
      partnerId: partnerIdOne.id,
    })
    .first('id')

  const country = await knex('Country').where({ abbreviation: 'US' }).first('id')
  const { id: geographyId } = await knex('Geography').where({ countryId: country.id }).first('id')

  const usersDetail = await knex('User as u')
    .join('Person as p', 'u.id', 'p.userId')
    .whereIn('u.name', users)
    .select('p.id as personId', 'u.name as userName')

  usersDetail.forEach(ud => (personIds[ud.userName] = ud.personId))

  const checkJobEd = await knex('JobContext').where({
    personId: personIds.jon,
    jobFunctionId: jobFunctionClinical.id,
  })

  if (checkJobEd.length < 1) {
    await knex('JobContext').insert([
      { personId: personIds.ed, jobFunctionId: jobFunctionRegionalAdmin.id, geographyId },
      { personId: personIds.jim, jobFunctionId: jobFunctionLabManager.id, geographyId },
      { personId: personIds.jon, jobFunctionId: jobFunctionClinical.id, geographyId },
      { personId: personIds.steve, jobFunctionId: jobFunctionClinical.id, geographyId },
    ])
  }
}
