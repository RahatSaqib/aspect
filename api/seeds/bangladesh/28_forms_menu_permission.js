module.exports = require('../utils').seed(seed, __filename)

const { upsertJobFunctionFixture, upsertPermissionFixture } = require('../common')
const jobFunctions = require('./fixtures/jobFunctions')
const {
  partner: { externalId: partnerExternalId },
} = require('./fixtures/partnerData')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner').where({ externalId: partnerExternalId }).first('id')

  await upsertPermissionFixture(knex)
  await upsertJobFunctionFixture(knex, jobFunctions, partnerId)
}
