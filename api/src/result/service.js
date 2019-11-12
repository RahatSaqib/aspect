const Boom = require('boom')
const _ = require('lodash')
const dateFormat = require('date-fns/format')
const { subDays, subMonths, startOfMonth, endOfMonth } = require('date-fns')
const Promise = require('bluebird')
const {
  knex,
  filterParams,
  filterDateRangeParams,
  sortPageParams,
} = require('../db')
const { resultUpdated } = require('./actions')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { getUser } = require('../auth/service')
const {
  resultWorkflowStatusToId,
  resultTreatmentStatusToId,
} = require('../shared/dictionary')
const { oneDirectionalMd5Hash } = require('../shared/encryption')
const { returnIso8601StringWithoutTimeZoneOffset } = require('../shared/date')
const { getPathFromFileReferenceId } = require('../file/service')

const SELECT_LIST_FIELDS = [
  'r.id',
  'r.externalId',
  knex.raw(
    "case when GREATEST(IFNULL(rtas.requiresTreatment,0), IFNULL(rtas2.requiresTreatment,0)) = 0 then null else case when rts.externalId= 'OnTreatment' then 'ok' when rts.externalId = 'NotPossible' then 'na' when r.endedOn<DATE_SUB(NOW(),INTERVAL 32 DAY) then 'alert' when r.endedOn<=DATE_SUB(NOW(),INTERVAL 16 DAY) and r.endedOn>=DATE_SUB(NOW(),INTERVAL 32 DAY) then 'warning' else 'na' end end as treatmentStatusInfo"
  ),
  knex.raw('IFNULL(r.endedOn, r.startedOn) as endedOn'),
  'd.name as deviceName',
  'c.name as countryName',
  'st.name as stateName',
  'lg.name as lgaName',
  'rc1.name as resultCategory1Name',
  'rc2.name as resultCategory2Name',
  'rs.name as resultWorkflowStatus',
  'rts.externalId as resultTreatmentStatus',
  'rtsl.changedOn as resultTreatmentStatusChangedOn',
  knex.raw('ifnull(rts.name, "N/A") as resultTreatmentStatusName'),
  knex.raw(
    'GREATEST(IFNULL(rtas.requiresTreatment,0), IFNULL(rtas2.requiresTreatment,0)) as requiresTreatment'
  ),
  'so.name as sampleOriginSiteName',
  'sp.externalId as sampleId',
  'r.errorCode',
  'sp.collectedOn as sampleCollectedOn',
  'a.name as assayName',
  'a.id as assayId',
  'r.deviceId',
  'stp.name as sampleTypeName',
  knex.raw(
    `IFNULL(JSON_UNQUOTE(JSON_EXTRACT(r.resultData, "$.resultText")), CONCAT(IFNULL(rc1.name, ''), '|', IFNULL(rc2.name, ''))) as resultText`
  ),
  knex.raw('JSON_UNQUOTE(JSON_EXTRACT(r.patientData, "$.id")) as patientId'),
  'si.name as siteName',
  'dt.name as deviceTypeName',
]
const SELECT_COMMON_FIELDS = [
  'r.id',
  'r.externalId',
  'r.startedOn',
  'r.endedOn',
  'r.deviceId',
  'd.name as deviceName',
  'd.serial as deviceSerial',
  'c.name as countryName',
  'st.name as stateName',
  'lg.name as lgaName',
  'rc1.name as resultCategory1Name',
  'rc2.name as resultCategory2Name',
  'rs.id as resultWorkflowStatusId',
  'rs.name as resultWorkflowStatus',
  'rs.externalId as resultWorkflowStatusExternalId',
  'rsl.changedOn as resultWorkflowChangedOn',
  'rts.id as resultTreatmentStatusId',
  'rts.externalId as resultTreatmentStatus',
  'r.resultData',
  'r.formData',
  'r.siteId',
  'si.name as siteName',
  'r.assayVersion',
  'r.consumableSerial',
  'r.consumableLot',
  'r.consumableExpirationDate',
  'r.instrumentSerial',
  'r.moduleName',
  'r.moduleSerial',
  'r.researchId',
  'r.senderVersion',
  'r.senderOperator',
  'r.notes',
  'r.errorCode',
  'r.errorNotes',
  'r.createdOn',
  'r.updatedOn',
  'r.assayId',
  'sp.externalId as sampleId',
  'r.sampleGroup',
  'sp.originSiteId as sampleOriginSiteId',
  'sp.collectedOn as sampleCollectedOn',
  'so.name as sampleOriginSiteName',
  'stp.name as sampleTypeName',
  knex.raw('JSON_UNQUOTE(JSON_EXTRACT(r.patientData, "$.id")) as patientId'),
  knex.raw(
    'GREATEST(IFNULL(rtas.requiresTreatment,0), IFNULL(rtas2.requiresTreatment,0)) as requiresTreatment'
  ),
  knex.raw(
    "case when GREATEST(IFNULL(rtas.requiresTreatment,0), IFNULL(rtas2.requiresTreatment,0)) = 0 then null else case when rts.externalId= 'OnTreatment' then 'ok' when rts.externalId = 'NotPossible' then 'na' when r.endedOn<DATE_SUB(NOW(),INTERVAL 32 DAY) then 'alert' when r.endedOn<=DATE_SUB(NOW(),INTERVAL 16 DAY) and r.endedOn>=DATE_SUB(NOW(),INTERVAL 32 DAY) then 'warning' else 'na' end end as treatmentStatusInfo"
  ),
  'r.patientData',
  'rsl.reason as resultWorkflowLogReason',
  'rsl.operator as resultWorkflowLogOperator',
  'rsl.createdOn as resultWorkflowLogCreatedOn',
  'rsl.changedOn as resultWorkflowLogChangedOn',
  'rtsl.method as resultTreatmentMethod',
  'rtsl.data as resultTreatmentData',
  'rtsl.resultTreatmentStatusId',
  'rtsl.changedOn as resultTreatmentStatusChangedOn',
  'rtsl.createdOn as resultTreatmentStatusCreatedOn',
]
const SELECT_SHOW_FIELDS = _.concat(SELECT_COMMON_FIELDS, 'rf.formSchema')
const SORT_FIELDS = [
  'endedOn',
  'deviceName',
  'sampleOriginSiteName',
  'stateName',
  'lgaName',
  'sampleId',
  'errorCode',
  'resultText',
  'resultWorkflowStatus',
  'resultTreatmentStatus',
  'resultTreatmentStatusChangedOn',
  'requiresTreatment',
  'resultCategory1Name',
  'resultCategory2Name',
  'patientId',
]

