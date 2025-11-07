const _ = require('lodash')
const Boom = require('@hapi/boom')
const { knex, sortPageParams } = require('../../db')
const { SORT_FIELDS } = require('../query')
const { getConstraints } = require('../../auth/constraints')
const { getQueryForResultsListAndExport } = require('./db')
const { applyExtraColumns } = require('../extraColumns')
const { sanitizeExtraColumns } = require('../extraColumns')

const LIST_FIELDS_UTC = {
  id: 'r.id',
  endedOn: 'r.endedOn',
  externalId: 'r.externalId',
  deviceName: 'd.name',
  sampleOriginSiteName: 'so.name',
  sampleId: 'r.sample_externalId',
  resultText: 'r.resultText',
  errorCode: 'r.errorCode',
  resultTreatmentStatus: knex.raw('null'), // not used
  resultTreatmentStatusI18nKey: knex.raw('null'), // not used
  treatmentStatusInfo: knex.raw('null'), // not used
  patientId: 'r.patient_externalId',
  assayId: 'r.assayId',
  resultCategory1Name: 'r.resultCategory1_name',
  resultCategory1I18nKey: 'r.resultCategory1_i18nKey',
  stateName: 'st.name',
  siteName: 'si.name',
  assayName: 'r.assay_name',
  assayI18nKey: 'r.assay_i18nKey',
  caseExternalId: knex.raw('null'), // not used
  diseaseId: 'r.disease_id',
  diseaseName: 'r.disease_name',
  diseaseExternalId: 'r.disease_externalId',
  requiresTreatment: knex.raw(
    'COALESCE(r.resultCategory1Assay_requiresTreatment,0) OR COALESCE(r.resultCategory2Assay_requiresTreatment,0)'
  ),
}

async function getResultCount(query, auth) {
  query.minDate = query.minDate instanceof Date ? query.minDate : new Date(query.minDate)
  query.maxDate = query.maxDate instanceof Date ? query.maxDate : new Date(query.maxDate)

  const dataConstraints = await getConstraints(auth.credentials)
  const resultQuery = buildQueryForResultsListAndExport(query, dataConstraints)
  const { count: total } = await resultQuery.clone().countDistinct('r.id as count').first()

  return {
    ok: true,
    total,
  }
}

async function getListResults(query, auth, fields = LIST_FIELDS_UTC) {
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
        selectFields.resultCategory2Name = 'r.resultCategory2_name'
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

    // if (assay.resultDataSchema) {
    //   const resultDataSchema = JSON.parse(assay.resultDataSchema)
    //   _.each(resultDataSchema, (value, key) => {
    //     if (value.list) {
    //       const alias = key.replace('.', '_')
    //       if (!sortableFields.includes(alias)) {
    //         selectFields[alias] = knex.raw('JSON_EXTRACT(r.resultData, ?)', [`$.${key}`])

    //         sortableFields.push(alias)
    //       }
    //       assayColumns.push({
    //         db: alias,
    //         type: value.type,
    //         title: value.title,
    //         i18nKey: value.i18nKey,
    //         formatter: value.formatter,
    //       })
    //     }
    //   })
    // }
  }

  if (query.sortCol && !sortableFields.includes(query.sortCol)) {
    return Boom.badRequest()
  }

  const dataConstraints = await getConstraints(auth.credentials)
  const resultQuery = buildQueryForResultsListAndExport(query, dataConstraints)

  const resultFields = {
    resultCategory2Name: 'r.resultCategory2_name',
    resultCategory2I18nKey: 'r.resultCategory2_i18nKey',
    resultCategory2Titlei18nKey: 'r.assay_resultCategory2Label_i18nKey',
    resultCategory1Titlei18nKey: 'r.assay_resultCategory1Label_i18nKey',
    resultCategory1Title: 'r.assay_resultCategory1Label',
    resultCategory2Title: 'r.assay_resultCategory2Label',
    deviceStateName: 'stdpn.name',
  }

  const data = await resultQuery
    .clone()
    .modify(sortPageParams, query, 'endedOn')
    .select(selectFields)
    .modify(function (qb) {
      qb.select(resultFields)
    })

  applyExtraColumns(data, assayColumns)
  sanitizeExtraColumns(assayColumns)

  const result = {
    ok: true,
    length: data.length,
    data,
    extraColumns: assayColumns,
  }
  return result
}

function buildQueryForResultsListAndExport(query, dataConstraints) {
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

  return getQueryForResultsListAndExport(query, dataConstraints)
}

async function listResults(request) {
  const { query, auth } = request
  const result = await getListResults(query, auth)
  return result
}

async function resultCount(request) {
  const { query, auth } = request
  const result = await getResultCount(query, auth)
  return result
}

module.exports = { listResults, resultCount, getQueryForResultsListAndExport }
