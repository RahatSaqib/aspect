const reduce = require('lodash/reduce')
const includes = require('lodash/includes')
const { knex } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { filterDateRangeParams, filterParams } = require('../db')
const [m4b1Mapping] = require('../../templates/xpert_m4b1_patients/mapping')

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
      knex.raw(`r.resultData->>'$.customFieldData."254".value'`),
    ])
    .select([
      'rc1.externalId as resultCategory1',
      'rc2.externalId as resultCategory2',
      knex.raw(
        `r.resultData->>'$.customFieldData."257".value' as typeOfPatient`
      ),
      knex.raw(
        `r.resultData->>'$.customFieldData."254".value' as previouslyTreated`
      ),
      knex.raw('COUNT(*) as quantity'),
    ])

  const defaultValues = {}
  // Init default values set to 0
  Object.values(m4b1Mapping).forEach(reportValue => {
    defaultValues[reportValue] = 0
  })
  // Get the types of patient included in the report
  const typesOfPatient = Object.keys(defaultValues).map(
    reportKey => reportKey.split('_')[2]
  )

  const report = reduce(
    rawReport,
    (partialReport, reportItem) => {
      let fieldName
      const typeOfPatient =
        reportItem.typeOfPatient !== null &&
        includes(typesOfPatient, reportItem.typeOfPatient)
          ? reportItem.typeOfPatient
          : 'Other'

      // NoResult and Invalid will be consider as Error, including them in the same column
      if (includes(['NoResult', 'Invalid'], reportItem.resultCategory1))
        reportItem.resultCategory1 = 'Error'

      // Not-splitted result categories
      if (includes(['NotDetected', 'Error'], reportItem.resultCategory1)) {
        fieldName = `${reportItem.resultCategory1}_${
          reportItem.resultCategory2 || 'NA'
        }_${typeOfPatient}`
      } else if (reportItem.resultCategory2 === 'Indeterminate')
        fieldName = `${
          reportItem.resultCategory1 === 'Trace Detected'
            ? reportItem.resultCategory1
            : 'Other'
        }_Indeterminate_${typeOfPatient}`
      else if (
        reportItem.resultCategory1 === 'Detected' &&
        includes(['NotDetected', 'Detected'], reportItem.resultCategory2)
      )
        // Considering custom field VNPreviouslyTreated as Chưa điều trị hoặc điều trị <1 tháng (No Treatment) when value is null
        fieldName = `${reportItem.resultCategory1}_${
          reportItem.resultCategory2 || 'NA'
        }_${typeOfPatient}_${
          reportItem.previouslyTreated &&
          reportItem.previouslyTreated !== 'null'
            ? reportItem.previouslyTreated
            : 'Chưa điều trị hoặc điều trị <1 tháng'
        }`

      partialReport[fieldName] += reportItem.quantity
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
  getGeneXpertM4B1PatientsReport,
  getResultCountsByHIVStatus,
}
