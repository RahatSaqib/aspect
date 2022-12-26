exports.up = async function (knex) {
  await knex.schema.alterTable('Result', result => {
    result.integer('gxAlertTestId').unsigned().nullable().index()
    result.dateTime('gxAlertSyncedOn').nullable().index()
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('Result', result => {
    result.dropColumns('gxAlertTestId', 'gxAlertSyncedOn')
  })
}
