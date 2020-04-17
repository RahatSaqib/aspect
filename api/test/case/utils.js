const { knex } = require('../../src/db')

async function getFirstCase() {
  return knex('Case').first()
}

async function getFirstPartnerId() {
  const { id } = await knex('Partner').first()
  return id
}

module.exports = {
  getFirstCase,
  getFirstPartnerId,
}
