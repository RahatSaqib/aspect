const { partnerName } = require('./fixtures/partnerData')

module.exports = require('../utils').seed(async knex => {
  await knex('Partner').update({ isDefault: true }).where('name', partnerName)
}, __filename)
