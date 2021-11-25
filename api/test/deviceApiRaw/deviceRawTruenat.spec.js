const chai = require('chai')
const Promise = require('bluebird')
const _ = require('lodash')
const { knex } = require('../../src/db')
const { randomToken } = require('../../src/deviceApi/apiKey')
const { waitAsyncComplete } = require('../utils/generatorFunctionUtils')
const { deviceApiRawStatusToId } = require('../../src/shared/dictionary')
const { parseDateOrDefault } = require('../../src/shared/date')

const server = require('../utils/testUtils')

const { assert, expect } = chai

describe.only('Device API Raw routes for Truenat Authentication & Result Upload', () => {
  const deviceApiRawPath = '/device/raw'
  let truenatDevice
  before(async () => {
    truenatDevice = await knex('DeviceType as dt')
      .join('Device as d', 'dt.id', 'd.deviceTypeId')
      .join('Site as s', 'd.siteId', 's.id')
      .join('DeviceApiKey as dak', 'd.id', 'dak.deviceId')
      .whereNotNull('dak.username')
      .andWhere({
        'dak.revoked': false,
        'dt.externalId': 'molbioTruenat',
      })
      .first('d.id', 'dak.username', 's.shortName as password')
  })

  async function authenticateWithTruelabApi(username, password) {
    return server.post(`${deviceApiRawPath}/truelab/devices/login`).send({
      Username: username,
      Password: password,
    })
  }

  describe('Truenat Authentication Route', () => {
    it('Should respond with a bearer token, a username and a successful flag when valid credentials are sent', async () => {
      const { body } = await authenticateWithTruelabApi(
        truenatDevice.username,
        truenatDevice.password
      )
      assert.isOk(body.token)
      assert.match(body.token, /^Bearer\s/)
      assert.isOk(body.username)
      assert.isTrue(body.success)
    })

    it('Should respond with 401 when invalid credentials are sent', async () => {
      const response = await authenticateWithTruelabApi(
        truenatDevice.username,
        'BAD PASSWORD'
      )
      const { status } = response
      assert.equal(status, 401)
    })
  })
})
