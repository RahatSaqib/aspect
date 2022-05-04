const { partnerName, plugin } = require('./fixtures/partnerData')

module.exports = require('../utils').seed(
  async knex => knex('Partner').where({ name: partnerName }).update({ plugin }),
  __filename
)
