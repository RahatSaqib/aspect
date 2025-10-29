const Boom = require('@hapi/boom')
const _ = require('lodash')
const dateFormat = require('date-fns/format')
const { format, addMonths, startOfDay, endOfDay } = require('date-fns')
const Promise = require('bluebird')
const { getAllMonthsInRange, getMonthYearField, returnIso8601StringWithoutTimeZoneOffset } = require('../shared/date')
const {
  getReportCommonFieldsTZ,
  LIST_FIELDS_UTC,
  LIST_FIELDS_UTC2,
  SORT_FIELDS,
  RESULT_STRING_TEMPLATE_FIELDS,
} = require('./query')
const { knex, filterParams, filterDateRangeParams, sortPageParams } = require('../db')
const {
  addConstraints,
  canViewResults,
  getConstraints,
  addPartnerQueryConstraints,
  getUserFromCredentials,
} = require('../auth/constraints')
const { getUser, getUserByUserId, getPersonByPersonId } = require('../auth/service')
const {
  allAssayToId,
  allResultCategoryToId,
  resultTreatmentStatusToId,
  resultStatusToId,
  resultSourceToId,
  resultTypeToId,
} = require('../shared/dictionary')
const { oneDirectionalMd5Hash } = require('../shared/encryption')
const { getPathFromFileReferenceId } = require('../file/service')
const { getSiteByPartnerCountry, getSite } = require('../site/service')
const { updateTagsById } = require('../tag/service')
const { getCaseId } = require('../case/service')
const { applyExtraColumns, sanitizeExtraColumns } = require('./extraColumns')
const { getAllAssaySchemas, getAssayResultCategories } = require('../assay/service')

const confirmedTreatmentTracking = require('./treatment')
const logger = require('../shared/logger')
const { createFormObject } = require('../forms/service')
const { GRAPH_FLAGS } = require('../shared/constants')
const {
  getResultByResultId,
  getQueryForResultsListAndExport,
  getQueryForResultsListAndExport2,
  showFileReferencesById,
  getFactResultCountBase,
  FACT_FIELD_SCOPE,
} = require('./common/db')
const { getDeviceByDeviceId } = require('../device/service')
const { getGroupBy, clinicalIndicatorAggregations } = require('./common/logic')
const {
  processGroupedQuery,
  getClinicalIndicatorQueryForFactTable,
  getClinicalIndicatorQueryForResultsTable,
} = require('./common/db')
const { replaceOffset } = require('../shared/date')

function buildQueryForResultsListAndExport(query, dataConstraints) {
  const orConstraint = dataConstraints.$or

  const isSiteLevelAccess = _.some(orConstraint, obj => _.has(obj, 'site'))

  // check if user has site-level access and modify the constraint
  if (isSiteLevelAccess) {
    const filteredOrConstraint = _.map(orConstraint, obj => {
      if (query.reportableSiteId) {
        return _.omit(obj, 'site')
      }
      if (obj.result && obj.result.reportableSiteId) {
        return {
          ...obj,
          result: _.omit(obj.result, 'reportableSiteId'),
        }
      }
      return obj
    })
    dataConstraints.$or = filteredOrConstraint
  }

  return getQueryForResultsListAndExport(query, dataConstraints)
}

async function getListResults(query, auth, fields = LIST_FIELDS_UTC) {
  // for now call existing function, but later add here a query with different aggregations
  const selectFields = _.clone(fields)
  const sortableFields = _.clone(SORT_FIELDS)

  /**
   * Make sure minDate and maxDate are Date object - needed to let knex correctly
   * format value for MySql format - i.e. UTC as 'yyyy-MM-dd hh:mm:ss' (without timezone offset)
   */
  query.minDate = query.minDate instanceof Date ? query.minDate : new Date(query.minDate)
  query.maxDate = query.maxDate instanceof Date ? query.maxDate : new Date(query.maxDate)

  const assayColumns = []
  /**
   * assayColumns items shape:
   * {
        db: 'resultText', // Query column to process
        type: 'string', // The type of the value shown in the UI. Depending what this value is, the formatting will be different. Possible values: string, number.
        title: 'Collection of Results', // The default title of the extra column
        i18nKey: 'collectionOfResults', // The i18nKey of the extra column title
        fieldName: 'collectionOfResults', // The name of the result's field to set
        postProcess: resultText => doSomething(resultText) // A function that will receive the raw db value and return the new processed value
        formatter: 'joinArrayWithCommas' // The name of the custom formatter function defined in the UI
      }
   */

  if (query.assayId && !_.isArray(query.assayId)) {
    const { assayId } = query
    const assay = await knex('Assay as a').where('a.id', assayId).first()

    if (assay.resultCategory1Label) {
      if (!sortableFields.includes('resultCategory1Name')) {
        selectFields.resultCategory1Name = 'rc1.name'
        sortableFields.push('resultCategory1Name')
      }
      assayColumns.push({
        db: 'resultCategory1Name',
        fieldName: 'resultCategory1Name',
        type: 'string',
        title: assay.resultCategory1Label,
        i18nKey: assay.resultCategory1i18nKey,
      })
    }

    if (assay.resultCategory2Label) {
      if (!sortableFields.includes('resultCategory2Name')) {
        selectFields.resultCategory2Name = 'rc2.name'
        sortableFields.push('resultCategory2Name')
      }
      assayColumns.push({
        db: 'resultCategory2Name',
        fieldName: 'resultCategory2Name',
        type: 'string',
        title: assay.resultCategory2Label,
        i18nKey: assay.resultCategory2i18nKey,
      })
    }

    if (assay.resultDataSchema) {
      const resultDataSchema = JSON.parse(assay.resultDataSchema)
      _.each(resultDataSchema, (value, key) => {
        if (value.list) {
          const alias = key.replace('.', '_')
          if (!sortableFields.includes(alias)) {
            selectFields[alias] = knex.raw('JSON_EXTRACT(resultData, ?)', [`$.${key}`])
            sortableFields.push(alias)
          }
          assayColumns.push({
            db: alias,
            type: value.type,
            title: value.title,
            i18nKey: value.i18nKey,
            formatter: value.formatter,
            postProcess: resultData => JSON.parse(resultData),
          })
        }
      })
    }
  }

  // now we know if the sort that was passed is valid:
  if (query.sortCol && !sortableFields.includes(query.sortCol)) {
    return Boom.badRequest()
  }

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const resultQuery = buildQueryForResultsListAndExport(query, dataConstraints)

  // get total count for paging
  const getCount = resultQuery.clone().countDistinct('r.id as count').first()

  const resultFields = {
    resultCategory2Name: 'rc2.name',
    resultCategory2I18nKey: 'rc2.i18nKey',
    resultCategory2Titlei18nKey: 'a.resultCategory2i18nKey',
    resultCategory1Titlei18nKey: 'a.resultCategory1i18nKey',
    resultCategory1Title: 'a.resultCategory1label',
    resultCategory2Title: 'a.resultCategory2label',
    deviceStateName: 'stdpn.name',
  }

  // get rows
  const getItems = resultQuery
    .clone()
    .groupBy('r.id')
    .modify(sortPageParams, query, 'endedOn')
    .select(selectFields)
    .modify(function (qb) {
      qb.select(resultFields)
    })
  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  // Create extra columns based on the assay configuration
  applyExtraColumns(data, assayColumns)
  // Remove extraColumns fields that shouldn't be retrieved to UI
  sanitizeExtraColumns(assayColumns)

  const result = {
    ok: true,
    total,
    length: data.length,
    data,
    extraColumns: assayColumns,
  }
  return result
}

async function listResults(request) {
  const { query, auth } = request
  const result = await getListResults(query, auth)
  return result
}

function buildQueryForResultsListAndExport2(query, dataConstraints) {
  if (dataConstraints.$or) {
    const orConstraint = dataConstraints.$or

    const isSiteLevelAccess = _.some(orConstraint, obj => _.has(obj, 'site'))

    if (isSiteLevelAccess) {
      const filteredOrConstraint = _.map(orConstraint, obj => {
        if (query.reportableSiteId) {
          return _.omit(obj, 'site')
        }
        if (obj.result && obj.result.reportableSiteId) {
          return {
            ...obj,
            result: _.omit(obj.result, 'reportableSiteId'),
          }
        }
        return obj
      })
      dataConstraints.$or = filteredOrConstraint
    }
  }

  return getQueryForResultsListAndExport2(query, dataConstraints)
}

