exports.up = async function (knex) {
  await knex.schema.alterTable('ResultFollowUp', table => {
    table.string('reason').after('followUpId')
  })
  await knex.schema.alterTable('Result', table => {
    table.dateTime('recordedInRegister')
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('ResultFollowUp', table => {
    table.dropColumn('reason')
  })
  await knex.schema.alterTable('Result', table => {
    table.dropColumn('recordedInRegister')
  })
}
