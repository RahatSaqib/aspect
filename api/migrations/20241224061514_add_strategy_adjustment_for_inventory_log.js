exports.up = function (knex) {
  return knex.schema.alterTable('InventoryLog', function (table) {
    table
      .enum('reconcilationAdjustment', [
        'currentSiteAdjustment',
        'currentSiteAndProviderAdjustment',
        'currentSiteAndProviderAndNationalAdjustment',
      ])
      .nullable()

    table
      .enum('reconcilationStrategy', [
        'withLotAndExpirationDateStrategy',
        'withExpirationDateStrategy',
        'withLotStrategy',
      ])
      .nullable()
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('InventoryLog', function (table) {
    table.dropColumn('reconcilationAdjustment')
    table.dropColumn('reconcilationStrategy')
  })
}
