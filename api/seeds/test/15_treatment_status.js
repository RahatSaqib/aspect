module.exports = require('../utils').seed(seed, 'test_15_treatment_status')

const treatmentStatus = require('../fixtures/treatmentStatus.json')

async function seed(knex) {
  await knex('ResultTreatmentStatus').insert(treatmentStatus)
}
