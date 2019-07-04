module.exports = require('../utils').seed(seed, __filename)

const treatmentStatus = require('../fixtures/treatmentStatus.json')

async function seed(knex) {
  const [{ countTreatmentStatus }] = await knex('ResultTreatmentStatus').count(
    '* as countTreatmentStatus'
  )
  if (treatmentStatus.length > countTreatmentStatus)
    await knex('ResultTreatmentStatus').insert(treatmentStatus)
}
