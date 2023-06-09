const {
  partner: { externalId: partnerExternalId },
} = require('./fixtures/partnerData')

module.exports = require('../utils').seed(async knex => {
  await knex('Partner').update({ isDefault: true }).where('externalId', partnerExternalId)
}, __filename)
