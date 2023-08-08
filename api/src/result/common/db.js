const { subDays, subMonths } = require('date-fns')
const _ = require('lodash')
const { getConstraints, addConstraints, addPartnerQueryConstraints } = require('../../auth/constraints')
const { getUser } = require('../../auth/service')
const { SELECT_FIELDS_UTC } = require('../query')
const { knex, filterParams, filterDateRangeParams } = require('../../db')
const { getDatesFromQuery } = require('../../shared/date')
const { allAssayToId, allResultCategoryToId } = require('../../shared/dictionary')
const getPositiveCategoriesExternalIds = require('../../resultCategory/service')
const { pageParams, sortParams } = require('../../db')
const { getBaseQueryForFactResultsDeviceByTimeFrame } = require('../../fact/common/db')

async function getResultByResultId(auth, resultId, fields = SELECT_FIELDS_UTC) {
  const dataConstraints = await getConstraints(auth.credentials)
  const { userName } = await getUser(auth.credentials.name)
  const results = await getBaseQueryForResults()
    .join('ResultType as rt', 'rt.id', 'r.resultTypeId')
    .select('rt.excluded', 'rt.id as resultTypeId')
    .where('r.id', resultId)
    .modify(
      addConstraints,
      dataConstraints,
      {
        device: 'd',
        result: 'r',
      },
      { displayResult: 'all' }
    )
    .select({
      resultText: knex.raw(
        `CONCAT(a.resultCategory1label,':',IFNULL(rc1.name, ''), '|', a.resultCategory2label ,':',IFNULL(rc2.name, '-'))`
      ),
      stateId: 'st.id',
      deviceTypeId: 'dt.id',
      resultCategory1: 'r.resultCategory1',
      resultCategory2: 'r.resultCategory2',
      sampleTypeId: 'stp.id',
      resultSourceExternalId: 'rso.externalId',
      partnerId: 'p.id',
      partnerPluginName: 'p.plugin',
      deviceTypePluginName: 'dt.plugin',
      deviceId: 'r.deviceId',
      ...fields,
    })

  let data = null
  // translate result data back to an object and get assay details
  // if selecting the result was successful
  if (results.length === 1) {
    ;[data] = results
    if (data.resultData) {
      data.resultData = JSON.parse(data.resultData)
      // full result text for the result details page
      data.fullResultText = data.resultData.resultText
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
        .join('DeviceType as dt', 'dt.id', 'a.deviceTypeId')
        .where('a.id', data.assayId)
        .first('a.*', 'dt.externalId as deviceTypeExternalId')
      if (data.assay.resultDataSchema) {
        data.assay.resultDataSchema = JSON.parse(data.assay.resultDataSchema)
      }
      if (data.assay.patientDataSchema) {
        data.assay.patientDataSchema = JSON.parse(data.assay.patientDataSchema)
      }
    }
    // select files attached to this result
    const { data: files } = await showFileReferencesById(auth, resultId)
    data.files = files

    const { data: followUps } = await showResultFollowUps(resultId, dataConstraints)
    data.followUps = followUps
  }

  if (data) {
    getResultTreatmentStatus(data)
    data.resultNotes = await getResultNotesByResultId(resultId)
    data.resultTreatmentStatusCreatedBy = userName

    if (data.resultData && data.resultData.detectedResistance && data.resultData.detectedResistance.length > 0)
      data.detectedResistance = data.resultData.detectedResistance.join(', ')

    data.customFields = await getCustomFieldsForResult(data)
  }

  return { ok: results.length === 1, data }
}

