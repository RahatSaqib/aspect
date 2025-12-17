module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  await knex('Result').update({
    resultData: knex.raw("JSON_REMOVE(resultData, '$.errorNotes')"),
  })
}