async function getListResults2(query, auth, fields = LIST_FIELDS_UTC2) {
  const selectFields = _.clone(fields)
  const sortableFields = _.clone(SORT_FIELDS)

  query.minDate = query.minDate instanceof Date ? query.minDate : new Date(query.minDate)
  query.maxDate = query.maxDate instanceof Date ? query.maxDate : new Date(query.maxDate)

  const assayColumns = []

  if (query.assayId && !_.isArray(query.assayId)) {
    const { assayId } = query
    const assay = await knex('Assay as a').where('a.id', assayId).first()

    if (assay.resultCategory1Label) {
      if (!sortableFields.includes('resultCategory1Name')) {
        selectFields.resultCategory1Name = 'rc1.name'
        sortableFields.push('resultCategory1Name')
      }
      assayColumns.push({
        db: 'resultCategory1Name',
        fieldName: 'resultCategory1Name',
        type: 'string',
        title: assay.resultCategory1Label,
        i18nKey: assay.resultCategory1i18nKey,
      })
    }

    if (assay.resultCategory2Label) {
      if (!sortableFields.includes('resultCategory2Name')) {
        selectFields.resultCategory2Name = 'resultCategory2_name'
        sortableFields.push('resultCategory2Name')
      }
      assayColumns.push({
        db: 'resultCategory2Name',
        fieldName: 'resultCategory2Name',
        type: 'string',
        title: assay.resultCategory2Label,
        i18nKey: assay.resultCategory2i18nKey,
      })
    }

    if (assay.resultDataSchema) {
      const resultDataSchema = JSON.parse(assay.resultDataSchema)
      _.each(resultDataSchema, (value, key) => {
        if (value.list) {
          const alias = key.replace('.', '_')
          if (!sortableFields.includes(alias)) {
            selectFields[alias] = knex.raw('JSON_EXTRACT(r.resultText, ?)', [`$.${key}`])

            sortableFields.push(alias)
          }
          assayColumns.push({
            db: alias,
            type: value.type,
            title: value.title,
            i18nKey: value.i18nKey,
            formatter: value.formatter,
            // postProcess: resultData => JSON.parse(resultData),
          })
        }
      })
    }
  }

  if (query.sortCol && !sortableFields.includes(query.sortCol)) {
    return Boom.badRequest()
  }

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const resultQuery = buildQueryForResultsListAndExport2(query, dataConstraints)
  const getCount = resultQuery.clone().countDistinct('r.id as count').first()

  // const getCount = resultQuery.clone().countDistinct('r.id as count').first()

  const resultFields = {
    resultCategory2Name: 'r.resultCategory2_name',
    resultCategory2I18nKey: 'r.resultCategory2_i18nKey',
    resultCategory2Titlei18nKey: 'r.assay_resultCategory2Label_i18nKey',
    resultCategory1Titlei18nKey: 'r.assay_resultCategory1Label_i18nKey',
    resultCategory1Title: 'r.assay_resultCategory1Label',
    resultCategory2Title: 'r.assay_resultCategory2Label',
    deviceStateName: 'stdpn.name',
  }

  const getItems = resultQuery
    .clone()

    .modify(sortPageParams, query, 'endedOn')
    .select(selectFields)
    .modify(function (qb) {
      qb.select(resultFields)
    })

  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  applyExtraColumns(data, assayColumns)
  sanitizeExtraColumns(assayColumns)

  const result = {
    ok: true,
    total,
    length: data.length,
    data,
    extraColumns: assayColumns,
  }
  return result
}

async function listResults2(request) {
  const { query, auth } = request
  const result = await getListResults2(query, auth)
  return result
}

async function getDownloadResultsList(query, auth) {
  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const resultQuery = knex('Result as r')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .innerJoin('AssayType as at', 'a.assayTypeId', 'at.id')
    .innerJoin('Disease as dis', 'at.diseaseId', 'dis.id')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .leftJoin('Site as si', 'r.siteId', 'si.id')
    .leftJoin('Geography as g', 'si.geographyId', 'g.id')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .leftJoin('Sample as sp', 'r.sampleId', 'sp.id')
    .leftJoin('SampleType as stp', 'sp.sampleTypeId', 'stp.id')
    .leftJoin('Site as so', 'sp.originSiteId', 'so.id')
    .leftJoin('ResultTreatmentStatusLog as rtsl', 'r.treatmentStatusLogId', 'rtsl.id')
    .leftJoin('ResultTreatmentStatus as rts', 'rtsl.resultTreatmentStatusId', 'rts.id')
    .leftJoin('Site as sirep', 'r.reportableSiteId', 'sirep.id')
    .leftJoin('ResultStatusLog as rslog', 'r.resultStatusLogId', 'rslog.id')
    .leftJoin('Person as ptr', 'rslog.createdBy', 'ptr.userId')
    .leftJoin('ResultCategoryAssay as rca', function () {
      this.on('r.assayId', 'rca.assayId').andOn('r.resultCategory1', 'rca.resultCategoryId')
    })
    .leftJoin('ResultCategoryAssay as rca2', function () {
      this.on('r.assayId', 'rca2.assayId').andOn('r.resultCategory2', 'rca2.resultCategoryId')
    })
    // only results which are reportable for either ResultCategory
    .where(builder => builder.where('rca.reportable', 1).orWhere('rca2.reportable', 1))
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
              knex.raw('LOWER(JSON_EXTRACT(patientData,"$.firstName")) like LOWER(JSON_QUOTE(?))', [
                `%${params.patientSample}%'`,
              ])
            )
            .orWhere(
              knex.raw('LOWER(JSON_EXTRACT(patientData,"$.lastName")) like LOWER(JSON_QUOTE(?))', [
                `%${params.patientSample}%`,
              ])
            )
            .orWhere(
              knex.raw('LOWER(JSON_EXTRACT(patientData,"$.name")) like LOWER(JSON_QUOTE(?))', [
                `%${params.patientSample}%`,
              ])
            )
            .orWhere(
              knex.raw('LOWER(JSON_EXTRACT(patientData,"$.id")) like LOWER(JSON_QUOTE(?))', [
                `%${params.patientSample}%`,
              ])
            )
        )
      }
      if (params.assayExternalIds) {
        queryBuilder.whereIn('a.externalId', params.assayExternalIds.split(','))
      }
      if (params.diseaseExternalIds) queryBuilder.whereIn('dis.externalId', params.diseaseExternalIds.split(','))

      if (params.resultCategories) {
        queryBuilder.where(builder =>
          builder
            .whereIn('rc1.externalId', params.resultCategories.split(','))
            .orWhereIn('rc2.externalId', params.resultCategories.split(','))
        )
      }
      if (params.isTransferred) {
        // return only results transferred "to me" (to r.reportableSiteId)
        queryBuilder.whereRaw('sp.originSiteId != r.reportableSiteId')
      }
      if (params.treatmentStatus) queryBuilder.where('rts.externalId', params.treatmentStatus)
      if (params.deviceType) queryBuilder.where('dt.externalId', params.deviceType)
    }, query)
    .modify(addConstraints, dataConstraints, {
      assay: 'a',
      assayType: 'at',
      device: 'd',
      deviceType: 'dt',
      sample: 'sp',
      geography: 'g',
      result: 'r',
      country: 'c',
    })

  // get total count for paging
  const getCount = resultQuery.clone().countDistinct('r.id as count').first()

  // get rows
  const getItems = resultQuery
    .clone()
    .groupBy('r.id')
    .modify(sortPageParams, query, 'r.updatedOn')
    .select(
      'r.id',
      'r.externalId',
      'r.firstViewedOn',
      'r.endedOn',
      'r.updatedOn',
      'a.externalId as assayExternalId',
      'si.name as siteName',
      'd.name as deviceName',
      'rc1.externalId as resultCategory1ExternalId',
      'rc2.externalId as resultCategory2ExternalId',
      'r.patientData',
      'r.resultData',
      'dis.externalid as diseaseExternalId',
      'dis.name as diseaseName',
      'sp.externalId as sampleId',
      'so.id as sampleOriginSiteId',
      'so.externalId as sampleOriginSiteExternalId',
      'so.name as sampleOriginSiteName',
      'rtsl.changedOn as resultTreatmentStatusChangedOn',
      'rts.name as resultTreatmentStatusName',
      'rts.externalId as resultTreatmentStatusExternalId',
      'rts.i18nKey as resultTreatmentStatusi18nKey',
      'r.reportableSiteId',
      'sirep.name as reportableSiteName',
      'rslog.createdOn as transferredOn',
      'ptr.name as transferredBy'
    )

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  // get follow ups for all results in the response for performance (filter later)
  const followUps = await knex('ResultFollowUp as rfu')
    .join('FollowUp as fu', 'rfu.followUpId', 'fu.id')
    .join('FollowUpType as fut', 'fu.followUpTypeId', 'fut.id')
    .whereIn(
      'rfu.resultId',
      data.map(r => r.id)
    )
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
    endedOn: returnIso8601StringWithoutTimeZoneOffset(d.endedOn),
    updatedOn: d.updatedOn,
    assayExternalId: d.assayExternalId,
    siteName: d.siteName,
    sampleOriginSiteId: d.sampleOriginSiteId,
    firstViewedOn: d.firstViewedOn ? d.firstViewedOn : null,
    deviceName: d.deviceName,
    resultCategory1ExternalId: d.resultCategory1ExternalId,
    resultCategory2ExternalId: d.resultCategory2ExternalId,
    patientData: d.patientData ? JSON.parse(d.patientData) : null,
    resultData: d.resultData
      ? _.pick(JSON.parse(d.resultData), ['resultText', 'copies', 'log', 'detectedResistance'])
      : null,
    sample: {
      id: d.sampleId,
      originSite: d.sampleOriginSiteId
        ? {
            externalId: d.sampleOriginSiteExternalId,
            name: d.sampleOriginSiteName,
          }
        : null,
    },
    treatmentStatus: {
      changedOn: d.resultTreatmentStatusChangedOn,
      name: d.resultTreatmentStatusName,
      externalId: d.resultTreatmentStatusExternalId,
      i18nKey: d.resultTreatmentStatusi18nKey,
    },
    followUps: _.sortBy(
      _.filter(followUps, { resultId: d.id }).map(f => _.omit(f, 'resultId')),
      ['date', 'updatedOn']
    ),
    comments: [],
    // result transferred
    reportableSiteName: d.reportableSiteName,
    transferredOn: d.transferredOn,
    transferredBy: d.transferredBy,
    reportableSiteId: d.reportableSiteId,
    diseaseExternalId: d.diseaseExternalId,
    diseaseName: d.diseaseName,
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
  const results = await getDownloadResultsList(query, auth, true)
  const myProm = async () => {
    const idsToBeRegistered = _.uniq(_.map(results.data, elem => elem.id))
    if (idsToBeRegistered && idsToBeRegistered.length > 0) await addResultDownloadLog(idsToBeRegistered, user.id)
  }
  myProm().catch(err => {
    logger.error(err)
  })
  return results
}

