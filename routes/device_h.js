let camelize = require('camelize')
let Promise = require('bluebird')
let Joi = require('joi')
let { knex, requestFilter, requestSortPage } = require('../db')

module.exports = [{
  method: 'GET',
  path: '/device',
  handler: Promise.coroutine(listDevices),
  config: {
    description: 'Device List',
    notes: 'List data for devices',
    tags: ['api'],
    validate: {
      query: {
        sortCol: Joi.string(),
        sortDir: Joi.string().allow('asc', 'desc'),
        page: Joi.number().integer().positive(),
        size: Joi.number().integer().positive(),
        name: Joi.string()
      }
    }
  }
}]

function* listDevices(request, reply){
  try {
    // get total count for paging
    let getCount = knex('device')
      .modify(requestFilter, request, 'name')
      .count('id as count').first()

    // get rows
    let getItems = knex('device')
      .modify(requestFilter, request, 'name')
      .modify(requestSortPage, request, 'name')
      .select('id', 'name', 'shortname', 'created_on', 'last_ping_on', 'updated_on as last_seen',
        knex.raw('\'Active\' as status'), knex.raw('id * 134 as total_tests'))

    // return result when both queries are finished
    let [{count: total}, data] = yield Promise.all([getCount, getItems])
    let result = {ok: true, total, data, length: data.length}
    
    reply(camelize(result))
  } catch(err){
    reply(camelize(err)).code(500)
  }
}
