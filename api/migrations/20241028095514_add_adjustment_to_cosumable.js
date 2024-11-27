exports.up = function (knex) {
  return knex.schema.alterTable('Consumable', function (table) {
    table
      .enum('adjustment', [
        'currentSiteAdjustment',
        'currentSiteAndProviderAdjustment',
        'currentSiteAndProviderAndNationalAdjustment',
      ])
      .defaultTo('currentSiteAndProviderAdjustment')
      .notNullable()
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('Consumable', function (table) {
    table.dropColumn('adjustment')
  })
}
