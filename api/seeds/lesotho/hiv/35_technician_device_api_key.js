module.exports = require('../../utils').seed(seed, __filename)
const updateJobFunctions = require('../../common/20210331_add_jobfunction_technician')
const jobFunctionFixture = require('../shared/fixtures/jobFunctions')
const { partnerName } = require('./fixtures/partnerData')
const { upsertDashboardWidgets } = require('../../common')
const dashboardWidgets = require('./fixtures/dashboardWidget')

async function seed(knex) {
  await updateJobFunctions(knex, partnerName, jobFunctionFixture)

  // we also have to update the widgets after adding a new job function
  const { id: partnerId } = await knex('Partner')
    .where({ name: partnerName })
    .first('id')

  await upsertDashboardWidgets(knex, partnerId, dashboardWidgets)
}
