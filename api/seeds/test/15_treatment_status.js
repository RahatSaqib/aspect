module.exports = require('../utils').seed(seed, __filename)

const treatmentStatus = require('../fixtures/treatmentStatus.json')

async function seed(knex) {
  await knex('ResultTreatmentStatus').insert(treatmentStatus)
}
