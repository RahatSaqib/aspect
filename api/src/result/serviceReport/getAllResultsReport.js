const Boom = require('@hapi/boom')
const { subDays } = require('date-fns')
const _ = require('lodash')
const flat = require('flat')
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

  const { partnerId, id: userId } = user
  const props = { query, partnerId, userId }
  const xdrAssayId = await assayToId('GxMtbXdr')
  const dataIncludesResistances = queryIncludesXdr(query, xdrAssayId)
  const columnsFromAssaySchema = await getColumnsFromAssaySchema(props)
  const columnsFromCustomFields = await getColumnsFromCustomFields({ partnerId, assayId: query.assayId })

  const { data, extraColumns = [] } = await getResultsForExport(
    auth,
    query,
    dataIncludesResistances,
    columnsFromCustomFields
  )

  const columns = [
    ...extraColumns.map(column => ({
      key: column.db,
      header: column.title,
    })),
    // TODO: move below items to Excel template for better formatting and translations
    { key: 'deviceStateName', header: 'State' },
    { key: 'caseExternalId', header: 'Case ID' },
    { key: 'resultCategoryGroup', header: 'Result' },
    { key: 'resultText', header: 'Raw Result' },
    { key: `mtbResult`, header: 'MTB' },
    ...(dataIncludesResistances ? XDR_RESISTANCES.map(name => ({ key: `xdrResistance${name}`, header: name })) : []),
    { key: 'sampleCollectedOn', header: 'Sample Collected Date' },
    { key: 'sampleOriginSiteName', header: 'Sample Collection Site' },
    { key: 'resultTreatmentStatus', header: 'Follow Up Status' },
    { key: 'followUpName', header: 'Follow Up' },
    { key: 'followUpDate', header: 'Follow Up Date' },
    { key: 'followUpComment', header: 'Follow Up Comment' },
    { key: 'recordedInRegister', header: 'Recorded In Register' },
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
    ...columnsFromAssaySchema, // Legacy code, apparently doesn't work
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
      { key: 'patientId', header: 'Patient Id' },
    ],
    // TODO: use i18n string, because `exportData()` uses locale file templates with all labels translated
    defaultNoDataMessage: 'No data',
  }
  return dataset
}

async function getResultsForExport(auth, query, dataIncludesResistances, columnsFromCustomFields) {
  const { timezoneIANA } = await getUser(auth.credentials.name)

  const selectFields = {
    ...COMMON_LIST_FIELDS_UTC,
    resultText: knex.raw('r.resultData->>"$.resultText"'),
    mtbResult: knex.raw(`
      CASE
        WHEN rc1.externalId = "Detected" AND a.externalId IN ("GxMtbRif", "GxMtbRifUltra") THEN CONCAT("Detected, ", r.resultData->>"$.bacterialLoad")
        WHEN rc1.externalId = "Detected" AND a.externalId IN ("GxMtbXdr") THEN "Detected"
      ELSE NULL END`),
    ...(dataIncludesResistances
      ? XDR_RESISTANCES.reduce((acc, name) => {
          acc[`xdrResistance${name}`] = knex.raw(`
            CASE
              WHEN a.externalId = "GxMtbXdr" AND rc1.externalId = "Detected" THEN
                (CASE WHEN r.resultData->>"$.allResistances.${name}" = "NotDetected"
                  THEN "Not Detected"
                  ELSE r.resultData->>"$.allResistances.${name}"
                END)
              ELSE NULL
            END`)
          return acc
        }, {})
      : {}),
    ...columnsFromCustomFields.reduce((acc, column) => {
      const [columnName, ...attributes] = column.key.split('.')
      if (attributes.length > 0) {
        const attributePath = attributes.join('.')
        acc[column.key] = knex.raw(`${columnName}->>"$.${attributePath}"`)
      } else {
        acc[column.key] = knex.raw(columnName)
      }
      return acc
    }, {}),
    // override datetime fields with user time offset:
    startedOn: getDateTimeProjectionInTimeZoneIANA(knex, 'r.startedOn', timezoneIANA),
    endedOn: getDateTimeProjectionInTimeZoneIANA(knex, 'r.endedOn', timezoneIANA),
    consumableExpirationDate: getDateTimeProjectionInTimeZoneIANA(knex, 'r.consumableExpirationDate', timezoneIANA),
    createdOn: getDateTimeProjectionInTimeZoneIANA(knex, 'r.createdOn', timezoneIANA),
    updatedOn: getDateTimeProjectionInTimeZoneIANA(knex, 'r.updatedOn', timezoneIANA),
    sampleCollectedOn: getDateTimeProjectionInTimeZoneIANA(knex, 'sp.collectedOn', timezoneIANA),
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

  const baseQuery = getQueryForResultsListAndExport(query, dataConstraints).select(selectFields)

  // Override baseQuery from to use index result_partner_endedOn_index for performance issues
  const asd = knex
    // .from(baseQuery.from(knex.raw('Result r FORCE INDEX (result_deviceId_endedOn_index)')).as('baseQ'))
    .from(baseQuery.as('baseQ'))
    .leftJoin(getLatestFollowUps().as('lastestFollowUps'), 'baseQ.id', 'lastestFollowUps.resultId')
    // .modify(sortPageParams, query, 'endedOn')
    .select('baseQ.*', 'lastestFollowUps.followUpName', 'lastestFollowUps.followUpDate')

  console.log('🚀 ~ getResultsForExport ~ asd:', asd.toString())

  console.time('getResultsForExport')
  const data = await asd
  console.timeEnd('getResultsForExport')

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

const queryIncludesXdr = (query, xdrAssayId) => {
  return (
    xdrAssayId &&
    (!query.assayId ||
      query.assayId === xdrAssayId ||
      (Array.isArray(query.assayId) && query.assayId.includes(xdrAssayId)))
  )
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
