const Boom = require('@hapi/boom')
const _ = require('lodash')
const { knex, filterParams, sortPageParams } = require('../db')
const { getUser } = require('../auth/service')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { getTagsById } = require('../tag/service')
const { resultStatusToId } = require('../shared/dictionary')
const { addResultCountsQuery, addTransferredQuery } = require('../shared/query')
const { INTERNAL_DEVICE_IDS } = require('../shared/constants')
const { getNotDecommissionedDevices } = require('../device/common/db')
const { getSitesQuery, getSiteListQuery, getSiteListModifiedQuery } = require('./common/db')
const { SELECT_SHOW_FIELDS } = require('./common/constants')

async function listSites(request) {
  const { query, auth } = request

  // To ensure correct database queries, the `stateId` and `lgaId` values should be converted from empty strings to `null`.
  ;['stateId', 'lgaId'].forEach(property => {
    if (query[property] === '') {
      query[property] = null
    }
  })

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const siteQuery = getSiteListQuery(query, dataConstraints)

  const getCount = knex
    .count('siteId as count')
    .from(siteQuery.clone().select('s.id as siteId').distinct().as('innerQuery'))
    .first()
  // get rows
  const getItems = getSiteListModifiedQuery(query, dataConstraints)

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])
  const result = { ok: true, total, length: data.length, data }
  return result
}

// TODO: should also be in the db file
function getSite(siteId, dataConstraints) {
  return knex('Site as s')
    .join('SiteType as st', 's.siteTypeId', 'st.id')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as sta', 'g.stateId', 'sta.id')
    .leftOuterJoin('Country as ct', 'g.countryId', 'ct.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .leftOuterJoin('Site as spw', 's.parentWarehouseId', 'spw.id')
    .where('s.id', siteId)
    .modify(addConstraints, dataConstraints, { site: 's', geography: 'g' })
    .first([
      ...SELECT_SHOW_FIELDS,
      getNotDecommissionedDevices(dataConstraints).whereRaw('d.siteId = s.id').count('d.siteId').as('totalDevices'),
    ])
    .select('st.name as siteType', 'st.externalId as siteTypeExternalId', 'spw.name as parentWarehouseName')
}

async function showSite(request) {
  const { params, auth } = request

  const dataConstraints = await getConstraints(auth.credentials)

  // get item
  const siteQuery = getSite(params.siteId, dataConstraints)
    // Add active consumables at the site (current or unreconciled)
    .leftJoin(
      knex('Result as r')
        .leftJoin('ConsumableAssay as ca', 'ca.assayId', 'r.assayId')
        .where('r.siteId', params.siteId)
        .whereNull('r.reconciliationDate')
        .select('r.siteId', 'ca.consumableId')
        .unionAll(function () {
          this.select('ii.siteid', 'ii.consumableId')
            .from('InventoryItem as ii')
            .where('ii.siteId', params.siteId)
            .where('ii.quantityOnHand', '>', 0)
        })
        .as('ac'),
      'ac.siteId',
      's.id'
    )
    .select({ activeConsumables: knex.raw('GROUP_CONCAT(DISTINCT ac.consumableId)') })

  const site = await siteQuery
  if (!site || site.id === null) {
    return Boom.notFound()
  }

  site.selectedConsumables = site.activeConsumables ? site.activeConsumables.split(',').map(Number) : []
  delete site.activeConsumables

  const tags = (await getTagsById(auth, site.id, 'site')) ?? []

  site.consumableIds = await knex('SiteConsumable as sc').where('sc.siteId', site.id).pluck('consumableId')

  site.devices = await getNotDecommissionedDevices(dataConstraints)
    .where('d.siteId', params.siteId)
    .select('d.id', 'd.name', 'd.shortName', 'dt.id as deviceTypeId', 'dt.name as deviceTypeName', 'dtc.id as category')

  const result = { ok: true, data: { ...site, tags } }

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

async function listSitesForTransferSelectList(request) {
  const { auth } = request

  const { personId, partnerId, countryId } = await getUser(auth.credentials.name)
  const data = await getListSitesForTransferSelectList({ personId, partnerId, countryId })

  return { ok: true, data }
}

async function getListSitesForSelectList(dataConstraints, opt = {}) {
  const { excludeSiteIds, mode, siteTypeExternalIds, tags } = opt

  let sitesQuery = knex('Site as s')
    .leftOuterJoin('SiteType as sType', 's.siteTypeId', 'sType.id')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .leftOuterJoin('Site as stp', 's.parentWarehouseId', 'stp.id')
    .leftOuterJoin('SiteConsumable as sc', 's.id', 'sc.siteId')
    .whereNotIn('s.externalId', INTERNAL_DEVICE_IDS)

  if (tags && tags.length > 0) {
    sitesQuery = sitesQuery
      .leftOuterJoin('SiteTag as stg', 's.id', 'stg.siteId')
      .leftOuterJoin('Tag as t', 'stg.tagId', 't.id')
      .whereIn('t.title', tags)
  }
  if (siteTypeExternalIds && siteTypeExternalIds.length > 0) {
    const siteTypes = _.isArray(siteTypeExternalIds) ? siteTypeExternalIds : [siteTypeExternalIds]
    sitesQuery = sitesQuery.whereIn('sType.externalId', siteTypes)
  }
  if (excludeSiteIds) {
    const siteIds = _.isArray(excludeSiteIds) ? excludeSiteIds : [excludeSiteIds]
    sitesQuery = sitesQuery.whereNotIn('s.id', siteIds)
  }

  let columnsToSelect = [
    's.id',
    's.name',
    'g.stateId',
    'st.name as stateName',
    'stp.id as parentWarehouseId',
    knex.raw(`GROUP_CONCAT(sc.consumableId SEPARATOR ',') as siteConsumables`),
    'sType.externalId as siteType',
  ]

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
    .groupBy('s.id')
    .distinct()

  const sites = await sitesQuery

  /**
   * convert csv string of siteConsumables into array of numbers
   */
  const data = sites.map(it => {
    it.siteConsumables = it.siteConsumables?.split(',').map(x => +x)
    return it
  })

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
    data,
  }
}

async function getListSitesForTransferSelectList({ personId, partnerId, countryId }) {
  return knex('Site as s')
    .join('JobContext as jc', 'jc.personId', personId)
    .leftJoin('Geography as sg', 's.geographyId', 'sg.id')
    .leftJoin('Site as jcs', function () {
      this.on('jc.siteId', 'jcs.id').andOnNull('jc.geographyId')
    })
    .leftJoin('Geography as g', function () {
      this.on('jc.geographyId', '=', 'g.id').orOn('jcs.geographyId', '=', 'g.id')
    })
    .where(function () {
      this.whereNotNull('g.stateId').andWhere('g.stateId', '=', knex.raw('sg.stateId'))
    })
    .orWhere(function () {
      this.whereNull('g.stateId')
    })
    .andWhere('s.partnerId', partnerId)
    .andWhere('sg.countryId', countryId)
    .select(['s.id', 's.name'])
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
    .join('SiteType as st', 's.siteTypeId', 'st.id')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as sta', 'g.stateId', 'sta.id')
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
  const dataConstraints = await getConstraints(auth.credentials)
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
  getSitesQuery,
  listSites,
  getSite,
  getSiteByPartnerCountry,
  showSite,
  listSitesForSelectList,
  listSitesForTransferSelectList,
  listSitesWithReporters,
  getListSitesForSelectList,
  disableSite,
}
