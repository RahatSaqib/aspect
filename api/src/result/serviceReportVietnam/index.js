const reduce = require('lodash/reduce')
const includes = require('lodash/includes')
const { format, endOfMonth, startOfMonth } = require('date-fns')
const { getUser } = require('../../auth/service')
const { getConstraints, addConstraints } = require('../../auth/constraints')
const { knex, filterDateRangeParams, filterParams } = require('../../db')
const [m4b1Mapping] = require('../../../templates/xpert_m4b1_patients/mapping')
const { getWellFormattedDateStringWithTimezone, startOfMonthUTC, endOfMonthUTC } = require('../../shared/date')
const { getTypeOfPatientCategory, getMappingFieldName } = require('./geneXpertM4B1PatientsReport')
const { SELECT_GX_MTB_CNT_BY_RESULT_CATEGORY } = require('../query')

const activeScreeningUseKey = 'Sàng lọc chủ động: ghi rõ'
const routineDiagnosticUseKey = 'Chẩn đoán thường quy'
const otherUseKey = 'Khác: ghi rõ'

function getBaseQuery(dataConstraints, query) {
  return knex('Result as r')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .leftOuterJoin('Site as s', 's.id', 'r.siteId')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftOuterJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      site: 's',
      geography: 'g',
      assay: 'a',
      result: 'r',
    })
    .modify(filterDateRangeParams, query, 'r.endedOn')
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      siteName: 's.name',
    })
}

async function getGeneXpertM4B1PatientsReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const rawReport = await getBaseQuery(dataConstraints, query)
    .whereIn('a.externalId', ['GxMtbRif', 'GxMtbRifUltra'])
    .groupBy([
      'rc1.id',
      'rc2.id',
      knex.raw(`r.resultData->>'$.customFieldData."257".value'`),
      knex.raw(`r.resultData->>'$.customFieldData."256".value'`),
      knex.raw(`r.resultData->>'$.customFieldData."251".value'`),
      knex.raw(`r.resultData->>'$.customFieldData."254".value'`),
    ])
    .select([
      'rc1.externalId as resultCategory1',
      'rc2.externalId as resultCategory2',
      knex.raw(`r.resultData->>'$.customFieldData."257".value' as typeOfPatient`),
      knex.raw(`r.resultData->>'$.customFieldData."256".value' as specimenType`),
      knex.raw(`r.resultData->>'$.customFieldData."251".value' as testingReason`),
      knex.raw(`r.resultData->>'$.customFieldData."254".value' as previouslyTreated`),
      knex.raw('COUNT(*) as quantity'),
    ])

  const defaultValues = {}
  // Init default values set to 0
  Object.values(m4b1Mapping).forEach(reportValue => {
    defaultValues[reportValue] = 0
  })
  // Get the types of patient included in the report
  const typesOfPatient = Object.keys(defaultValues).map(reportKey => reportKey.split('_')[2])

  const report = reduce(
    rawReport,
    (partialReport, reportItem) => {
      const typeOfPatient = getTypeOfPatientCategory(reportItem.typeOfPatient, reportItem.specimenType, typesOfPatient)

      const fieldName = getMappingFieldName(reportItem, typeOfPatient)
      partialReport[fieldName] += reportItem.quantity

      // "Active Screening/Other" is a separate count, not included in totals, so it's treated apart
      if (includes([activeScreeningUseKey, otherUseKey], reportItem.testingReason)) {
        partialReport[`ActiveScreening_${typeOfPatient}`] += reportItem.quantity
      }

      return partialReport
    },
    defaultValues
  )

  return {
    ok: true,
    data: report,
  }
}