async function getListResults(query, auth, fields = SELECT_LIST_FIELDS) {
  const selectFields = _.clone(fields)
  const sortableFields = _.clone(SORT_FIELDS)

  const assayColumns = []
  if (query.assayId) {
    const assay = await knex('Assay as a')
      .where('a.id', query.assayId)
      .first()

    if (assay.resultCategory1Label) {
      selectFields.push('rc1.name as resultCategory1Name')
      sortableFields.push('resultCategory1Name')
      assayColumns.push({
        db: 'resultCategory1Name',
        type: 'string',
        title: assay.resultCategory1Label,
        i18nKey: assay.resultCategory1i18nKey,
      })
    }

    if (assay.resultCategory2Label) {
      selectFields.push('rc2.name as resultCategory2Name')
      sortableFields.push('resultCategory2Name')
      assayColumns.push({
        db: 'resultCategory2Name',
        type: 'string',
        title: assay.resultCategory2Label,
        i18nKey: assay.resultCategory2i18nKey,
      })
    }

    const resultDataSchema = JSON.parse(assay.resultDataSchema)
    _.each(resultDataSchema, (value, key) => {
      if (value.list) {
        selectFields.push(
          knex.raw('JSON_EXTRACT(resultData, ?) as ?', [
            `$.${key}`,
            key.replace('.', '_'),
          ])
        )

        sortableFields.push(key.replace('.', '_'))

        assayColumns.push({
          db: key.replace('.', '_'),
          type: value.type,
          title: value.title,
          i18nKey: value.i18nKey,
        })
      }
    })
  }

  // now we know if the sort that was passed is valid:
  if (query.sortCol && !sortableFields.includes(query.sortCol)) {
    return Boom.badRequest()
  }

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const resultQuery = knex('Result as r')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .leftJoin('Geography as g', 'r.geographyId', 'g.id')
    .leftJoin('Country as c', 'g.countryId', 'c.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as lg', 'g.lgaId', 'lg.id')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .leftJoin('Sample as sp', 'r.sampleId', 'sp.id')
    .leftJoin('SampleType as stp', 'sp.sampleTypeId', 'stp.id')
    .leftJoin('Site as so', 'sp.originSiteId', 'so.id')
    .leftJoin('ResultCategoryAssay as rtas', function() {
      this.on('r.assayId', 'rtas.assayId').andOn(
        'r.resultCategory1',
        'rtas.resultCategoryId'
      )
    })
    .leftJoin('ResultCategoryAssay as rtas2', function() {
      this.on('r.assayId', 'rtas2.assayId').andOn(
        'r.resultCategory1',
        'rtas2.resultCategoryId'
      )
    })
    .leftJoin(
      'ResultWorkflowLog as rsl',
      'r.resultWorkflowStatusLogId',
      'rsl.id'
    )
    .leftJoin(
      'ResultWorkflowStatus as rs',
      'rsl.resultWorkflowStatusId',
      'rs.id'
    )
    .leftJoin(
      'ResultTreatmentStatusLog as rtsl',
      'r.treatmentStatusLogId',
      'rtsl.id'
    )
    .leftJoin(
      'ResultTreatmentStatus as rts',
      'rtsl.resultTreatmentStatusId',
      'rts.id'
    )
    .leftJoin('Site as si', 'r.siteId', 'si.id')
    .modify(filterDateRangeParams, query, 'r.endedOn')
    .modify(filterParams, query, {
      deviceId: 'd.id',
      assayId: 'r.assayId',
      resultCategoryId: 'r.resultCategory1',
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      deviceName: 'd.name',
      siteName: 'si.name',
      sampleId: 'sp.externalId',
      sampleOriginSite: 'so.name',
      errorCode: 'r.errorCode',
      workflowStatusId: 'rs.id',
      treatmentStatusId: 'rts.id',
    })
    .modify((queryBuilder, params) => {
      if (params.patientOrResearchId) {
        queryBuilder
          .whereRaw('JSON_EXTRACT(r.patientData, "$.id") like ?', [
            `%${params.patientOrResearchId}%`,
          ])
          .orWhere('r.researchId', 'like', `%${params.patientOrResearchId}%`)
      }
    }, query)
    .modify(addPartnerQueryConstraints, dataConstraints)
    .modify(addConstraints, dataConstraints, { device: 'd', sample: 'sp' })
  // get total count for paging
  const getCount = resultQuery
    .clone()
    .count('r.id as count')
    .first()
  // get rows
  const getItems = resultQuery
    .clone()
    .modify(sortPageParams, query, 'endedOn')
    .select(selectFields)
  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])
  // if assay specified columns from the resultData field, parse them to valid JSON
  if (assayColumns) {
    _.each(data, d => {
      _.each(assayColumns, c => {
        if (c && c.db.indexOf('resultCategory') === -1) {
          const path = c.db.replace('.', '_')
          _.set(d, path, JSON.parse(d[path]))
        }
      })
    })
  }

  const result = {
    ok: true,
    total,
    length: data.length,
    data,
    extraColumns: assayColumns,
  }

  return result
}

function getResultTreatmentStatus(response) {
  if (response.requiresTreatment) {
    const today = new Date()
    const lastSixteenDays = subDays(today, 16)
    const lastThirtyTwoDays = subDays(today, 32)
    const isPastThirtyTwoDays = response.endedOn <= lastThirtyTwoDays
    const isPastSixteenDays =
      response.endedOn <= lastSixteenDays &&
      response.endedOn > lastThirtyTwoDays
    if (response.resultTreatmentStatus === 'OnTreatment') {
      response.treatmentStatusInfo = 'ok'
    } else if (response.resultTreatmentStatus === 'NotPossible') {
      response.treatmentStatusInfo = 'na'
    } else if (isPastThirtyTwoDays) {
      response.treatmentStatusInfo = 'alert'
    } else if (isPastSixteenDays) {
      response.treatmentStatusInfo = 'warning'
    } else {
      response.treatmentStatusInfo = 'na'
    }
  } else {
    response.treatmentStatusInfo = null
  }
}
const addPartnerQueryConstraints = (
  queryBuilder,
  { partner, country, geography, site }
) => {
  if (partner) queryBuilder.where('r.partnerId', partner.id)
  if (site) queryBuilder.where('r.siteId', partner.id)
  else if (geography) {
    if (geography.lgaId) queryBuilder.where('g.lgaId', geography.lgaId)
    else if (geography.stateId) queryBuilder.where('g.stateId', geography.lgaId)
  } else if (country) queryBuilder.where('c.id', country.id)
}
async function exportResults(query, auth) {
  const selectFields = _.clone(SELECT_COMMON_FIELDS)
  const sortableFields = _.clone(SORT_FIELDS)

  const assayColumns = []
  if (query.assayId) {
    const assay = await knex('Assay as a')
      .where('a.id', query.assayId)
      .first()

    if (assay.resultCategory1Label) {
      selectFields.push('rc1.name as resultCategory1Name')
      sortableFields.push('resultCategory1Name')
      assayColumns.push({
        db: 'resultCategory1Name',
        type: 'string',
        title: assay.resultCategory1Label,
        i18nKey: assay.resultCategory1i18nKey,
      })
    }

    if (assay.resultCategory2Label) {
      selectFields.push('rc2.name as resultCategory2Name')
      sortableFields.push('resultCategory2Name')
    }
  }

  // now we know if the sort that was passed is valid:
  if (query.sortCol && !sortableFields.includes(query.sortCol)) {
    return Boom.badRequest()
  }

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const resultQuery = knex('Result as r')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .leftJoin('Geography as g', 'r.geographyId', 'g.id')
    .leftJoin('Country as c', 'g.countryId', 'c.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as lg', 'g.lgaId', 'lg.id')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .leftJoin('Sample as sp', 'r.sampleId', 'sp.id')
    .leftJoin('SampleType as stp', 'sp.sampleTypeId', 'stp.id')
    .leftJoin('Site as so', 'sp.originSiteId', 'so.id')
    .leftJoin('ResultCategoryAssay as rtas', function() {
      this.on('r.assayId', 'rtas.assayId').andOn(
        'r.resultCategory1',
        'rtas.resultCategoryId'
      )
    })
    .leftJoin('ResultCategoryAssay as rtas2', function() {
      this.on('r.assayId', 'rtas2.assayId').andOn(
        'r.resultCategory1',
        'rtas2.resultCategoryId'
      )
    })
    .leftJoin(
      'ResultWorkflowLog as rsl',
      'r.resultWorkflowStatusLogId',
      'rsl.id'
    )
    .leftJoin(
      'ResultWorkflowStatus as rs',
      'rsl.resultWorkflowStatusId',
      'rs.id'
    )
    .leftJoin(
      'ResultTreatmentStatusLog as rtsl',
      'r.treatmentStatusLogId',
      'rtsl.id'
    )
    .leftJoin(
      'ResultTreatmentStatus as rts',
      'rtsl.resultTreatmentStatusId',
      'rts.id'
    )
    .leftJoin('Site as si', 'r.siteId', 'si.id')
    .modify(addPartnerQueryConstraints, dataConstraints)
    .modify(addConstraints, dataConstraints, { device: 'd', sample: 'sp' })
    .modify(filterDateRangeParams, query, 'r.endedOn')
    .modify(filterParams, query, {
      deviceId: 'd.id',
      assayId: 'r.assayId',
      resultCategoryId: 'r.resultCategory1',
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      deviceName: 'd.name',
      siteName: 'si.name',
      sampleId: 'sp.externalId',
      sampleOriginSite: 'so.name',
      errorCode: 'r.errorCode',
      workflowStatusId: 'rs.id',
      treatmentStatusId: 'rts.id',
    })
    .modify((queryBuilder, params) => {
      if (params.patientOrResearchId) {
        queryBuilder
          .whereRaw('JSON_EXTRACT(r.patientData, "$.id") like ?', [
            `%${params.patientOrResearchId}%`,
          ])
          .orWhere('r.researchId', 'like', `%${params.patientOrResearchId}%`)
      }
    }, query)
    .modify(sortPageParams, query, 'endedOn')
    .select(selectFields)
  const data = await resultQuery

  const result = {
    ok: true,
    data,
  }

  return result
}
async function listResults(request) {
  const { query, auth } = request
  const result = await getListResults(query, auth)
  return result
}

