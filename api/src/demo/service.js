const _ = require('lodash')
const Boom = require('boom')
const jwt = require('jsonwebtoken')
const { knex } = require('../db')
const config = require('../config')
const { getConstraints, addConstraints } = require('../auth/constraints')

function* getDemoDevice(request) {
  const { auth, params } = request

  const dataConstraints = yield getConstraints(auth.credentials)

  const device = yield knex('Device as d')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceTypeCategory as dc', 'dt.deviceTypeCategoryId', 'dc.id')
    .leftOuterJoin('User as u', 'u.id', 'd.approvedBy')
    .where('d.id', +params.deviceId)
    .modify(addConstraints, dataConstraints, { device: 'd' })
    .first('d.id', 'd.name', 'd.deviceTypeId')
  if (!device) {
    return Boom.notFound()
  }

  const result = { id: device.id, name: device.name }

  const apiKey = yield knex('DeviceApiKey as dak')
    .innerJoin('Device as d', 'dak.deviceId', 'd.id')
    .where({ 'd.id': +params.deviceId, 'dak.revoked': 0 })
    .modify(addConstraints, dataConstraints, { device: 'd' })
    .first('dak.id as dak')

  if (apiKey) {
    result.access = jwt.sign(apiKey, config.secret)
  }

  const assays = yield knex('Assay as a')
    .innerJoin('DeviceType as dt', 'dt.id', 'a.deviceTypeId')
    .where({ 'dt.id': device.deviceTypeId })
    .orderBy('a.name')
    .select('a.id', 'a.name')

  result.assays = []
  for (const assay of assays) {
    const results = yield knex('Result as r')
      .where('r.assayId', assay.id)
      .select('id', knex.raw('JSON_UNQUOTE(JSON_EXTRACT(resultData, "$.resultText")) as name'))
      .orderBy('name')
      .limit(100)
    result.assays.push(Object.assign({ results: _.sortedUniqBy(results, 'name') }, assay))
  }

  return result
}


module.exports = {
  getDemoDevice
}