async function getGeneXpertM4B2ActivitiesReport(auth, query) {
  const {
    mtbNotDetected,
    mtbDetectedRifNotDetected,
    mtbDetectedRifDetected,
    mtbDetectedRifIndeterminate,
    mtbTraceNoRif,
    mtbNoResult,
    mtbInvalid,
  } = SELECT_GX_MTB_CNT_BY_RESULT_CATEGORY
  const dataConstraints = await getConstraints(auth.credentials)
  const categoriesCnt = await getBaseQuery(dataConstraints, query)
    .whereIn('a.externalId', ['GxMtbRif', 'GxMtbRifUltra'])
    .select({
      mtbNotDetected,
      mtbDetectedRifNotDetected,
      mtbDetectedRifDetected,
      mtbDetectedRifIndeterminate,
      mtbTraceNoRif,
      mtbNoResult,
      mtbInvalid,
      error_5006_5007_5017: knex.raw("SUM(CASE WHEN r.errorCode IN ('5006', '5007', '5017') THEN 1 ELSE 0 END)"),
      error_1001_1002_2014_4009_4010_4017: knex.raw(
        "SUM(CASE WHEN r.errorCode IN ('1001', '1002', '2014', '4009', '4010', '4017') THEN 1 ELSE 0 END)"
      ),
      error_2008: knex.raw("SUM(CASE WHEN r.errorCode = '2008' THEN 1 ELSE 0 END)"),
      error_2005_2006_2016: knex.raw("SUM(CASE WHEN r.errorCode IN ('2005', '2006', '2016') THEN 1 ELSE 0 END)"),
      error_2035: knex.raw("SUM(CASE WHEN r.errorCode = '2035' THEN 1 ELSE 0 END)"),
      error_5011: knex.raw("SUM(CASE WHEN r.errorCode = '5011' THEN 1 ELSE 0 END)"),
      error_2037: knex.raw("SUM(CASE WHEN r.errorCode = '2037' THEN 1 ELSE 0 END)"),
      error_2126_2127: knex.raw("SUM(CASE WHEN r.errorCode IN ('2126', '2127') THEN 1 ELSE 0 END)"),
      error_5001_5002_5003_5004_5005: knex.raw(
        "SUM(CASE WHEN r.errorCode IN ('5001', '5002', '5003', '5004', '5005') THEN 1 ELSE 0 END)"
      ),
      error_other: knex.raw(
        "SUM(CASE WHEN r.errorCode IS NOT NULL AND r.errorCode NOT IN ('5006', '5007', '5017', '5001', '1001', '1002', '2014', '4009', '4010', '4017', '2008', '2005', '2006', '2016','2035', '5011', '2037', '2126', '2127', '5002', '5003', '5004', '5005') THEN 1 ELSE 0 END)"
      ),
      laboratories: knex.raw('GROUP_CONCAT(DISTINCT s.name ORDER BY s.name)'),
    })
    .first()

  return { ok: true, data: categoriesCnt }
}

async function getListRResistantTestReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const rows = await getBaseQuery(dataConstraints, query)
    .whereIn('a.externalId', ['GxMtbRif', 'GxMtbRifUltra'])
    .andWhere('rc2.externalId', 'Detected')
    .select([
      knex.raw("IFNULL(patientData->>'$.name', '-') as fullName"),
      knex.raw(
        "CASE WHEN IFNULL(patientData->>'$.age', 'null') = 'null' THEN '-' ELSE patientData->>'$.age' END as age"
      ),
      knex.raw(
        "CASE WHEN IFNULL(patientData->>'$.address', 'null') = 'null' THEN '-' ELSE patientData->>'$.address' END as address"
      ),
      knex.raw(
        `CASE WHEN IFNULL(r.resultData->>'$.customFieldData."257".value', 'null') = 'null' THEN '-' ELSE r.resultData->>'$.customFieldData."257".value' END as targetGroup`
      ),
      'r.endedOn as xpertResultDate',
      'r.notes',
    ])
  return {
    ok: true,
    data: {
      rows,
      total: rows.length,
    },
  }
}

async function getReasonForTestingReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  let { minDate: minDateStr = getWellFormattedDateStringWithTimezone(startOfMonth(new Date())) } = query
  const { maxDate: maxDateStr = getWellFormattedDateStringWithTimezone(endOfMonth(new Date())) } = query
  if (typeof minDateStr !== 'string') {
    minDateStr = minDateStr.toISOString()
  }
  const dateFrom = startOfMonthUTC(minDateStr)
  const dateTo = endOfMonthUTC(maxDateStr)
  const rows = await knex('Result as r')
    .leftJoin('Site as s', 's.id', 'r.siteId')
    .leftJoin('Geography as g', 'g.id', 'r.geographyId')
    .select([
      knex.raw(
        `IF(resultData->>'$.customFieldData."251".value' = 'null', 'N/A', resultData->>'$.customFieldData."251".value') AS fields`
      ),
      knex.raw(`count(resultData->>'$.customFieldData."251".value') AS total`),
    ])
    .andWhere(knex.raw(`resultData->>'$.customFieldData."251".value' is not null`))
    .modify(addConstraints, dataConstraints, {
      result: 'r',
    })
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      siteName: 's.name',
    })
    .modify(filterDateRangeParams, { minDate: dateFrom, maxDate: dateTo }, 'r.endedOn')
    // Keeping this to the Pr approve, if the dates are wrong filtred (now it takes 1 month), maybe it should bounded to the current day only)
    // .andWhere('r.endedOn', '>=', dateFrom)
    // .andWhere('r.endedOn', '<=', dateTo)
    .groupBy(knex.raw(`resultData->>'$.customFieldData."251".value'`))
  return {
    ok: true,
    data: rows,
    total: rows.length,
  }
}

