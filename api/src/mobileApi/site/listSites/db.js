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

function applyMobileSiteListFilters(qb, filters) {
  if (!filters || !Object.keys(filters).length) {
    return
  }
  const { nameContains, modifiedSince } = filters
  if (nameContains) {
    qb.andWhere('s.name', 'like', `%${nameContains}%`)
  }
  if (modifiedSince) {
    qb.andWhere(function filterStaleSites() {
      this.where('s.createdOn', '>=', modifiedSince).orWhere('s.updatedOn', '>=', modifiedSince)
    })
  }
}

/**
 * Gets a list of sites for mobile view with user-specific access controls.
 *
 * Returns sites that the user has access to:
 * - Always: sites where the user has direct job assignments (onlyForTransfers = false)
 * - When `includeStateWideSites` is true (reporter_app / legacy JWT without clientType): also sites in the user's
 *   states that lack job assignments (onlyForTransfers = true)
 * @async
 * @function getSitesMobileView
 * @param {Object} dataConstraints - User data constraints containing partner and access information
 * @param {string[]|null} type - Optional array of site type external IDs to filter by, default is lab and clinic
 * @param {string} [sortBy='name'] - Field to sort results by, defaults to 'name'
 * @param {Object} [filters={}] - Optional filters: `nameContains` (substring, min 3 chars in validation), `modifiedSince` (Date; omits sites where both createdOn and updatedOn are before this instant)
 * @param {boolean} [includeStateWideSites=true] - When true (reporter_app / legacy tokens), includes state-wide transfer-only rows (`onlyForTransfers: true`). When false, only assigned sites; `onlyForTransfers` is always false on each row (same field as reporter for response contract only).
 * @returns {Promise<Array<Object>>} Promise that resolves to an array of site objects with the following properties:
 *   - {number} id - Site ID
 *   - {string} name - Site name
 *   - {string} shortName - Site short name
 *   - {string} state - State name
 *   - {string} lga - LGA (Local Government Area) name
 *   - {string} externalId - Site external ID
 *   - {boolean} sampleRegistrationAllowed - Whether sample registration is allowed at this site (editable in Site CRUD)
 *   - {boolean} onlyForTransfers - Semantics apply only when `includeStateWideSites` is true (reporter_app): false = job assignment, true = transfer-only site in user states. When `includeStateWideSites` is false, always false (payload shape parity with reporter_app; not meaningful for true_connect/web).
 * @throws {Error} Database errors from knex operations
 */
const getSitesMobileView = async (
  dataConstraints,
  type,
  sortBy = 'name',
  filters = {},
  includeStateWideSites = true
) => {
  // Query for sites the user has a Job Assignment to (onlyForTransfers = false)
  const assignedSitesQuery = getSitesQuery(dataConstraints).modify(qb => {
    if (type) {
      qb.andWhere(qbSiteType => qbSiteType.whereIn('st.externalId', type))
    }
    applyMobileSiteListFilters(qb, filters)
  })

  const assignedBranch = assignedSitesQuery
    .clone()
    .select(SELECT_LIST_FIELDS)
    .select(knex.raw('false as onlyForTransfers'))

  let sitesListQ
  if (includeStateWideSites) {
    // Query to fetch all remaining sites in state/country (onlyForTransfers = true) — reporter_app only
    const stateSitesQuery = knex('Site as s')
      .join('SiteType as st', 's.siteTypeId', 'st.id')
      .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
      .leftOuterJoin('State as sta', 'g.stateId', 'sta.id')
      .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
      .modify(qb => {
        if (type) {
          qb.andWhere(qbSiteType => qbSiteType.whereIn('st.externalId', type))
        }
        applyMobileSiteListFilters(qb, filters)
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

    sitesListQ = assignedBranch
      .clone()
      .union(stateSitesQuery.select(SELECT_LIST_FIELDS).select(knex.raw('true as onlyForTransfers')))
      .orderBy(sortBy)
  } else {
    sitesListQ = assignedBranch.clone().orderBy(sortBy)
  }

  const sitesList = await sitesListQ
  sitesList.forEach(s => {
    s.sampleRegistrationAllowed = Boolean(s.sampleRegistrationAllowed)
    s.onlyForTransfers = Boolean(s.onlyForTransfers)
  })

  return sitesList
}

module.exports = { getSitesMobileView }
