const Boom = require('@hapi/boom')
const { subDays } = require('date-fns')
const _ = require('lodash')
const flat = require('flat')
const startCase = require('lodash/startCase')
const { assayToId } = require('../../shared/dictionary')
const { knex, sortPageParams } = require('../../db')
const { getPersonByPersonId, getUser } = require('../../auth/service')
const { getAllAssaySchemas } = require('../../assay/service')
const { SORT_FIELDS, COMMON_LIST_FIELDS_UTC } = require('../query')
const { getDateTimeProjectionInTimeZoneIANA } = require('../../shared/date')
const { getQueryForResultsListAndExport, getCustomFieldsForResult } = require('../common/db')
const { getConstraints } = require('../../auth/constraints')
const { XDR_RESISTANCES } = require('../../shared/constants')

/**
 This report logic is consumed by the all results report, as well as from the csv download of the result list.
 */
module.exports = async (auth, query) => {
  const user = await getPersonByPersonId(auth.credentials.personId)

  // get whole dataset - based on current query params (sorting, filtering) and auth constraints
  // ---------------
  // change query page/size values to get whole dataset (not only currently paged items)
  query.page = 0
  // For performance issues we are going to limit this report to max 1m results.
  query.size = query.maxNumberOfRecords || 1000000

  // For performance issues this enforce to use the result_partner_endedOn_index Index, because it helps to reduce query time down to  60%
  if (_.isNil(query.minDate)) query.minDate = subDays(new Date(query.maxDate), query.daysToSubstract || 360)

  const { data, extraColumns = [] } = await getResultsForExport(auth, query)
  const { partnerId, id: userId } = user
  const props = { query, partnerId, userId }
  const columnsFromAssaySchema = await getColumnsFromAssaySchema(props)
  const columnsFromCustomFields = await getColumnsFromCustomFields({ partnerId, assayId: query.assayId })
  const xdrAssayId = await assayToId('GxMtbXdr')
  const dataIncludesResistances = queryIncludesXdr(query, xdrAssayId)
  const columns = [
    ...extraColumns.map(column => ({
      key: column.db,
      header: column.title,
    })),
    // TODO: move below items to Excel template for better formatting and translations
    { key: 'deviceStateName', header: 'State' },
    { key: 'caseExternalId', header: 'Case ID' },
    { key: 'resultCategoryGroup', header: 'Result' },
    { key: 'resultData.resultText', header: 'Raw Result' },
    { key: `mtbResistance`, header: 'MTB' }, // mtbResistance is defined in func dataSelector()
    ...(dataIncludesResistances
      ? XDR_RESISTANCES.map(name => ({ key: `resultData.allResistances.${name}`, header: name }))
      : []),
    { key: 'sampleCollectedOn', header: 'Sample Collected Date' },
    { key: 'sampleOriginSiteName', header: 'Sample Collection Site' },
    { key: 'resultWorkflowStatus', header: 'Result Status' },
    { key: 'resultTreatmentStatus', header: 'Follow Up Status' },
    { key: 'followUpName', header: 'Follow Up' },
    { key: 'followUpDate', header: 'Follow Up Date' },
    { key: 'followUpComment', header: 'Follow Up Comment' },
    { key: 'recordedInRegister', header: 'Recorded In Register' },
    { key: 'resultWorkflowChangedOn', header: 'Result Status Changed On' },
    { key: 'consumableSerial', header: 'Consumable Serial' },
    { key: 'consumableLot', header: 'Consumable Lot' },
    { key: 'consumableExpirationDate', header: 'Consumable Expiration Date' },
    { key: 'instrumentSerial', header: 'Instrument Serial' },
    { key: 'moduleName', header: 'Module' },
    { key: 'moduleSerial', header: 'Module Serial' },
    { key: 'researchId', header: 'Research ID' },
    { key: 'senderOperator', header: 'Operator' },
    { key: 'errorCode', header: 'Error Code' },
    { key: 'errorNotes', header: 'Error notes' },
    { key: 'notes', header: 'Notes' },
    { key: 'assayName', header: 'Assay' },

    // dynamic columns from different schema json fields
    ...columnsFromAssaySchema,
    ...columnsFromCustomFields,
  ]

  const dataset = {
    ok: true,
    total: data.length,
    length: data.length,
    data,
    dynamicColumns: columns,
    fixedColumns: [
      { key: 'endedOn', header: 'Test Date' },
      { key: 'stateName', header: 'Sample State' },
      { key: 'siteName', header: 'Sample Site' },
      { key: 'sampleId', header: 'Sample ID' },
      { key: 'deviceName', header: 'Device' },
      { key: 'assayName', header: 'Assay' },
      { key: 'errorCode', header: 'Error Code' },
      { key: 'resultWorkflowStatus', header: 'Workflow Status' },
      { key: 'patientId', header: 'Patient Id' },
    ],
    dataSelector: (
      dataRow // if you need to transform your dataset to another format, you should pass the transformation function to avoid iterate twice the datasource.
    ) => {
      const { resultData, mtbResistance } = humanizeResistances(dataRow, dataRow.assayId === xdrAssayId)
      return require('flat')({
        ...dataRow,
        mtbResistance,
        patientData: JSON.parse(dataRow.patientData),
        resultData,
        formData: JSON.parse(dataRow.formData),
        errorCode: _.replace(dataRow.errorCode || '', /(\r\n|\n|\r)/gm, ''),
        errorNotes: _.replace(dataRow.errorNotes || '', /(\r\n|\n|\r)/gm, ''),
        notes: _.replace(dataRow.notes || '', /(\r\n|\n|\r)/gm, ''),
      })
    },
    // TODO: use i18n string, because `exportData()` uses locale file templates with all labels translated
    defaultNoDataMessage: 'No data',
  }
  return dataset
}