async function getDownloadResultsList(query, auth) {
  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const resultQuery = knex('Result as r')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .innerJoin('AssayType as at', 'a.assayTypeId', 'at.id')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .leftJoin('Geography as g', 'r.geographyId', 'g.id')
    .leftJoin('Country as c', 'g.countryId', 'c.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as lg', 'g.lgaId', 'lg.id')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .leftJoin(
      'ResultWorkflowLog as rsl',
      'r.resultWorkflowStatusLogId',
      'rsl.id'
    )
    .leftJoin(
      'ResultWorkflowStatus as rs',
      'rsl.resultWorkflowStatusId',
      'rs.id'
    )
    .leftJoin('Sample as sp', 'r.sampleId', 'sp.id')
    .leftJoin('SampleType as stp', 'sp.sampleTypeId', 'stp.id')
    .leftJoin('Site as so', 'sp.originSiteId', 'so.id')
    .leftJoin('Site as si', 'r.siteId', 'si.id')
    .leftJoin(
      'ResultTreatmentStatusLog as rtsl',
      'r.treatmentStatusLogId',
      'rtsl.id'
    )
    .leftJoin(
      'ResultTreatmentStatus as rt',
      'rtsl.resultTreatmentStatusId',
      'rt.id'
    )
    .leftJoin(
      knex.raw(
        '(select count(id) as cntComments, max(id) as lastId, resultId from ResultNote group by resultId) as rn'
      ),
      'r.id',
      'rn.resultId'
    )
    .leftJoin('ResultNote as rn2', 'rn.lastId', 'rn2.id')
    .leftJoin('User as u2', 'rn2.createdBy', 'u2.id')
    .whereIn('rs.externalId', [
      'Deliverable',
      'Delivered',
      'Acknowledged',
      'Flagged',
    ])
    .modify((queryBuilder, params) => {
      if (params.minUpdatedOn) {
        queryBuilder.where('r.updatedOn', '>=', params.minUpdatedOn)
      }
      if (params.maxUpdatedOn) {
        queryBuilder.where('r.updatedOn', '<', params.maxUpdatedOn)
      }
      if (params.patientSample) {
        queryBuilder.where(builder =>
          builder
            .where('sp.externalId', 'like', `%${params.patientSample}%`)
            .orWhere(
              knex.raw('JSON_EXTRACT(patientData,"$.firstName")'),
              'like',
              `%${params.patientSample}%`
            )
            .orWhere(
              knex.raw('JSON_EXTRACT(patientData,"$.lastName")'),
              'like',
              `%${params.patientSample}%`
            )
            .orWhere(
              knex.raw('JSON_EXTRACT(patientData,"$.name")'),
              'like',
              `%${params.patientSample}%`
            )
            .orWhere(
              knex.raw('JSON_EXTRACT(patientData,"$.id")'),
              'like',
              `%${params.patientSample}%`
            )
        )
      }
      if (params.assayTypeAbbreviations) {
        queryBuilder.whereIn(
          'at.abbreviation',
          params.assayTypeAbbreviations.split(',')
        )
      }
      if (params.resultCategories) {
        queryBuilder.where(builder =>
          builder
            .whereIn('rc1.externalId', params.resultCategories.split(','))
            .orWhereIn('rc2.externalId', params.resultCategories.split(','))
        )
      }
      if (params.workflowStatus) {
        queryBuilder.where('rs.externalId', params.workflowStatus)
      }
      if (params.treatmentStatus)
        queryBuilder.where('rt.externalId', params.treatmentStatus)
      if (params.deviceType)
        queryBuilder.where('dt.externalId', params.deviceType)
      else queryBuilder.where('dt.externalId', 'CepheidGeneXpert')
    }, query)
    .modify(addConstraints, dataConstraints, { device: 'd', sample: 'sp' })
  // get total count for paging
  const getCount = resultQuery
    .clone()
    .count('r.id as count')
    .first()

  // get rows
  const getItems = resultQuery
    .clone()
    .modify(sortPageParams, query, 'r.updatedOn')
    .select(
      'r.id',
      'r.externalId',
      'r.startedOn',
      'r.endedOn',
      'r.createdOn',
      'r.updatedOn',
      'r.longitude',
      'r.latitude',
      'r.treatmentStatusLogId',
      'a.externalId as assayExternalId',
      'si.name as siteName',
      'd.name as deviceName',
      'rc1.externalId as resultCategory1ExternalId',
      'rc2.externalId as resultCategory2ExternalId',
      'r.patientData',
      'r.resultData',
      'r.formData',
      'r.researchId',
      'r.senderVersion',
      'r.senderOperator',
      'r.notes',
      'r.errorCode',
      'r.errorNotes',
      'sp.externalId as sampleId',
      'r.sampleGroup',
      'sp.collectedOn as sampleCollectedOn',
      'so.id as sampleOriginSiteId',
      'so.externalId as sampleOriginSiteExternalId',
      'so.name as sampleOriginSiteName',
      'stp.name as sampleTypeName',
      'rs.name as resultWorkflowStatusName',
      'rs.externalId as resultWorkflowStatusExternalId',
      'rs.i18nKey as resultWorkflowStatusi18nKey',
      'rsl.reason as resultWorkflowStatusReason',
      'rsl.changedOn as resultWorkflowStatusChangedOn',
      'rtsl.changedOn as resultTreatmentStatusChangedOn',
      'rtsl.data as resultTreatmentStatusData',
      'rtsl.method as resultTreatmentStatusMethod',
      'rt.name as resultTreatmentStatusName',
      'rt.externalId as resultTreatmentStatusExternalId',
      'rt.i18nKey as resultTreatmentStatusi18nKey',
      'rn.cntComments',
      'rn2.id as lastCommentId',
      'rn2.text as lastCommentText',
      'rn2.createdOn as lastCommentOn',
      'u2.name as lastCommentBy'
    )

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  // get follow ups for all results in the response for performance (filter later)
  const followUps = await knex('ResultFollowUp as rfu')
    .join('FollowUp as fu', 'rfu.followUpId', 'fu.id')
    .join('FollowUpType as fut', 'fu.followUpTypeId', 'fut.id')
    .whereIn('rfu.resultId', data.map(d => d.id))
    .select(
      'rfu.resultId',
      'rfu.id',
      'rfu.externalId',
      'rfu.date',
      'rfu.createdOn',
      'rfu.updatedOn',
      'fu.name as followUpName',
      'fu.externalId as followUpExternalId',
      'fu.i18nKey as followUpi18nKey',
      'fut.name as followUpTypeName',
      'fut.externalId as followUpTypeExternalId',
      'fut.i18nKey as followUpTypei18nKey'
    )

  const transformedData = _.map(data, d => ({
    id: d.id,
    externalId: d.externalId,
    startedOn: returnIso8601StringWithoutTimeZoneOffset(d.startedOn),
    endedOn: returnIso8601StringWithoutTimeZoneOffset(d.endedOn),
    createdOn: d.createdOn,
    updatedOn: d.updatedOn,
    longitude: d.longitude,
    latitude: d.latitude,
    assayExternalId: d.assayExternalId,
    siteName: d.siteName,
    deviceName: d.deviceName,
    resultCategory1ExternalId: d.resultCategory1ExternalId,
    resultCategory2ExternalId: d.resultCategory2ExternalId,
    patientData: d.patientData ? JSON.parse(d.patientData) : null,
    resultData: d.resultData ? JSON.parse(d.resultData) : null,
    formData: d.formData ? JSON.parse(d.formData) : null,
    researchId: d.researchId,
    senderVersion: d.senderVersion,
    senderOperator: d.senderOperator,
    notes: d.notes,
    errorCode: d.errorCode,
    errorNotes: d.errorNotes,
    sample: {
      id: d.sampleId,
      collectedOn: d.sampleCollectedOn,
      group: d.sampleGroup,
      type: d.sampleTypeName,
      originSite: d.sampleOriginSiteId
        ? {
            externalId: d.sampleOriginSiteExternalId,
            name: d.sampleOriginSiteName,
          }
        : null,
    },
    workflowStatus: {
      name: d.resultWorkflowStatusName,
      externalId: d.resultWorkflowStatusExternalId,
      i18nKey: d.resultWorkflowStatusi18nKey,
      reason: d.resultWorkflowStatusReason,
      changedOn: d.resultWorkflowStatusChangedOn,
    },
    treatmentStatus: {
      changedOn: d.resultTreatmentStatusChangedOn,
      name: d.resultTreatmentStatusName,
      externalId: d.resultTreatmentStatusExternalId,
      i18nKey: d.resultTreatmentStatusi18nKey,
      method: d.resultTreatmentStatusMethod,
      data: d.resultTreatmentStatusData,
    },
    followUps: _.sortBy(
      _.filter(followUps, { resultId: d.id }).map(f => _.omit(f, 'resultId')),
      ['date', 'updatedOn']
    ),
    cntComments: d.cntComments,
    lastCommentId: d.lastCommentId ? +d.lastCommentId : null,
    lastCommentText: d.lastCommentText,
    lastCommentOn: d.lastCommentOn,
    lastCommentBy: d.lastCommentBy,
  }))

  const result = {
    ok: true,
    total,
    length: transformedData.length,
    data: transformedData,
  }

  return result
}

