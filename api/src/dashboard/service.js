const _ = require('lodash')
const { knex } = require('../db')
const { getConstraints, addConstraints, canViewSites, canViewDevices, canViewResults } = require('../auth/constraints')
const Promise = require('bluebird')
const subDays = require('date-fns/sub_days')

function* homeDashboard(request) {
  const { auth } = request
  const now = new Date()

  // get data constraints
  const dataConstraints = yield getConstraints(auth.credentials)

  const queue = []

  if (canViewSites(auth)) {
    const sitesTotalQuery = knex('Site as s').count('s.id as cnt')
      .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
      .leftOuterJoin('State as st', 'g.stateId', 'st.id')
      .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
      .modify(addConstraints, dataConstraints, { site: 's', geography: 'g' })

    queue.push({
      name: 'sitesTotalQuery',
      query: sitesTotalQuery
    })
  }

  if (canViewDevices(auth)) {
    const devicesTotalQuery = knex('Device as d').count('d.id as cnt')
      .innerJoin('Site as s', 's.id', 'd.siteId')
      .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
      .innerJoin('DeviceTypeCategory as dc', 'dc.id', 'dt.deviceTypeCategoryId')
      .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
      .leftOuterJoin('State as st', 'g.stateId', 'st.id')
      .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
      .where('dc.hasResults', 1)
      .modify(addConstraints, dataConstraints, { site: 's', geography: 'g' })

    queue.push({
      name: 'devicesTotalQuery',
      query: devicesTotalQuery
    })
  }

  if (canViewResults(auth)) {
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

    queue.push({
      name: 'resultsTotalQuery30d',
      query: resultsTotalQuery30d
    })

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

    queue.push({
      name: 'resultsTotalQuery1d',
      query: resultsTotalQuery1d
    })
  }

  // to do - limit users by job
  const usersTotalQuery = knex('User as u').count('u.id as cnt')
  queue.push({
    name: 'usersTotalQuery',
    query: usersTotalQuery
  })

  const queries = []

  _.forEach(queue, (o) => { queries.push(o.query) })

  const queryResults = yield Promise.all(queries)

  function findResult(queryName) {
    const i = _.findIndex(queue, ['name', queryName])
    return queryResults[i][0]
  }

  const resultData = {}

  if (canViewSites(auth)) {
    resultData.sitesTotal = findResult('sitesTotalQuery').cnt
  }

  if (canViewDevices(auth)) {
    resultData.devicesTotal = findResult('devicesTotalQuery').cnt
  }

  if (canViewResults(auth)) {
    resultData.resultsTotal30d = findResult('resultsTotalQuery30d').cnt
    resultData.resultsTotal1d = findResult('resultsTotalQuery1d').cnt
  }

  resultData.usersTotal = findResult('usersTotalQuery').cnt

  // TODO: Remove magic numbers below when moving to "real" dashboard

  const result = Object.assign({ data: resultData })

  return result
}

module.exports = {
  homeDashboard
}
