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
const { resultStatusToId } = require('../shared/dictionary')

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
      's.partnerId',
      'g.countryId',
      'g.stateId',
      'g.lgaId',
      'st.name as stateName',
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

async function listSitesWithReporters(request) {
  const { auth, query } = request
  const dataConstraints = await getConstraints(
    auth.credentials,
    'actionDashboard'
  )
  const { minDate, maxDate } = query
  const resultStatusId = await resultStatusToId('Transfer')

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
     * for counting results 'delivered' to Reporters
     */
    .leftOuterJoin('ResultDownloadLog as rdl', 'rdl.resultId', 'r.id')
    /**
     * for counting `transferred` results -
     * we join `Site.id` to `ResultStatusLog.data.previousReportableSiteId`
     * and count all 'ResultStatusLog.resultId' which have ResultStatus = 'Transfer'
     * See func `transferResult` in `api/src/result/service.js` for details
     * about what we store in field ResultStatusLog.data
     */
    .leftOuterJoin('ResultStatusLog as rslog', builder => {
      builder
        .on(
          's.id',
          knex.raw(
            `CAST(IFNULL(rslog.data ->> '$.previousReportableSiteId', 0) as UNSIGNED)`
          )
        )
        // limit this join by `Transfer` result status only
        .andOn('rslog.resultStatusId', resultStatusId)
    })
    /**
     * join ResultStatusLog and Result to limit transferred results
     * by date range - count resultTransferred.id for `transferred` results
     */
    .leftOuterJoin('Result as resultTransferred', queryBuilder => {
      queryBuilder.on('rslog.resultId', 'resultTransferred.id')
      if (minDate) {
        queryBuilder.andOn(
          'resultTransferred.endedOn',
          '>=',
          knex.raw('?', [minDate])
        )
      }
      if (maxDate) {
        queryBuilder.andOn(
          'resultTransferred.endedOn',
          '<=',
          knex.raw('?', [maxDate])
        )
      }
    })
    /**
     * for counting different statuses rts.externalId = 'XXX'
     */
    .leftOuterJoin(
      'ResultTreatmentStatusLog as rtsl',
      'rtsl.id',
      'r.treatmentStatusLogId'
    )
    .leftOuterJoin(
      'ResultTreatmentStatus as rts',
      'rts.id',
      'rtsl.resultTreatmentStatusId'
    )
    /**
     * for counting  rca.requiresTreatment = 1
     */
    .leftOuterJoin('ResultCategoryAssay as rca', builder => {
      builder.on('r.assayId', 'rca.assayId').andOn(function () {
        this.on('r.resultCategory1', 'rca.resultCategoryId').orOn(
          'r.resultCategory2',
          'rca.resultCategoryId'
        )
      })
    })
    .leftOuterJoin('ResultCategoryAssay as rcaTransferred', builder => {
      builder
        .on('resultTransferred.assayId', 'rcaTransferred.assayId')
        .andOn(function () {
          this.on(
            'resultTransferred.resultCategory1',
            'rcaTransferred.resultCategoryId'
          ).orOn(
            'resultTransferred.resultCategory2',
            'rcaTransferred.resultCategoryId'
          )
        })
    })
    /**
     * for counting only delivered transferred results
     */
    .leftOuterJoin(
      'ResultDownloadLog as rdlTransferred',
      'rdlTransferred.resultId',
      'resultTransferred.id'
    )
    /**
     * take only clinics
     */
    .whereRaw(
      `(
        tag.title     LIKE ? or
        tag.title     LIKE ? or
        s.name        LIKE ? or
        s.externalId  LIKE ?
      )`,
      ['%clinic%', '%dots%', '%clinic%', '%clinic%']
    )
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
    .from(
      siteQuery.clone().select('s.id as siteId').distinct().as('innerQuery')
    )
    .first()

  // get page items
  const getItems = siteQuery
    .clone()
    .modify(sortPageParams, query, 'siteName')
    // all counts
    .count({
      totalResults: knex.raw('DISTINCT r.id'),
      delivered: knex.raw('DISTINCT rdl.resultId'),
      /**
       * We should only be counting results that were delivered in the last four columns
       * because we're measuring how many of the results are linked to treatment on the
       * Reporter and they can't put results on treatment if they were never delivered
       * to the reporter.
       */
      requiresTreatment: knex.raw(`DISTINCT
        CASE
          WHEN rca.requiresTreatment = 1  AND  rca.reportable = 1  AND  r.reportableSiteId = s.id
          THEN rdl.resultId ELSE null
        END`),
      onTreatment: knex.raw(`DISTINCT
        CASE
          WHEN rca.requiresTreatment = 1  AND  rca.reportable = 1  AND  r.reportableSiteId = s.id  AND  rts.externalId = 'OnTreatment'
          THEN rdl.resultId ELSE null
        END`),
      notPossible: knex.raw(`DISTINCT
        CASE
          WHEN rca.requiresTreatment = 1  AND  rca.reportable = 1  AND  r.reportableSiteId = s.id  AND  rts.externalId = 'NotPossible'
          THEN rdl.resultId ELSE null
        END`),
      notOnTreatment: knex.raw(`DISTINCT
        CASE
          WHEN rca.requiresTreatment = 1  AND  rca.reportable = 1  AND  r.reportableSiteId = s.id  AND  (rts.externalId = 'AwaitingTreatment' OR rts.id is null)
          THEN rdl.resultId ELSE null
        END`),
      // see comment for joining table ResultStatusLog
      transferred: knex.raw(`DISTINCT
        CASE
          WHEN rcaTransferred.requiresTreatment = 1  AND  rcaTransferred.reportable = 1
          THEN rdlTransferred.resultId
          ELSE null
        END`),
    })
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
  updateSite,
  listSitesForSelectList,
  listSitesWithReporters,
}