async function downloadResultsList(request) {
  const { query, auth } = request
  const user = await getUser(auth.credentials.name)
  const result = await getDownloadResultsList(query, auth)
  const idsToUpdate = _.uniq(
    _.map(
      _.omitBy(
        result.data,
        elem => elem.workflowStatus.externalId !== 'Delivered'
      ),
      elem => elem.id
    )
  )

  const idsToBeRegistered = _.uniq(_.map(result.data, elem => elem.id))
  if (idsToUpdate) await updateResultStatus(idsToUpdate, user.id)
  if (idsToBeRegistered) await addResultDownloadLog(idsToBeRegistered, user.id)

  const assigmentValue = elem => {
    elem.workflowStatus.externalId = 'Delivered'
  }
  _.forEach(result.data, assigmentValue)
  return result
}
async function addResultDownloadLog(idsToBeRegistered, userId) {
  const now = new Date()

  await Promise.each(idsToBeRegistered, async resultId => {
    await knex('ResultDownloadLog').insert({
      resultId,
      createdOn: now,
      createdBy: userId,
    })
  })
}
async function updateResultStatus(idsToUpdate, userId) {
  const { id: DeliveredId } = await knex('ResultWorkflowStatus')
    .where('externalId', 'Delivered')
    .first('id')
  const now = new Date()
  await Promise.each(idsToUpdate, async resultId => {
    const [resultWorkflowStatusLogId] = await knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId: DeliveredId,
      changedOn: now,
      createdOn: now,
      createdBy: userId,
      reason: 'Download Results Api',
      operator: 'Reporter App',
    })
    await knex('Result')
      .where({
        id: resultId,
      })
      .update({ resultWorkflowStatusLogId })
  })
}
async function showResult(request) {
  const result = await getResultByResultId(request)
  return result.ok ? result : Boom.notFound()
}

async function showDeviceLogs(request) {
  const result = await getDeviceLogsByResultId(request)
  return result
}

async function getDeviceLogsByResultId(request) {
  const { params, auth } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const deviceLogs = await knex('DeviceLog as dl')
    .innerJoin('Device as d', 'dl.deviceId', 'd.id')
    .where('dl.resultId', params.resultId)
    .orderBy('createdOn', 'desc')
    .modify(addConstraints, dataConstraints, { device: 'd' })
    .select(
      'dl.createdOn',
      'dl.deviceOperationId',
      'dl.source',
      'dl.deviceConfigurationUpdated',
      'dl.senderIp',
      'dl.rawMessage'
    )
    .limit(50)
  return { data: deviceLogs }
}

async function showFileReferences(request) {
  const {
    params: { resultId },
    auth,
  } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const fileReferences = await knex('ResultFileReference as rf')
    .join('FileReference as f', 'f.id', 'rf.fileReferenceId')
    .join('Result as r', 'r.id', 'rf.resultId')
    .join('Sample as sp', 'r.sampleId', 'sp.id')
    .join('FileContentType as fct', 'f.fileContentTypeId', 'fct.id')
    .join('Device as d', 'r.deviceId', 'd.id')
    .where('rf.resultId', resultId)
    .orderBy('f.id', 'asc')
    .modify(addConstraints, dataConstraints, { device: 'd', sample: 'sp' })
    .select(
      'f.id',
      'f.name',
      'f.length',
      'f.createdOn',
      'fct.externalId as fileContentType',
      'fct.mimeType',
      'fct.mimeSubtype'
    )
    .map(ref => {
      ref.url = `/result/file/${resultId}/${ref.id}/${ref.name}`
      return ref
    })
  return { data: fileReferences }
}

function downloadFile(request, reply) {
  return downloadFileAsync(request)
    .then(path => {
      reply.file(path)
    })
    .catch(err => {
      console.error(err) // eslint-disable-line no-console
      reply(err)
    })
}

function downloadFirstImage(request, reply) {
  const {
    auth,
    params: { resultId },
  } = request
  return downloadFileAsync({ auth, params: { resultId, mimeType: 'image' } })
    .then(path => {
      reply.file(path)
    })
    .catch(err => {
      console.error(err) // eslint-disable-line no-console
      reply(err)
    })
}

async function downloadFileAsync({ auth, params }) {
  const { resultId, fileReferenceId, fileName, mimeType } = params
  const dataConstraints = await getConstraints(auth.credentials)
  const fileReference = await knex('ResultFileReference as rf')
    .join('FileReference as f', 'f.id', 'rf.fileReferenceId')
    .join('Result as r', 'r.id', 'rf.resultId')
    .join('Sample as sp', 'r.sampleId', 'sp.id')
    .join('FileContentType as fct', 'f.fileContentTypeId', 'fct.id')
    .join('Device as d', 'r.deviceId', 'd.id')
    .modify(addConstraints, dataConstraints, { device: 'd', sample: 'sp' })
    .where('rf.resultId', resultId)
    .modify(qb => {
      if (fileReferenceId != null) {
        qb.where('f.id', fileReferenceId)
      }
      if (fileName != null) {
        qb.where('f.name', fileName)
      }
      if (mimeType != null) {
        qb.where('fct.mimeType', mimeType)
      }
    })
    .orderBy('f.id', 'desc')
    .first('f.id')
  if (fileReference == null) {
    throw Boom.notFound('Cannot find file')
  }
  return getPathFromFileReferenceId(knex, fileReference.id)
}

