const _ = require('lodash')
const {
  knex,
  filterParams,
  filterDateRangeParams,
  sortPageParams,
} = require('../db')
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
  'c.contact as cname',
  'sd.devices',
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
]

async function listSites(request) {
  const { query, auth } = request

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const siteQuery = knex('Site as s')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .leftOuterJoin(
      knex('Issue as i')
        .select(
          'i.siteId',
          knex.raw(
            "GROUP_CONCAT( DISTINCT ic.externalId SEPARATOR ',' ) as siteIssues"
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
    .where(function() {
      if (!query.siteIds) {
        return
      }
      this.whereIn('s.id', query.siteIds.split(','))
    })
    .where(function() {
      if (!query.deviceName) {
        return
      }
      const deviceQuery = knex('Device as d')
        .select('d.siteId')
        .modify(filterParams, query, {
          deviceName: 'd.name',
        })

      this.whereIn('s.id', deviceQuery)
    })
    .modify(filterDateRangeParams, query, 's.createdOn')
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      siteName: 's.name',
      externalId: 's.externalId',
    })
    .modify(addConstraints, dataConstraints, { site: 's', geography: 'g' })
  const getCount = siteQuery
    .clone()
    .count('s.id as count')
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
    .leftOuterJoin(
      knex('JobContext as jc')
        .select('p.name as contact', 'jc.siteId')
        .innerJoin('Job as j', 'jc.jobId', 'j.id')
        .innerJoin('Person as p', ' j.personId', 'p.id')
        .as('c'),
      's.id',
      'c.siteId'
    )
    .leftOuterJoin(
      knex('Device as d')
        .select(
          'd.siteId',
          knex.raw(
            "GROUP_CONCAT( dt.id , '-' , dt.name SEPARATOR ';' ) as devices"
          )
        )
        .leftOuterJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
        .groupBy('d.siteId')
        .as('sd'),
      's.id',
      'sd.siteId'
    )
    .where('s.id', siteId)
    .modify(addConstraints, dataConstraints, { site: 's', geography: 'g' })
    .first(SELECT_SHOW_FIELDS)
}

async function showSite(request) {
  const { params, auth } = request

  const dataConstraints = await getConstraints(auth.credentials)

  // get item
  const item = await getSite(params.siteId, dataConstraints)
  if (item.devices) {
    item.devices = item.devices.split(';').map(device => {
      const separator = device.indexOf('-')
      return {
        id: device.substring(0, separator),
        name: device.substring(separator + 1),
      }
    })
  }
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
          'state',
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
  const { auth } = request

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const sites = await knex('Site as s')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .modify(addConstraints, dataConstraints, { site: 's', geography: 'g' })
    .orderBy(['s.name'], 'asc')
    .select('s.id', 's.name', 's.partnerId', 'g.countryId')

  const countryState = await knex('Country as c')
    .innerJoin('Geography as g', 'g.countryId', 'c.id')
    .leftJoin('State as s', 's.id', 'g.stateId')
    .modify(addConstraints, dataConstraints, { geography: 'g' })
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

module.exports = {
  listSites,
  getSite,
  showSite,
  updateSite,
  listSitesForSelectList,
}
