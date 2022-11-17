exports.up = async function (knex) {
  await knex.schema.alterTable('IssueType', issueType => {
    issueType.boolean('readyForNotification').notNullable().default(false)
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('IssueType', issueType => {
    issueType.dropColumn('readyForNotification')
  })
}