async function getResultsForExport(auth, query) {
  const { timezoneIANA } = await getUser(auth.credentials.name)

  const selectFields = {
    ...COMMON_LIST_FIELDS_UTC,
    // override datetime fields with user time offset:
    startedOn: getDateTimeProjectionInTimeZoneIANA(knex, 'r.startedOn', timezoneIANA),
    endedOn: getDateTimeProjectionInTimeZoneIANA(knex, 'r.endedOn', timezoneIANA),
    resultWorkflowChangedOn: getDateTimeProjectionInTimeZoneIANA(knex, 'rsl.changedOn', timezoneIANA),
    consumableExpirationDate: getDateTimeProjectionInTimeZoneIANA(knex, 'r.consumableExpirationDate', timezoneIANA),
    createdOn: getDateTimeProjectionInTimeZoneIANA(knex, 'r.createdOn', timezoneIANA),
    updatedOn: getDateTimeProjectionInTimeZoneIANA(knex, 'r.updatedOn', timezoneIANA),
    sampleCollectedOn: getDateTimeProjectionInTimeZoneIANA(knex, 'sp.collectedOn', timezoneIANA),
    resultWorkflowLogCreatedOn: getDateTimeProjectionInTimeZoneIANA(knex, 'rsl.createdOn', timezoneIANA),
    resultWorkflowLogChangedOn: getDateTimeProjectionInTimeZoneIANA(knex, 'rsl.changedOn', timezoneIANA),
    resultTreatmentStatusChangedOn: getDateTimeProjectionInTimeZoneIANA(knex, 'rtsl.changedOn', timezoneIANA),
    transferredOn: getDateTimeProjectionInTimeZoneIANA(knex, 'rslog.createdOn', timezoneIANA),
    firstViewedOn: getDateTimeProjectionInTimeZoneIANA(knex, 'r.firstViewedOn', timezoneIANA),
    deviceStateName: 'stdpn.name',
    resultCategoryGroup: 'rcg.name',
  }
  const sortableFields = [...SORT_FIELDS]

  const assayColumns = []
  if (query.assayId) {
    const assays = await knex('Assay as a')
      .modify(queryBuilder => {
        if (_.isArray(query.assayId)) queryBuilder.whereIn('a.id', query.assayId)
        else queryBuilder.where('a.id', query.assayId)
      })

      .select()

    for (const assay of assays) {
      if (assay.resultCategory1Label && selectFields.resultCategory1Name !== 'rc1.name') {
        selectFields.resultCategory1Name = 'rc1.name'
        sortableFields.push('resultCategory1Name')
        assayColumns.push({
          db: 'resultCategory1Name',
          type: 'string',
          title: assay.resultCategory1Label,
          i18nKey: assay.resultCategory1i18nKey,
        })
      }

      if (assay.resultCategory2Label && selectFields.resultCategory2Name !== 'rc2.name') {
        selectFields.resultCategory2Name = 'rc2.name'
        sortableFields.push('resultCategory2Name')
        assayColumns.push({
          db: 'resultCategory2Name',
          type: 'string',
          title: assay.resultCategory2Label,
          i18nKey: assay.resultCategory2i18nKey,
        })
      }
    }
  }

  // now we know if the sort that was passed is valid:
  if (query.sortCol && !sortableFields.includes(query.sortCol)) {
    return Boom.badRequest()
  }

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const baseQuery = getQueryForResultsListAndExport(query, dataConstraints).groupBy('r.id').select(selectFields)

  const data = await knex
    .from(baseQuery.as('baseQ'))
    .leftJoin(getLatestFollowUps().as('lastestFollowUps'), 'baseQ.id', 'lastestFollowUps.resultId')
    .leftJoin(
      getLatestResultWorkflowLog().as('latestResultWorkflowLog'),
      'baseQ.id',
      'latestResultWorkflowLog.resultId'
    )
    .modify(sortPageParams, query, 'endedOn')
    .select(
      'baseQ.*',
      'lastestFollowUps.followUpName',
      'lastestFollowUps.followUpDate',
      'latestResultWorkflowLog.followUpComment',
      'latestResultWorkflowLog.recordedInRegister'
    )

  return {
    data,
    extraColumns: assayColumns,
  }
}

