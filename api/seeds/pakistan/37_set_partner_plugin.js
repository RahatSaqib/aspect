const {
  partner: { externalId: partnerExternalId },
  plugin,
} = require('./fixtures/partnerData')

module.exports = require('../utils').seed(
  async knex => knex('Partner').where({ externalId: partnerExternalId }).update({ plugin }),
  __filename
)