async function getResultCountsByHIVStatus(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)

  const data = await getBaseQuery(dataConstraints, query)
    .whereIn('a.externalId', ['GxMtbRif', 'GxMtbRifUltra'])
    .select(
      knex.raw(`
        CASE CAST(resultData->>'$.customFieldData."255".value' AS UNSIGNED)
          WHEN 0 THEN 'HIV NEGATIVE'
          WHEN 1 THEN 'HIV POSITIVE'
          WHEN 2 THEN 'HIV UNKNOWN STATUS'
          ELSE 'HIV Status Unspecified'
        END as hivStatus
      `),
      'rc1.name as resultCategory1',
      'rc2.name as resultCategory2'
    )
    .groupBy('hivStatus', 'r.resultCategory1', 'r.resultCategory2')
    .count({
      cntAll: knex.raw('DISTINCT r.id'),
    })
    .orderBy('hivStatus')

  return {
    ok: true,
    data,
    total: data.length,
  }
}

const joinCurrentPeriodInventoryLog = (joinQuery, dateFrom) => {
  joinQuery.on('il.inventoryItemId', 'ii.id').andOn(knex.raw(`IFNULL(il.adjustedFrom, il.createdOn) >= '${dateFrom}'`))
}

async function getGlobalFundInventoryReport(auth, query) {
  const { globalFundInventoryReportDictionary } = require('./dictionary.json')
  const dataConstraints = await getConstraints(auth.credentials)
  const { culture } = await getUser(auth.credentials.name)
  const { maxDate } = query
  const rows = await knex('InventoryItem as ii')
    .innerJoin('Site as s', 's.id', 'ii.siteId')
    .leftJoin('InventoryLog as il', q => joinCurrentPeriodInventoryLog(q, new Date(query.minDate).toISOString()))
    .leftJoin('ConsumableReason as cr', 'cr.id', 'il.consumableReasonId')
    .leftJoin('Geography as g', 'g.id', 's.geographyId')
    .select([
      's.name as siteName',
      'ii.lotNumber',
      'ii.expiresOn',
      knex.raw(`
      ii.quantityonhand - SUM(CASE WHEN IFNULL(il.adjustedFrom, il.createdOn) >
      '${maxDate}' THEN il.quantity * IF(cr.decrease, -1, 1) ELSE 0 END) AS quantityOnHand`),
    ])
    .modify(queryBuilder => applyInventoryProjection(queryBuilder, maxDate))
    .modify(addConstraints, dataConstraints, {
      site: 's',
      geography: 'g',
      InventoryItem: 'ii',
    })
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      siteName: 's.name',
    })
    .groupBy(['ii.lotNumber', 'il.siteId'])
  return {
    ok: true,
    data: rows,
    total: rows.length,
    dynamicColumns: globalFundInventoryReportDictionary[culture],
    dataSelector: dataRow => {
      const stockLastPeriod =
        dataRow.quantityOnHand - dataRow.transferFrom + dataRow.receiveTo + dataRow.use + dataRow.damage
      return {
        ...dataRow,
        stockLastMonth: stockLastPeriod,
      }
    },
  }
}

async function getGeneXpertM4B3BiologicalProducts(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)

  const { maxDate } = query

  const rows = await knex('InventoryItem as ii')
    .innerJoin('Site as s', 's.id', 'ii.siteId')
    .leftJoin('InventoryLog as il', q => joinCurrentPeriodInventoryLog(q, new Date(query.minDate).toISOString()))
    .leftJoin('Result as r', 'r.id', 'il.resultId')
    .join('Consumable as c', 'c.id', 'ii.consumableId')
    .join('Unit as u', 'u.id', 'c.unit')
    .leftJoin('ConsumableReason as cr', 'cr.id', 'il.consumableReasonId')
    .leftJoin('Geography as g', 'g.id', 's.geographyId')
    .select([
      's.name as siteName',
      'ii.lotNumber',
      'c.name as productName',
      'u.name as unit',
      'ii.expiresOn',
      knex.raw(
        `sum(case when r.resultData->>'$.customFieldData."251".value' = '${activeScreeningUseKey}' then 1 else 0 end) as activeScreening`
      ),
      knex.raw(
        `sum(case when r.resultData->>'$.customFieldData."251".value' = '${routineDiagnosticUseKey}' then 1 else 0 end) as routine`
      ),
      knex.raw(
        `sum(case when r.resultData->>'$.customFieldData."251".value' = '${otherUseKey}' then 1 else 0 end) as other`
      ),
      'ii.quantityOnHand as funding',
      knex.raw(`
      ii.quantityOnHand - SUM(CASE WHEN IFNULL(il.adjustedFrom, il.createdOn) >
      '${maxDate}' THEN il.quantity * IF(cr.decrease, -1, 1) ELSE 0 END) AS quantityOnHand`),
    ])
    .modify(queryBuilder => applyInventoryProjection(queryBuilder, maxDate))
    .modify(addConstraints, dataConstraints, {
      geography: 'g',
      InventoryItem: 'ii',
    })
    .modify(filterParams, query, {
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      siteName: 's.name',
    })
    .groupBy(['ii.lotNumber', 'il.siteId'])

  return {
    ok: true,
    data: {
      rows,
      ...getM4B3Totals(rows),
      dateSignature: format(new Date(), ' d/M/yyyy'),
    },
    total: rows.length,
    dataSelector: getM4B3dataSelectorFunction,
  }
}

