let Promise = require('bluebird')
let { knex, filterParams, sortPageParams } = require('../db')
let { getConstraints, addConstraints } = require('../auth/constraints')

const SELECT_LIST_FIELDS = [
  'p.id', 'p.name', 'p.partnerTypeId', 'pt.name as partnerTypeName'
]

const SELECT_SHOW_FIELDS = [
  'p.id', 'p.name', 'p.partnerTypeId', 'pt.name as partnerTypeName'
]

function* listPartners(request){
  let {query, auth} = request

  // get data constraints
  let dataConstraints = yield getConstraints(auth.credentials)

  let partnerQuery = knex('Partner as p')
    .modify(filterParams, query, 'name', 'd.name')
    .modify(addConstraints, dataConstraints, {Partner: 'p'})

  // get total count for paging
  let getCount = partnerQuery.clone()
    .count('p.id as count').first()

  // get rows
  let getItems = partnerQuery.clone()
    .modify(sortPageParams, query, 'name')
    .innerJoin('PartnerType as pt', 'pt.id', 'p.partnerTypeId')
    .select(SELECT_LIST_FIELDS)

  // return result when both queries are finished
  let [{count: total}, data] = yield Promise.all([getCount, getItems])

  let result = {ok: true, total, length: data.length, data}

  return result
}

function* showPartner(request) {
  const {params, auth} = request


  // get data constraints
  let dataConstraints = yield getConstraints(auth.credentials)

  // get item
  const [item] = yield knex('Partner as p')
    .where('p.id', params.partnerId)
    .innerJoin('PartnerType as pt', 'pt.id', 'p.partnerTypeId')
    .modify(addConstraints, dataConstraints, {Partner: 'p'})
    .select(SELECT_SHOW_FIELDS)

  const result = {ok: true, data: item}

  return result
}

module.exports = {
  listPartners,
  showPartner
}
