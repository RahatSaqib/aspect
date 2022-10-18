const updateJobFunctions = require('../common/20210331_add_jobfunction_technician')
const jobFunctionFixture = require('./fixtures/jobFunctions')
const { partnerName } = require('./fixtures/partnerData')

module.exports = require('../utils').seed(
  async knex => updateJobFunctions(knex, partnerName, jobFunctionFixture),
  __filename
)
