async function addColumn(knex, tableName, columnName, delegate) {
  return knex.schema.hasColumn(tableName, columnName).then(exists => {
    if (!exists) {
      return knex.schema.alterTable(tableName, tbl => delegate(tbl))
    }
  })
}

module.exports = {
  addColumn,
}
