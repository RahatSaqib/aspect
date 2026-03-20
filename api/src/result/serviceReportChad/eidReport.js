const _ = require('lodash')
const { knex, filterDateRangeParams } = require('../../db')
const { getBaseQueryForResults } = require('../common/db')
const { assayToId } = require('../../shared/dictionary')
const { addConstraints, addPartnerQueryConstraints } = require('../../auth/constraints')

const EID_FIELD_PATH = "r.patientData ->> '$.ChadEIDTestingWindow'"
const WITHIN_8_WEEKS = '< 8 semaines'
const AFTER_8_WEEKS = '8 semaines-12 moiss'

async function getEidTestingWindowSummaryData(dataConstraints, query) {
  const assayId = await assayToId('GxHiv1Qual')
  if (!assayId) {
    return null
  }

  const baseQuery = getBaseQueryForResults()
    .where('r.assayId', assayId)
    .modify(filterDateRangeParams, query, 'r.endedOn')
    .modify(addPartnerQueryConstraints, dataConstraints)
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      deviceType: 'dt',
      site: 'si',
      geography: 'g',
      result: 'r',
      country: 'c',
      disease: 'dis',
      assay: 'a',
      assayType: 'at',
      sample: 'sp',
    })

  const summaryQuery = baseQuery
    .clone()
    .select(
      'sirep.id as reportableSiteId',
      knex.raw("COALESCE(sirep.name, 'Unknown') as facilityName"),
      knex.raw('COUNT(*) as totalTests'),
      knex.raw(`SUM(CASE WHEN ${EID_FIELD_PATH} = ? THEN 1 ELSE 0 END) as within8Weeks`, [WITHIN_8_WEEKS]),
      knex.raw(`SUM(CASE WHEN ${EID_FIELD_PATH} = ? THEN 1 ELSE 0 END) as after8Weeks`, [AFTER_8_WEEKS])
    )
    .groupBy('sirep.id', 'sirep.name')

  const rows = await summaryQuery

  const data = rows.map(row => {
    const total = _.toNumber(row.totalTests) || 0
    const within = _.toNumber(row.within8Weeks) || 0
    const after = _.toNumber(row.after8Weeks) || 0
    const pctWithin = total > 0 ? Math.round((within / total) * 1000) / 10 : null
    const pctAfter = total > 0 ? Math.round((after / total) * 1000) / 10 : null
    return {
      facilityName: row.facilityName,
      totalTests: total,
      within8Weeks: within,
      after8Weeks: after,
      pctWithin8Weeks: pctWithin,
      pctAfter8Weeks: pctAfter,
    }
  })

  const dynamicColumns = [
    { key: 'facilityName', header: 'Établissement' },
    { key: 'totalTests', header: 'Nombre total de tests EID' },
    { key: 'within8Weeks', header: 'Dans les 8 semaines (nombre)' },
    { key: 'after8Weeks', header: 'Après 8 semaines (nombre)' },
    { key: 'pctWithin8Weeks', header: 'Dans les 8 semaines (%)' },
    { key: 'pctAfter8Weeks', header: 'Après 8 semaines (%)' },
  ]
  return { data, dynamicColumns }
}

module.exports = {
  getEidTestingWindowSummaryData,
}
