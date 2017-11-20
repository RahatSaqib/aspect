const _ = require('lodash')
const supertest = require('supertest')
const chai = require('chai')
const Promise = require('bluebird')
const { knex } = require('../../src/db')

const server = supertest.agent('http://localhost:8080')
const assert = chai.assert

const aspectAdminCredentials = {
  adminUsername: 'admin',
  adminPassword: 'test07',
}

const macAddress = 'MAC000000000000'
const basicDevicePayload = {
  name: 'New GeneXpert Laboratory',
  serial: null,
  status: null,
  type: {
    id: 'CepheidGeneXpert',
  },
  site: null,
  checkpoint: null,
  log: null,
  configuration: {
    checkpoint: null,
    data: { macAddress },
  },
  operation: null,
  result: null,
}

describe('Device API routes for GxConnect Devices', () => {
  describe('when no device API key is specified', () => {
    it('should respond with UNAUTHORIZED', done => {
      server
        .post('/device')
        .set('Authorization', 'Bearer ')
        .send(basicDevicePayload)
        .end((err, res) => {
          assert.equal(res.statusCode, 401)
          done()
        })
    })
  })

  describe('when unknown device API key is specified', () => {
    it('should respond with UNAUTHORIZED', done => {
      server
        .post('/device')
        .set('Authorization', 'Bearer fg2g9cjx0njzgbfmkem0')
        .send(basicDevicePayload)
        .end((err, res) => {
          assert.equal(res.statusCode, 401)
          done()
        })
    })
  })

  let deviceApiKey
  const countryCode = 'US'

  describe('when known device API key is specified', () => {
    before(done => {
      server
        .post('/api/auth')
        .send({
          name: aspectAdminCredentials.adminUsername,
          password: aspectAdminCredentials.adminPassword,
          clientName: 'gx_connect',
          clientId: `${Math.floor(Math.random() * 800000000) + 100000000}`,
        })
        .end((err, res) => {
          assert.equal(res.statusCode, 200)
          const adminAccessToken = res.body.access
          assert.isOk(adminAccessToken)

          server
            .post('/api/demo/device/api-key')
            .set('Authorization', `Bearer ${adminAccessToken}`)
            .end((err, res) => {
              assert.equal(res.statusCode, 200)
              assert.property(res.body, 'token')
              deviceApiKey = res.body.token
              assert.isOk(deviceApiKey)
              done()
            })
        })
    })

    after(done => {
      knex
        .from('DeviceApiKey as dak')
        .leftJoin('Device as d', 'dak.deviceId', 'd.id')
        .leftJoin('Site as s', 'd.siteId', 's.id')
        .where({ token: deviceApiKey })
        .first('dak.id as deviceApiKeyId', 'd.id as deviceId', 's.id as siteId')
        .then(idsToDelete => {
          const deleteDeviceApiKey = knex
            .from('DeviceApiKey')
            .where({ id: idsToDelete.deviceApiKeyId })
            .delete()
          const deleteDeviceLogs = knex
            .from('DeviceLog')
            .where({ deviceId: idsToDelete.deviceId })
            .delete()
          const deleteDevice = knex
            .from('Device')
            .where({ id: idsToDelete.deviceId })
            .delete()
          const deleteSite = knex
            .from('Site')
            .where({ id: idsToDelete.siteId })
            .delete()

          return Promise.all([
            deleteDeviceApiKey,
            deleteDeviceLogs,
            deleteDevice,
            deleteSite,
          ]).then(() => {
            const haveApiKeysBeenCleared = knex
              .from('DeviceApiKey')
              .where({ id: idsToDelete.deviceApiKeyId })
              .select()

            const haveDevicesBeenCleared = knex
              .from('Device')
              .where({
                macAddress: basicDevicePayload.configuration.data.macAddress,
              })
              .select()

            const haveSitesBeenCleared = knex
              .from('Site')
              .where({
                name: basicDevicePayload.name,
              })
              .select()

            return Promise.all([
              haveApiKeysBeenCleared,
              haveDevicesBeenCleared,
              haveSitesBeenCleared,
            ]).finally(() => done())
          })
        })
    })

    describe('send new device data', () => {
      describe('before a device name and country code have been specified', () => {
        it('should respond with NOT_FOUND', done => {
          server
            .post('/device')
            .set('Authorization', `Bearer ${deviceApiKey}`)
            .send(basicDevicePayload)
            .end((err, res) => {
              assert.equal(res.statusCode, 404)
              done()
            })
        })
      })

      describe('after a device name and country code have been specified', () => {
        it('should respond with OK', done => {
          server
            .post('/device')
            .set('Authorization', `Bearer ${deviceApiKey}`)
            .send(
              _.merge(basicDevicePayload, {
                configuration: {
                  checkpoint: null,
                  data: {
                    macAddress,
                    country: countryCode,
                  },
                },
              })
            )
            .end((err, res) => {
              assert.equal(res.statusCode, 200)
              server
                .post('/device')
                .set('Authorization', `Bearer ${deviceApiKey}`)
                .send(basicDevicePayload)
                .end((err, res) => {
                  assert.equal(res.statusCode, 200)
                  done()
                })
            })
        })

        it('should have created a device and link it to the device API key', done => {
          knex('DeviceApiKey as dak')
            .join('Device as d', 'dak.DeviceId', 'd.id')
            .join('Site as s', 'd.siteId', 's.id')
            .join('Geography as g', 's.geographyId', 'g.id')
            .join('Country as c', 'g.countryId', 'c.id')
            .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
            .where({ 'dak.token': deviceApiKey })
            .select(
              'd.name as deviceName',
              'd.macAddress',
              's.name as siteName',
              'c.abbreviation as countryCode',
              'dt.externalId as deviceType'
            )
            .then(results => {
              assert.deepEqual(results, [
                {
                  deviceName: basicDevicePayload.name,
                  macAddress: basicDevicePayload.configuration.data.macAddress,
                  siteName: basicDevicePayload.name,
                  countryCode,
                  deviceType: basicDevicePayload.type.id,
                },
              ])
            })
            .finally(() => done())
        })
      })
    })
  })

  describe('generating a new device API key from a device with a known MAC address/instrument serial combination', () => {
    const instrumentSerialNumbers = ['123456']
    it('should not create a duplicate device', done => {
      let firstDeviceApiKey
      let secondDeviceApiKey
      // Login as Aspect Admin
      server
        .post('/api/auth')
        .send({
          name: aspectAdminCredentials.adminUsername,
          password: aspectAdminCredentials.adminPassword,
          clientName: 'gx_connect',
          clientId: `${Math.floor(Math.random() * 800000000) + 100000000}`,
        })
        .end((err, res) => {
          // Create new Device API key
          const adminAccessToken = res.body.access
          server
            .post('/api/demo/device/api-key')
            .set('Authorization', `Bearer ${adminAccessToken}`)
            .end((err, res) => {
              firstDeviceApiKey = res.body.token
              // Submit device configuration with MAC address and instrument serial numbers
              server
                .post('/device')
                .set('Authorization', `Bearer ${firstDeviceApiKey}`)
                .send(
                  _.merge(basicDevicePayload, {
                    configuration: {
                      checkpoint: null,
                      data: {
                        macAddress,
                        country: countryCode,
                        instrumentSerialNumbers,
                      },
                    },
                  })
                )
                .end(() => {
                  // Check that device exists wioth MAC Address and Instrument Serial
                  knex('DeviceApiKey as dak')
                    .join('Device as d', 'dak.DeviceId', 'd.id')
                    .where({ 'dak.token': firstDeviceApiKey })
                    .select('d.macAddress', 'd.serial')
                    .then(results => {
                      assert.deepEqual(results, [
                        {
                          macAddress,
                          serial: instrumentSerialNumbers[0],
                        },
                      ])
                      // Single device exists, new generate a new API key
                      server
                        .post('/api/demo/device/api-key')
                        .set('Authorization', `Bearer ${adminAccessToken}`)
                        .end((err, res) => {
                          secondDeviceApiKey = res.body.token
                          assert.notEqual(secondDeviceApiKey, firstDeviceApiKey)
                          // Submit same device configuration with MAC address and instrument serial numbers
                          server
                            .post('/device')
                            .set(
                              'Authorization',
                              `Bearer ${secondDeviceApiKey}`
                            )
                            .send(
                              _.merge(basicDevicePayload, {
                                configuration: {
                                  checkpoint: null,
                                  data: {
                                    macAddress,
                                    country: countryCode,
                                    instrumentSerialNumbers,
                                  },
                                },
                              })
                            )
                            .end(() => {
                              // Check that old API key is no longer associated with a device
                              knex('DeviceApiKey as dak')
                                .where({ 'dak.token': firstDeviceApiKey })
                                .select('dak.deviceId', 'dak.revoked')
                                .then(results => {
                                  assert.deepEqual(results, [
                                    {
                                      deviceId: null,
                                      revoked: 1,
                                    },
                                  ])
                                  // Check that device exists with MAC Address and Instrument
                                  // Serial linked to the new device API key
                                  knex('DeviceApiKey as dak')
                                    .join('Device as d', 'dak.DeviceId', 'd.id')
                                    .where({ 'dak.token': secondDeviceApiKey })
                                    .select('d.macAddress', 'd.serial')
                                    .then(results => {
                                      assert.deepEqual(results, [
                                        {
                                          macAddress,
                                          serial: instrumentSerialNumbers[0],
                                        },
                                      ])
                                      // Single device still exists, now clean up
                                      knex
                                        .from('DeviceApiKey as dak')
                                        .where({ token: firstDeviceApiKey })
                                        .first('dak.id as firstDeviceApiKeyId')
                                        .then(idToDelete => {
                                          knex
                                            .from('DeviceApiKey')
                                            .where({
                                              id:
                                                idToDelete.firstDeviceApiKeyId,
                                            })
                                            .delete()
                                            .then(() => {
                                              knex
                                                .from('DeviceApiKey as dak')
                                                .leftJoin(
                                                  'Device as d',
                                                  'dak.deviceId',
                                                  'd.id'
                                                )
                                                .leftJoin(
                                                  'Site as s',
                                                  'd.siteId',
                                                  's.id'
                                                )
                                                .where({
                                                  token: secondDeviceApiKey,
                                                })
                                                .first(
                                                  'dak.id as deviceApiKeyId',
                                                  'd.id as deviceId',
                                                  's.id as siteId'
                                                )
                                                .then(idsToDelete => {
                                                  const deleteDeviceApiKey = knex
                                                    .from('DeviceApiKey')
                                                    .where({
                                                      id:
                                                        idsToDelete.deviceApiKeyId,
                                                    })
                                                    .delete()
                                                  const deleteDeviceLogs = knex
                                                    .from('DeviceLog')
                                                    .where({
                                                      deviceId:
                                                        idsToDelete.deviceId,
                                                    })
                                                    .delete()
                                                  const deleteDevice = knex
                                                    .from('Device')
                                                    .where({
                                                      id: idsToDelete.deviceId,
                                                    })
                                                    .delete()
                                                  const deleteSite = knex
                                                    .from('Site')
                                                    .where({
                                                      id: idsToDelete.siteId,
                                                    })
                                                    .delete()
                                                  return Promise.all([
                                                    deleteDeviceApiKey,
                                                    deleteDeviceLogs,
                                                    deleteDevice,
                                                    deleteSite,
                                                  ]).then(() => {
                                                    const haveApiKeysBeenCleared = knex
                                                      .from('DeviceApiKey')
                                                      .where({
                                                        id:
                                                          idsToDelete.deviceApiKeyId,
                                                      })
                                                      .select()
                                                    const haveDevicesBeenCleared = knex
                                                      .from('Device')
                                                      .where({
                                                        macAddress:
                                                          basicDevicePayload
                                                            .configuration.data
                                                            .macAddress,
                                                      })
                                                      .select()
                                                    const haveSitesBeenCleared = knex
                                                      .from('Site')
                                                      .where({
                                                        name:
                                                          basicDevicePayload.name,
                                                      })
                                                      .select()

                                                    return Promise.all([
                                                      haveApiKeysBeenCleared,
                                                      haveDevicesBeenCleared,
                                                      haveSitesBeenCleared,
                                                    ]).finally(() => done())
                                                  })
                                                })
                                            })
                                        })
                                    })
                                })
                            })
                        })
                    })
                })
            })
        })
    })
  })
})
