module.exports = require('../utils').seed(seed)

async function seed(knex) {
  // TODO: Check if seed file already ran

  await knex('IssueEscalationTrigger')
    .update({
      escalationConditions: JSON.stringify({
        evaluationMethod: 'sql-script',
        evaluationParameter:
          './src/plugin/partner/Myanmar/sqlScripts/deviceOfflineLevel3ROEscalatedNetwork.sql',
      }),
    })
    .whereRaw(
      'escalationConditions->>"$.evaluationParameter" = "./sqlScripts/Myanmar/issues/escalations/deviceOfflineLevel3ROEscalatedNetwork.sql"'
    )

  await knex('IssueEscalationTrigger')
    .update({
      escalationConditions: JSON.stringify({
        evaluationMethod: 'sql-script',
        evaluationParameter:
          './src/plugin/partner/Myanmar/sqlScripts/deviceNoResultsLevel3ROEscalatedNoResults.sql',
      }),
    })
    .whereRaw(
      'escalationConditions->>"$.evaluationParameter" = "./sqlScripts/Myanmar/issues/escalations/deviceNoResultsLevel3ROEscalatedNoResults.sql"'
    )

  await knex('IssueResolutionTrigger')
    .update({
      resolutionConditions: JSON.stringify({
        evaluationMethod: 'sql-script',
        evaluationParameter:
          './src/plugin/partner/Myanmar/sqlScripts/deviceOfflineResolveLUNetwork.sql',
      }),
    })
    .whereRaw(
      'resolutionConditions->>"$.evaluationParameter" = "./sqlScripts/Myanmar/issues/resolutions/deviceOfflineLUNetwork.sql"'
    )
}
