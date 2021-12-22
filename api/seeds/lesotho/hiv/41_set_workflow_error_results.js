module.exports = require('../../utils').seed(seed, __filename)
const setWorkflowStatusErrorResults = require('../../common/20211210_set_workflow_status_error_results')

async function seed(knex) {
  await setWorkflowStatusErrorResults(knex)
}
