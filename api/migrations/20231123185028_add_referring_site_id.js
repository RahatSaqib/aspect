exports.up = async function (knex) {
  await knex.schema.alterTable('Result', x => {
    x.integer('referringSiteId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Site')
      .nullable()
      .after('reportableSiteId')
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('Result', x => {
    x.dropForeign('referringSiteId')
    x.dropIndex('referringSiteId')
    x.dropColumn('referringSiteId')
  })
}
