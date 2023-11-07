/* eslint-disable linebreak-style */

const { upsertSingle } = require('../../seeds/utils')

async function setUserPermission(knex, userName, jobFunctionName, permissionId) {
  // ------------------------------------------------------
  // make sure specified users have permissions to see Treatment Graph
  // ------------------------------------------------------
  // Country, Person
  const {
    id: personId,
    lastPartnerId: partnerId,
    lastCountryId: countryId,
  } = await knex('Person as p').innerJoin('User as u', 'p.userId', 'u.id').where('u.name', userName).first('p.*')
  // Geography
  const { id: geographyId } = await knex('Geography')
    .where({ countryId })
    .whereNull('stateId')
    .whereNull('lgaId')
    .first()
  // JobFunction
  const { id: jobFunctionId } = await knex('JobFunction').where({ partnerId, name: jobFunctionName }).first()

  // JobContext
  await upsertSingle(knex, 'JobContext', {
    personId,
    jobFunctionId,
    geographyId,
  })

  // JobFunctionPermission
  const jobFunctionPermission = await knex('JobFunctionPermission').where({ permissionId, jobFunctionId }).first()
  if (!jobFunctionPermission) {
    await knex('JobFunctionPermission').insert({
      jobFunctionId,
      permissionId,
    })
  }

  return {
    personId,
    partnerId,
    countryId,
    geographyId,
    jobFunctionId,
  }
}

module.exports = {
  setUserPermission,
}
