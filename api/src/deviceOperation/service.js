const Promise = require('bluebird')
const _ = require('lodash')

const { knex, filterParams, sortPageParams } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

const SELECT_LIST_FIELDS = ['do.id', 'do.startedOn', 'do.data']

function* listDeviceOperations(request) {
  const { query, auth } = request
  const dataConstraints = yield getConstraints(auth.credentials)

  const deviceOperationQuery = knex('DeviceOperation as do')
    .innerJoin('Device as d', 'do.deviceId', 'd.id')
    .modify(filterParams, query, {
      deviceId: 'do.deviceId',
    })
    .modify(addConstraints, dataConstraints, { device: 'd' })

  // get total count for paging
  const getCount = deviceOperationQuery.clone().count('do.id as count').first()

  // get rows
  const getItems = deviceOperationQuery
    .clone()
    .modify(sortPageParams, query, 'do.startedOn')
    .select(SELECT_LIST_FIELDS)
    .map(deviceOperation =>
      _.assign(deviceOperation, {
        data: JSON.parse(deviceOperation.data) || {},
      })
    )

  // return result when both queries are finished
  const [{ count: total }, data] = yield Promise.all([getCount, getItems])

  const result = { ok: true, total, length: data.length, data }

  return result
}

module.exports = {
  listDeviceOperations,
}
