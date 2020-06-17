const { knex } = require('../../src/db')

async function getFirstPatient() {
  return knex('Patient').first()
}

async function getFirstPartnerId() {
  const { id } = await knex('Partner').first()
  return id
}

module.exports = {
  getFirstPatient,
  getFirstPartnerId,
}