function getResultTreatmentStatus(response) {
  if (response.requiresTreatment) {
    const today = new Date()
    const lastSixteenDays = subDays(today, 16)
    const lastThirtyTwoDays = subDays(today, 32)
    const isPastThirtyTwoDays = response.endedOn <= lastThirtyTwoDays
    const isPastSixteenDays = response.endedOn <= lastSixteenDays && response.endedOn > lastThirtyTwoDays
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

async function getCustomFieldsForResult({ deviceId, partnerId, countryId, assayId, diseaseId } = {}) {
  const { getCustomFields } = require('../../forms/service')
  let customFields = (await getCustomFields(partnerId, deviceId, countryId, assayId, diseaseId))?.fields
  customFields = _.sortBy(customFields, ['order', 'name'])
  customFields = customFields.map(
    ({ title, source, fieldType, order, controlType, validation, items, condition, filters, optional, id }) => ({
      title,
      source,
      fieldType,
      order,
      controlType,
      validation,
      items,
      condition,
      filters,
      optional,
      id,
    })
  )
  return customFields
}

const getBaseResults = () =>
  knex('Result as r')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .innerJoin('AssayType as at', 'a.assayTypeId', 'at.id')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('ResultSource as rso', 'r.resultSourceId', 'rso.id')
    .leftJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .leftJoin('Disease as dis', 'at.diseaseId', 'dis.id')
    .leftJoin('PartnerAssay as pa', q => {
      q.on('r.assayId', 'pa.assayId').andOn('r.partnerId', 'pa.partnerId')
    })
    .leftJoin('Geography as g', 'r.geographyId', 'g.id')
    .leftJoin('Country as c', 'g.countryId', 'c.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as lg', 'g.lgaId', 'lg.id')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .leftJoin('Sample as sp', 'r.sampleId', 'sp.id')
    .leftJoin('SampleType as stp', 'sp.sampleTypeId', 'stp.id')
    .leftJoin('Site as so', 'sp.originSiteId', 'so.id')
    .leftJoin('Site as si', 'd.siteId', 'si.id')

const getBaseQueryForResults = () =>
  getBaseResults()
    .leftJoin('ResultCategoryAssay as rca', q => {
      q.on('r.assayId', 'rca.assayId').andOn('r.resultCategory1', 'rca.resultCategoryId')
    })
    .leftJoin('ResultCategoryAssay as rca2', q => {
      q.on('r.assayId', 'rca2.assayId').andOn('r.resultCategory2', 'rca2.resultCategoryId')
    })
    .leftJoin('ResultForm as rf', q => {
      q.on('r.assayId', 'rf.assayId').andOn('r.partnerId', 'rf.partnerId')
    })
    .leftJoin('Partner as p', 'r.partnerId', 'p.id')
    .leftJoin('ResultWorkflowLog as rsl', 'r.resultWorkflowStatusLogId', 'rsl.id')
    .leftJoin('ResultWorkflowStatus as rs', 'rsl.resultWorkflowStatusId', 'rs.id')
    .leftJoin('ResultTreatmentStatusLog as rtsl', 'r.treatmentStatusLogId', 'rtsl.id')
    .leftJoin('ResultTreatmentStatus as rts', 'rtsl.resultTreatmentStatusId', 'rts.id')
    .leftJoin('Site as sirep', 'r.reportableSiteId', 'sirep.id')
    .leftJoin('ResultStatusLog as rslog', 'r.resultStatusLogId', 'rslog.id')
    .leftJoin('Person as ptr', 'rslog.createdBy', 'ptr.userId')
    .leftJoin('PatientCase as ca', 'ca.id', 'r.patientCaseId')

function getQueryForResultsListAndExport(query, dataConstraints) {
  const { showUnapprovedDevices = false, resultCategoryGroupId, assayId } = query
  const displayResult = query.displayResult || 'actual'

  const resultQuery = getBaseQueryForResults()
    .leftJoin('Site as sdpn', 'sdpn.id', 'd.siteId')
    .leftJoin('Geography as gdpn', 'sdpn.geographyId', 'gdpn.id')
    .leftJoin('State as stdpn', 'stdpn.id', 'gdpn.stateId')
    .modify(queryBuilder => {
      // this join is very expensive (doubles query time) and we're only using it for filtering, so only join on demand
      if (resultCategoryGroupId) {
        queryBuilder.leftJoin('ResultCategoryGroup as rcg', qbRcg => {
          qbRcg
            .on('r.assayId', 'rcg.assayId')
            .andOn(qbAndOn => {
              qbAndOn.on(knex.raw('rcg.resultCategory1Id IS NULL')).orOn('r.resultCategory1', 'rcg.resultCategory1Id')
            })
            .andOn(qbAndOn => {
              qbAndOn.on(knex.raw('rcg.resultCategory2Id IS NULL')).orOn('r.resultCategory2', 'rcg.resultCategory2Id')
            })
        })
      }
      if (query.consumableId)
        queryBuilder.join('InventoryLog as il', 'il.resultId', 'r.id').where('il.consumableId', query.consumableId)
      if (!_.isEmpty(assayId)) queryBuilder.whereIn('r.assayId', assayId)
      if (query.reportableSiteId || query.reportableSiteName) {
        /**
         * onlyEverTransferred filter can only be applied if
         * reportableSiteId or reportableSiteName is set
         * In UI, the first one is shown only if the second one is entered.
         */
        if (query.onlyEverTransferred) {
          /**
           * If only ever transferred is requested,
           * then we should show only the results that were ever transferred from the reportable site.
           * For this, we should:
           * - Get all the transfer logs
           * - ...where this result was transferred
           * - ...and the previous reportable site was the one specified in the reportableSiteId or reportableSiteName filter
           */
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
        } else {
          /**
           * If only ever transferred is NOT requested,
           * then we should show only the results with the reportable site id/name associated
           */
          // eslint-disable-next-line no-lonely-if
          if (query.reportableSiteId) {
            queryBuilder.where('sirep.id', query.reportableSiteId)
          } else {
            queryBuilder.where('sirep.name', 'LIKE', `%${query.reportableSiteName}%`)
          }
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
      workflowStatusId: 'rs.id',
      treatmentStatusId: 'rts.id',
      patientCaseId: 'r.patientCaseId',
      diseaseId: 'dis.id',
      onlyReportableResults: 'rca.reportable',
      resultCategoryGroupId: 'rcg.externalId',
      assayId: 'a.id',
    })
    .modify((queryBuilder, params) => {
      if (params.onlyDownloadedByReporter) queryBuilder.innerJoin('ResultDownloadLog as rdl', 'r.id', 'rdl.resultId')

      if (params.onlyTreatmentRequired || params.treatmentStatus) {
        /**
         * If treatment filters are required, then we get only the results delivered and downloaded in the reporter app
         */
        queryBuilder.andWhere(b => {
          b.where('rca.requiresTreatment', true).orWhere('rca2.requiresTreatment', true)
        })
      }

      if (params.patientOrResearchId) {
        queryBuilder.where(builder =>
          builder
            .whereRaw('LOWER(JSON_EXTRACT(r.patientData, "$.id")) like LOWER(JSON_QUOTE(?))', [
              `%${params.patientOrResearchId}%`,
            ])
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
        result: 'r',
        country: 'c',
        disease: 'dis',
      },
      { displayResult, showUnapprovedDevices }
    )

  return resultQuery
}

async function showFileReferencesById(auth, resultId) {
  const dataConstraints = await getConstraints(auth.credentials)
  const fileReferences = await knex('ResultFileReference as rf')
    .join('FileReference as f', 'f.id', 'rf.fileReferenceId')
    .join('Result as r', 'r.id', 'rf.resultId')
    .join('Sample as sp', 'r.sampleId', 'sp.id')
    .join('FileContentType as fct', 'f.fileContentTypeId', 'fct.id')
    .join('Device as d', 'r.deviceId', 'd.id')
    .where('rf.resultId', resultId)
    .orderBy('f.id', 'asc')
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      result: 'r',
      sample: 'sp',
    })
    .select(
      'f.id',
      'f.name',
      'f.length',
      'f.createdOn',
      'fct.externalId as fileContentType',
      'fct.mimeType',
      'fct.mimeSubtype'
    )
    .then(items =>
      items.map(ref => {
        ref.url = `/result/file/${resultId}/${ref.id}/${ref.name}`
        return ref
      })
    )
  return { data: fileReferences }
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
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      result: 'r',
      sample: 'sp',
    })
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

async function getResultNotesByResultId(resultId) {
  const resultNotes = await knex('ResultNote as rn')
    .leftJoin('User as u', 'rn.createdBy', 'u.id')
    .leftJoin('ResultNoteType as rt', 'rt.id', 'rn.resultNoteTypeId')
    .where('rn.resultId', resultId)
    .orderBy('rn.createdOn', 'desc')
    .select('u.name as createdBy', 'rn.text', 'rn.id', 'rn.changedOn', 'rn.createdOn', 'rt.name as noteType')

  return resultNotes
}

function getQueryForDataExtract(query, dataConstraints) {
  const { showUnapprovedDevices = false } = query
  const displayResult = query.displayResult || 'actual'

  const resultQuery = getBaseResults()
    .leftJoin('Geography as go', 'so.geographyId', 'go.id')
    .leftJoin('State as stateo', 'go.stateId', 'stateo.id')
    .leftJoin('Lga as lgao', 'go.lgaId', 'lgao.id')
    .leftJoin(
      knex('Result as minr')
        .select('minr.deviceId')
        .min('minr.endedOn as minDate')
        .groupBy('minr.deviceId')
        .as('firstResult'),
      'firstResult.deviceId',
      'd.id'
    )
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
      diseaseId: 'dis.id',
      assayId: 'a.id',
    })
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
        result: 'r',
        country: 'c',
        disease: 'dis',
      },
      { showUnapprovedDevices, displayResult }
    )

  return resultQuery
}