async function getResultByResultId(request, fields = SELECT_SHOW_FIELDS) {
  const { auth, params } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const { userName } = await getUser(auth.credentials.name)

  const results = await knex('Result as r')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .leftJoin('Geography as g', 'r.geographyId', 'g.id')
    .leftJoin('Site as si', 'r.siteId', 'si.id')
    .leftJoin('Country as c', 'g.countryId', 'c.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as lg', 'g.lgaId', 'lg.id')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .leftJoin('Sample as sp', 'r.sampleId', 'sp.id')
    .leftJoin('SampleType as stp', 'sp.sampleTypeId', 'stp.id')
    .leftJoin('Site as so', 'sp.originSiteId', 'so.id')
    .leftJoin('ResultCategoryAssay as rtas', function() {
      this.on('r.assayId', 'rtas.assayId').andOn(
        'r.resultCategory1',
        'rtas.resultCategoryId'
      )
    })
    .leftJoin('ResultCategoryAssay as rtas2', function() {
      this.on('r.assayId', 'rtas2.assayId').andOn(
        'r.resultCategory1',
        'rtas2.resultCategoryId'
      )
    })
    .leftJoin(
      'ResultWorkflowLog as rsl',
      'r.resultWorkflowStatusLogId',
      'rsl.id'
    )
    .leftJoin(
      'ResultWorkflowStatus as rs',
      'rsl.resultWorkflowStatusId',
      'rs.id'
    )
    .leftJoin(
      'ResultTreatmentStatusLog as rtsl',
      'r.treatmentStatusLogId',
      'rtsl.id'
    )
    .leftJoin(
      'ResultTreatmentStatus as rts',
      'rtsl.resultTreatmentStatusId',
      'rts.id'
    )
    .leftJoin('ResultForm as rf', function() {
      this.on('r.assayId', 'rf.assayId').andOn('r.partnerId', 'rf.partnerId')
    })
    .where('r.id', +params.resultId)
    .modify(addConstraints, dataConstraints, { device: 'd', sample: 'sp' })
    .select(fields)

  let data = null

  // translate result data back to an object and get assay details
  // if selecting the result was successful
  if (results.length === 1) {
    ;[data] = results
    if (data.resultData) {
      data.resultData = JSON.parse(data.resultData)
    }
    if (data.formSchema) {
      data.formSchema = JSON.parse(data.formSchema)
    }
    if (data.formData) {
      data.formData = JSON.parse(data.formData)
    }
    if (data.patientData) {
      data.patientData = JSON.parse(data.patientData)
    }
    if (data.assayId) {
      data.assay = await knex('Assay as a')
        .where('a.id', data.assayId)
        .first()
      if (data.assay.resultDataSchema) {
        data.assay.resultDataSchema = JSON.parse(data.assay.resultDataSchema)
      }
      if (data.assay.patientDataSchema) {
        data.assay.patientDataSchema = JSON.parse(data.assay.patientDataSchema)
      }
    }
    // select files attached to this result
    const { data: files } = await showFileReferences(request)
    data.files = files

    const { data: followUps } = await showResultFollowUps(
      params.resultId,
      dataConstraints
    )
    data.followUps = followUps
  }

  if (data) {
    getResultTreatmentStatus(data)
    data.resultNotes = await getResultNotesByResultId(+params.resultId)
    data.resultTreatmentStatusCreatedBy = userName
  }

  return { ok: results.length === 1, data }
}

async function getResultNotesByResultId(resultId) {
  const resultNotes = await knex('ResultNote as rn')
    .leftJoin('User as u', 'rn.createdBy', 'u.id')
    .leftJoin('ResultNoteType as rt', 'rt.id', 'rn.resultNoteTypeId')
    .where('rn.resultId', resultId)
    .orderBy('rn.createdOn', 'desc')
    .select(
      'u.name as createdBy',
      'rn.text',
      'rn.id',
      'rn.changedOn',
      'rn.createdOn',
      'rt.name as noteType'
    )

  return resultNotes
}

async function listResultTypes(request) {
  const { query } = request

  const resultTypeQuery = knex('ResultType as rt').modify(filterParams, query, {
    name: 'rt.name',
  })

  // get total count for paging
  const getCount = resultTypeQuery
    .clone()
    .count('rt.id as count')
    .first()

  // get rows
  const getItems = resultTypeQuery
    .clone()
    .modify(sortPageParams, query, 'name')
    .select('id', 'name')

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  const result = { ok: true, total, length: data.length, data }

  return result
}

// ---------------------------------
// exporting Results data
// ---------------------------------

async function updateWorkflowStatus(request) {
  const { auth, params, payload } = request
  const now = new Date()
  const { resultId } = params
  const { id: currentUserId } = await getUser(auth.credentials.name)
  // get the result so we can check access and if status changed
  const result = await getResultByResultId(request)
  if (!result.ok) {
    return Boom.notFound()
  }
  let { resultWorkflowStatusId } = payload
  const { changedOn = now, operator, reason, updatedOn } = payload

  // check if a externalId is provided
  if (payload.externalId) {
    resultWorkflowStatusId = await resultWorkflowStatusToId(payload.externalId)

    if (!resultWorkflowStatusId) {
      return Boom.badRequest('Invalid ResultWorkflowStatus ID')
    }
  }

  // update the resultWorkflowStatusId.
  if (resultWorkflowStatusId !== result.data.resultWorkflowStatusId) {
    const [lastLogId] = await knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId,
      createdBy: currentUserId,
      operator,
      reason,
      changedOn,
      createdOn: now,
    })

    if (!updatedOn || result.data.resultWorkflowChangedOn < updatedOn) {
      await knex('Result')
        .where('id', resultId)
        .update({
          resultWorkflowStatusLogId: lastLogId,
          updatedBy: currentUserId,
          updatedOn: now,
        })
    }
  }

  const response = await showResult(request)
  return response
}

async function listTreatmentStatusTypes() {
  const resultQuery = knex('ResultTreatmentStatus as rsl')

  // get total count for paging
  const getCount = resultQuery
    .clone()
    .count('rsl.id as count')
    .first()

  // get rows
  const getItems = resultQuery
    .clone()
    .orderBy('id', 'asc')
    .select('id', 'name')

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  const result = { ok: true, total, length: data.length, data }

  return result
}

async function updateTreatmentStatusPost(request) {
  const { auth, payload } = request
  const { id: currentUserId } = await getUser(auth.credentials.name)

  // get the result so we can check access and if status changed
  const result = await getResultByResultId(request)
  if (!result.ok) {
    Boom.notFound()
  }

  const {
    resultTreatmentStatusId,
    externalId,
    data,
    method,
    changedOn,
  } = payload

  return updateTreatmentStatus(
    request,
    currentUserId,
    result,
    resultTreatmentStatusId,
    externalId,
    data,
    method,
    changedOn
  )
}

async function updateTreatmentStatus(
  request,
  currentUserId,
  result,
  resultTreatmentStatusId,
  externalId,
  data,
  method,
  changedOn = new Date()
) {
  const now = new Date()

  let treatmentStatusId = null
  // check if a externalId is provided
  if (externalId) {
    treatmentStatusId = await resultTreatmentStatusToId(externalId)
    if (!treatmentStatusId) {
      return Boom.badRequest('Invalid externalId')
    }
  } else if (resultTreatmentStatusId) {
    // check if value of resultTreatmentStatusId is valid
    const treatmentStatus = await knex('ResultTreatmentStatus')
      .where('id', resultTreatmentStatusId)
      .first()
    if (!treatmentStatus) {
      return Boom.badRequest('Invalid resultTreatmentStatusId')
    }
    treatmentStatusId = resultTreatmentStatusId
  }
  let lastTreatment = await getLastTreatmentStatusByResult(result.data.id)
  if (
    treatmentStatusId !== result.data.resultTreatmentStatusId &&
    treatmentStatusId
  ) {
    const [treatmentStatusLogId] = await knex(
      'ResultTreatmentStatusLog'
    ).insert({
      resultId: result.data.id,
      resultTreatmentStatusId: treatmentStatusId,
      method,
      data,
      createdOn: now,
      changedOn,
      createdBy: currentUserId,
    })

    if (
      !lastTreatment ||
      (lastTreatment && lastTreatment.changedOn < changedOn)
    ) {
      await knex('Result')
        .where('id', result.data.id)
        .update({
          treatmentStatusLogId,
          updatedBy: currentUserId,
          updatedOn: now,
        })
      lastTreatment = await getLastTreatmentStatusByResult(result.data.id)
    }
  }

  if (data) {
    const [{ treatmentStatusLogId }] = await knex('Result')
      .where('id', result.data.id)
      .select('treatmentStatusLogId')
    await knex('ResultTreatmentStatusLog')
      .where('id', treatmentStatusLogId)
      .update({
        data,
        changedOn,
      })
  }

  const response = await showResult(request)
  response.data.treatmentStatus = lastTreatment

  if (!response.data.resultTreatmentStatusCreatedOn) {
    response.data.resultTreatmentStatusCreatedOn =
      result.data.endedOn || result.data.startedOn || now
  }

  return response
}

