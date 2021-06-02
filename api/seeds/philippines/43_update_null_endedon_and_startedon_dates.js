module.exports = require('../utils').seed(
  async knex =>
    knex('Result')
      .whereRaw('endedOn IS NULL AND startedOn IS NULL')
      .update({
        startedOn: knex.raw(
          `COALESCE(patientData ->> '$.dateEncoded', createdOn)`
        ),
        endedOn: knex.raw(
          `COALESCE(patientData ->> '$.dateEncoded', createdOn)`
        ),
      }),
  __filename
)
