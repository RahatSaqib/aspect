const { knex } = require('../../db')
const { addConstraints } = require('../../auth/constraints')

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

async function updateSite(siteId, params) {
  await knex('Site as s').where('s.id', siteId).update(params)
}

async function checkSiteAccess(siteId, dataConstraints) {
  return knex('Site as s').where('s.id', siteId).modify(addConstraints, dataConstraints, { site: 's' }).first('s.id')
}
module.exports = { getExistingSite, getExistingSiteExcludingCurrent, updateSite, checkSiteAccess }
