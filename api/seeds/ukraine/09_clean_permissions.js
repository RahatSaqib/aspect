module.exports = require('../utils').seed(seed, __filename)

const { upsertJobFunctionFixture } = require('../common')
const { getPartnerByName } = require('../utils')
const jobFunctionsFixture = require('../common/fixtures/jobFunctions.json')

async function seed(knex) {
  const { id: partnerId } = await getPartnerByName(knex, 'Ukraine')
  await upsertJobFunctionFixture(knex, jobFunctionsFixture, partnerId)
}
