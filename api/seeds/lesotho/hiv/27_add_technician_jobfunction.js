const updateJobFunctions = require('../../common/20210331_add_jobfunction_technician')
const jobFunctionFixture = require('../shared/fixtures/jobFunctions')
const {
  partner: { externalId: partnerExternalId },
} = require('./fixtures/partnerData')

module.exports = require('../../utils').seed(
  async knex => updateJobFunctions(knex, partnerExternalId, jobFunctionFixture),
  __filename
)
