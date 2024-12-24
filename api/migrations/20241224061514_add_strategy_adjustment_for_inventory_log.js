exports.up = function (knex) {
  return knex.schema.alterTable('InventoryLog', function (table) {
    table.enum('reconcilationAdjustment', [
      'currentSiteAdjustment',
      'currentSiteAndProviderAdjustment',
      'currentSiteAndProviderAndNationalAdjustment',
    ])

    table.enum('reconcilationStrategy', [
      'withLotAndExpirationDateStrategy',
      'withExpirationDateStrategy',
      'withLotStrategy',
    ])
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('InventoryLog', function (table) {
    table.dropColumn('reconcilationAdjustment')
    table.dropColumn('reconcilationStrategy')
  })
}
