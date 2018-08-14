module.exports = require('../utils').seed(seed)

async function seed(knex) {
  // TODO: Check if seed file already ran

  await knex('AlertTemplate')
    .where({
      message:
        'Module {{issue.data.moduleName}} errors, conduct troubleshooting',
    })
    .update({
      message:
        'Possible module failure on module {{issue.data.moduleName}} contact engineer',
    })

  await knex('SmsTemplate')
    .where({
      message:
        'Module {{issue.data.moduleName}} errors, conduct troubleshooting',
    })
    .update({
      message:
        'Possible module failure on module {{issue.data.moduleName}} contact engineer',
    })

  await knex('EmailTemplate')
    .where({
      subject: 'Procedural Module Errors',
    })
    .update({
      subject: 'Possible module failure',
      body:
        'Possible module failure on module {{issue.data.moduleName}} contact engineer',
      htmlBody:
        'Possible module failure on module <em>{{issue.data.moduleName}}</em> contact engineer',
    })

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
