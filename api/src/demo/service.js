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
    .first('d.id', 'd.name')
  if (!device) {
    return Boom.notFound()
  }

  const apiKey = yield knex('DeviceApiKey as dak')
    .innerJoin('Device as d', 'dak.deviceId', 'd.id')
    .where({ 'd.id': +params.deviceId, 'dak.revoked': 0 })
    .modify(addConstraints, dataConstraints, { device: 'd' })
    .first('dak.id as dak')

  if (apiKey) {
    device.access = jwt.sign(apiKey, config.secret)
  }

  return device
}


module.exports = {
  getDemoDevice
}