async function addResultDownloadLog(idsToBeRegistered, userId) {
  const now = new Date()

  return Promise.each(idsToBeRegistered, async resultId =>
    knex('ResultDownloadLog').insert({
      resultId,
      createdOn: now,
      createdBy: userId,
    })
  )
}

async function showResult(request) {
  const {
    params: { resultId },
    auth,
  } = request
  const result = await getResultByResultId(auth, resultId)
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

  return showFileReferencesById(auth, resultId)
}

function downloadFile(request, reply) {
  return downloadFileAsync(request)
    .then(path => {
      reply.file(path)
    })
    .catch(err => {
      logger.error(err)
      throw err
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
      logger.error(err)
      throw err
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
    .modify(addConstraints, dataConstraints, { device: 'd', result: 'r' })
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

async function getResultForStringTemplateProcessing(resultId, fields = RESULT_STRING_TEMPLATE_FIELDS, knex = knex) {
  return knex('Result as r')
    .join('Assay as a', 'r.assayId', 'a.id')
    .join('AssayType as at', 'a.assayTypeId', 'at.id')
    .join('Site as s', 'r.siteId', 's.id')
    .join('Device as d', 'r.deviceId', 'd.id')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .join('Sample as sample', 'r.sampleId', 'sample.id')
    .join('Partner as p', 'r.partnerId', 'p.id')
    .leftJoin('PartnerDisease as pd', function () {
      this.on('at.diseaseId', 'pd.diseaseId').andOn('r.partnerId', 'pd.partnerId')
    })
    .leftJoin('PartnerAssay as pa', qb => {
      qb.on('r.assayId', 'pa.assayId').andOn('r.partnerId', 'pa.partnerId')
    })
    .leftJoin('PatientCase as c', 'r.patientCaseId', 'c.id')
    .leftJoin('Patient as patient', 'sample.patientId', 'patient.id')
    .leftJoin('Site as sos', 'sample.originSiteId', 'sos.id')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategoryAssay as rca1', function () {
      this.on('r.resultCategory1', 'rca1.resultCategoryId').andOn('r.assayId', 'rca1.assayId')
    })
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .leftJoin('ResultCategoryAssay as rca2', function () {
      this.on('r.resultCategory2', 'rca2.resultCategoryId').andOn('r.assayId', 'rca2.assayId')
    })
    .where({ 'r.id': resultId })
    .first(...fields)
}

async function listResultTypes(request) {
  const { query } = request

  const resultTypeQuery = knex('ResultType as rt').modify(filterParams, query, {
    name: 'rt.name',
  })

  // get total count for paging
  const getCount = resultTypeQuery.clone().count('rt.id as count').first()

  // get rows
  const getItems = resultTypeQuery.clone().modify(sortPageParams, query, 'name').select('id', 'name')

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  const result = { ok: true, total, length: data.length, data }

  return result
}

async function listTreatmentStatusTypes() {
  const resultQuery = knex('ResultTreatmentStatus as rsl')

  // get total count for paging
  const getCount = resultQuery.clone().count('rsl.id as count').first()

  // get rows
  const getItems = resultQuery.clone().orderBy('id', 'asc').select('id', 'i18nKey', 'name', 'externalId')

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  const result = { ok: true, total, length: data.length, data }

  return result
}

async function updateTreatmentStatusPost(request) {
  const {
    auth,
    payload,
    params: { resultId },
  } = request
  const { id: currentUserId } = await getUser(auth.credentials.name)

  // get the result so we can check access and if status changed
  const result = await getResultByResultId(auth, resultId)
  if (!result.ok) {
    Boom.notFound()
  }

  const { resultTreatmentStatusId, externalId, data, method, changedOn } = payload

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
  resultTreatmentStatusExternalId,
  data,
  method,
  changedOn = new Date()
) {
  const now = new Date()

  const lastTreatment = await updateTreatmentStatusByResultId(
    currentUserId,
    now,
    result.data.id,
    result.data.resultTreatmentStatusId,
    resultTreatmentStatusExternalId,
    resultTreatmentStatusId,
    data,
    method,
    changedOn
  )

  const response = await showResult(request)
  response.data.treatmentStatus = lastTreatment

  if (!response.data.resultTreatmentStatusCreatedOn) {
    response.data.resultTreatmentStatusCreatedOn = result.data.endedOn || result.data.startedOn || now
  }

  return response
}

async function updateTreatmentStatusByResultId(
  userId,
  now,
  resultId,
  currentTreatmentStatusId,
  resultTreatmentStatusExternalId,
  resultTreatmentStatusId,
  data,
  method,
  changedOn = new Date()
) {
  let treatmentStatusId = null
  // check if a externalId is provided
  if (resultTreatmentStatusExternalId) {
    treatmentStatusId = await resultTreatmentStatusToId(resultTreatmentStatusExternalId)
    if (!treatmentStatusId) {
      return Boom.badRequest('Invalid externalId')
    }
  } else if (resultTreatmentStatusId) {
    // check if value of resultTreatmentStatusId is valid
    const treatmentStatus = await knex('ResultTreatmentStatus').where('id', resultTreatmentStatusId).first()
    if (!treatmentStatus) {
      return Boom.badRequest('Invalid resultTreatmentStatusId')
    }
    treatmentStatusId = resultTreatmentStatusId
  }
  let lastTreatment = await getLastTreatmentStatusByResult(resultId)
  if (treatmentStatusId !== currentTreatmentStatusId && treatmentStatusId) {
    const [treatmentStatusLogId] = await knex('ResultTreatmentStatusLog').insert({
      resultId,
      resultTreatmentStatusId: treatmentStatusId,
      method,
      data,
      createdOn: now,
      changedOn,
      createdBy: userId,
    })

    if (!lastTreatment || (lastTreatment && lastTreatment.changedOn < changedOn)) {
      await knex('Result').where('id', resultId).update({
        treatmentStatusLogId,
        updatedBy: userId,
        updatedOn: now,
      })
      lastTreatment = await getLastTreatmentStatusByResult(resultId)
    }
  }

  if (data) {
    const [{ treatmentStatusLogId }] = await knex('Result').where('id', resultId).select('treatmentStatusLogId')
    await knex('ResultTreatmentStatusLog').where('id', treatmentStatusLogId).update({
      data,
      changedOn,
    })
  }

  return lastTreatment
}

async function getLastTreatmentStatusByResult(resultId) {
  return knex('Result as r')
    .innerJoin('ResultTreatmentStatusLog as rtl', 'r.treatmentStatusLogId', 'rtl.id')
    .innerJoin('ResultTreatmentStatus as ts', 'rtl.resultTreatmentStatusId', 'ts.id')
    .where('rtl.resultId', resultId)
    .orderBy('rtl.changedOn', 'desc')
    .first('rtl.changedOn', 'ts.name', 'ts.externalId', 'ts.i18nKey')
}

async function getTreatmentStatusByResultId(resultId) {
  return knex('Result as r')
    .innerJoin('ResultTreatmentStatusLog as rtl', 'r.treatmentStatusLogId', 'rtl.id')
    .innerJoin('ResultTreatmentStatus as ts', 'rtl.resultTreatmentStatusId', 'ts.id')
    .where('rtl.resultId', resultId)
    .first(
      'rtl.id as treatmentStatusLogId',
      'rtl.data',
      'rtl.method',
      'rtl.changedOn',
      'ts.name',
      'ts.externalId',
      'ts.i18nKey'
    )
}

/*
When will this return a duplicate?
 - Here is an example of a return value that was duplicated in Ukraine: 806279_634634_ee5025da
   - Instrument 806729 ran a test that for a duplicate sample ID
   - Sample IDs are hand entered and not unique and this is normal
   - The test started at a time where the hour ended with 6 on the 34th minute
   - The start time and the end time are the same which means this test hadn't completed at the time of being uploaded
   - This time should have been 06:34 or 16:34
   - If the same device starts 2 tests using the same sample ID at the same minute 10 hours apart, and those tests do not complete, this function will create a duplicated value
*/
function createUniqueIdForResult(instrumentSerial, testStartedOn, testEndedOn, sampleId) {
  if (!instrumentSerial || !testStartedOn || !testEndedOn || !sampleId) {
    return null
  }
  const hashedSampleId = oneDirectionalMd5Hash(sampleId)
  const uniqueId = `${instrumentSerial}_${dateFormat(testStartedOn, 'mmss').substr(1)}${dateFormat(
    testEndedOn,
    'mmss'
  ).substr(1)}_${hashedSampleId.substr(0, 8)}`
  return uniqueId
}

async function listFollowUps(request) {
  const { auth, query } = request
  const dataConstraints = await getConstraints(auth.credentials)

  const queryBuilder = knex('FollowUp as fu')
    .join('FollowUpType as fut', 'fu.followUpTypeId', 'fut.id')
    .join('FollowUpAssay as fua', 'fu.id', 'fua.followUpId')
    .leftJoin('Assay as a', 'fua.assayId', 'a.id')
    .leftJoin('AssayType as at', 'a.assayTypeId', 'at.id')
    .leftJoin('Disease as dis', 'at.diseaseId', 'dis.id')
    .leftJoin('ResultCategory as rc1', 'fua.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'fua.resultCategory2', 'rc2.id')
    .where(queryBuilder => {
      queryBuilder.where('fua.partnerId', dataConstraints.partner.id)
      if (query.diseaseId) queryBuilder.where('dis.id', query.diseaseId)

      if (query.typeId) {
        queryBuilder.where('fu.followUpTypeId', query.typeId)
      }

      if (query.assayId) {
        queryBuilder.where(function () {
          this.where('fua.assayId', query.assayId).orWhereNull('fua.assayId')
        })
      }

      if (query.resultCategory1) {
        queryBuilder.where(function () {
          this.where('fua.resultCategory1', query.resultCategory1)
        })
      }

      if (query.resultCategory2) {
        queryBuilder.where(function () {
          this.where('fua.resultCategory2', query.resultCategory2)
        })
      }
    })
    .orderBy('fu.id', 'a.id', 'rc1.id', 'rc2.id')
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
              _.pick(a, ['assayId', 'assayName', 'assayExternalId', 'assayI18nKey']),

              (v, k) => _.lowerFirst(k.replace('assay', ''))
            ),
            {
              resultCategories: _.uniqBy(
                data.filter(d => d.id === f.id && d.assayId === a.assayId && d.resultCategory1Id),
                r => `${r.resultCategory1Id}-${r.resultCategory2Id}`
              ).map(r => ({
                category1: _.mapKeys(
                  _.pick(r, [
                    'resultCategory1Id',
                    'resultCategory1Name',
                    'resultCategory1ExternalId',
                    'resultCategory1I18nKey',
                  ]),
                  (v, k) => _.lowerFirst(k.replace('resultCategory1', ''))
                ),
                category2: _.mapKeys(
                  _.pick(r, [
                    'resultCategory2Id',
                    'resultCategory2Name',
                    'resultCategory2ExternalId',
                    'resultCategory2I18nKey',
                  ]),
                  (v, k) => _.lowerFirst(k.replace('resultCategory2', ''))
                ),
              })),
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
  const result = await getResultByResultId(auth, resultId)
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
      return Boom.badRequest('This result already has a follow up with this external ID.')
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

  return updateTreatmentStatusBasedOnFollowUps(request, currentUserId, result, date, 'FollowUp', 'Client API')
}

async function updateResultFollowUp(request) {
  const now = new Date()
  const { auth, params, payload } = request
  const { resultId } = params
  const { date, id, externalId, followUpId, followUpExternalId } = payload
  const { id: currentUserId } = await getUser(auth.credentials.name)

  // get the result so we can check access and if status changed
  const result = await getResultByResultId(auth, resultId)
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
    .orWhere(function () {
      this.where('resultId', resultId).where('externalId', externalId || '-1')
    })
    .update({
      date,
      updatedOn: now,
      updatedBy: currentUserId,
      followUpId: knex.raw('ifnull(?, followUpId)', followUp ? followUp.id : null),
    })

  if (affectedRows === 0) {
    return Boom.notFound('Could not find follow up')
  }

  return updateTreatmentStatusBasedOnFollowUps(request, currentUserId, result, date, 'FollowUp', 'Client API')
}

async function deleteResultFollowUp(request) {
  const { auth, params, payload } = request
  const { resultId } = params
  const { date, id, externalId } = payload
  const { id: currentUserId } = await getUser(auth.credentials.name)

  // get the result so we can check access
  const result = await getResultByResultId(auth, resultId)
  if (!result.ok) {
    return Boom.notFound()
  }

  await knex('ResultFollowUp')
    .where('id', id || '-1')
    .orWhere(function () {
      this.where('resultId', resultId).where('externalId', externalId || '-1')
    })
    .del()

  return updateTreatmentStatusBasedOnFollowUps(request, currentUserId, result, date, 'FollowUp', 'Client API')
}

async function updateTreatmentStatusBasedOnFollowUps(request, currentUserId, result, date, data, method) {
  const followUps = await knex('ResultFollowUp as r')
    .join('FollowUp as f', 'r.followUpId', 'f.id')
    .join('FollowUpType as t', 'f.followUpTypeId', 't.id')
    .where('resultId', result.data.id)
    .select('f.externalId', 't.externalId as followUpTypeExternalId')
  let treatmentStatusExternalId = 'AwaitingTreatment'
  if (_.find(followUps, f => f.followUpTypeExternalId === 'treatment')) {
    treatmentStatusExternalId = 'OnTreatment'
  } else if (_.find(followUps, f => f.followUpTypeExternalId === 'outcome' && f.externalId !== 'cured')) {
    treatmentStatusExternalId = 'NotPossible'
  }

  return updateTreatmentStatus(request, currentUserId, result, null, treatmentStatusExternalId, data, method)
}

async function transferResult(request) {
  const {
    auth,
    params: { resultId },
    payload: { siteId, timestamp, comment, includeAllResults },
  } = request
  const { partnerId, countryId, id: currentUserId, userName } = await getUser(auth.credentials.name)

  // get the result so we can check access
  const result = await getResultByResultId(auth, resultId)

  if (!result.ok) {
    return Boom.notFound('Result with requested Id is not found')
  }

  // check if target site exists in current user's country and partner
  const site = await getSiteByPartnerCountry(siteId, { partnerId, countryId })
  if (!site) {
    return Boom.notFound('Requested site not found')
  }

  const resultStatusId = await resultStatusToId('Transfer')
  if (!resultStatusId) {
    return Boom.badRequest('Invalid externalId `Transfer`')
  }

  // get item if timeStamp of prev action is newer than current timeStamp
  let resultStatusLog = await knex('ResultStatusLog')
    .whereNotNull('timestamp')
    .where('timestamp', '>', timestamp)
    .where({ resultId, resultStatusId })
    .first('createdOn', 'createdBy')

  let resultStatusLogId
  let transferredOn
  let transferredBy = userName
  if (resultStatusLog) {
    // ^^^
    // prev transfer is newer than current - get its props and skip current action
    // ---
    resultStatusLogId = resultStatusLog.id
    transferredOn = resultStatusLog.createdOn
    const author = await getUserByUserId(resultStatusLog.createdBy)
    transferredBy = author ? author.userName : '?'
  } else {
    // ^^^
    // current action is newer
    // ---
    const now = new Date()

    // log
    ;[resultStatusLogId] = await knex('ResultStatusLog').insert({
      resultId,
      resultStatusId,
      createdOn: now,
      createdBy: currentUserId,
      data: JSON.stringify({
        siteId: result.data.siteId,
        reportableSiteId: siteId,
        previousReportableSiteId: result.data.reportableSiteId,
        sampleOriginSiteId: result.data.sampleOriginSiteId,
        comment,
      }),
      timestamp,
    })
    resultStatusLog = await knex('ResultStatusLog').where({ id: resultStatusLogId }).first('createdOn')
    transferredOn = resultStatusLog.createdOn

    // update
    await knex('Result').where('id', resultId).update({
      reportableSiteId: siteId,
      resultStatusLogId,
      firstViewedOn: null,
      updatedBy: currentUserId,
      updatedOn: now,
    })

    await knex('ResultTransferLog').insert({
      resultId,
      reportableSiteId: siteId,
      sampleOriginSiteId: result.data.sampleOriginSiteId,
      previousReportableSiteId: result.data.reportableSiteId,
      comment,
      createdOn: now,
      createdBy: currentUserId,
    })

    result.data.reportableSiteId = siteId
    result.data.reportableSiteName = site.name
  }

  const currTreatmentStatus = await getTreatmentStatusByResultId(resultId)

  // func getResultByResultId(request) does not return now current result because
  // r.reportableSiteId now has changed and may not equal to user's siteId's -
  // so we here simply update few fields affected by transfer and return old result
  result.data.transferredOn = transferredOn
  result.data.transferredBy = transferredBy
  result.data.resultStatusLogId = resultStatusLogId
  result.data.firstViewedOn = null
  result.data.treatmentStatus = _.pick(currTreatmentStatus, [
    'changedOn',
    'name',
    'externalId',
    'i18nKey',
    'method',
    'data',
  ])
  result.data.followUps = []

  const { patientId } = result.data
  if (includeAllResults && patientId) {
    // get all other results of the same Patient Id
    const otherResultsForPatient = await knex('Result')
      .whereNot('id', resultId)
      .whereRaw('LOWER(JSON_EXTRACT(patientData, "$.id")) = LOWER(JSON_QUOTE(?))', [patientId])
      .select('id')
    // transfer them all to new siteId
    await Promise.each(otherResultsForPatient, ({ id }) =>
      transferResult({
        auth,
        params: { resultId: id },
        payload: {
          siteId,
          timestamp,
          comment,
          // make sure to pass `false` here - to use this recursion only once
          includeAllResults: false,
        },
      })
    )
  }

  return result
}

async function updateTransferNotification(request) {
  const {
    params: { resultId },
    payload: { firstViewedOn },
    auth,
  } = request

  const result = await getResultByResultId(auth, resultId)

  if (!result.ok) {
    return Boom.notFound('Result with requested Id is not found')
  }

  if (result.data.firstViewedOn) {
    return Boom.badRequest('Result has already been viewed')
  }

  await knex('Result as r').where('r.id', resultId).update({
    firstViewedOn,
  })

  const data = await getResultByResultId(auth, resultId)

  return data
}

// ---------------------------------------------------------------
async function getResultsForReport(auth, query, timezoneIANA) {
  // for now call existing function, but later add here a query with different aggregations
  return getListResults(query, auth, getReportCommonFieldsTZ(timezoneIANA))
}

async function currentResultAggregations(request) {
  const { auth, query } = request
  const user = await getUserFromCredentials(auth.credentials)
  const { timezoneIANA: timeZoneIANA } = user

  if (!canViewResults(auth)) {
    throw Boom.forbidden('You do not have access to results')
  }

  /**
   * date range must be defined
   */
  const { minDate, maxDate } = query
  if (!minDate || !maxDate) {
    return Boom.badRequest('Dates are required')
  }
  /**
   * See 'NOTE' in file
   * PkDashboard/pages/MtbRifSection/CurrentTestingPage/CurrentTestingGraph.jsx.
   *
   * Notice here that datetime has format 'yyyy-01-01' and 'yyyy-12-31'.
   * Like
   *    minDate: 2024-01-01T00:00:00.000+06:00
   *    maxDate: 2024-12-31T23:59:59.999+06:00
   * And below we cut only date part YYYY-MM-DD for using in knex queries
   */
  query.minDate = minDate.substring(0, 10)
  query.maxDate = maxDate.substring(0, 10)

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  // optional flags
  const { flags = [] } = query

  // if no group is specified, use result category
  const groupBy = getGroupBy(query)

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  // if grouping only by month and assay, resultCategory1, resultCategory2 (the most common case),
  // we can query the fact tables for much better performance
  const factTableDataGroups = ['month', 'assay', 'resultCategory1', 'resultCategory2']

  const resp = {}
  let dateColumn
  let baseQuery
  if (_.every(groupBy, group => _.includes(factTableDataGroups, group)) && !query?.resistance) {
    baseQuery = getClinicalIndicatorQueryForFactTable(dataConstraints, null, groupBy, query)
    dateColumn = 'r.startedOn'
  } else {
    baseQuery = getClinicalIndicatorQueryForResultsTable(dataConstraints, null, groupBy, query)
  }
  /**
   * Total tests in specified period
   */
  if (_.intersection(flags, [GRAPH_FLAGS.GET_TOTAL_RESULTS, GRAPH_FLAGS.GET_TOTAL_RESULTS_IN_PERIOD]).length > 0) {
    const [{ cnt }] = await baseQuery.clone()
    resp.totalResults = cnt
  }

  /**
   * List of the number of tests in date range groupped by xxx
   */
  const data = await processGroupedQuery(knex, baseQuery, groupBy, dateColumn)

  if (groupBy.includes('month') && query.minDate && query.maxDate) {
    // Get all months in date range (YYYY-MM)
    const months = getAllMonthsInRange(query.minDate, query.maxDate)

    resp.data = []
    for (const month of months) {
      const monthData = data.filter(result => result.month === month)
      if (monthData.length > 0) {
        resp.data = [...resp.data, ...monthData]
      } else {
        resp.data = [...resp.data, { cnt: 0, month }]
      }
    }
  } else {
    resp.data = data
  }

  /**
   * Total tests of the current year
   */
  if (flags.includes(GRAPH_FLAGS.GET_TOTAL_RESULTS_IN_CURRENT_YEAR)) {
    const totalResultsCurrentYear = _.reduce(
      resp.data.filter(x => _.startsWith(x.month, `${currentYear}-`)),
      (acc, { cnt }) => {
        acc += cnt
        return acc
      },
      0
    )
    resp.totalResultsCurrentYear = totalResultsCurrentYear
  }
  /**
   * Average tests per month during the current year
   */
  if (flags.includes(GRAPH_FLAGS.GET_AVERAGE_RESULTS_PER_MONTH_CURRENT_YEAR)) {
    const totalResultsCurrentYear = _.reduce(
      resp.data.filter(x => _.startsWith(x.month, `${currentYear}-`)),
      (acc, { cnt }) => {
        acc += cnt
        return acc
      },
      0
    )
    resp.averageTestsPerMonthCurrentYear = Math.round(totalResultsCurrentYear / currentMonth)
  }
  /**
   * Total tests in the last 24 hours
   */
  if (flags.includes(GRAPH_FLAGS.GET_TOTAL_RESULTS_FOR_TODAY)) {
    const queryParams = {
      ...query,
      minDate: replaceOffset(startOfDay(now), timeZoneIANA),
      maxDate: replaceOffset(endOfDay(now), timeZoneIANA),
    }

    const q = getClinicalIndicatorQueryForResultsTable(dataConstraints, null, groupBy, queryParams)
    const [{ cnt }] = await q.clone()
    resp.totalResultsToday = cnt
  }

  return resp
}

// ---------------------------------------------------------------
function getQuarterByMonth(monthNumber) {
  if (monthNumber >= 1 && monthNumber <= 3) return 1
  if (monthNumber >= 4 && monthNumber <= 6) return 2
  if (monthNumber >= 7 && monthNumber <= 9) return 3
  if (monthNumber >= 10 && monthNumber <= 12) return 4
  return null
}

// ---------------------------------------------------------------
async function trendInQuarters(request) {
  const { query } = request
  let groupBy = [...getGroupBy(query), 'month']

  request.query = { ...request.query, groupBy }

  // get data grouped by month via using Fact table
  const resp = await clinicalIndicatorAggregations(request)

  // remove `month` from groupBy array to use rest of groupBy items
  groupBy = _.filter(groupBy, it => it !== 'month')

  // re-group data by quarter
  const dataRaw = _.reduce(
    resp.data,
    (acc, it) => {
      const [yyyy, mm] = it.month.split('-')
      const quarter = getQuarterByMonth(+mm)
      const restGroupedBy = _.pick(it, groupBy)

      acc[yyyy] = acc[yyyy] || {} // object for each year
      acc[yyyy][quarter] = acc[yyyy][quarter] || [] // array of items for each quarter

      /**
       * from array of items in acc[yyyy][quarter] - get item with same
       * props as in `restGroupedBy`
       */
      let item = _.find(acc[yyyy][quarter], restGroupedBy)
      if (!item) {
        item = { cnt: 0, ...restGroupedBy }
        acc[yyyy][quarter] = [...acc[yyyy][quarter], item]
      }
      item.cnt += it.cnt
      return acc
    },
    {
      /**
       * assemble temporal object
       * YYYY: {
       *  1: [
       *    { cnt: xxx, resultCategory1: 'Detected', ... }, <---- `cnt` and each groupBy param
       *    { cnt: xxx, resultCategory1: 'NotDetected', ... },
       *    ...
       *  ],
       *  2: ...
       *  3: ...
       *  4: ...
       * }
       */
    }
  )

  return { resp, dataRaw }
}

// ---------------------------------------------------------------
async function trendInQuartersMtbDetected(request) {
  const { dataRaw } = await trendInQuarters(request)
  const DETECTED = 'Detected'

  // get final data set groped by rest of items
  let grouped = []
  // for each year ...
  _.keys(dataRaw).forEach(yyyy => {
    // ... for each quarter ...
    _.keys(dataRaw[yyyy]).forEach(quarter => {
      grouped = [
        ...grouped,
        _.reduce(
          dataRaw[yyyy][quarter],
          (acc, it) => {
            if (it.resultCategory1 === DETECTED) {
              acc.MtbDetected = it.cnt
            }
            acc.Total += it.cnt
            return acc
          },
          {
            quarter: `${yyyy}-${quarter}`,
            Total: 0,
            MtbDetected: 0,
          }
        ),
      ]
    })
  })

  grouped = _.sortBy(grouped, 'quarter')
  grouped.forEach(it => {
    it.MtbToTotalPercentage = it.Total === 0 ? 0 : (100 * it.MtbDetected) / it.Total
  })

  return {
    grouped,
    keysFromGrouped: ['Total', 'MtbDetected', 'MtbToTotalPercentage'], // series
    i18nKeys: {
      MtbDetected: 'MTBPlus',
      Total: 'Total',
      MtbToTotalPercentage: 'MTBPercent',
    },
  }
}

// ---------------------------------------------------------------
async function trendInQuartersRifDetected(request) {
  const { dataRaw } = await trendInQuarters(request)
  const DETECTED = 'Detected'

  // get final data set groped by rest of items
  let grouped = []
  // for each year ...
  _.keys(dataRaw).forEach(yyyy => {
    // ... for each quarter ...
    _.keys(dataRaw[yyyy]).forEach(quarter => {
      grouped = [
        ...grouped,
        _.reduce(
          dataRaw[yyyy][quarter],
          (acc, it) => {
            if (it.resultCategory1 === DETECTED) {
              acc.MtbDetected += it.cnt
              if (it.resultCategory2 === DETECTED) {
                acc.RrdDetected += it.cnt
              }
            }
            return acc
          },
          {
            quarter: `${yyyy}-${quarter}`,
            MtbDetected: 0,
            RrdDetected: 0,
          }
        ),
      ]
    })
  })

  grouped = _.sortBy(grouped, 'quarter')
  grouped.forEach(it => {
    it.RrdToMtbPercentage = it.MtbDetected === 0 ? 0 : (100 * it.RrdDetected) / it.MtbDetected
  })

  return {
    grouped,
    keysFromGrouped: ['MtbDetected', 'RrdDetected', 'RrdToMtbPercentage'], // series
    i18nKeys: {
      MtbDetected: 'MTBPlus',
      RrdDetected: 'RRDHash',
      RrdToMtbPercentage: 'RRDPercent',
    },
  }
}

function queryResultFollowUpLastItems(followUpType) {
  const rfuLastIds = knex('ResultFollowUp as _rfu')
    .innerJoin('FollowUp as _fu', '_rfu.followUpId', '_fu.id')
    .innerJoin('FollowUpType as _fut', '_fu.followUpTypeId', '_fut.id')
    .select(['_rfu.resultId', knex.raw('MAX(_rfu.id) as _id')])
    .where('_fut.externalId', followUpType)
    .groupBy('_rfu.resultId')

  return rfuLastIds
}

async function followUpAggregations(request) {
  const { auth, query } = request

  if (!canViewResults(auth)) {
    throw Boom.forbidden('You do not have access to results')
  }

  let assay = null
  if (query.assay && !Array.isArray(query.assay)) {
    assay = [query.assay]
  } else if (query.assay) {
    assay = query.assay
  }

  // get followUpType from query, or set it to 1st item ('treatment') from followUpTypes
  const followUpTypes = (await knex('FollowUpType').select('externalId')).map(x => x.externalId)
  const [treatmentFollowUpType] = followUpTypes
  let followUpType = query.followUpType || treatmentFollowUpType
  if (!followUpTypes.includes(query.followUpType)) {
    followUpType = treatmentFollowUpType
  }

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const resultQuery = knex('Result as r')
    .innerJoin('Device as d', 'd.id', 'r.deviceId')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('Site as s', 's.id', 'r.siteId')
    .innerJoin('Assay as a', 'a.id', 'r.assayId')
    .innerJoin('AssayType as at', 'at.id', 'a.assayTypeId')
    .innerJoin('ResultCategory as rc1', 'rc1.id', 'r.resultCategory1')
    .leftJoin('ResultCategory as rc2', 'rc2.id', 'r.resultCategory2')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('State as st', 'st.id', 'g.stateId')
    .innerJoin('ResultCategoryAssay as rca', function () {
      this.on('r.assayId', 'rca.assayId').andOn('r.resultCategory1', 'rca.resultCategoryId')
    })
    .leftJoin('ResultCategoryAssay as rсa2', function () {
      this.on('r.assayId', 'rсa2.assayId').andOn('r.resultCategory2', 'rсa2.resultCategoryId')
    })
    .leftJoin(queryResultFollowUpLastItems(followUpType).as('_rfu'), 'r.id', '_rfu.resultId')
    .leftJoin(`ResultFollowUp as rfu`, `_rfu._id`, `rfu.id`)
    .leftJoin(`FollowUp as fu`, `rfu.followUpId`, `fu.id`)
    .leftJoin('FollowUpType as fut', 'fu.followUpTypeId', 'fut.id')
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      geography: 'g',
      site: 's',
    })
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      deviceName: 'd.name',
      deviceType: 'dt.externalId',
      partnerId: 'g.partnerId',
      siteName: 's.name',
    })
    .modify(qb => {
      if (assay) {
        qb.whereIn('a.externalId', assay)
      }
      if (query.assayType) {
        qb.where('at.externalId', '=', query.assayType)
      }
      if (query.followUp) {
        qb.where(`fu.externalId`, '=', query.followUp)
      }
      if (query.minDate) {
        qb.where('r.endedOn', '>=', query.minDate)
      }
      if (query.maxDate) {
        qb.where('r.endedOn', '<=', query.maxDate)
      }
      if (query.resultCategory1) {
        qb.where('rc1.externalId', '=', query.resultCategory1)
      }
      if (query.resultCategory2) {
        qb.where('rc2.externalId', '=', query.resultCategory2)
      }
    })
    .where('rca.reportable', true)
    .where(`fut.externalId`, '=', followUpType)
    .orderBy('r.endedOn')
    .count('r.id as cnt')

  // if no group is specified, use followUp
  let groupBy = null
  if (!query.groupBy) {
    groupBy = ['followUp']
  } else if (!Array.isArray(query.groupBy)) {
    groupBy = [query.groupBy]
  } else {
    groupBy = query.groupBy
  }
  // group also by 'followUp' if missed
  if (!groupBy.includes('followUp')) {
    groupBy.push('followUp')
  }

  const data = await processGroupedQuery(knex, resultQuery, groupBy)

  return { data }
}

