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
    data: {
      macAddress: 'MAC000000000000',
    },
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
      describe('before a device name AND country code have been specified', () => {
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

      describe('after a device name AND country code have been specified', () => {
        const countryCode = 'US'

        it('should respond with OK', done => {
          server
            .post('/device')
            .set('Authorization', `Bearer ${deviceApiKey}`)
            .send(
              _.merge(basicDevicePayload, {
                configuration: {
                  checkpoint: null,
                  data: {
                    macAddress: 'MAC000000000000',
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
              'd.name as DeviceName',
              'd.macAddress',
              's.name as SiteName',
              'c.abbreviation as CountryCode',
              'dt.externalId as DeviceType'
            )
            .then(results => {
              assert.deepEqual(results, [
                {
                  DeviceName: basicDevicePayload.name,
                  macAddress: basicDevicePayload.configuration.data.macAddress,
                  SiteName: basicDevicePayload.name,
                  CountryCode: countryCode,
                  DeviceType: basicDevicePayload.type.id,
                },
              ])
            })
            .finally(() => done())
        })
      })
    })
  })
})