async function getColumnsFromAssaySchema({ query, partnerId, userId }) {
  const columns = []
  const assaySchema = await getAllAssaySchemas(partnerId, userId, query.assayId)
  let resultData = {}
  let patientData = {}

  assaySchema.forEach(element => {
    if (element.patientDataSchema) {
      patientData = _.merge(patientData, JSON.parse(element.patientDataSchema))
    }
    if (element.resultDataSchema) {
      resultData = _.merge(resultData, JSON.parse(element.resultDataSchema))
    }
  })

  const flattenObjects = {
    ...flat({ resultData }),
    ...flat({ patientData }),
  }

  _.forEach(flattenObjects, (value, key) => {
    if (key.toLowerCase().indexOf('title') >= 0) {
      columns.push({
        header: value,
        key: key.replace('.title', '').replace('.properties', ''),
      })
    }
  })

  return columns
}

const getLatestFollowUps = () => {
  const subQuery = knex('ResultFollowUp')
    .select('resultId', 'followUpId', 'date', 'updatedOn')
    .andWhere('isDeleted', false)
    .select(knex.raw('ROW_NUMBER() OVER(PARTITION BY resultId ORDER BY updatedOn DESC) AS rowNumber'))

  return knex('FollowUp as fup')
    .select('rf.resultId', 'fup.name as followUpName', 'rf.date as followUpDate')
    .from(subQuery.as('rf'))
    .leftJoin('FollowUp as fup', 'rf.followUpId', 'fup.id')
    .join('FollowUpType as fut', 'fut.id', 'fup.followUpTypeId')
    .where('rf.rowNumber', 1)
    .andWhere('fut.externalId', 'treatment')
}

const getLatestResultWorkflowLog = () => {
  const subQuery = knex('ResultWorkflowLog')
    .select('resultId', 'resultWorkflowStatusId', 'reason', 'changedOn', 'createdOn')
    .select(knex.raw('ROW_NUMBER() OVER(PARTITION BY resultId ORDER BY createdOn DESC) AS rowNumber'))

  return knex
    .from(subQuery.as('rwl'))
    .leftJoin('ResultWorkflowStatus as rwsInner', 'rwl.resultWorkflowStatusId', 'rwsInner.id')
    .whereIn('rwsInner.externalId', ['acknowledged', 'flagged'])
    .andWhere('rwl.rowNumber', 1)
    .select(
      'rwl.resultId',
      'rwl.reason as followUpComment',
      knex.raw(`
        CASE
          WHEN rwsInner.externalId = 'acknowledged' THEN rwl.changedOn
          ELSE NULL
        END AS recordedInRegister
      `)
    )
}

const queryIncludesXdr = (query, xdrAssayId) => {
  return (
    xdrAssayId &&
    (!query.assayId ||
      query.assayId === xdrAssayId ||
      (Array.isArray(query.assayId) && query.assayId.includes(xdrAssayId)))
  )
}

