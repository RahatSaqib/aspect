exports.up = async function (knex) {
  await knex.schema.alterTable('FactResultsDeviceByTimeFrame', x => {
    x.integer('siteId').unsigned().references('id').inTable('Site').notNullable()
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('FactResultsDeviceByTimeFrame', x => {
    x.dropForeign('siteId')
  })
}
