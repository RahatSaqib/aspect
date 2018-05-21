const { addColumn } = require('./utils')

async function addColumns(knex) {
  // add 2 new columns for InventoryStock issues - i.e. how many due days are considered for
  // triggering Stockout or StockExpiring issue (per partner).
  await addColumn(knex, 'Partner', 'dueDaysInventoryStockout', tbl => {
    tbl.integer('dueDaysInventoryStockout')
  })
  await addColumn(knex, 'Partner', 'dueDaysInventoryStockExpiring', tbl => {
    tbl.integer('dueDaysInventoryStockExpiring')
  })
}

module.exports = {
  addColumns,
}
