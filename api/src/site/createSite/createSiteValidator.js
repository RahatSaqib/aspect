const Boom = require('@hapi/boom')
const {
  knex,
  // filterParams,
  // filterDateRangeParams,
  // sortPageParams,
} = require('../../db')

async function validate(site) {
  checkSiteNotExists(site)
}

function checkSiteNotExists({ name, shortName }) {
  const existingSiteId = knex('Site')
    .where({ name })
    .orWhere({ shortName })
    .first('id')
  if (existingSiteId) {
    throw Boom.badRequest(
      `A site with the same name (${name}) or short name (${shortName}) already exists.`
    )
  }
}

module.exports = { default: validate }
