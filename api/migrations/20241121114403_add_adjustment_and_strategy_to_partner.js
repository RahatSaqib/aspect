exports.up = function (knex) {
  return knex.schema.alterTable('Partner', function (table) {
    table
      .enum('inventoryAdjustment', [
        'currentSiteAdjustment',
        'currentSiteAndProviderAdjustment',
        'currentSiteAndProviderAndNationalAdjustment',
      ])
      .defaultTo('currentSiteAndProviderAdjustment')
      .notNullable()
    table
      .enum('inventoryStrategy', ['withLotAndExpirationDateStrategy', 'withExpirationDateStrategy', 'withLotStrategy'])
      .defaultTo('withLotAndExpirationDateStrategy')
      .notNullable()
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('Partner', function (table) {
    table.dropColumn('inventoryAdjustment')
    table.dropColumn('inventoryStrategy')
  })
}
