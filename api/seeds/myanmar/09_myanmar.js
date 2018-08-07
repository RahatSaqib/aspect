module.exports = require('../../src/db').seed(seed)

async function seed(knex) {
  const dateFormatUpdated = await knex('Person')
    .whereNotNull('dateFormat')
    .first()
  if (dateFormatUpdated != null) {
    return
  }

  await knex('Person').update({ dateFormat: 'D/M/YYYY' })
}
