const updateJobFunctions = require('../../common/20210331_add_jobfunction_technician')
const jobFunctionFixture = require('../shared/fixtures/jobFunctions')
const { partnerName } = require('./fixtures/partnerVariables.json')

module.exports = require('../../utils').seed(
  async knex => updateJobFunctions(knex, partnerName, jobFunctionFixture),
  __filename
)
