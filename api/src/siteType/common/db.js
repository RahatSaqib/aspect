const { knex } = require('../../db')

async function getSiteTypes() {
  return knex('SiteType').select(`id`, `externalId`, `i18nKey`, `name`)
}

module.exports = {
  getSiteTypes
}
