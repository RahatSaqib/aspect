module.exports = require('../utils').seed(seed)

const { resultTreatmentStatusToId } = require('../../src/shared/dictionary')
const { subMinutes } = require('date-fns')

const treatmentStatus = require('../fixtures/treatmentStatus.json')

const now = new Date()

async function seed(knex) {
  const treatment = await resultTreatmentStatusToId('AwaitingTreatment')
  await knex('ResultTreatmentStatus').insert(treatmentStatus)

  await knex('ResultTreatmentStatusLog').insert({
    resultTreatmentStatusId: treatment,
    changedOn: subMinutes(now, 90),
    createdOn: subMinutes(now, 90),
  })
}