async function addResultNote(request) {
  const { auth, params, payload } = request
  const now = new Date()
  const { resultId } = params
  const { id: currentUserId } = await getUser(auth.credentials.name)

  // get the result so we can check access and if status changed
  const result = await getResultByResultId(request)
  if (!result.ok) {
    return Boom.notFound()
  }

  const { note, resultNoteType, changedOn = now } = payload

  const { id: resultNoteTypeId } = await knex('ResultNoteType')
    .where('externalId', resultNoteType || 'General')
    .first('id')

  if (!resultNoteTypeId) {
    return Boom.notFound()
  }

  if (note.length > 255) {
    return Boom.badRequest('The length of the comment must be less than 256')
  }

  await knex('ResultNote').insert({
    resultNoteTypeId,
    resultId,
    text: note,
    changedOn,
    createdOn: now,
    updatedBy: currentUserId,
    createdBy: currentUserId,
  })

  const resultNotes = await getResultNotesByResultId(+params.resultId)

  return {
    ok: true,
    length: resultNotes.length,
    data: resultNotes,
  }
}

async function deleteResultNote(request) {
  const { params } = request
  const { resultId, commentId } = params

  // get the result so we can check access
  const result = await getResultByResultId(request)
  if (!result.ok) {
    return Boom.notFound()
  }

  await knex('ResultNote')
    .where('id', commentId)
    .where('resultId', resultId)
    .del()

  const resultNotes = await getResultNotesByResultId(+params.resultId)

  return {
    ok: true,
    length: resultNotes.length,
    data: resultNotes,
  }
}

async function allResultNotes(request) {
  const { params } = request

  // get the result so we can check access and if status changed
  const result = await getResultByResultId(request)
  if (!result.ok) {
    return Boom.notFound()
  }

  const resultNotes = await getResultNotesByResultId(+params.resultId)

  return {
    ok: true,
    length: resultNotes.length,
    data: resultNotes,
  }
}

async function getLastTreatmentStatusByResult(resultId) {
  return knex('Result as r')
    .innerJoin(
      'ResultTreatmentStatusLog as rtl',
      'r.treatmentStatusLogId',
      'rtl.id'
    )
    .innerJoin(
      'ResultTreatmentStatus as ts',
      'rtl.resultTreatmentStatusId',
      'ts.id'
    )
    .where('rtl.resultId', resultId)
    .orderBy('rtl.changedOn', 'desc')
    .first('rtl.changedOn', 'ts.name', 'ts.externalId', 'ts.i18nKey')
}

async function updateFormData(request) {
  const {
    auth,
    params,
    payload,
    plugins: { messageContext },
  } = request
  const now = new Date()
  const { resultId } = params

  const result = await getResultByResultId(request, [
    'r.assayId',
    'r.partnerId',
    'r.formData',
  ])
  if (!result.ok) {
    return Boom.notFound()
  }
  const existingFormData = _.get(result.data, 'formData', {})
  const mergedFormData = _.merge({}, existingFormData, payload)
  if (!_.isEqual(existingFormData, mergedFormData)) {
    const resultForm = await knex('ResultForm')
      .where({
        partnerId: result.data.partnerId,
        assayId: result.data.assayId,
      })
      .first('formSchema')

    if (!resultForm || _.isEmpty(resultForm.formSchema)) {
      return Boom.badRequest(
        'This result cannot accept form data because no form schema is defined.'
      )
    }
    const formSchema = JSON.parse(resultForm.formSchema)
    const unrecognisedFields = _.difference(
      Object.keys(payload),
      Object.keys(formSchema.fields)
    )
    if (!_.isEmpty(unrecognisedFields)) {
      const undefinedFieldMessage =
        unrecognisedFields.length > 1
          ? `This result cannot accept the following fields in it's form data: [${unrecognisedFields.join()}] because they are not defined in the forms schema.`
          : `This result cannot accept the following field in it's form data: ${
              unrecognisedFields[0]
            } because it is not defined in the forms schema.`
      return Boom.badRequest(undefinedFieldMessage)
    }
    const fieldValidationErrors = []
    _.each(Object.keys(payload), formFieldKey => {
      const formFieldValue = _.get(payload, formFieldKey)
      const formFieldSchema = _.get(formSchema, ['fields', formFieldKey])
      if (!_.isNil(formFieldValue)) {
        const allowMultipleSelection = _.get(
          formFieldSchema,
          'control.allowMultipleSelection',
          true
        )
        const formFieldOptions = _.get(formFieldSchema, 'control.options')
        if (formFieldOptions) {
          const allowedValues = _.map(formFieldOptions, 'value')
          if (_.isArray(formFieldValue)) {
            if (!allowMultipleSelection && formFieldValue.length > 1) {
              fieldValidationErrors.push(
                `[${formFieldValue.join()}] is invalid for ${formFieldKey} because the field does not allow multiple values.`
              )
            }
            const illegalValuesEntered = _.difference(
              formFieldValue,
              allowedValues
            )
            if (!_.isEmpty(illegalValuesEntered)) {
              const validationMessage =
                illegalValuesEntered.length === 1
                  ? `${
                      illegalValuesEntered[0]
                    } is invalid for ${formFieldKey} because it is not present in the options configured for the field.`
                  : `[${illegalValuesEntered.join()}] are invalid for ${formFieldKey} because they are not present in the options configured for the field.`
              fieldValidationErrors.push(validationMessage)
            }
          } else if (!allowedValues.includes(formFieldValue)) {
            fieldValidationErrors.push(
              `${formFieldValue} is invalid for ${formFieldKey} because it is not present in the options configured for the field.`
            )
          }
        }
      }
    })
    if (!_.isEmpty(fieldValidationErrors)) {
      return Boom.badRequest(fieldValidationErrors.join('\n'))
    }
    messageContext.bindActionCreators({
      resultUpdated,
    })
    const { id: currentUserId } = await getUser(auth.credentials.name)
    await messageContext.transact(async knex => {
      await knex('Result')
        .where('id', resultId)
        .update({
          formData: JSON.stringify(mergedFormData),
          updatedBy: currentUserId,
          updatedOn: now,
        })
      messageContext.resultUpdated(resultId)
    })
  }
  const response = await showResult(request)
  return response
}

async function listWorkflowStatusTypes() {
  const resultQuery = knex('ResultWorkflowStatus as rs')

  // get total count for paging
  const getCount = resultQuery
    .clone()
    .count('rs.id as count')
    .first()

  // get rows
  const getItems = resultQuery
    .clone()
    .orderBy('id', 'asc')
    .select('id', 'name')

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  const result = { ok: true, total, length: data.length, data }

  return result
}

async function listWorkflowStatusLog(request) {
  const result = await getWorkflowStatusLogByResultId(request)
  return result.ok ? result : Boom.notFound()
}

