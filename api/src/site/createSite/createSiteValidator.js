const { reject } = require('lodash')
const { knex } = require('../../db')

module.exports = async function (site) {
  const errors = []
  await checkSiteNotExists(site, errors)
  return errors
}

async function checkSiteNotExists({ name, shortName }, errors) {
  const existingSiteId = await knex('Site')
    .where({ name })
    .orWhere({ shortName })
    .limit(1)
    .pluck('id')

  if (existingSiteId > 0) {
    errors.push(
      `A site with the same name (${name}) or short name (${shortName}) already exists.`
    )
    reject(errors)
  }
}
