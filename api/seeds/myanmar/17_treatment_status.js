module.exports = require('../utils').seed(seed, 'myanmar_17_treatment_status')

const treatmentStatus = require('../fixtures/treatmentStatus.json')

async function seed(knex) {
  await knex('ResultTreatmentStatus').insert(treatmentStatus)
}