const getResultCountBaseGroupBySiteId = (assayIds, resultCategoryIds, dataConstraints, query) => {
  const dates = getDatesFromQuery(query)
  let { dateFrom } = dates
  const { dateTo } = dates
  if (dateFrom >= dateTo) {
    dateFrom = subMonths(dateTo, 1)
  }

  const positiveResultCategories = _.values(_.pick(resultCategoryIds, getPositiveCategoriesExternalIds()))
  const mtbDetected = `
    JSON_SEARCH(
      r.resultData ->> '$.detectedResistance[*]',
      'one',
      'MTB'
    ) IS NOT NULL
    OR
    r.resultCategory1 IN (${positiveResultCategories})
  `

  const counter = (id, condition) =>
    knex.raw(`
    DISTINCT
    CASE
      WHEN ${condition}
      THEN ${id}
      ELSE null
    END
  `)

  const countXdr = value =>
    counter(
      'r.id',
      `
    JSON_SEARCH(
      r.resultData ->> '$.detectedResistance[*]',
      'one',
      '${value}'
    ) IS NOT NULL
  `
    )

  return knex('Site as s')
    .innerJoin('Device as d', 's.id', 'd.siteId')
    .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .leftOuterJoin('Result as r', onQuery => {
      onQuery
        .on('d.id', 'r.deviceId')
        .andOn('r.endedOn', '>=', knex.raw(`'${new Date(dateFrom).toISOString()}'`))
        .andOn('r.endedOn', '<', knex.raw(`'${new Date(dateTo).toISOString()}'`))
    })
    .leftOuterJoin('Assay as a', 'r.assayId', 'a.id')
    .leftOuterJoin('SiteTag as sita', 's.id', 'sita.siteId')
    .leftOuterJoin('Tag as t', 't.id', 'sita.tagId')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .where(qWhere => {
      qWhere.whereIn('a.id', [assayIds.GxMtbXdr]).orWhereNull('a.id')
    })
    .modify(addConstraints, dataConstraints, { site: 's', geography: 'g' })
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      siteName: 's.name',
    })
    .select(`s.id as siteId`, 'g.stateId', 'g.lgaId')
    .groupBy('s.id')
    .select(knex.raw('CASE WHEN COUNT(r.id) IS NOT NULL AND COUNT(r.id) > 0 THEN 1 ELSE 0 END as hasPerformedXdr')) // -> to be changed in follow-up
    .count({
      isPmdt: knex.raw(`DISTINCT CASE WHEN t.title = 'PMDT' THEN 1 ELSE null END`),
      cntAll: knex.raw('DISTINCT r.id'),
      cnt_mtb: counter('r.id', mtbDetected),
      cnt_inh: countXdr('INH'),
      cnt_flq: countXdr('FLQ'),
      cnt_amk: countXdr('AMK'),
      cnt_kan: countXdr('KAN'),
      cnt_cap: countXdr('CAP'),
      cnt_eth: countXdr('ETH'),
      cnt_Invalid: counter('r.id', `r.resultCategory1 = ${resultCategoryIds.Invalid}`),
      cnt_NoResult: counter('r.id', `r.resultCategory1 = ${resultCategoryIds.NoResult}`),
      cnt_Error: counter('r.id', `r.resultCategory1 = ${resultCategoryIds.Error}`),
    })
    .clone()
}

