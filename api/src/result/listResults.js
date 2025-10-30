const _ = require('lodash')
const Boom = require('@hapi/boom')
const { knex, filterParams, filterDateRangeParams, sortPageParams } = require('../db')
const { SORT_FIELDS } = require('./query')
const { addConstraints, getConstraints, addPartnerQueryConstraints } = require('../auth/constraints')
const { applyExtraColumns } = require('./extraColumns')
const { sanitizeExtraColumns } = require('./extraColumns')

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
  diseaseExternalId: 'disease_externalId',
  requiresTreatment: 'r.resultCategoryAssay_requiresTreatment',
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
          })
        }
      })
    }
  }

  if (query.sortCol && !sortableFields.includes(query.sortCol)) {
    return Boom.badRequest()
  }

  const dataConstraints = await getConstraints(auth.credentials)

  const resultQuery = buildQueryForResultsListAndExport(query, dataConstraints)

  const getCount = resultQuery.clone().countDistinct('r.id as count').first()

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

  const start = new Date()
  const [{ count: total }, data] = await Promise.all([getCount, getItems])
  applyExtraColumns(data, assayColumns)
  sanitizeExtraColumns(assayColumns)
  const end = new Date()

  // ANSI escape code for green text
  const green = '\x1b[32m'
  const reset = '\x1b[0m'
  console.log(`${green}Time taken: ${end - start} milliseconds${reset}`)

  const result = {
    ok: true,
    total,
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

function getQueryForResultsListAndExport(query, dataConstraints) {
  const { showUnapprovedDevices = false, showDecommissionedDevices = false, assayId } = query
  const displayResult = query.displayResult || 'actual'

  const resultQuery = getBaseResults()
    .leftJoin('Site as sirep', 'r.reportableSiteId', 'sirep.id')
    .leftJoin('Site as sdpn', 'sdpn.id', 'd.siteId')
    .leftJoin('Geography as gdpn', 'sdpn.geographyId', 'gdpn.id')
    .leftJoin('State as stdpn', 'stdpn.id', 'gdpn.stateId')

    .modify(queryBuilder => {
      if (query.onlyUnreconciled) {
        queryBuilder.whereNull('r.reconciliationDate')
      }
      if (query.consumableId)
        queryBuilder.join('InventoryLog as il', 'il.resultId', 'r.id').where('il.consumableId', query.consumableId)
      if (!_.isEmpty(assayId)) queryBuilder.whereIn('r.assayId', assayId)
      if (query.reportableSiteId || query.reportableSiteName) {
        if (query.onlyEverTransferred) {
          const siteOperationAndValue = query.reportableSiteId
            ? `= ${query.reportableSiteId}`
            : `IN (
                SELECT s_transfer.id
                FROM Site s_transfer
                WHERE s_transfer.name LIKE '%${query.reportableSiteName}%'
              )`
          queryBuilder.whereRaw(
            `EXISTS (
              SELECT rslog_transfer.resultId
              FROM ResultStatusLog as rslog_transfer
                INNER JOIN ResultStatus as rs_transfer ON rslog_transfer.resultStatusId = rs_transfer.id
              WHERE rslog_transfer.resultId = r.id
                and rs_transfer.externalId = 'Transfer'
                and CAST(IFNULL(rslog_transfer.data ->> '$.previousReportableSiteId', 0) as UNSIGNED) ${siteOperationAndValue}
            )`
          )
        } else if (query.reportableSiteId) {
          queryBuilder.where('sirep.id', query.reportableSiteId)
        } else {
          queryBuilder.where('sirep.name', 'LIKE', `%${query.reportableSiteName}%`)
        }
      }
    })
    .modify(filterDateRangeParams, query, 'r.endedOn')
    .modify(filterParams, query, {
      deviceId: 'd.id',
      resultCategoryId: 'r.resultCategory1',
      resultCategory2Id: 'r.resultCategory2',
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      deviceName: 'd.name',
      deviceType: 'dt.externalId',
      siteName: 'si.name',
      sampleId: 'sp.externalId',
      sampleOriginSite: 'so.name',
      errorCode: 'r.errorCode',
      treatmentStatusId: 'rts.id',
      patientCaseId: null, // 'r.patientCaseId',
      diseaseId: 'dis.id',
      onlyReportableResults: 'rca.reportable',
      resultCategoryGroupId: 'rcg.externalId',
      assayId: 'a.id',
    })
    .modify((queryBuilder, params) => {
      if (params.onlyDownloadedByReporter) queryBuilder.innerJoin('ResultDownloadLog as rdl', 'r.id', 'rdl.resultId')

      if (params.onlyTreatmentRequired || params.treatmentStatus) {
        queryBuilder.andWhere(b => {
          b.where('rca.requiresTreatment', true).orWhere('rca2.requiresTreatment', true)
        })
      }

      if (params.patientOrResearchId) {
        queryBuilder.where(builder =>
          builder
            .whereRaw('LOWER(r.patient_externalId) like LOWER(?)', [`%${params.patientOrResearchId}%`])
            .orWhere('r.researchId', 'like', `%${params.patientOrResearchId}%`)
        )
      }
      if (params.treatmentStatus === 'AwaitingTreatment') {
        queryBuilder.where(builder =>
          builder.where('rts.externalId', params.treatmentStatus).orWhereNull('rts.externalId')
        )
      } else if (params.treatmentStatus) {
        queryBuilder.where('rts.externalId', params.treatmentStatus)
      }
    }, query)
    .modify(addPartnerQueryConstraints, dataConstraints)
    .modify(
      addConstraints,
      dataConstraints,
      {
        assay: 'a',
        assayType: 'at',
        device: 'd',
        deviceType: 'dt',
        sample: 'sp',
        site: 'si',
        geography: 'g',
        result_read: 'r',
        country: 'c',
        disease: 'dis',
      },
      { showUnapprovedDevices, showDecommissionedDevices, displayResult }
    )
    .modify(queryBuilder => {
      if (query.withTags) {
        queryBuilder.leftJoin(
          knex('Tag as tag')
            .innerJoin('ResultTag as rtg', 'rtg.tagId', 'tag.id')
            .groupBy('rtg.resultId')
            .select('rtg.resultId', knex.raw('GROUP_CONCAT(DISTINCT tag.title  SEPARATOR ", ") as tagsCsv'))
            .as('tags'),
          'r.id',
          'tags.resultId'
        )
      }
    })

  return resultQuery
}

const getBaseResults = () =>
  knex(`Result_read as r`)
    .leftJoin('Partner as p', 'r.partnerId', 'p.id')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .leftJoin('Site as si', 'r.siteId', 'si.id')
    .leftJoin('Geography as g', 'si.geographyId', 'g.id')
    .leftJoin('Country as c', 'g.countryId', 'c.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as lg', 'g.lgaId', 'lg.id')
    .leftJoin('Sample as sp', 'r.sampleId', 'sp.id')
    .leftJoin('SampleType as stp', 'sp.sampleTypeId', 'stp.id')
    .leftJoin('Site as so', 'sp.originSiteId', 'so.id')

async function listResults(request) {
  const { query, auth } = request
  const result = await getListResults(query, auth)
  return result
}

module.exports = { listResults }
