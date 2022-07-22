module.exports = require('../utils').seed(seed, __filename)

const { subDays } = require('date-fns')

const { normalizeTreatmentStatusDistributionByResults } = require('../commonGenerateResults')

const now = new Date()

async function seed(knex) {
  await normalizeTreatmentStatusDistributionByResults(
    knex,
    await knex('Result').where('endedOn', '>', subDays(now, 7)).select('id'),
    70,
    90
  )
}