const getXdrDevicesSummary = async (dataConstraints, query) => {
  const assayIds = await allAssayToId()
  const resultCategoryIds = await allResultCategoryToId()
  const countsBase = getResultCountBaseGroupBySiteId(assayIds, resultCategoryIds, dataConstraints, query)

  const counterField = name => knex.raw(`IFNULL(SUM(_sub.${name}), 0) as ${name}`)
  const baseQuery = knex('Geography as g')
    .modify(qb => {
      if (query.lgaId) {
        qb.innerJoin('Site as location', 'g.id', 'location.geographyId')
        qb.leftJoin(countsBase.as('_sub'), '_sub.siteId', 'location.id')
      } else if (query.stateId) {
        qb.innerJoin('Lga as location', 'g.lgaId', 'location.id')
        qb.leftJoin(countsBase.as('_sub'), '_sub.lgaId', 'location.id')
      } else {
        qb.innerJoin('State as location', 'g.stateId', 'location.id')
        qb.leftJoin(countsBase.as('_sub'), '_sub.stateId', 'location.id')
        qb.whereNull('g.lgaId')
      }
    })
    .modify(addConstraints, dataConstraints, { geography: 'g' })
    .modify(filterParams, query, { countryId: 'g.countryId', stateId: 'g.stateId', lgaId: 'g.lgaId' })

  const [totals] = await baseQuery
    .clone()
    .select(
      knex.raw(`'TOTAL' as locationName`),
      knex.raw(`COUNT(DISTINCT location.id) as totalRecords`),
      counterField('isPmdt'),
      counterField('hasPerformedXdr'),
      counterField('cntAll'),
      counterField('cnt_mtb'),
      counterField('cnt_inh'),
      counterField('cnt_flq'),
      counterField('cnt_amk'),
      counterField('cnt_kan'),
      counterField('cnt_cap'),
      counterField('cnt_eth'),
      counterField('cnt_Invalid'),
      counterField('cnt_NoResult'),
      counterField('cnt_Error')
    )

  const data = await baseQuery
    .clone()
    .groupBy('location.id')
    .select(
      `location.name as locationName`,
      counterField('isPmdt'),
      counterField('hasPerformedXdr'),
      counterField('cntAll'),
      counterField('cnt_mtb'),
      counterField('cnt_inh'),
      counterField('cnt_flq'),
      counterField('cnt_amk'),
      counterField('cnt_kan'),
      counterField('cnt_cap'),
      counterField('cnt_eth'),
      counterField('cnt_Invalid'),
      counterField('cnt_NoResult'),
      counterField('cnt_Error')
    )
    .modify(sortParams, query, 'locationName')
    .modify(_q => {
      // For export, we don't provide paging params - we should get all records
      if (query.size) _q.modify(pageParams, query)
    })

  data.unshift(_.omit(totals, 'totalRecords'))
  return { total: totals.totalRecords, data, length: data.length }
}

