const { seedResultTreatment } = require('../utils_treatment')

module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  await seedResultTreatment(knex)
}
