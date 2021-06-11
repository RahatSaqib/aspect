module.exports = require('../utils').seed(
  async knex =>
    knex('Result')
      .whereNull('endedOn').whereNull('startedOn')
      .update({
        startedOn: knex.raw(
          `COALESCE(patientData->>'$.dateEncoded', createdOn)`
        ),
        endedOn: knex.raw(
          `COALESCE(patientData->>'$.dateEncoded', createdOn)`
        ),
      }),
  __filename
)
