const _ = require('lodash')
const supertest = require('supertest')
const chai = require('chai')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai

async function postToDeviceApi({
  authHeader,
  payload,
  expectedStatusCode,
  expectedResponseBody,
}) {
  return server
    .post('/device')
    .set('Authorization', authHeader)
    .send(payload)
    .then(res => {
      if (expectedStatusCode) {
        assert.equal(res.statusCode, expectedStatusCode)
      } else if (
        !expectedResponseBody &&
        !_.inRange(res.statusCode, 200, 300)
      ) {
        assert.fail(
          res.statusCode.toString(),
          '2XX',
          `The post to Aspect device API failed: ${JSON.stringify(res.body)}`
        )
      }
      if (expectedResponseBody !== undefined) {
        assert.deepEqual(res.body, expectedResponseBody)
      }
      return res
    })
    .catch(error => {
      const { actual, expected, message } = error
      assert.fail(actual, expected, message)
    })
}

async function getMaxDeviceId(knex) {
  const [maxDeviceId] = await knex
    .from('Device')
    .orderBy('id', 'desc')
    .limit(1)
    .select('id')
    .pluck('id')
  return maxDeviceId
}

const deviceTypes = {}
async function getDeviceType(externalId, knex) {
  if (!deviceTypes[externalId]) {
    deviceTypes[externalId] = await knex
      .from('DeviceType')
      .where({ externalId })
      .first('id', 'deviceTypeCategoryId', 'externalid', 'name', 'plugin')
  }
  return Promise.resolve(deviceTypes[externalId])
}

async function getDevicesWithIdLargerThan(deviceId, knex) {
  const devices = await knex
    .from('Device')
    .where('id', '>', deviceId)
    .orderBy('id', 'asc')
    .select(
      'partnerId',
      'geographyId',
      'siteId',
      'deviceTypeId',
      'deviceStatusId',
      'name',
      'shortName',
      'macAddress',
      'serial',
      'hostId',
      'culture',
      'timezone',
      'configurationData'
    )
  return _.map(devices, device =>
    _.merge({}, device, {
      configurationData: JSON.parse(device.configurationData),
    })
  )
}

module.exports = {
  postToDeviceApi,
  getMaxDeviceId,
  getDeviceType,
  getDevicesWithIdLargerThan,
}
