const { knex } = require('../db')

async function customFieldsCompletionStatsService(fieldWeighting) {
  const results = await knex('Results as r').where(
    'r.creationDate',
    '>',
    'DATE_SUB(NOW(), INTERVAL 1 MONTH)'
  )
  // select json customfields from results
  
  const a = 'a'
  return a
}

module.export = { customFieldsCompletionStatsService }
