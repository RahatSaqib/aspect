const _ = require('lodash')
const { knex } = require('../db')

async function getServersByPartner() {
  const query = await knex('Partner as p').select()
  const result = _.map(query, elem => ({
    name: elem.name,
    serverUrl: elem.serverUrl,
  }))
  console.log(result)
  return { data: result }
}

module.exports = { getServersByPartner }
