const { knex } = require('../../db')
const { addConstraints } = require('../../auth/constraints')

const getExistingSite = async (name, shortName, externalId) =>
  getExistingSiteExcludingCurrent(null, name, shortName, externalId)

async function getExistingSiteExcludingCurrent(siteId, name, shortName, externalId) {
  return knex('Site')
    .whereNot({ id: siteId })
    .whereNot({ disabled: 1 })
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
