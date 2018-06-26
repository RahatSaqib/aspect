module.exports = require('../../src/db').seed(seed)

async function seed(knex) {
  // check if this seed already ran
  const issueStatus = await knex('IssueStatus')
    .whereNot('order', 0)
    .first()
  if (issueStatus) {
    return
  }

  const { id: issueStatusSeverityIdLow } = await knex('IssueStatusSeverity')
    .where('externalId', 'Low')
    .first()

  const { id: issueStatusSeverityIdMedium } = await knex('IssueStatusSeverity')
    .where('externalId', 'Medium')
    .first()

  const { id: issueStatusSeverityIdHigh } = await knex('IssueStatusSeverity')
    .where('externalId', 'High')
    .first()

  await Promise.all([
    await knex('IssueStatus')
      .where('externalId', 'Inactive')
      .update({ order: 5, issueStatusSeverityId: issueStatusSeverityIdLow }),

    await knex('IssueStatus')
      .where('externalId', 'Active')
      .update({ order: 0, issueStatusSeverityId: issueStatusSeverityIdHigh }),

    await knex('IssueStatus')
      .where('externalId', 'Acknowledged')
      .update({ order: 4, issueStatusSeverityId: issueStatusSeverityIdMedium }),

    await knex('IssueStatus')
      .where('externalId', 'OK')
      .update({ order: 5, issueStatusSeverityId: issueStatusSeverityIdLow }),

    await knex('IssueStatus')
      .where('externalId', 'DueSoon')
      .update({ order: 3, issueStatusSeverityId: issueStatusSeverityIdMedium }),

    await knex('IssueStatus')
      .where('externalId', 'DueNow')
      .update({ order: 2, issueStatusSeverityId: issueStatusSeverityIdHigh }),

    await knex('IssueStatus')
      .where('externalId', 'Overdue')
      .update({ order: 1, issueStatusSeverityId: issueStatusSeverityIdHigh }),

    await knex('IssueStatus')
      .where('externalId', 'Resolved')
      .update({ order: 5, issueStatusSeverityId: issueStatusSeverityIdLow }),
  ])
}
