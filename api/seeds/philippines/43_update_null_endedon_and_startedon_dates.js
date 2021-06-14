module.exports = require('../utils').seed(
  async knex =>
    knex('Result')
      .whereNull('endedOn')
      .whereNull('startedOn')
      .update({
        startedOn: knex.raw(
          `COALESCE(STR_TO_DATE(CONCAT(SUBSTRING(patientData->>'$.dateEncoded', 1, 19), 'Z'),'%Y-%m-%dT%TZ'), createdOn)`
        ),
        endedOn: knex.raw(
          `COALESCE(STR_TO_DATE(CONCAT(SUBSTRING(patientData->>'$.dateEncoded', 1, 19), 'Z'),'%Y-%m-%dT%TZ'), createdOn)`
        ),
      }),
  __filename
)
