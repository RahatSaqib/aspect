module.exports = require('../utils').seed(seed, __filename)

const { ensureResultTreatmentStatuses } = require('../common')

async function seed(knex) {
  await ensureResultTreatmentStatuses(knex)
}