async function createResult(request) {
  return updateOrCreateResult(request)
}

async function updateOrCreateResult(request, result = {}) {
  const { auth, payload } = request
  const { id: userId, partnerId } = await getUser(auth.credentials.name)
  const dataConstraints = await getConstraints(auth.credentials)
  const isCreating = !result.id
  const isUpdating = !isCreating
  const now = new Date()

  // check that user has access to site
  const site = await getSite(payload.siteId || result.siteId, dataConstraints)
  if (_.isEmpty(site)) {
    return Boom.notFound('This site does not exist or you do not have access.')
  }

  // check that user has access to the assay
  const [assay] = await getAllAssaySchemas(partnerId, userId, payload.assayId || result.assayId)
  if (_.isEmpty(assay)) {
    return Boom.notFound('This assay does not exist or you do not have access.')
  }

  // is the selected category valid for the assay?
  const validCategories = _.map(await getAssayResultCategories(assay.id), 'id')
  if (
    validCategories.indexOf(payload.resultCategory1) === -1 ||
    (payload.resultCategory2 && validCategories.indexOf(payload.resultCategory2) === -1)
  ) {
    return Boom.badRequest('The selected result is not valid for this assay.')
  }

  // deviceId is optional. if null and creating a result, it has to be an assay that is for manual entry only
  let { deviceId } = result
  if (isCreating) {
    deviceId = await validatePayloadHadDeviceId(payload)
  }
  // check that user has access to device
  const device = await getDeviceByDeviceId({
    deviceId,
    credentials: auth.credentials,
  })

  if (!device) {
    return Boom.notFound('This device does not exist or you do not have access.')
  }

  if (!device.hasResults) {
    return Boom.badRequest(
      'This device does not generate results. Make sure that you have selected the correct device.'
    )
  }

  /**
   * on updating - read current record from db to have all fields without default values
   * for insert().onConflict() operation
   */
  if (isUpdating) {
    const existingResult = await knex('Result').where({ id: result.id }).first()
    result = { ...existingResult, ...result }
  }

  // we can start filling in the result details now
  if (isCreating) {
    result.assayId = assay.id
    result.partnerId = partnerId
    result.siteId = site.id
    result.deviceId = device.id
    result.longitude = site.longitude
    result.latitude = site.latitude
    result.resultSourceId = await resultSourceToId('EnteredByHand')
    result.resultTypeId = await resultTypeToId('Patient')
    result.createdOn = now
    result.createdBy = userId
    result.resultData = '{}'
    /**
     * can set reportableSiteId only in Create mode, can't change it in Edit mode.
     * Notice that reportableSiteId is auto-filled in Create mode after selecting Site
     */
    result.reportableSiteId = payload.reportableSiteId || payload.sampleOriginSiteId
    /**
     * patientData
     */
    result.patientData = JSON.stringify({
      id: payload.patientId,
    })
  }

  result.resultCategory1 = payload.resultCategory1 // this is required field
  result.resultCategory2 = payload.resultCategory2 || null
  result.startedOn = payload.startedOn
  result.endedOn = payload.endedOn
  result.updatedOn = now
  result.updatedBy = userId

  result.errorCode = payload.errorCode || null
  result.notes = payload.notes
  result.senderOperator = payload.senderOperator

  // create sample-entry or update it
  result.sampleId = await updateOrCreateSample(
    result.sampleId,
    payload.sampleId || null,
    payload.sampleTypeId || null,
    payload.sampleCollectedOn || null,
    payload.sampleOriginSiteId || null
  )

  // create case entry or update it
  if (payload.caseExternalId && assay.diseaseId) {
    result.patientCaseId = await getCaseId(
      {
        externalId: payload.caseExternalId,
        diseaseId: assay.diseaseId,
        partnerId,
      },
      true,
      userId
    )
  } else {
    result.patientCaseId = null
  }

  // TODO: Log any changes (see ASP-1371)
  ;[result.id] = await knex('Result').insert(result).onConflict('id').merge()

  // update or insert tags
  await updateTagsById(result.id, 'result', payload.tags, auth)

  // insert treatment status (can't be changed manually, so only do on insert)
  if (isCreating) {
    const resultTreatmentStatusId = await resultTreatmentStatusToId('AwaitingTreatment')
    await updateTreatmentStatusByResultId(
      userId,
      now,
      result.id,
      null,
      null,
      resultTreatmentStatusId,
      null,
      'Manual Result Entry',
      now
    )
  }

  const r = await getResultByResultId(auth, result.id)
  return r
}

