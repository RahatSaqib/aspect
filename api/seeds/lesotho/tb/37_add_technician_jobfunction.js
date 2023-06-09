module.exports = require('../../utils').seed(seed, __filename)
const updateJobFunctions = require('../../common/20210331_add_jobfunction_technician')
const jobFunctionFixture = require('../shared/fixtures/jobFunctions')
const {
  partner: { externalId: partnerExternalId },
} = require('./fixtures/partnerData')
const { upsertDashboardWidgets } = require('../../common')
const dashboardWidgets = require('./fixtures/dashboardWidget')

async function seed(knex) {
  await updateJobFunctions(knex, partnerExternalId, jobFunctionFixture)

  // we also have to update the widgets after adding a new job function
  const { id: partnerId } = await knex('Partner').where({ externalId: partnerExternalId }).first('id')

  await upsertDashboardWidgets(knex, partnerId, dashboardWidgets)
}
