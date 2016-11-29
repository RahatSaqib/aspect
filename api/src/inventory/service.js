const Promise = require('bluebird')
const _ = require('lodash')
const {
  knex,
  query,
  filterParams,
  filterDateRangeParams,
  sortPageParams
} = require('../db')
const {
  getConstraints,
  addConstraints
} = require('../auth/constraints')

const CONSUMABLES_AT_SITE_SELECT_LIST_FIELDS = [
  'cas.id', 'cas.consumableId', 'cas.siteId', 'cas.expiresOn', 'cas.quantityOnHand',
  'c.name as consumableName', 'c.manufacturer', 'u.shortname as unitShortName',
  's.name as siteName', 's.countryId', 's.stateId', 's.lgaId',
  'co.name as countryName', 'st.name as stateName', 'l.name as lgaName'
]

const CONSUMABLES_AT_SITE_SORT_FIELDS = {
  consumableName: 'c.name',
  manufacturer: 'c.manufacturer',
  siteName: 's.name',
  countryName: 'co.name',
  stateName: 'st.name',
  lgaName: 'l.name',
  quantityOnHand: 'cas.quantityOnHand',
  expiresOn: 'cas.expiresOn'
}

const CONSUMABLES_AT_SITE_FILTER_FIELDS = {
  countryId: 's.countryId',
  stateId: 's.stateId',
  lgaId: 's.lgaId',
  consumableId: 'cas.consumableId',
  siteName: 's.name',
  siteId: 'cas.siteId'
}

const CONSUMABLES_AT_SITE_DATA_CONSTRAINT_ALIASES = { country: 'co', state: 'st', lga: 'l', site: 's' }

function* listConsumableAtSites(request) {
  const { auth } = request

  const dataConstraints = yield getConstraints(auth.credentials)

  const consumablesAtSiteQuery = query('Search Consumables at Site')
    .from('ConsumableAtSite as cas')
    .innerJoin('Consumable as c', 'cas.consumableId', 'c.id')
    .innerJoin('Unit as u', 'c.unit', 'u.id')
    .innerJoin('Site as s', 'cas.siteId', 's.id')
    .leftJoin('Country as co', 's.countryId', 'co.id')
    .leftJoin('State as st', 's.stateId', 'st.id')
    .leftJoin('Lga as l', 's.lgaId', 'l.id')
    .modify(filterDateRangeParams, request.query, 'cas.expiresOn')
    .modify(filterParams, request.query, CONSUMABLES_AT_SITE_FILTER_FIELDS)
    .modify(addConstraints, dataConstraints, CONSUMABLES_AT_SITE_DATA_CONSTRAINT_ALIASES)

  const getCount = consumablesAtSiteQuery.clone()
    .count('cas.id as count').first()

  const getItems = consumablesAtSiteQuery.clone()
    .modify(sortPageParams, request.query,
      CONSUMABLES_AT_SITE_SORT_FIELDS.siteName, CONSUMABLES_AT_SITE_SORT_FIELDS)
    .select(CONSUMABLES_AT_SITE_SELECT_LIST_FIELDS)

  const [{ count: total }, data] = yield Promise.all([getCount, getItems])

  return { ok: true, total, length: data.length, data }
}

function* listConsumablesAtSitesGroupedBySite(request) {
  const { auth } = request

  const dataConstraints = yield getConstraints(auth.credentials)

  const consumablesAtSiteByGeographyQuery = query('Join Consumables at Site, Site Details, and Geography Details')
    .from('ConsumableAtSite as cas')
    .innerJoin('Consumable as c', 'cas.consumableId', 'c.id')
    .innerJoin('Unit as u', 'c.unit', 'u.id')
    .innerJoin('Site as s', 'cas.siteId', 's.id')
    .leftJoin('Country as co', 's.countryId', 'co.id')
    .leftJoin('State as st', 's.stateId', 'st.id')
    .leftJoin('Lga as l', 's.lgaId', 'l.id')
    .modify(filterDateRangeParams, request.query, 'cas.expiresOn')

  const sitesQuery = consumablesAtSiteByGeographyQuery.clone()
    .modify(filterParams, request.query, CONSUMABLES_AT_SITE_FILTER_FIELDS)
    .modify(addConstraints, dataConstraints, CONSUMABLES_AT_SITE_DATA_CONSTRAINT_ALIASES)

  const getSiteCount = sitesQuery.clone()
    .countDistinct('cas.siteId as count').first()

  const sortAggregate = request.query.sortDir === 'desc' ? 'MAX' : 'MIN'
  const sortColumnName = request.query.sortCol || 'siteName'
  let sortColumnField = CONSUMABLES_AT_SITE_SORT_FIELDS[sortColumnName]
  if (sortColumnName === 'expiresOn') {
    const defaultDateOrderBy = request.query.sortDir === 'desc' ? '1000-01-01 00:00:00' : '9999-12-31 23:59:59'
    sortColumnField = `COALESCE(${CONSUMABLES_AT_SITE_SORT_FIELDS[sortColumnName]}, '${defaultDateOrderBy}')`
  }
  const aggregateColumn = `${sortAggregate}(${sortColumnField}) as ${sortColumnName}`
  const getSiteIds = sitesQuery.clone()
    .groupBy('cas.siteId')
    .select('cas.siteId', knex.raw(aggregateColumn))
    .modify(sortPageParams, request.query, sortColumnName)

  const [{ count: total }, sitesData] = yield Promise.all([getSiteCount, getSiteIds])

  const consumablesAtSiteFilters = Object.assign({}, request.query, { siteId: _.map(sitesData, 'siteId') })

  const sortDirection = request.query.sortDir === 'desc' ? 'desc' : 'asc'
  const consumablesAtSite = yield consumablesAtSiteByGeographyQuery.clone()
    .modify(filterParams, consumablesAtSiteFilters, CONSUMABLES_AT_SITE_FILTER_FIELDS)
    .modify(addConstraints, dataConstraints, CONSUMABLES_AT_SITE_DATA_CONSTRAINT_ALIASES)
    .orderBy('sortBy', sortDirection)
    .select([...CONSUMABLES_AT_SITE_SELECT_LIST_FIELDS, knex.raw(`${sortColumnField} as sortBy`)])

  const siteFields = ['siteId', 'siteName', 'countryId', 'stateId', 'lgaId', 'countryName', 'stateName', 'lgaName']
  const consumableAtSiteFields = ['consumableId', 'consumableName', 'manufacturer', 'unitShortName', 'id', 'expiresOn', 'quantityOnHand']
  const sites = _.uniqBy(
    _.map(consumablesAtSite, consumableAtSite =>
      _.pick(consumableAtSite, siteFields)), 'siteId')
  const sitesWithConsumables = _.map(sites, (siteRecord) => {
    const siteItems = _.filter(consumablesAtSite, { siteId: siteRecord.siteId })
    return Object.assign({},
      siteRecord,
      {
        inventoryItems: _.map(siteItems,
          siteItem => _.pick(siteItem, consumableAtSiteFields))
      })
  })

  return { ok: true, total, length: sitesWithConsumables.length, data: sitesWithConsumables }
}

module.exports = {
  listConsumableAtSites,
  listConsumablesAtSitesGroupedBySite
}
