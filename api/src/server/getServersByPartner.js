const { knex } = require('../db')

async function getServersByPartner() {
  const result = await knex('Partner as p').select(['name', 'serverUrl'])
  return { data: result }
}

module.exports = { getServersByPartner }
