const { knex } = require('../db')
const { getUser } = require('../auth/service')
const { formatDateOrDefault } = require('../shared/date')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { filterDateRangeParams, filterParams } = require('../db')

async function getGeneXpertM4B2ActivitiesReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const { id: partnerId } = dataConstraints.partner
  const {
    userName: reporter,
    cell: mobilePhone,
    email,
  } = await getUser(auth.credentials.name, { partnerId })
  const categoriesCnt = await knex('Result as r')
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
    .whereIn('a.externalId', ['GxMtbRif', 'GxMtbRifUltra'])
    .select([
      knex.raw(
        "SUM(CASE WHEN rc1.externalId = 'NotDetected' THEN 1 ELSE 0 END) as mtbNotDetected"
      ),
      knex.raw(
        "SUM(CASE WHEN rc1.externalId = 'Detected' AND rc2.externalId = 'HotDetected' THEN 1 ELSE 0 END) as mtbDetectedRifNotDetected"
      ),
      knex.raw(
        "SUM(CASE WHEN rc1.externalId = 'Detected' AND rc2.externalId = 'Detected' THEN 1 ELSE 0 END) as mtbDetectedRifDetected"
      ),
      knex.raw(
        "SUM(CASE WHEN rc1.externalId = 'Detected' AND rc2.externalId IS NULL THEN 1 ELSE 0 END) as mtbDetectedNoRif"
      ),
      knex.raw(
        "SUM(CASE WHEN rc1.externalId = 'Trace Detected' AND rc2.externalId IS NULL THEN 1 ELSE 0 END) as mtbTraceNoRif"
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
        "SUM(CASE WHEN r.errorCode NOT IN ('5006', '5007', '5017', '5001', '1001', '1002', '2014', '4009', '4010', '4017', '2008', '2005', '2006', '2016','2035', '5011', '2037', '2126', '2127', '5002', '5003', '5004', '5005') THEN 1 ELSE 0 END) as error_other"
      ),
      knex.raw('GROUP_CONCAT(DISTINCT s.name ORDER BY s.name) as laboratories'),
    ])
    .first()

  const data = {
    monthYear: `${query.minDate ? formatDateOrDefault(query.minDate) : ''} — ${
      query.maxDate ? formatDateOrDefault(query.maxDate) : ''
    }`,
    reporter,
    mobilePhone,
    email,
    ...categoriesCnt,
  }

  return { ok: true, data }
}

module.exports = {
  getGeneXpertM4B2ActivitiesReport,
}
