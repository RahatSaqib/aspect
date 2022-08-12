const { knex } = require('../../db')

async function getExistingSite(name, shortName, externalId) {
  return knex('Site')
    .where(qb => qb.orWhere({ name }).orWhere({ shortName }).orWhere({ externalId }))
    .first('name', 'shortName', 'externalId')
}

async function getExistingSiteExcludingCurrent(siteId, name, shortName, externalId) {
  return knex('Site')
    .whereNot({ id: siteId })
    .where(qb => qb.orWhere({ name }).orWhere({ shortName }).orWhere({ externalId }))
    .first('name', 'shortName', 'externalId')
}

module.exports = { getExistingSite, getExistingSiteExcludingCurrent }