async function validatePayloadHadDeviceId(payload) {
  if (payload.deviceId) {
    return payload.deviceId
  }

  throw Boom.internal('Device is mandatory.')
}

async function updateOrCreateSample(sampleId, externalId, sampleTypeId, collectedOn, originSiteId) {
  const now = new Date()
  let sampleData = {
    externalId,
    collectedOn,
    sampleTypeId,
    registeredInMobile: false,
    updatedOn: now,
  }

  if (sampleId) {
    // remove undefined (= not part of the POST fields) for updating
    sampleData = _.omitBy(sampleData, _.isUndefined)
    if (!_.isEmpty(sampleData)) {
      const existingSample = await knex('Sample').where({ id: sampleId }).first('originSiteId', 'registeredInMobile')
      if (existingSample) {
        sampleData.registeredInMobile = existingSample.registeredInMobile
        if (existingSample.originSiteId === null && originSiteId) {
          sampleData.originSiteId = originSiteId
        }
      }
    }
    await knex('Sample').update(sampleData).where({ id: sampleId })
    return sampleId
  }
  sampleData.originSiteId = originSiteId
  const [id] = await knex('Sample').insert({ ...sampleData, createdOn: now })
  return id
}

async function listSampleTypes() {
  const data = await knex('SampleType').orderBy('name').select('id', 'name', 'i18nKey', 'externalId')

  return { ok: true, data }
}

