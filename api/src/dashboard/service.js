const { knex } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')
const Promise = require('bluebird')
const subDays = require('date-fns/sub_days')

function* homeDashboard(request) {
  const { auth } = request
  const now = new Date()

  // get data constraints
  const dataConstraints = yield getConstraints(auth.credentials)

  const sitesTotalQuery = knex('Site as s').count('s.id as cnt')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .modify(addConstraints, dataConstraints, { site: 's', geography: 'g' })

  const devicesTotalQuery = knex('Device as d').count('d.id as cnt')
    .innerJoin('Site as s', 's.id', 'd.siteId')
    .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .innerJoin('DeviceTypeCategory as dc', 'dc.id', 'dt.deviceTypeCategoryId')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .where('dc.hasResults', 1)
    .modify(addConstraints, dataConstraints, { site: 's', geography: 'g' })

  const resultsTotalQuery30d = knex('Result as r').count('r.id as cnt')
    .innerJoin('Site as s', 's.id', 'r.siteId')
    .innerJoin('Device as d', 'd.id', 'r.deviceId')
    .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .innerJoin('DeviceTypeCategory as dc', 'dc.id', 'dt.deviceTypeCategoryId')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .whereBetween('r.endedOn', [subDays(now, 30), now])
    .modify(addConstraints, dataConstraints, { device: 'd', site: 's', geography: 'g' })

  const resultsTotalQuery1d = knex('Result as r').count('r.id as cnt')
    .innerJoin('Site as s', 's.id', 'r.siteId')
    .innerJoin('Device as d', 'd.id', 'r.deviceId')
    .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .innerJoin('DeviceTypeCategory as dc', 'dc.id', 'dt.deviceTypeCategoryId')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .whereBetween('r.endedOn', [subDays(now, 1), now])
    .modify(addConstraints, dataConstraints, { device: 'd', site: 's', geography: 'g' })

  const [sitesTotal, devicesTotal, resultsTotal30d, resultsTotal1d] = yield Promise.all([
    sitesTotalQuery, devicesTotalQuery, resultsTotalQuery30d, resultsTotalQuery1d
  ])

  const result = Object.assign({ data: {
    sitesTotal: sitesTotal[0].cnt,
    devicesTotal: devicesTotal[0].cnt,
    // TODO: Remove magic numbers below when moving to "real" dashboard
    resultsTotal30d: resultsTotal30d[0].cnt,
    resultsTotal1d: resultsTotal1d[0].cnt
  } })

  return result
}

module.exports = {
  homeDashboard
}
