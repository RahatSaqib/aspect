module.exports = require('../utils').seed(seed, 'sa_nhls_09_device_capacity')

const treatmentStatus = require('../fixtures/treatmentStatus.json')

async function seed(knex) {
  await knex('ResultTreatmentStatus').insert(treatmentStatus)
}
