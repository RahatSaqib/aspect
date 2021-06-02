module.exports = require('../utils').seed(
  async knex =>
    knex('Result')
      .whereRaw('endedOn IS NULL AND startedOn IS NULL')
      .update({
        startedOn: knex.raw(
          `COALESCE(resultData ->> '$.encodedResult.dateReleased', patientData ->> '$.dateEncoded')`
        ),
        endedOn: knex.raw(
          `COALESCE(resultData ->> '$.encodedResult.dateReleased', patientData ->> '$.dateEncoded')`
        ),
      }),
  __filename
)
