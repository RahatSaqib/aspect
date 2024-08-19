const { knex } = require('../../src/db')

// Create database records for testing
async function createRecords(records) {
  const createdRecords = []
  const bulkInsertData = records.map(record => ({
    table: record.table,
    data: record.data,
  }))
  await knex
    .batchInsert(bulkInsertData, 100)
    .returning('id')
    .then(ids => {
      for (let i = 0; i < ids.length; i++) {
        createdRecords.push({ id: ids[i], table: bulkInsertData[i].table })
      }
    })
  return createdRecords
}