async function getCustomFieldsCompletion(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const { partnerId } = await getPersonByPersonId(auth.credentials.personId)
  const { minDate, maxDate } = query

  const assayIds = await allAssayToId()

  const queryForm = await knex('FormType AS ft')
    .join('FormDefinition as fd', 'fd.formTypeId', 'ft.id')
    .innerJoin('Disease as d', 'fd.diseaseId', 'd.id')
    .where('fd.partnerId', partnerId)
    .where('ft.externalId', 'gxConnectForm')
    .where('d.externalId', 'tb') // <-- includes MTB and MTB-Ultra
    .distinct(
      'fd.externalId',
      'fd.assayId',
      'fd.diseaseId',
      'ft.externalId as formTypeId',
      knex.raw("REPLACE(fd.jsonSchemaFile, '.json', '') as jsonSchemaFileName")
    )
  /**
   * `forms` is a object with 2 props for 2 forms
   * {
   *    CustomFields_Bangladesh_Mtb: {...},
   *    CustomFields_Bangladesh_Mtb_Ultra: {...},
   * }
   */
  const forms = createFormObject(queryForm)

  /**
   * `allFormFields` is a object with 2 props for 2 forms
   * {
   *    CustomFields_Bangladesh_Mtb: [
   *      knex.raw('SUM(...) as cnt_FIELD_NAME_1'),
   *      knex.raw('SUM(...) as cnt_FIELD_NAME_2'),
   *      ...
   *    ],
   *    CustomFields_Bangladesh_Mtb_Ultra: [...],
   * }
   */
  let allColumns = []
  const allFormFields = _.reduce(
    _.keys(forms),
    (accForm, formKey) => {
      const { fields } = forms[formKey]
      let { assayId } = forms[formKey]
      const header = `Total Results (${assayId ? 'Mtb-Ultra' : 'Mtb'})`
      assayId = assayId || assayIds.GxMtbRif
      if (assayId !== assayIds.GxMtbRifUltra)
        allColumns = [
          ...allColumns,
          {
            key: `cntAll_${assayId}`,
            header,
          },
        ]

      accForm[formKey] = _.reduce(
        fields,
        (acc, field) => {
          const { name, title, source, gxAlertDbColumn } = field
          const fieldName = gxAlertDbColumn || name
          acc = [
            ...acc,
            knex.raw(
              `SUM(IFNULL(JSON_EXTRACT(fcfc.completionByField, '$."${source}".completed'),0)) as cnt_${assayId}_${fieldName}`
            ),
          ]

          allColumns = [
            ...allColumns,
            {
              key: `cnt_${assayId}_${fieldName}`,
              header: title,
            },
          ]

          return acc
        },
        // initial object with counter for all affected results
        [knex.raw(`SUM( IFNULL(fcfc.recordCount, 0) ) as cntAll_${assayId}`)]
      )

      return accForm
    },
    {}
  )
  const startDate = new Date(minDate.split('T')[0])
  const endDate = endOfDay(new Date(maxDate.split('T')[0]))
  const allCustomFields = _.reduce(_.values(allFormFields), (acc, formFields) => [...acc, ...formFields], [])

  const data = await knex('Site as s')
    .innerJoin('FactCustomFieldCompletion as fcfc', 'fcfc.siteId', 's.id')
    .innerJoin('Assay as a', 'fcfc.assayId', 'a.id')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .whereIn('a.id', [assayIds.GxMtbRif, assayIds.GxMtbRifUltra])
    .modify(addConstraints, dataConstraints, {
      site: 's',
      geography: 'g',
      assay: 'a',
    })
    .modify(filterDateRangeParams, { minDate: startDate, maxDate: endDate }, 'fcfc.date')
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      siteName: 's.name',
    })
    .groupBy('s.id')
    .select(['s.id as siteId', 's.name as siteName', knex.raw('SUM(fcfc.recordCount) as cntAll'), ...allCustomFields])
    .orderBy('s.name')

  data.forEach(siteRow => {
    let sum = 0
    let totalFields = 0
    _.keys(forms).forEach(formKey => {
      const { fields } = forms[formKey]
      let { assayId } = forms[formKey]
      assayId = assayId || assayIds.GxMtbRif

      const total = siteRow[`cntAll_${assayId}`]
      fields.forEach(field => {
        const fieldName = field.gxAlertDbColumn || field.name
        const percentRaw = total > 0 ? (100 * siteRow[`cnt_${assayId}_${fieldName}`]) / total : 0
        const percent = percentRaw === 0 ? 0 : percentRaw < 1 ? _.round(percentRaw, 2) : _.round(percentRaw)
        siteRow[`cnt_${assayId}_${fieldName}`] = `${percent}%`
        sum += percent
      })
      totalFields += fields.length
    })
    siteRow.overall = `${_.round(sum / totalFields, 2)}%`
  })
  allColumns = [
    ...allColumns,
    {
      key: `overall`,
      header: 'Overall Completion Rate',
    },
  ]

  return {
    ok: true,
    data,
    dynamicColumns: allColumns,
  }
}

