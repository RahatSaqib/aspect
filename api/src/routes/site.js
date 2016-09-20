let camelize = require('camelize')
let _ = require('lodash')
let Promise = require('bluebird')
let Joi = require('joi')
let { knex, filterParams, sortPageParams } = require('../db')
let { asyncHandler, validateSortPageParams } = require('../util')

module.exports = [{
  method: 'GET',
  path: '/site',
  handler: asyncHandler(listSites),
  config: {
    description: 'Site List',
    notes: 'Pageable and sortable list of sites',
    validate: {
      query: Object.assign({
        name: Joi.string().allow('').description('Filter for site name')
      }, validateSortPageParams('name', 'shortname', 'state', 'lga', 'created_on', 'totalDevices'))
    }
  }
}]

function* listSites(request){
  let {query, auth} = request

  // get data constraints
  let dataConstraints = yield getConstraints(auth.credentials.name)

  // get sites subquery

  // get total count for paging
  let getCount = knex('site as s')
    .modify(filterParams, query, 'name')
    .leftOuterJoin('state as st', 's.state_id', 'st.id')
    .leftOuterJoin('lga as l', 's.lga_id', 'l.id')
    .modify(addConstraints, dataConstraints, {state: 'st', lga: 'l'})
    .count('s.id as count').first()

  // get rows
  let getItems = knex('site as s')
    .leftOuterJoin('state as st', 's.state_id', 'st.id')
    .leftOuterJoin('lga as l', 's.lga_id', 'l.id')
    .modify(filterParams, query, 'name', 's.name')
    .modify(sortPageParams, query, 'name')
    .modify(addConstraints, dataConstraints, {state: 'st', lga: 'l'})
    .select('s.id', 's.name', 's.shortname',
      'st.name as state', 'l.name as lga',
      's.created_on', knex.raw('s.id + 2 as total_devices'))

  // return result when both queries are finished
  let [{count: total}, data] = yield Promise.all([getCount, getItems])

  let result = {ok: true, total, length: data.length, data}

  return camelize(result)
}

function getConstraints(username){
  return knex('data_filter as f')
    .innerJoin('role as r', 'f.id', 'r.data_filter_id')
    .innerJoin('user_role as ur', 'r.id', 'ur.role_id')
    .innerJoin('user as u', 'ur.user_id', 'u.id')
    .where({'u.name': username})
    .select('f.constraint')
    .map(f => JSON.parse(f.constraint))
}

function addConstraints(queryBuilder, dataConstraints, aliases = {state: 'state', lga: 'lga'}){
  if(!dataConstraints || !dataConstraints.length){
    return
  }

  queryBuilder.where(function(){
    for(let constraint of dataConstraints){
      if(constraint.state){
        this.orWhere(_.mapKeys(constraint.state, (v, k) => `${aliases.state}.${k}`))
      }

      if(constraint.lga){
        this.orWhere(_.mapKeys(constraint.lga, (v, k) => `${aliases.lga}.${k}`))
      }
    }
  })
}
