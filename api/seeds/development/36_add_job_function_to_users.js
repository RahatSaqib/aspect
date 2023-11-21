const Promise = require('bluebird')

module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  const users = ['ed', 'jim', 'jon', 'steve']
  const personIds = {}

  await Promise.each(users, async user => {
    const userDetail = await knex('User').where({ name: user }).first('id')
    const personId = await knex('Person').where({ userId: userDetail.id }).first('id')
    personIds[user] = personId.id
  })

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

  const jobFunctionManager = await knex('JobFunction')
    .where({
      externalId: 'manager',
      partnerId: partnerIdOne.id,
    })
    .first('id')

  const country = await knex('Country').where({ abbreviation: 'US' }).first('id')

  const { id: geographyId } = await knex('Geography').where({ countryId: country.id }).first('id')

  const checkJobEd = await knex('JobContext').where({
    personId: personIds.jon,
    jobFunctionId: jobFunctionClinical.id,
  })

  if (checkJobEd.length < 1) {
    await knex('JobContext').insert([
      { personId: personIds.ed, jobFunctionId: jobFunctionManager.id, geographyId },
      { personId: personIds.jim, jobFunctionId: jobFunctionLabManager.id, geographyId },
      { personId: personIds.jon, jobFunctionId: jobFunctionClinical.id, geographyId },
      { personId: personIds.steve, jobFunctionId: jobFunctionClinical.id, geographyId },
    ])
  }
}
