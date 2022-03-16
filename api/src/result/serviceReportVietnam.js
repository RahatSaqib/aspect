const { endOfMonth, startOfMonth, format, parseISO } = require('date-fns')
const { knex } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { filterDateRangeParams, filterParams } = require('../db')
const { getWellFormattedDateStringWithTimezone } = require('../shared/date')

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

async function getGeneXpertM4B2ActivitiesReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const categoriesCnt = await getBaseQuery(dataConstraints, query)
    .whereIn('a.externalId', ['GxMtbRif', 'GxMtbRifUltra'])
    .select([
      knex.raw(
        "SUM(CASE WHEN rc1.externalId = 'NotDetected' THEN 1 ELSE 0 END) as mtbNotDetected"
      ),
      knex.raw(
        "SUM(CASE WHEN rc1.externalId = 'Detected' AND rc2.externalId = 'NotDetected' THEN 1 ELSE 0 END) as mtbDetectedRifNotDetected"
      ),
      knex.raw(
        "SUM(CASE WHEN rc1.externalId = 'Detected' AND rc2.externalId = 'Detected' THEN 1 ELSE 0 END) as mtbDetectedRifDetected"
      ),
      knex.raw(
        "SUM(CASE WHEN rc1.externalId = 'Detected' AND rc2.externalId = 'Indeterminate' THEN 1 ELSE 0 END) as mtbDetectedNoRif"
      ),
      knex.raw(
        "SUM(CASE WHEN rc1.externalId = 'Trace Detected' AND rc2.externalId = 'Indeterminate' THEN 1 ELSE 0 END) as mtbTraceNoRif"
      ),
      knex.raw(
        "SUM(CASE WHEN rc1.externalId = 'NoResult' THEN 1 ELSE 0 END) as noResult"
      ),
      knex.raw(
        "SUM(CASE WHEN rc1.externalId = 'Invalid' THEN 1 ELSE 0 END) as invalid"
      ),
      knex.raw(
        "SUM(CASE WHEN r.errorCode IN ('5006', '5007', '5017') THEN 1 ELSE 0 END) as error_5006_5007_5017"
      ),
      knex.raw(
        "SUM(CASE WHEN r.errorCode IN ('1001', '1002', '2014', '4009', '4010', '4017') THEN 1 ELSE 0 END) as error_1001_1002_2014_4009_4010_4017"
      ),
      knex.raw(
        "SUM(CASE WHEN r.errorCode = '2008' THEN 1 ELSE 0 END) as error_2008"
      ),
      knex.raw(
        "SUM(CASE WHEN r.errorCode IN ('2005', '2006', '2016') THEN 1 ELSE 0 END) as error_2005_2006_2016"
      ),
      knex.raw(
        "SUM(CASE WHEN r.errorCode = '2035' THEN 1 ELSE 0 END) as error_2035"
      ),
      knex.raw(
        "SUM(CASE WHEN r.errorCode = '5011' THEN 1 ELSE 0 END) as error_5011"
      ),
      knex.raw(
        "SUM(CASE WHEN r.errorCode = '2037' THEN 1 ELSE 0 END) as error_2037"
      ),
      knex.raw(
        "SUM(CASE WHEN r.errorCode IN ('2126', '2127') THEN 1 ELSE 0 END) as error_2126_2127"
      ),
      knex.raw(
        "SUM(CASE WHEN r.errorCode IN ('5001', '5002', '5003', '5004', '5005') THEN 1 ELSE 0 END) as error_5001_5002_5003_5004_5005"
      ),
      knex.raw(
        "SUM(CASE WHEN r.errorCode IS NOT NULL AND r.errorCode NOT IN ('5006', '5007', '5017', '5001', '1001', '1002', '2014', '4009', '4010', '4017', '2008', '2005', '2006', '2016','2035', '5011', '2037', '2126', '2127', '5002', '5003', '5004', '5005') THEN 1 ELSE 0 END) as error_other"
      ),
      knex.raw('GROUP_CONCAT(DISTINCT s.name ORDER BY s.name) as laboratories'),
    ])
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
        "CASE WHEN IFNULL(patientData->>'$.age', '-') = 'null' THEN '-' ELSE IFNULL(patientData->>'$.age', '-') END as age"
      ),
      knex.raw("IFNULL(patientData->>'$.address', '-') as address"),
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

const joinMonthInventoryLogByDates = (joinQuery, dateFrom, dateTo) => {
  joinQuery
    .on('il.inventoryItemId', 'ii.id')
    .andOn(
      knex.raw(
        `IFNULL(il.adjustedFrom, il.createdOn) >= DATE(${dateFrom}) and IFNULL(il.adjustedFrom, il.createdOn) <= DATE(${dateTo})`
      )
    )
}

async function getGlobalFundInventoryReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  let {
    minDate: minDateStr = getWellFormattedDateStringWithTimezone(
      startOfMonth(new Date())
    ),
  } = query
  const {
    maxDate: maxDateStr = getWellFormattedDateStringWithTimezone(
      endOfMonth(new Date())
    ),
  } = query
  if (typeof minDateStr !== 'string') {
    minDateStr = minDateStr.toISOString()
  }
  const dateFrom = format(parseISO(minDateStr), 'yyyy-mm-dd')
  const dateTo = format(parseISO(maxDateStr), 'yyyy-mm-dd')
  const rows = await knex('InventoryItem as ii')
    .innerJoin('Site as s', 's.id', 'ii.siteId')
    .leftJoin('InventoryLog as il', q =>
      joinMonthInventoryLogByDates(q, dateFrom, dateTo)
    )
    .leftJoin('ConsumableReason as cr', 'cr.id', 'il.consumableReasonId')
    .leftJoin('Geography as g', 'g.id', 's.geographyId')
    .select([
      's.name as siteName',
      'ii.lotNumber',
      'ii.expiresOn',
      knex.raw(
        `    ii.quantityOnHand + IFNULL(SUM(CASE
        WHEN
            IFNULL(cr.decrease, 0) = 1
        THEN
            il.quantity
        ELSE - il.quantity
    END), 0) AS 'stockLastMonth'`
      ),
      knex.raw(
        `IFNULL(SUM(CASE WHEN il.operation = 'transfer from' THEN  il.quantity END), 0) as 'transferFrom'`
      ),
      knex.raw(
        `IFNULL(SUM(CASE WHEN il.operation = 'receive to' THEN  il.quantity END), 0) as 'receiveTo'`
      ),
      knex.raw(
        `IFNULL(SUM(CASE WHEN cr.name = 'Test Conducted' THEN  il.quantity END), 0) as 'use'`
      ),
      knex.raw(
        `IFNULL(SUM(CASE WHEN cr.name = 'Damage' THEN  il.quantity END), 0) as 'damage'`
      ),
      'ii.quantityOnHand',
    ])
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
  }
}

async function getResultCountsByHIVStatus(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)

  const data = await getBaseQuery(dataConstraints, query)
    .whereIn('a.externalId', ['GxMtbRif', 'GxMtbRifUltra'])
    .select(
      knex.raw(`
        CASE IFNULL(UPPER(r.patientData ->> '$.HIVStatus'), 'NULL')
        WHEN 'NULL' THEN '- Unspecified -'
        ELSE UPPER(r.patientData ->> '$.HIVStatus')
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

module.exports = {
  getGeneXpertM4B2ActivitiesReport,
  getListRResistantTestReport,
  getGlobalFundInventoryReport,
  getResultCountsByHIVStatus,
}
