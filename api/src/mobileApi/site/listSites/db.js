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

/** Assigned sites only — id, name, geography, externalId (no sampleRegistrationAllowed / onlyForTransfers). */
const SELECT_ASSIGNED_SIMPLE_FIELDS = [
  's.id',
  's.name',
  's.shortName',
  'sta.name as state',
  'l.name as lga',
  's.externalId',
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

function buildAssignedSitesQuery(dataConstraints, type, filters) {
  return getSitesQuery(dataConstraints).modify(qb => {
    if (type) {
      qb.andWhere(qbSiteType => qbSiteType.whereIn('st.externalId', type))
    }
    applyMobileSiteListFilters(qb, filters)
  })
}

/**
 * Reporter / Aspect Mobile: job-assignment sites plus state-wide transfer-only sites (`onlyForTransfers`).
 *
 * @async
 * @function getSitesMobileView
 * @param {Object} dataConstraints - User data constraints containing partner and access information
 * @param {string[]|null} type - Optional array of site type external IDs to filter by, default is lab and clinic
 * @param {string} [sortBy='name'] - Field to sort results by, defaults to 'name'
 * @param {Object} [filters={}] - Optional filters: `nameContains` (substring, min 3 chars in validation), `modifiedSince` (Date; omits sites where both createdOn and updatedOn are before this instant)
 * @returns {Promise<Array<Object>>} Site rows with `sampleRegistrationAllowed` and `onlyForTransfers`
 */
const getSitesMobileView = async (dataConstraints, type, sortBy = 'name', filters = {}) => {
  const assignedSitesQuery = buildAssignedSitesQuery(dataConstraints, type, filters)

  const assignedBranch = assignedSitesQuery
    .clone()
    .select(SELECT_LIST_FIELDS)
    .select(knex.raw('false as onlyForTransfers'))

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

  const sitesListQ = assignedBranch
    .clone()
    .union(stateSitesQuery.select(SELECT_LIST_FIELDS).select(knex.raw('true as onlyForTransfers')))
    .orderBy(sortBy)

  const sitesList = await sitesListQ
  sitesList.forEach(s => {
    s.sampleRegistrationAllowed = Boolean(s.sampleRegistrationAllowed)
    s.onlyForTransfers = Boolean(s.onlyForTransfers)
  })

  return sitesList
}

/**
 * Job-assignment sites only; same filters as {@link getSitesMobileView}, slimmer rows (no registration / transfer flags).
 *
 * @param {Object} dataConstraints
 * @param {string[]|null} type
 * @param {string} [sortBy='name']
 * @param {Object} [filters={}]
 * @returns {Promise<Array<Object>>}
 */
const getSitesMobileAssignedSimple = async (dataConstraints, type, sortBy = 'name', filters = {}) => {
  const assignedSitesQuery = buildAssignedSitesQuery(dataConstraints, type, filters)
  return assignedSitesQuery.clone().select(SELECT_ASSIGNED_SIMPLE_FIELDS).orderBy(sortBy)
}

module.exports = { getSitesMobileView, getSitesMobileAssignedSimple }
