const Boom = require('@hapi/boom')
const { getSite } = require('../query')

module.exports = async site => {
  await validateSiteNotExists(site)
}

async function validateSiteNotExists({ name, shortName }) {
  const existingSite = await getRepeatedSiteIfExists(name, shortName)

  if (existingSite) {
    throw Boom.badData(`A site with the same name (${name}) or short name (${shortName}) already exists.`)
  }
}

async function getRepeatedSiteIfExists(name, shortName) {
  return getSite(qb => qb.where({ name }).orWhere({ shortName }))
}
