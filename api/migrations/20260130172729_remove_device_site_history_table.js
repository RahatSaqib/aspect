exports.up = async function (knex) {
  await knex.schema.dropTableIfExists('DeviceSiteHistory')
}

exports.down = async function (knex) {
  await knex.schema.createTable('DeviceSiteHistory', history => {
    history.increments('id')
    history.integer('deviceId').unsigned().notNullable().index().references('id').inTable('Device')
    history.integer('siteId').unsigned().notNullable().index().references('id').inTable('Site')
    history.dateTime('createdOn')
    history.integer('createdBy').unsigned().index().references('id').inTable('User')
  })
}
