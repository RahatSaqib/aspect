const _ = require('lodash')
const {
  knex,
  filterParams,
  filterDateRangeParams,
  sortPageParams,
} = require('../db')
const { getUser } = require('../auth/service')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { transformGeographyFromUpdates } = require('../geography/service')

const totalDevicesQuery = knex('Device as d')
  .whereRaw('d.siteId = s.id')
  .count('d.siteId')
  .as('totalDevices')

const SELECT_LIST_FIELDS = [
  's.id',
  's.name',
  's.shortName',
  'st.name as state',
  'l.name as lga',
  's.createdOn',
  totalDevicesQuery,
  's.externalId',
  'activeIssues.siteIssues',
  knex.raw('MAX(ii.updatedOn) as inventoryUpdatedOn'),
]

const SELECT_SHOW_FIELDS = [
  's.id',
  's.name',
  's.shortName',
  's.externalId',
  'st.name as state',
  'l.name as lga',
  'ct.name as country',
  's.createdOn',
  totalDevicesQuery,
  'g.countryId',
  'g.stateId',
  'g.lgaId',
  's.timezoneId as timezone', // FIXME?
  's.city',
  's.zip',
  's.street1',
  's.street2',
  's.longitude',
  's.latitude',
  's.geographyId',
]

async function listSites(request) {
  const { query, auth } = request

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const siteQuery = knex('Site as s')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .leftOuterJoin('InventoryItem as ii', 's.id', 'ii.siteId')
    .leftOuterJoin(
      knex('Issue as i')
        .select(
          'i.siteId',
          knex.raw(
            "GROUP_CONCAT(DISTINCT ic.i18nKey SEPARATOR ',') as siteIssues"
          )
        )
        .innerJoin('IssueStatus as ist', 'ist.id', 'i.issuestatusid ')
        .innerJoin('IssueType as it', 'i.issueTypeId', 'it.id')
        .innerJoin('IssueCategory as ic', 'it.issueCategoryId', 'ic.id')
        .whereNotIn('ist.name', ['OK', 'Resolved'])
        .groupBy('i.siteId')
        .as('activeIssues'),
      'activeIssues.siteId',
      's.id'
    )
    .where(function () {
      if (!query.siteIds) {
        return
      }
      this.whereIn('s.id', query.siteIds.split(','))
    })
    .where(function () {
      if (!query.deviceName) {
        return
      }
      const deviceQuery = knex('Device as d')
        .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
        .select('d.siteId')
        .modify(filterParams, query, {
          deviceName: 'd.name',
          deviceType: 'dt.externalId',
        })

      this.whereIn('s.id', deviceQuery)
    })
    .groupBy(['s.id'])
    .modify(filterDateRangeParams, query, 's.createdOn')
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      siteName: 's.name',
      externalId: 's.externalId',
    })
    .modify(addConstraints, dataConstraints, { site: 's', geography: 'g' })

  const getCount = knex
    .count('siteId as count')
    .from(
      siteQuery.clone().select('s.id as siteId').distinct().as('innerQuery')
    )
    .first()
  // get rows
  const getItems = siteQuery
    .clone()
    .modify(sortPageParams, query, 'name')
    .select(SELECT_LIST_FIELDS)

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])
  data.forEach(site => {
    if (site.siteIssues) site.siteIssues = site.siteIssues.split(',')
  })
  const result = { ok: true, total, length: data.length, data }
  return result
}

function getSite(siteId, dataConstraints) {
  return knex('Site as s')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .leftOuterJoin('Country as ct', 'g.countryId', 'ct.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .where('s.id', siteId)
    .modify(addConstraints, dataConstraints, { site: 's', geography: 'g' })
    .first(SELECT_SHOW_FIELDS)
}

async function showSite(request) {
  const { params, auth } = request

  const dataConstraints = await getConstraints(auth.credentials)

  // get item
  const item = await getSite(params.siteId, dataConstraints)
  item.devices = await knex('Device as d')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceTypeCategory as dtc', 'dt.deviceTypeCategoryId', 'dtc.id')
    .modify(addConstraints, dataConstraints, { device: 'd', deviceType: 'dt' })
    .where('siteId', params.siteId)
    .distinct('dt.id', 'dt.name', 'dtc.id as category')
    .select()

  const result = { ok: true, data: item }

  return result
}

async function updateSite(request) {
  const { params, payload } = request

  // TODO: check permission
  const changedSiteFields = await transformGeographyFromUpdates(payload)
  // update item
  const updatedCount = await knex('Site')
    .where('id', params.siteId)
    .update(
      Object.assign(
        _.pick(changedSiteFields, [
          'name',
          'shortName',
          'externalId',
          'street1',
          'street2',
          'geographyId',
          'city',
          'zip',
          'latitude',
          'longitude',
        ]),
        { timezoneId: changedSiteFields.timezone } // TODO standardize timezone name
      )
    )

  if (updatedCount !== 1) {
    throw new Error('Unknown error')
  }

  const result = await showSite(request)
  return result
}

async function listSitesForSelectList(request) {
  const { auth, query, params } = request
  const { mode } = params

  // get data constraints
  let dataConstraints = await getConstraints(auth.credentials)
  if (mode === 'all') {
    // get all sites in user's country and partner
    const { partnerId, countryId } = await getUser(auth.credentials.name)
    dataConstraints = {
      partner: {
        id: partnerId,
      },
      country: {
        id: countryId,
      },
    }
  }

  let sitesQuery = knex('Site as s')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')

  if (query && query.tags && query.tags.length > 0)
    sitesQuery = sitesQuery
      .leftOuterJoin('SiteTag as stg', 's.id', 'stg.siteId')
      .leftOuterJoin('Tag as t', 'stg.tagId', 't.id')
      .whereIn('t.title', query.tags)

  sitesQuery = sitesQuery
    .modify(addConstraints, dataConstraints, { site: 's', geography: 'g' })
    .orderBy(['s.name'], 'asc')
    .select(
      's.id',
      's.name',
      's.shortName',
      's.partnerId',
      'g.countryId',
      'g.stateId',
      'g.lgaId',
      'l.name as lgaName',
      'st.name as stateName',
      's.longitude',
      's.latitude',
      's.zip',
      's.street1',
      's.street2',
      's.city',
      's.externalId'
    )
    .distinct()

  const sites = await sitesQuery

  const countryState = await knex('Country as c')
    .innerJoin('Geography as g', 'g.countryId', 'c.id')
    .leftJoin('State as s', 's.id', 'g.stateId')
    .modify(addConstraints, dataConstraints, { geography: 'g', country: 'c' })
    .orderBy(['c.name', 's.name'], 'asc')
    .select('c.name as countryName', 's.name as stateName')
    .first()

  return {
    ok: true,
    countryName: countryState.countryName,
    stateName: countryState.stateName,
    data: sites,
  }
}

function getSiteByPartnerCountry(siteId, { partnerId, countryId }) {
  const dataConstraints = {
    partner: {
      id: partnerId,
    },
    country: {
      id: countryId,
    },
  }
  return knex('Site as s')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .leftOuterJoin('Country as ct', 'g.countryId', 'ct.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .where('s.id', siteId)
    .modify(addConstraints, dataConstraints, {
      site: 's',
      geography: 'g',
      country: 'ct',
    })
    .first(SELECT_SHOW_FIELDS)
}

module.exports = {
  listSites,
  getSite,
  getSiteByPartnerCountry,
  showSite,
  updateSite,
  listSitesForSelectList,
}
