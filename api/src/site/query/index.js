const { knex } = require('../../db')

/**
 * Retrieves a site
 * @param {function} whereClause - Function taking a knex query builder as parameter
 * and add to it a Where clause to use to filter the site.
 * @returns First Site matching the @see whereClause
 */
async function getSite(whereClause) {
  return knex('Site as s').modify(whereClause)
}

module.exports = { getSite }