async function getWorkflowStatusLogByResultId(request) {
  const { query, params } = request

  const selectFields = [
    'log.id',
    'log.operator',
    'log.changedOn',
    'log.createdOn',
    'log.createdBy',
    'rs.name as statusName',
    'rs.i18nKey',
    'rs.externalId',
  ]
  const sortableFields = ['operator', 'changedOn', 'statusName']

  // now we know if the sort that was passed is valid:
  if (query.sortCol && !sortableFields.includes(query.sortCol)) {
    return Boom.badRequest()
  }

  const resultQuery = knex('ResultWorkflowLog as log')
    .innerJoin(
      'ResultWorkflowStatus as rs',
      'log.resultWorkflowStatusId',
      'rs.id'
    )
    .where('log.resultId', +params.resultId)

  // get total count for paging
  const getCount = resultQuery
    .clone()
    .count('log.id as count')
    .first()

  // get rows
  const getItems = resultQuery
    .clone()
    .modify(sortPageParams, query, 'changedOn')
    .select(selectFields)

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  const result = { ok: true, total, length: data.length, data }

  return result
}

function createUniqueIdForResult(
  instrumentSerial,
  testStartedOn,
  testEndedOn,
  sampleId
) {
  if (!instrumentSerial || !testStartedOn || !testEndedOn || !sampleId) {
    return null
  }
  const hashedSampleId = oneDirectionalMd5Hash(sampleId)
  const uniqueId = `${instrumentSerial}_${dateFormat(
    testStartedOn,
    'mmss'
  ).substr(1)}${dateFormat(testEndedOn, 'mmss').substr(
    1
  )}_${hashedSampleId.substr(0, 8)}`
  return uniqueId
}

async function confirmedTreatmentTracking(request) {
  const { auth, payload } = request

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const { siteId, assayTypeId, resultCategoryId } = payload

  const now = new Date()
  const lastEndedOn = endOfMonth(subMonths(now, 1))

  // normalize and format 'endedOn'
  let { endedOn } = payload
  if (!endedOn) {
    endedOn = subMonths(now, 1)
  }
  endedOn = endOfMonth(endedOn)
  if (endedOn > lastEndedOn) {
    return Boom.expectationFailed(
      '"endedOn" can not be greater than previous month'
    )
  }
  const startedOn = startOfMonth(subMonths(endedOn, 5)) // 6 months period

  const data = await knex('Result as r')
    // consider 100% as all results where requiresTreatment = 1 in the resultCategoryAssay table
    .innerJoin('ResultCategoryAssay as rca', function() {
      this.on('r.assayId', 'rca.assayId').andOn(
        'r.resultCategory1',
        'rca.resultCategoryId'
      )
    })
    .where('rca.requiresTreatment', 1)
    .leftOuterJoin(
      'ResultTreatmentStatusLog as rtsl',
      'r.treatmentStatusLogId',
      'rtsl.id'
    )
    .leftOuterJoin(
      'ResultTreatmentStatus as rts',
      'rtsl.resultTreatmentStatusId',
      'rts.id'
    )
    // filter by access level of current user
    .leftOuterJoin('Site as s', 'r.siteId', 's.id')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .leftOuterJoin('Geography as g', 'r.geographyId', 'g.id')
    .innerJoin('Sample as sp', 'r.sampleId', 'sp.id')
    .modify(addConstraints, dataConstraints, {
      site: 's',
      geography: 'g',
      device: 'd',
      sample: 'sp',
    })
    // if 'siteId' specified - filter by siteId
    .where(function() {
      if (siteId) {
        this.where('s.id', siteId)
      }
    })
    .modify(queryBuilder => {
      if (assayTypeId && resultCategoryId) {
        queryBuilder
          .innerJoin('Assay as a', 'a.id', 'r.assayId')
          .where('a.assayTypeId', assayTypeId)
          .where('r.resultCategory1', resultCategoryId)
      }
    })
    // filter by date range, inclusive
    .where('r.endedOn', '>=', startedOn)
    .where('r.endedOn', '<=', endedOn)
    .select(
      knex.raw('sum(ifnull(rts.externalId, "") != "NotPossible") as total'),
      knex.raw('sum(rts.externalId = "OnTreatment") as cntConfirmed'),
      knex.raw(`date_format(r.endedOn, '%Y-%m') AS monthTested`) // group by r.endedOn as 'yyyy-MM'
    )
    .groupBy('monthTested')
    .map(d => {
      // add percentages
      const getPercentage = (total, value) => {
        let pc = 0
        if (total) {
          pc = (value * 100) / total
          // max 1 decimal point
          pc = Math.round(10 * pc) / 10
        }
        return pc
      }
      d.pcConfirmed = getPercentage(d.total, d.cntConfirmed)
      return d
    })

  let dt = endedOn
  while (dt >= startedOn) {
    const monthTested = dateFormat(dt, 'yyyy-MM')
    if (!data.find(x => x.monthTested === monthTested)) {
      data.push({
        monthTested,
        pcConfirmed: 0,
        cntConfirmed: 0,
        total: 0,
      })
    }
    dt = endOfMonth(subMonths(dt, 1))
  }

  return {
    siteId,
    endedOn: dateFormat(endedOn, 'yyyy-MM-dd'),
    lastOn: dateFormat(lastEndedOn, 'yyyy-MM-dd'),
    data: _.sortBy(data, [x => x.monthTested]),
  }
}

