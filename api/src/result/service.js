let Promise = require('bluebird')
let { knex, filterParams, sortPageParams } = require('../db')
let { getConstraints, addConstraints } = require('../auth/constraints')

const _ = require('lodash')

function* listResults(request){
  const {query} = request

  const rawData = [
    {
      id: 1,
      lastTestOn: '2016-09-28T11:11:37.000Z',
      deviceName: 'D15 Franklin, MA #1',
      state: 'Massachusetts',
      lga: 'Franklin',
      patiendId: 38,
      resultText: 'adsklsa. Massachusetts opksa sadasd;'
    },
    {
      id: 2,
      lastTestOn: '2016-10-20T11:11:37.000Z',
      deviceName: 'D24 Gage, NE #1',
      state: 'Nebraska',
      lga: 'Gage',
      patiendId: 42,
      resultText: 'adsklsa. Nebraska opksa sadasd;'
    },
    {
      id: 3,
      lastTestOn: '2016-10-20T11:11:37.000Z',
      deviceName: 'D20 Suffolk, MA #2',
      state: 'Massachusetts',
      lga: 'Franklin',
      patiendId: 85,
      resultText: 'adsklsa. Massachusetts Suffolk sadasd;'
    }
  ]

  const total = 3
  const data = _.sortBy(rawData, query.sortCol)
  if (query.sortDir === 'desc') {
    data.reverse()
  }

  const result = {ok: true, total, length: data.length, data}

  return result
}

function* listResultTypes(request){
  let {query, auth} = request

  // get data constraints
  let dataConstraints = yield getConstraints(auth.credentials)

  let resultTypeQuery = knex('ResultType as rt')
    .modify(filterParams, query, 'name', 'rt.name')
    //.modify(addConstraints, dataConstraints, {device: 'd'})

  // get total count for paging
  let getCount = resultTypeQuery.clone()
    .count('rt.id as count').first()

  // get rows
  let getItems = resultTypeQuery.clone()
    .modify(sortPageParams, query, 'name')
    .select('id','name')

  // return result when both queries are finished
  let [{count: total}, data] = yield Promise.all([getCount, getItems])

  let result = {ok: true, total, length: data.length, data}

  return result
}

module.exports = {
  listResults,
  listResultTypes
}
