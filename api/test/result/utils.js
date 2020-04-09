const { knex } = require('../../src/db')

const getFirstResultAssayId = async () => {
  const { assayId } = await knex('result').first()
  return assayId
}

module.exports = {
  getFirstResultAssayId,
}