async function listFollowUps(request) {
  const { auth, query } = request
  const dataConstraints = await getConstraints(auth.credentials)

  const queryBuilder = knex('FollowUp as fu')
    .join('FollowUpType as fut', 'fu.followUpTypeId', 'fut.id')
    .join('FollowUpAssay as fua', 'fu.id', 'fua.followUpId')
    .leftJoin('Assay as a', 'fua.assayId', 'a.id')
    .leftJoin('ResultCategory as rc1', 'fua.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'fua.resultCategory2', 'rc2.id')
    .orderBy('fu.id', 'a.id', 'rc1.id', 'rc2.id')
    .where('fua.partnerId', dataConstraints.partner.id)
    .select(
      'fu.id',
      'fu.name',
      'fu.externalId',
      'fu.i18nKey',
      'fut.id as followUpTypeId',
      'fut.name as followUpTypeName',
      'fut.externalId as followUpTypeExternalId',
      'fut.i18nKey as followUpTypeI18nKey',
      'a.id as assayId',
      'a.name as assayName',
      'a.externalId as assayExternalId',
      'a.i18nKey as assayI18nKey',
      'rc1.id as resultCategory1Id',
      'rc1.name as resultCategory1Name',
      'rc1.externalId as resultCategory1ExternalId',
      'rc1.i18nKey as resultCategory1I18nKey',
      'rc2.id as resultCategory2Id',
      'rc2.name as resultCategory2Name',
      'rc2.externalId as resultCategory2ExternalId',
      'rc2.i18nKey as resultCategory2I18nKey'
    )

  if (query.typeId) {
    queryBuilder.where('fu.followUpTypeId', query.typeId)
  }

  if (query.assayId) {
    queryBuilder.where(function() {
      this.where('fua.assayId', query.assayId).orWhereNull('fua.assayId')
    })
  }

  if (query.resultCategory1) {
    queryBuilder.where(function() {
      this.where('fua.resultCategory1', query.resultCategory1)
    })
  }

  if (query.resultCategory2) {
    queryBuilder.where(function() {
      this.where('fua.resultCategory2', query.resultCategory2)
    })
  }

  const data = await queryBuilder

  // convert data to nested JSON
  const followUps = _.uniqBy(data, 'id').map(f =>
    Object.assign(
      _.pick(f, ['id', 'name', 'externalId', 'i18nKey']),
      {
        type: {
          id: f.followUpTypeId,
          name: f.followUpTypeName,
          externalId: f.followUpTypeExternalId,
          i18nKey: f.followUpTypeI18nKey,
        },
      },
      {
        assays: _.uniqBy(
          data.filter(d => d.id === f.id && d.assayId),
          'assayId'
        ).map(a =>
          Object.assign(
            _.mapKeys(
              _.pick(a, [
                'assayId',
                'assayName',
                'assayExternalId',
                'assayI18nKey',
              ]),

              (v, k) => _.lowerFirst(k.replace('assay', ''))
            ),
            {
              resultCategories: _.uniqBy(
                data.filter(
                  d =>
                    d.id === f.id &&
                    d.assayId === a.assayId &&
                    d.resultCategory1Id
                ),
                r => `${r.resultCategory1Id}-${r.resultCategory2Id}`
              ).map(r =>
                Object.assign(
                  {
                    category1: _.mapKeys(
                      _.pick(r, [
                        'resultCategory1Id',
                        'resultCategory1Name',
                        'resultCategory1ExternalId',
                        'resultCategory1I18nKey',
                      ]),
                      (v, k) => _.lowerFirst(k.replace('resultCategory1', ''))
                    ),
                  },
                  {
                    category2: _.mapKeys(
                      _.pick(r, [
                        'resultCategory2Id',
                        'resultCategory2Name',
                        'resultCategory2ExternalId',
                        'resultCategory2I18nKey',
                      ]),
                      (v, k) => _.lowerFirst(k.replace('resultCategory2', ''))
                    ),
                  }
                )
              ),
            }
          )
        ),
      }
    )
  )

  const result = {
    ok: true,
    total: followUps.length,
    length: followUps.length,
    data: followUps,
  }

  return result
}

async function setResultFollowUp(request) {
  const { auth, params, payload } = request
  const now = new Date()
  const { resultId } = params
  const { id: currentUserId } = await getUser(auth.credentials.name)

  // get the result so we can check access and if status changed
  const result = await getResultByResultId(request)
  if (!result.ok) {
    return Boom.notFound()
  }

  const { externalId, followUpId, followUpExternalId, date } = payload

  const followUp = await knex('FollowUp as fu')
    .join('FollowUpType as fut', 'fu.followUpTypeId', 'fut.id')
    .where('fu.externalId', followUpExternalId || -1)
    .orWhere('fu.id', followUpId || -1)
    .first('fu.id', 'fu.externalId', 'fu.followUpTypeId')

  if (!followUp) {
    return Boom.badRequest('Invalid follow up ID')
  }

  if (externalId) {
    const resultFollowUp = await knex('ResultFollowUp')
      .where('resultId', resultId)
      .where('externalId', externalId)
      .first('id')

    if (resultFollowUp) {
      return Boom.badRequest(
        'This result already has a follow up with this external ID.'
      )
    }
  }

  await knex('ResultFollowUp').insert({
    resultId,
    externalId,
    followUpId: followUp.id,
    date,
    createdBy: currentUserId,
    createdOn: now,
    updatedBy: currentUserId,
    updatedOn: now,
  })

  return updateTreatmentStatusBasedOnFollowUps(
    request,
    currentUserId,
    result,
    date,
    'FollowUp',
    'Client API'
  )
}

async function updateResultFollowUp(request) {
  const now = new Date()
  const { auth, params, payload } = request
  const { resultId } = params
  const { date, id, externalId, followUpId, followUpExternalId } = payload
  const { id: currentUserId } = await getUser(auth.credentials.name)

  // get the result so we can check access and if status changed
  const result = await getResultByResultId(request)
  if (!result.ok) {
    return Boom.notFound()
  }

  const followUp = await knex('FollowUp as fu')
    .join('FollowUpType as fut', 'fu.followUpTypeId', 'fut.id')
    .where('fu.externalId', followUpExternalId || -1)
    .orWhere('fu.id', followUpId || -1)
    .first('fu.id', 'fu.externalId', 'fu.followUpTypeId')

  const affectedRows = await knex('ResultFollowUp')
    .where('id', id || '-1')
    .orWhere(function() {
      this.where('resultId', resultId).where('externalId', externalId || '-1')
    })
    .update({
      date,
      updatedOn: now,
      updatedBy: currentUserId,
      followUpId: knex.raw(
        'ifnull(?, followUpId)',
        followUp ? followUp.id : null
      ),
    })

  if (affectedRows === 0) {
    return Boom.notFound('Could not find follow up')
  }

  return updateTreatmentStatusBasedOnFollowUps(
    request,
    currentUserId,
    result,
    date,
    'FollowUp',
    'Client API'
  )
}

async function deleteResultFollowUp(request) {
  const { auth, params, payload } = request
  const { resultId } = params
  const { date, id, externalId } = payload
  const { id: currentUserId } = await getUser(auth.credentials.name)

  // get the result so we can check access
  const result = await getResultByResultId(request)
  if (!result.ok) {
    return Boom.notFound()
  }

  await knex('ResultFollowUp')
    .where('id', id || '-1')
    .orWhere(function() {
      this.where('resultId', resultId).where('externalId', externalId || '-1')
    })
    .del()

  return updateTreatmentStatusBasedOnFollowUps(
    request,
    currentUserId,
    result,
    date,
    'FollowUp',
    'Client API'
  )
}

async function updateTreatmentStatusBasedOnFollowUps(
  request,
  currentUserId,
  result,
  date,
  data,
  method
) {
  const followUps = await knex('ResultFollowUp as r')
    .join('FollowUp as f', 'r.followUpId', 'f.id')
    .join('FollowUpType as t', 'f.followUpTypeId', 't.id')
    .where('resultId', result.data.id)
    .select('f.externalId', 't.externalId as followUpTypeExternalId')
  let treatmentStatusExternalId = 'AwaitingTreatment'
  if (_.find(followUps, f => f.followUpTypeExternalId === 'treatment')) {
    treatmentStatusExternalId = 'OnTreatment'
  } else if (
    _.find(
      followUps,
      f => f.followUpTypeExternalId === 'outcome' && f.externalId !== 'cured'
    )
  ) {
    treatmentStatusExternalId = 'NotPossible'
  }

  return updateTreatmentStatus(
    request,
    currentUserId,
    result,
    null,
    treatmentStatusExternalId,
    data,
    method
  )
}

async function showResultFollowUps(resultId, dataConstraints) {
  const followUps = await knex('ResultFollowUp as rfu')
    .join('Result as r', 'r.id', 'rfu.resultId')
    .join('Sample as sp', 'r.sampleId', 'sp.id')
    .join('Device as d', 'r.deviceId', 'd.id')
    .join('FollowUp as fu', 'rfu.followUpId', 'fu.id')
    .join('FollowUpType as fut', 'fu.followUpTypeId', 'fut.id')
    .where('rfu.resultId', resultId)
    .orderBy('rfu.date', 'rfu.updatedOn')
    .modify(addConstraints, dataConstraints, { device: 'd', sample: 'sp' })
    .select(
      'rfu.id',
      'rfu.externalId',
      'rfu.date',
      'rfu.createdOn',
      'rfu.updatedOn',
      'fu.name as followUpName',
      'fu.externalId as followUpExternalId',
      'fu.i18nKey as followUpi18nKey',
      'fut.name as followUpTypeName',
      'fut.externalId as followUpTypeExternalId',
      'fut.i18nKey as followUpTypei18nKey'
    )
  return { data: followUps }
}

module.exports = {
  listResults,
  exportResults,
  downloadResultsList,
  showResult,
  listResultTypes,
  updateWorkflowStatus,
  updateTreatmentStatusPost,
  listTreatmentStatusTypes,
  updateFormData,
  listWorkflowStatusTypes,
  listWorkflowStatusLog,
  showDeviceLogs,
  showFileReferences,
  downloadFile,
  downloadFirstImage,
  createUniqueIdForResult,
  confirmedTreatmentTracking,
  listFollowUps,
  setResultFollowUp,
  updateResultFollowUp,
  deleteResultFollowUp,
  addResultNote,
  deleteResultNote,
  allResultNotes,
  showResultFollowUps,
}