const getM4B3dataSelectorFunction = row => {
  row.existence = row.quantityOnHand
  row.stockLastPeriod =
    row.quantityOnHand - row.transferFrom - row.receiveTo + row.use + row.expired + row.stolen + row.damage + row.lost
  return {
    ...row,
  }
}

function getM4B3Totals(rows) {
  const totals = {
    totalInventory: 0,
    totalTransferFrom: 0,
    totalUse: 0,
    totalReceive: 0,
    totalExpired: 0,
    totalDamage: 0,
    totalStolen: 0,
    totalLost: 0,
    totalExistence: 0,
    totalActiveScreening: 0,
    totalRoutine: 0,
    totalOther: 0,
  }

  rows.reduce((acc, row) => {
    const { quantityOnHand, transferFrom, receiveTo: receive, use, expired, damage, stolen, lost } = row

    acc.totalTransferFrom += transferFrom
    acc.totalUse += use
    acc.totalReceive += receive
    acc.totalDamage += damage
    acc.totalExpired += expired
    acc.totalStolen += stolen
    acc.totalLost += lost
    acc.totalExistence += quantityOnHand
    acc.totalInventory += quantityOnHand - receive + (transferFrom + use + expired + damage + stolen + lost)
    const { activeScreening, routine, other } = row
    acc.totalActiveScreening += activeScreening
    acc.totalRoutine += routine
    acc.totalOther += other

    return acc
  }, totals)
  return totals
}

function applyInventoryProjection(queryBuilder, maxDate) {
  queryBuilder.select(
    knex.raw(
      `IFNULL(SUM(CASE WHEN cr.i18nKey = 'ConsumableReason_TransferSent' AND IFNULL(il.adjustedFrom, il.createdOn) <=
      '${maxDate}' THEN  il.quantity ELSE 0 END), 0) as 'transferFrom'`
    ),
    knex.raw(
      `IFNULL(SUM(CASE WHEN cr.i18nKey = 'ConsumableReason_TransferReceived' AND IFNULL(il.adjustedFrom, il.createdOn) <=
      '${maxDate}' THEN  il.quantity ELSE 0 END), 0) as 'receiveTo'`
    ),
    knex.raw(
      `IFNULL(SUM(CASE WHEN cr.i18nKey = 'ConsumableReason_TestConducted' AND IFNULL(il.adjustedFrom, il.createdOn) <=
      '${maxDate}' THEN  il.quantity ELSE 0 END), 0) as 'use'`
    ),
    knex.raw(
      `IFNULL(SUM(CASE WHEN cr.i18nKey = 'ConsumableReason_Damage' AND IFNULL(il.adjustedFrom, il.createdOn) <=
      '${maxDate}' THEN  il.quantity ELSE 0 END), 0) as 'damage'`
    ),
    knex.raw(
      `IFNULL(SUM(CASE WHEN cr.i18nKey = 'ConsumableReason_Expired' AND IFNULL(il.adjustedFrom, il.createdOn) <=
      '${maxDate}' THEN  il.quantity ELSE 0 END), 0) as 'expired'`
    ),
    knex.raw(
      `IFNULL(SUM(CASE WHEN cr.i18nKey = 'ConsumableReason_Stolen' AND IFNULL(il.adjustedFrom, il.createdOn) <=
      '${maxDate}' THEN  il.quantity ELSE 0 END), 0) as 'stolen'`
    ),
    knex.raw(
      `IFNULL(SUM(CASE WHEN cr.i18nKey = 'ConsumableReason_Lost' AND IFNULL(il.adjustedFrom, il.createdOn) <=
      '${maxDate}' THEN  il.quantity ELSE 0 END), 0) as 'lost'`
    )
  )
}

module.exports = {
  getGeneXpertM4B2ActivitiesReport,
  getListRResistantTestReport,
  getGlobalFundInventoryReport,
  getGeneXpertM4B1PatientsReport,
  getReasonForTestingReport,
  getResultCountsByHIVStatus,
  getGeneXpertM4B3BiologicalProducts,
}