async function processGroupedQuery(resultQuery, groupBy, dateColumn = 'IFNULL(r.endedOn, r.startedOn)') {
  // handle possible groups:
  const paramToDb = {
    resultCategory1: ['rc1.externalId as resultCategory1', 'rc1.i18nKey as resultCategory1I18nKey '],
    resultCategory2: ['rc2.externalId as resultCategory2', 'rc2.i18nKey as resultCategory2I18nKey '],
    assay: ['a.externalId as assay', 'a.i18nKey as assayI18nKey'],

    week: knex.raw(`DATE_FORMAT(${dateColumn}, "%x-%v") as week_value`),
    month: knex.raw(`DATE_FORMAT(${dateColumn}, "%Y-%m") as month_value`),
    quarter: knex.raw(`CONCAT( YEAR(${dateColumn}),'-',QUARTER(${dateColumn}) ) as quarter_value`),
    year: knex.raw(`DATE_FORMAT(${dateColumn}, "%Y") as year_value`),
    day: knex.raw(`DATE_FORMAT(${dateColumn}, "%Y-%m-%d") as day_value`),

    gender: knex.raw('replace(r.patientData ->> "$.gender", "null", null) as gender'),
    age: knex.raw('replace(r.patientData ->> "$.age", "null", null) as age'),
    state: 'st.name as state',
    followUp: [`fu.externalId as followUp`, `fu.i18nKey as followUpI18nKey`],
  }

  const reservedWords = ['day', 'month', 'quarter', 'week', 'year']

  groupBy.forEach(g => {
    resultQuery.modify(qb => {
      const name = reservedWords.includes(g) ? `${g}_value` : g
      qb.select(paramToDb[g])
      qb.groupBy(name)
      qb.orderBy(name)
    })
  })

  const data = (await resultQuery).map(item => {
    groupBy.forEach(g => {
      if (reservedWords.includes(g)) {
        // set value for originally intended prop name and delete temporal prop
        item[g] = item[`${g}_value`]
        delete item[`${g}_value`]
      }
    })
    return item
  })

  return data
}

