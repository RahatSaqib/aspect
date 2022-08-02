const { knex } = require('../../../db')

module.exports = async function () {
  const siteTypes = await knex('SiteType').select(`id`, `externalId`, `i18nKey`, `name`)

  return { ok: true, data: { siteTypes } }
}
