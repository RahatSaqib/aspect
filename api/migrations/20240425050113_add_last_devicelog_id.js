exports.up = async function (knex) {
  await knex.schema.table('Result', table => {
    table.bigInteger('lastDeviceLogId').unsigned().index().references('id').inTable('DeviceLog')
  })

  await knex('Result')
    .update({
      lastDeviceLogId: knex.raw('dl.max_id'),
    })
    .join(
      knex('DeviceLog').select('resultId', knex.raw('MAX(id) as max_id')).groupBy('resultId').as('dl'),
      'Result.id',
      'dl.resultId'
    )
}

exports.down = async function (knex) {
  await knex.schema.table('Result', table => {
    table.dropForeign('lastDeviceLogId')
    table.dropColumns('lastDeviceLogId')
  })
}