const getResistanceValue = (resistance, resultText, defaultValue) => {
  if (!resultText) return defaultValue
  /**
   * patterns:
   *   PREFIX XXX Resistance @label_result_detected
   *   PREFIX XXX @label_result_detected
   *   PREFIX XXX detected
   *   PREFIX XXX Resistance @label_result_detected SUFFIX
   *   PREFIX XXX @label_result_detected SUFFIX
   *   PREFIX XXX detected SUFFIX
   *
   * examples:
   *   INH Resistance @label_result_detected
   *   ENH @label_result_detected
   *   High INH Resistance @label_result_detected
   *   Very Low ETH @label_result-detected
   *   High MTB @label_result-detected
   *   Low MTB detected
   *   MTB detected
   *   MTB detected MEDIUM
   *   MTB DETECTED VERY LOW
   *   MTB @label_result_concatenate_two @label_result_detected @label_semi_quant_level_text_very_low
   *   MTB @label_result_concatenate_two @label_result_detected @label_semi_quant_level_text_high
   *   VeryLow MTB Detected
   *   Very-Low MTB Detected
   *   Very_Low MTB Detected
   *   Very Low MTB Detected
   */
  const re = new RegExp(
    `
\\b
    (?:
      (
        high  |  low  |  very[\\s-_]?low
      )?
      \\s+
    )?
    ${resistance}
\\s+
    (?:resistance\\s+)?
    (?:
      @label_result_concatenate_two
      [\\s,]+
    )?
    (?:@label[_-]result[_-])?
    (Detected)
    (?:
      [\\s,]+
      (?:
        @label[a-z_]+_text_
      )?
      (
        high  |  low  |  very[\\s-_]?low  |  [a-z]+
      )
    )?
\\b
  `.replace(/\s/g, ''), // remove all white spaces, tabs and line breaks
    'im' // <-- do not include `g` to let STRING.match(re) catch groups
  )
  /**
   * process found match and return constructed value, or ...
   */
  const match = resultText.match(re)
  if (match) {
    let [
      ,
      prefix,
      status, // only `Detected` now, but may be extended to Indeterminate or other statuses
      suffix, // i.e. empty or Medium, etc
    ] = match
    const getStartCase = txt => {
      if (!txt) return txt || ''
      txt = txt.toLowerCase()
      if (txt === 'verylow') txt = 'very low'
      return _.startCase(txt)
    }
    prefix = getStartCase(prefix)
    status = _.startCase(status.toLowerCase())
    suffix = getStartCase(suffix)
    const details = prefix || suffix
    return `${status}${details ? `, ${details}` : ''}`
  }
  /**
   * ... otherwise return default value
   */
  return defaultValue
}

const humanizeResistances = (dataRow, isMtbXdr) => {
  let { resultData, resultCategoryGroup: mtbResistance } = dataRow
  if (resultData) {
    /**
     * Hack to present a little bit clearer texts due to the lack of i18n handling in backend:
     */
    resultData = JSON.parse(resultData)
    const { resultText } = resultData
    if (isMtbXdr) {
      if (resultData.allResistances) {
        /**
         * if XDR was Detected (i.e. is in `detectedResistance` array), then add it's high/low/veryLow
         * details to the value.
         * --> Check helper func `checkResistance` in api/src/result/serviceReportBangladesh/index.js
         * to see how we handle this addition in the query.
         */
        const { detectedResistance } = resultData
        XDR_RESISTANCES.forEach(resistance => {
          let resistanceValue = startCase(resultData.allResistances[resistance])
          if (detectedResistance?.includes(resistance)) {
            resistanceValue = getResistanceValue(resistance, resultText, resistanceValue)
          }

          resultData.allResistances[resistance] = resistanceValue
        })
      }
    }
    /**
     * show empty cell if MTB is not detected in resultText
     */
    mtbResistance = getResistanceValue('MTB', resultText, '')
  }
  return { resultData, mtbResistance }
}

async function getColumnsFromCustomFields({ partnerId, assayId }) {
  const diseaseId = assayId
    ? (
        await knex('Assay as a')
          .join('AssayType as at', 'at.id', 'a.assayTypeId')
          .join('Disease as d', 'd.id', 'at.diseaseId')
          .whereIn('a.id', _.isArray(assayId) ? assayId : [assayId])
          .first(knex.raw('GROUP_CONCAT(d.id) as diseaseId'))
      ).diseaseId.split(',')
    : undefined // without assayId, the diseaseId will be undefined

  const customFields = await getCustomFieldsForResult({ partnerId, diseaseId, assayId })

  return customFields.map(cf => ({
    header: cf.title,
    key: cf.source,
  }))
}
