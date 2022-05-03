const { partnerName, partnerPlugin } = require('./fixtures/partnerData')

module.exports = require('../utils').seed(
  async knex =>
    knex('Partner')
      .where({ name: partnerName })
      .update({ plugin: partnerPlugin }),
  __filename
)
