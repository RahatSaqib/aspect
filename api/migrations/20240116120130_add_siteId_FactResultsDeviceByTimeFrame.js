exports.up = async function (knex) {
  const tableExists = await knex.schema.hasTable('FactResultsDeviceByTimeFrame')
  // If the table exists, truncate (remove) all data because siteId is notNullable
  if (tableExists) {
    await knex('FactResultsDeviceByTimeFrame').truncate()
  }
  await knex.schema.alterTable('FactResultsDeviceByTimeFrame', x => {
    x.integer('siteId').unsigned().references('id').inTable('Site')
    x.dropForeign('deviceId')
    x.dropUnique([], 'factresultsdevicebytimeframe_unique')
    x.unique(
      ['deviceId', 'siteId', 'assayId', 'resultCategory1', 'resultCategory2', 'timeFrame', 'startedOn'],
      'factresultsdevicebytimeframe_unique'
    )
    x.foreign('deviceId').references('id').inTable('Device')
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('FactResultsDeviceByTimeFrame', x => {
    x.dropForeign('siteId', 'factresultsdevicebytimeframe_siteid_foreign')
    x.dropIndex('siteId', 'factresultsdevicebytimeframe_siteid_foreign')
    x.dropForeign('deviceId')
    x.dropUnique([], 'factresultsdevicebytimeframe_unique')
    x.unique(
      ['deviceId', 'assayId', 'resultCategory1', 'resultCategory2', 'timeFrame', 'startedOn'],
      'factresultsdevicebytimeframe_unique'
    )
    x.foreign('deviceId').references('id').inTable('Device')
    x.dropColumns('siteId')
  })
}
