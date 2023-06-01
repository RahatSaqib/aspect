const Boom = require('@hapi/boom')
const _ = require('lodash')
const { knex, filterParams, filterDateRangeParams, sortPageParams } = require('../db')
const { getUser } = require('../auth/service')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { resultStatusToId } = require('../shared/dictionary')
const { addResultCountsQuery, addTransferredQuery } = require('../shared/query')
const { INTERNAL_DEVICE_IDS } = require('../shared/constants')
const { getNotDecommissionedDevices } = require('../device/common/db')

const SELECT_LIST_FIELDS = [
  's.id',
  's.name',
  's.shortName',
  'st.name as state',
  'l.name as lga',
  's.createdOn',
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
  'g.countryId',
  'g.stateId',
  'g.lgaId',
  's.timezoneId as timezone',
  's.city',
  's.zip',
  's.street1',
  's.street2',
  's.longitude',
  's.latitude',
  's.geographyId',
  's.siteTypeId',
  's.hoursStart',
  's.hoursEnd',
  's.notes',
  's.parentWarehouseId',
  's.hoursStart',
  's.hoursEnd',
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
        .select('i.siteId', knex.raw("GROUP_CONCAT(DISTINCT ic.i18nKey SEPARATOR ',') as siteIssues"))
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
    .whereNotIn('s.externalId', INTERNAL_DEVICE_IDS)
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
    .from(siteQuery.clone().select('s.id as siteId').distinct().as('innerQuery'))
    .first()
  // get rows
  const getItems = siteQuery
    .clone()
    .modify(sortPageParams, query, 'name')
    .select([
      ...SELECT_LIST_FIELDS,
      getNotDecommissionedDevices(dataConstraints).whereRaw('d.siteId = s.id').count('d.siteId').as('totalDevices'),
    ])

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
    .leftOuterJoin('SiteType as t', 't.id', 's.siteTypeId')
    .leftOuterJoin('Country as ct', 'g.countryId', 'ct.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .where('s.id', siteId)
    .modify(addConstraints, dataConstraints, { site: 's', geography: 'g' })
    .first([
      ...SELECT_SHOW_FIELDS,
      getNotDecommissionedDevices(dataConstraints).whereRaw('d.siteId = s.id').count('d.siteId').as('totalDevices'),
    ])
    .select('t.name as siteType')
}

async function showSite(request) {
  const { params, auth } = request

  const dataConstraints = await getConstraints(auth.credentials)

  // get item
  const site = await getSite(params.siteId, dataConstraints)

  if (!site) {
    return Boom.notFound()
  }
  site.devices = await getNotDecommissionedDevices(dataConstraints)
    .where('siteId', params.siteId)
    .select('d.id', 'd.name', 'd.shortName', 'dt.id as deviceTypeId', 'dt.name as deviceTypeName', 'dtc.id as category')
  const result = { ok: true, data: site }

  return result
}

async function disableSite(request) {
  const {
    params,
    auth: { credentials },
  } = request
  const dataConstraints = await getConstraints(credentials)
  const user = await getUser(credentials.name)
  const { id: disabledBy } = user
  const updatedCount = await knex('Site as s')
    .where('s.id', params.siteId)
    .modify(addConstraints, dataConstraints, { site: 's' })
    .update({ disabled: true, disabledOn: new Date(), disabledBy })

  if (updatedCount !== 1) {
    return getDisableSiteErrorReason(params.siteId, dataConstraints)
  }

  return { ok: true }
}

async function getDisableSiteErrorReason(siteId, dataConstraints) {
  let error = new Boom.Boom('Unknown error')
  const site = await getSite(siteId, dataConstraints)

  if (!site) {
    const rawSiteRecord = await knex('Site as s').where('s.id', siteId).first('s.id', 's.disabled')

    if (!rawSiteRecord) {
      error = new Boom.notFound(`The site doesn't exists.`)
    } else if (rawSiteRecord.disabled) {
      error = new Boom.conflict('The site is already disabled.')
    } else {
      error = new Boom.forbidden(`You don't have access to this site. Ask your administrator.`)
    }
  }
  return error
}

async function listSitesForSelectList(request) {
  const { auth, query, params } = request
  const { mode } = params

  // get data constraints
  let dataConstraints = await getConstraints(auth.credentials)
  if (mode === 'all' || mode === 'reporter') {
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
  const { tags, siteTypeExternalIds, excludeSiteIds } = query || {}
  const response = await getListSitesForSelectList(dataConstraints, {
    excludeSiteIds,
    mode,
    siteTypeExternalIds,
    tags,
  })
  return response
}

async function getListSitesForSelectList(dataConstraints, opt = {}) {
  const { excludeSiteIds, mode, siteTypeExternalIds, tags } = opt
  let sitesQuery = knex('Site as s')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .whereNotIn('s.externalId', INTERNAL_DEVICE_IDS)

  if (tags && tags.length > 0) {
    sitesQuery = sitesQuery
      .leftOuterJoin('SiteTag as stg', 's.id', 'stg.siteId')
      .leftOuterJoin('Tag as t', 'stg.tagId', 't.id')
      .whereIn('t.title', tags)
  }
  if (siteTypeExternalIds && siteTypeExternalIds.length > 0) {
    const siteTypes = _.isArray(siteTypeExternalIds) ? siteTypeExternalIds : [siteTypeExternalIds]
    sitesQuery = sitesQuery
      .leftOuterJoin('SiteType as sType', 's.siteTypeId', 'sType.id')
      .whereIn('sType.externalId', siteTypes)
  }
  if (excludeSiteIds) {
    const siteIds = _.isArray(excludeSiteIds) ? excludeSiteIds : [excludeSiteIds]
    sitesQuery = sitesQuery.whereNotIn('s.id', siteIds)
  }

  let columnsToSelect = ['s.id', 's.name', 'g.stateId', 'st.name as stateName']

  if (mode !== 'reporter') {
    columnsToSelect = [
      ...columnsToSelect,
      's.partnerId',
      'g.countryId',
      'g.lgaId',
      'l.name as lgaName',
      's.externalId',
      's.customProperties',
    ]
  }

  sitesQuery = sitesQuery
    .modify(addConstraints, dataConstraints, { site: 's', geography: 'g' })
    .orderBy(['s.name'], 'asc')
    .select(columnsToSelect)
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
    mode,
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

async function listSitesWithReporters(request) {
  const { auth, query } = request
  const dataConstraints = await getConstraints(auth.credentials, 'actionDashboard')
  const { minDate, maxDate } = query
  const resultStatusTransferId = await resultStatusToId('Transfer')

  // const sites
  const siteQuery = knex('Site as s')
    .innerJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .leftOuterJoin('Result as r', queryBuilder => {
      queryBuilder.on('r.reportableSiteId', 's.id')
      if (minDate) {
        queryBuilder.andOn('r.endedOn', '>=', knex.raw('?', [minDate]))
      }
      if (maxDate) {
        queryBuilder.andOn('r.endedOn', '<=', knex.raw('?', [maxDate]))
      }
    })
    .leftOuterJoin('Sample as sample', 'r.sampleId', 'sample.id')
    .leftOuterJoin('Assay as a', 'r.assayId', 'a.id')
    .leftOuterJoin('AssayType as at', 'a.assayTypeId', 'at.id')
    .leftOuterJoin('Disease as dis', 'at.diseaseId', 'dis.id')
    .leftOuterJoin('Device as d', 'r.deviceId', 'd.id')
    .leftOuterJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .leftOuterJoin('SiteTag as siteTag', 's.id', 'siteTag.siteId')
    .leftOuterJoin('Tag as tag', 'siteTag.tagId', 'tag.id')
    /**
     * take only clinics
     */
    .where('tag.title', 'Reportable Site')
    .where(function () {
      if (!query.siteIds) {
        return
      }
      this.whereIn('s.id', query.siteIds.split(','))
    })
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      siteName: 's.name',
      siteId: 's.id',
      partnerId: 's.partnerId',
      deviceName: 'd.name',
      deviceType: 'dt.externalId',
      assayId: 'r.assayId',
      diseaseId: 'dis.id',
    })
    .modify(addConstraints, dataConstraints, { site: 's', geography: 'g' })
    .groupBy('s.id')

  // totals available items
  const getCount = knex
    .count('siteId as count')
    .from(siteQuery.clone().select('s.id as siteId').distinct().as('innerQuery'))
    .first()

  // get page items
  const getItems = siteQuery
    .clone()
    // add joins and different counts for results - (not)onTreatment, requiresTreatment, notPossible, ...
    .modify(queryBuilder => {
      addResultCountsQuery(queryBuilder, knex)
    })
    // add joins/count for 'transferred' results
    .modify(queryBuilder => {
      addTransferredQuery(queryBuilder, knex, resultStatusTransferId, {
        minDate,
        maxDate,
      })
    })
    .modify(sortPageParams, query, 'siteName')
    .select(
      'g.countryId',
      'g.stateId',
      'st.name as stateName',
      'g.lgaId',
      'l.name as lgaName',
      's.partnerId',
      's.id as siteId',
      's.id as id',
      's.name as siteName',
      knex.raw('coalesce(s.shortName,s.externalId) as siteShortName')
    )

  // run both queries
  const [{ count: total }, data] = await Promise.all([getCount, getItems])
  /**
   * to make last 4 columns to add up to the total-columns - add 'transferred' to first 3 counts
   */
  data.forEach(item => {
    item.totalResults += item.transferred
    item.delivered += item.transferred
    item.requiresTreatment += item.transferred
  })

  return { ok: true, total, length: data.length, data }
}

module.exports = {
  listSites,
  getSite,
  getSiteByPartnerCountry,
  showSite,
  listSitesForSelectList,
  listSitesWithReporters,
  getListSitesForSelectList,
  disableSite,
}
