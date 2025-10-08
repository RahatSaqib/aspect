const { knex } = require('../../../db')
const { INTERNAL_DEVICE_IDS } = require('../../../shared/constants')
const { getSitesQuery } = require('../../../site/service')

const SELECT_LIST_FIELDS = [
  's.id',
  's.name',
  's.shortName',
  'sta.name as state',
  'l.name as lga',
  's.externalId',
  's.sampleRegistrationAllowed',
]

/**
 * Gets a list of sites for mobile view with user-specific access controls.
 *
 * Returns sites that the user has access to, including:
 * - Sites where the user has direct job assignments (onlyForTransfers = false)
 * - Sites in the user's states that don't have job assignments (onlyForTransfers = true)
 * @async
 * @function getSitesMobileView
 * @param {Object} dataConstraints - User data constraints containing partner and access information
 * @param {string[]|null} type - Optional array of site type external IDs to filter by, default is lab and clinic
 * @param {string} [sortBy='name'] - Field to sort results by, defaults to 'name'
 * @returns {Promise<Array<Object>>} Promise that resolves to an array of site objects with the following properties:
 *   - {number} id - Site ID
 *   - {string} name - Site name
 *   - {string} shortName - Site short name
 *   - {string} state - State name
 *   - {string} lga - LGA (Local Government Area) name
 *   - {string} externalId - Site external ID
 *   - {boolean} sampleRegistrationAllowed - Whether sample registration is allowed at this site (editable in Site CRUD)
 *   - {boolean} onlyForTransfers - Whether this site is only accessible for transfers (no direct job assignment)
 * true for sites in the user's states that don't have job assignments
 * By "user states" we mean the states where the user has any job assignment.
 * @throws {Error} Database errors from knex operations
 */
const getSitesMobileView = async (dataConstraints, type, sortBy = 'name') => {
  // Query for sites the user has a Job Assignment to (onlyForTransfers = false)
  const assignedSitesQuery = getSitesQuery(dataConstraints).modify(qb => {
    if (type) {
      qb.andWhere(qbSiteType => qbSiteType.whereIn('st.externalId', type))
    }
  })

  // Query to fetch all remaining sites, including those outside the user’s scope (onlyForTransfers = true)
  const stateSitesQuery = knex('Site as s')
    .join('SiteType as st', 's.siteTypeId', 'st.id')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as sta', 'g.stateId', 'sta.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .modify(qb => {
      if (type) {
        qb.andWhere(qbSiteType => qbSiteType.whereIn('st.externalId', type))
      }
    })
    .where('s.partnerId', dataConstraints.partner.id)
    .modify(qb => {
      if (dataConstraints.country) {
        qb.andWhere('g.countryId', dataConstraints.country.id)
      }
    })
    .where('s.disabled', 0)
    .whereNotIn('s.id', assignedSitesQuery.clone().select('s.id'))
    .whereNotIn('s.externalId', INTERNAL_DEVICE_IDS)

  // Union the two queries
  const sitesListQ = assignedSitesQuery
    .clone()
    .select(SELECT_LIST_FIELDS)
    .select(knex.raw('false as onlyForTransfers'))
    .union(stateSitesQuery.select(SELECT_LIST_FIELDS).select(knex.raw('true as onlyForTransfers')))
    .orderBy(sortBy)

  const sitesList = await sitesListQ
  sitesList.forEach(s => {
    s.sampleRegistrationAllowed = Boolean(s.sampleRegistrationAllowed)
    s.onlyForTransfers = Boolean(s.onlyForTransfers)
  })

  return sitesList
}

module.exports = { getSitesMobileView }
