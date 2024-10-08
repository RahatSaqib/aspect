const seedSiteConsumables = require('../common/upsert_site_consumable')

// eslint-disable-next-line import/no-dynamic-require
const partnerData = require(`../${process.env['seeds.directory'].replace('./seeds/', '')}/fixtures/partnerData`)

module.exports = require('../utils').seed(async knex => {
  await seedSiteConsumables(knex, partnerData)
}, __filename)
