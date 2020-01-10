module.exports = require('../utils').seed(seed, __filename)

const { initDataFromFixture } = require('../utils')

async function seed(knex) {
  const { id } = await knex('ResultCategory')
    .where('i18nKey', 'ResultCategoryTraceDetected')
    .first()
  await knex('ResultCategory')
    .update('externalId', 'TraceDetected')
    .where({ id })

  await initDataFromFixture(knex, 'ResultWorkflowStatus')
}