// ---------------------------------------------------------------
async function xdrAssayGraphAggregations(request) {
  const { auth, query } = request
  const dataConstraints = await getConstraints(auth.credentials)

  /**
   * in the query use use fact table `FactResultsDeviceByTimeFrame` where
   * field `statedOn` is a date part (no time) and is stored in format
   * `YYYY-MM-01 00:00:00`. Because of that - below cut only date part from
   * request.query's minDate/maxDate, and then add time part for UTC 00:00.
   * In this case sql query will compare `r.startedOn >= minDate` and
   * `r.startedOn < maxDate`
   */
  let { minDate, maxDate } = query
  minDate = `${minDate.slice(0, 10)}T00:00:00.000+00:00`
  maxDate = `${maxDate.slice(0, 10)}T23:59:59.999+00:00`

  const resultCategoryIds = await allResultCategoryToId()
  const assayIds = await allAssayToId()

  /**
   * manually get list of months in the interval.
   * Do not use func `eachMonthOfInterval` from `date-fns` because it converts
   * time into local user's timezone time, i.e. instead of
   * `2023-10-01T00:00:00.000+00:00` it may use `2023-09-30T21:00:00.000+03:00`
   * if user's tz is +03:00
   */
  let months = []
  let monthDate = new Date(minDate)
  const endDate = new Date(maxDate)
  while (monthDate < endDate) {
    months = [...months, monthDate]
    monthDate = addMonths(monthDate, 1)
  }

  let data = await getFactResultCountBase({
    resultCategoryIds,
    dataConstraints,
    query: { ...query, minDate, maxDate },
    fieldsScope: [FACT_FIELD_SCOPE.all],
    assay: ['GxMtbXdr'],
  })
    .where('a.id', assayIds.GxMtbXdr)
    .modify(filterDateRangeParams, { minDate, maxDate }, 'r.startedOn')
    .select(getMonthYearField(knex, 'r.startedOn', 'month'))
    .groupBy('month')
    .orderBy('month')

  data = months.map(monthDate => {
    const month = format(monthDate, 'yyyy-MM')
    const item = data.find(it => it.month === month)
    const {
      cntAll: TotalTests = 0,
      cnt_mtb: MtbDetected = 0,
      cnt_flq: FqrDetected = 0,
      cnt_inh: InhDetected = 0,
      cnt_amk: AmkDetected = 0,
      cnt_kan: KanDetected = 0,
      cnt_cap: CapDetected = 0,
      cnt_eth: EthDetected = 0,
    } = item || {}
    const FqrToMtbPercentage = MtbDetected === 0 ? 0 : (100 * FqrDetected) / MtbDetected
    const InhToMtbPercentage = MtbDetected === 0 ? 0 : (100 * InhDetected) / MtbDetected
    const AmkToMtbPercentage = MtbDetected === 0 ? 0 : (100 * AmkDetected) / MtbDetected
    const KanToMtbPercentage = MtbDetected === 0 ? 0 : (100 * KanDetected) / MtbDetected
    const CapToMtbPercentage = MtbDetected === 0 ? 0 : (100 * CapDetected) / MtbDetected
    const EthToMtbPercentage = MtbDetected === 0 ? 0 : (100 * EthDetected) / MtbDetected

    return {
      month,
      TotalTests,
      MtbDetected,
      FqrDetected,
      InhDetected,
      AmkDetected,
      KanDetected,
      CapDetected,
      EthDetected,
      FqrToMtbPercentage,
      InhToMtbPercentage,
      AmkToMtbPercentage,
      KanToMtbPercentage,
      CapToMtbPercentage,
      EthToMtbPercentage,
    }
  })

  return {
    grouped: data,
    // series
    keysFromGrouped: [
      'TotalTests',
      'MtbDetected',
      'FqrDetected',
      'InhDetected',
      'AmkDetected',
      'KanDetected',
      'CapDetected',
      'EthDetected',
      'FqrToMtbPercentage',
      'InhToMtbPercentage',
      'AmkToMtbPercentage',
      'KanToMtbPercentage',
      'CapToMtbPercentage',
      'EthToMtbPercentage',
    ],
    i18nKeys: {
      TotalTests: 'TotalTests',
      MtbDetected: 'MtbDetected',
      FqrDetected: 'FqrDetected',
      InhDetected: 'InhDetected',
      AmkDetected: 'AmkDetected',
      KanDetected: 'KanDetected',
      CapDetected: 'CapDetected',
      EthDetected: 'EthDetected',
      FqrToMtbPercentage: 'FQRPercent',
      InhToMtbPercentage: 'INHPercent',
      AmkToMtbPercentage: 'AMKPercent',
      KanToMtbPercentage: 'KANPercent',
      CapToMtbPercentage: 'CAPPercent',
      EthToMtbPercentage: 'ETHPercent',
    },
  }
}

module.exports = {
  updateTransferNotification,
  listResults,
  listResults2,
  getResultsForReport,
  downloadResultsList,
  showResult,
  getResultForStringTemplateProcessing,
  listResultTypes,
  updateTreatmentStatusPost,
  listTreatmentStatusTypes,
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
  transferResult,
  currentResultAggregations,
  followUpAggregations,
  queryResultFollowUpLastItems,
  getListResults,
  getListResults2,
  createResult,
  addPartnerQueryConstraints,
  addResultDownloadLog,
  listSampleTypes,
  getCustomFieldsCompletion,

  trendInQuartersMtbDetected,
  trendInQuartersRifDetected,

  xdrAssayGraphAggregations,

  getClinicalIndicatorQueryForResultsTable,
  processGroupedQuery,
  getQuarterByMonth,
  buildQueryForResultsListAndExport,
  buildQueryForResultsListAndExport2,
}