function getClinicalIndicatorQueryForFactTable(dataConstraints, assay, groupBy, query) {
  return getBaseQueryForFactResultsDeviceByTimeFrame(knex, {
    addConstraints,
    dataConstraints,
    filterParams,
    assay,
    query,
  }).where(function () {
    // skip filtering by 'rca.reportable' if grouping by 'assay'
    if (!groupBy.includes('assay')) {
      this.where('rca.reportable', true)
    }
  })
}

function getClinicalIndicatorQueryForResultsTable(dataConstraints, assay, groupBy, query) {
  return knex('Result as r')
    .innerJoin('Device as d', 'd.id', 'r.deviceId')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('Site as s', 's.id', 'r.siteId')
    .innerJoin('Assay as a', 'a.id', 'r.assayId')
    .innerJoin('AssayType as at', 'at.id', 'a.assayTypeId')
    .innerJoin('ResultCategory as rc1', 'rc1.id', 'r.resultCategory1')
    .leftOuterJoin('ResultCategory as rc2', 'rc2.id', 'r.resultCategory2')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as st', 'st.id', 'g.stateId')
    .innerJoin('ResultCategoryAssay as rca', function () {
      this.on('r.assayId', 'rca.assayId').andOn('r.resultCategory1', 'rca.resultCategoryId')
    })
    .modify(addConstraints, dataConstraints, {
      assay: 'a',
      assayType: 'at',
      device: 'd',
      site: 's',
      geography: 'g',
      result: 'r',
    })
    .modify(filterParams, query, {
      assay: 'a.externalId',
      countryId: 'g.countryId',
      partnerId: 'g.partnerId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      siteName: 's.name',
      deviceName: 'd.name',
      deviceType: 'dt.externalId',
    })
    .modify(qb => {
      if (query.minDate) {
        qb.where('r.startedOn', '>=', query.minDate)
      }
      if (query.maxDate) {
        qb.where('r.startedOn', '<=', query.maxDate)
      }
      if (!query.assay && assay) {
        qb.whereIn('a.externalId', assay)
      }
      if (query.assayType) {
        qb.where('at.externalId', '=', query.assayType)
      }
      if (query.resultCategory1) {
        qb.where('rc1.externalId', '=', query.resultCategory1)
      }
      if (query.resultCategory2) {
        qb.where('rc2.externalId', '=', query.resultCategory2)
      }
      if (query.resistance) {
        qb.whereRaw(`
      JSON_SEARCH(
        r.resultData ->> '$.detectedResistance[*]',
        'one',
        '${query.resistance}'
      ) IS NOT NULL
    `)
      }
    })
    .where(function () {
      // skip filtering by 'rca.reportable' if grouping by 'assay'
      if (!groupBy.includes('assay')) {
        this.where('rca.reportable', true)
      }
    })
    .orderBy('r.startedOn', 'r.endedOn')
    .count('r.id as cnt')
}

module.exports = {
  getResultByResultId,
  getQueryForResultsListAndExport,
  showFileReferencesById,
  getResultNotesByResultId,
  getBaseQueryForResults,
  getQueryForDataExtract,
  getCustomFieldsForResult,
  getXdrDevicesSummary,
  processGroupedQuery,
  getClinicalIndicatorQueryForFactTable,
  getClinicalIndicatorQueryForResultsTable,
}
