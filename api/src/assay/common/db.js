const { knex } = require('../../db')

const getAssay = async id => {
  return knex('Assay').where({ id }).first()
}

module.exports = {
  getAssay,
}
