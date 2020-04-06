const supertest = require('supertest')
const chai = require('chai')
const _ = require('lodash')
const shared = require('../utils/sharedToken')
const { knex, run } = require('../../src/db')
const { getAccessToken, createUser, removeUser } = require('../utils/authUtils')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai

function runTest(test) {
  return run(async knex => test(knex))
}

describe('Device routes', () => {
  const path = '/api/device'
  let deviceId

  describe('GET', () => {
    shared.checkToken(server, path)

    it('should return a list of devices when using valid token "approved"', async () => {
      await server
        .get(path)
        .set('Authorization', `Bearer ${shared.token}`)
        .then(res => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAbove(res.body.data.length, 0)
          assert.property(res.body.data[0], 'id')
          assert.property(res.body.data[0], 'name')
          assert.property(res.body.data[0], 'shortName')
          assert.property(res.body.data[0], 'createdOn')
          assert.property(res.body.data[0], 'lastPingOn')
          assert.property(res.body.data[0], 'lastSeen')
          assert.property(res.body.data[0], 'state')
          assert.property(res.body.data[0], 'type')
          assert.property(res.body.data[0], 'category')
          assert.property(res.body.data[0], 'hasResults')
          assert.property(res.body.data[0], 'hasConnectivity')
          assert.property(res.body.data[0], 'status')
          assert.property(res.body.data[0], 'resultCountLastMonth')
          assert.property(res.body.data[0], 'resultCountThisMonth')
          assert.typeOf(res.body.data[0].error, 'Object')
          assert.typeOf(res.body.data[0].availability, 'Object')
          assert.property(res.body.data[0], 'deliveredLastMonth')
          assert.property(res.body.data[0], 'deliveredThisMonth')
          assert.property(res.body, 'total')
          // store 'deviceId' for use in POST section below
          deviceId = res.body.data[0].id
        })
    })

    it('should return only medical devices if hasResults=1', async () => {
      await server
        .get(`${path}?hasResults=1&page=0&size=100`)
        .set('Authorization', `Bearer ${shared.token}`)
        .then(res => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAbove(res.body.data.length, 0)
          assert.property(res.body.data[0], 'id')
          assert.property(res.body.data[0], 'name')
          assert.property(res.body.data[0], 'shortName')
          assert.property(res.body.data[0], 'createdOn')
          assert.property(res.body.data[0], 'lastPingOn')
          assert.property(res.body.data[0], 'lastSeen')
          assert.property(res.body.data[0], 'state')
          assert.property(res.body.data[0], 'type')
          assert.property(res.body.data[0], 'category')
          assert.property(res.body.data[0], 'hasResults')
          assert.property(res.body.data[0], 'hasConnectivity')
          assert.property(res.body.data[0], 'status')
          assert.property(res.body.data[0], 'resultCountLastMonth')
          assert.property(res.body.data[0], 'resultCountThisMonth')
          assert.typeOf(res.body.data[0].error, 'Object')
          assert.typeOf(res.body.data[0].availability, 'Object')
          assert.property(res.body.data[0], 'deliveredLastMonth')
          assert.property(res.body.data[0], 'deliveredThisMonth')
          assert.equal(
            _.every(res.body.data, d => d.hasResults === 1),
            true
          )
          assert.property(res.body, 'total')
        })
    })

    it('should return only devices that have connectivity hardware if hasConnectivity=1', async () => {
      await server
        .get(`${path}?hasConnectivity=1&page=0&size=100`)
        .set('Authorization', `Bearer ${shared.token}`)
        .then(res => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')
          assert.isAtLeast(res.body.data.length, 1)
          assert.property(res.body.data[0], 'id')
          assert.property(res.body.data[0], 'name')
          assert.property(res.body.data[0], 'shortName')
          assert.property(res.body.data[0], 'createdOn')
          assert.property(res.body.data[0], 'lastPingOn')
          assert.property(res.body.data[0], 'lastSeen')
          assert.property(res.body.data[0], 'state')
          assert.property(res.body.data[0], 'type')
          assert.property(res.body.data[0], 'category')
          assert.property(res.body.data[0], 'hasResults')
          assert.property(res.body.data[0], 'hasConnectivity')
          assert.property(res.body.data[0], 'status')
          assert.property(res.body.data[0], 'resultCountLastMonth')
          assert.property(res.body.data[0], 'resultCountThisMonth')
          assert.typeOf(res.body.data[0].error, 'Object')
          assert.typeOf(res.body.data[0].availability, 'Object')
          assert.property(res.body.data[0], 'deliveredLastMonth')
          assert.property(res.body.data[0], 'deliveredThisMonth')
          assert.equal(
            _.every(res.body.data, d => d.hasConnectivity === 1),
            true
          )
          assert.property(res.body, 'total')
        })
    })

    it('should return details of a specific device', async () => {
      await server
        .get(`${path}/1`)
        .set('Authorization', `Bearer ${shared.token}`)
        .then(res => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'Object')
          assert.property(res.body.data, 'id')
          assert.property(res.body.data, 'name')
          assert.property(res.body.data, 'shortName')
          assert.property(res.body.data, 'createdOn')
          assert.property(res.body.data, 'lastPingOn')
          assert.property(res.body.data, 'lastSeen')
          assert.property(res.body.data, 'status')
          assert.property(res.body.data, 'statusToken')
          assert.property(res.body.data, 'category')
          assert.property(res.body.data, 'hasResults')
          assert.property(res.body.data, 'hasConnectivity')
          assert.property(res.body.data, 'siteId')
          assert.property(res.body.data, 'siteName')
          assert.property(res.body.data, 'hostId')
          assert.property(res.body.data, 'deviceStatusId')
          assert.property(res.body.data, 'configurationData')
          assert.property(res.body.data, 'notes')
          assert.property(res.body.data, 'serial')
          assert.property(res.body.data, 'deviceType')
          assert.property(res.body.data, 'dailyCapacity')
          assert.property(res.body.data, 'resultCountLastMonth')
          assert.property(res.body.data, 'resultCountThisMonth')
          assert.property(res.body.data, 'errorCountLastMonth')
          assert.property(res.body.data, 'errorCountThisMonth')
          assert.property(res.body.data, 'utilizationRateThisMonth')
          assert.property(res.body.data, 'errorRateThisMonth')
        })
    })

    it('should return performance report of a specific device', async () => {
      await server
        .get(`${path}/performance/2`)
        .set('Authorization', `Bearer ${shared.token}`)
        .then(res => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'utilizationRateAvg')
          assert.property(res.body, 'errorRateAvg')
          assert.property(res.body, 'data')
          assert.equal(res.body.data.length, 13)
          assert.typeOf(res.body.data, 'array')
          assert.property(res.body.data[0], 'totalResult')
          assert.property(res.body.data[0], 'errorCount')
          assert.property(res.body.data[0], 'monthTested')
          assert.property(res.body.data[0], 'utilizationRate')
          assert.property(res.body.data[0], 'errorRate')
        })
    })

    const daktariVirologyDeviceTypeExternalId = 'DaktariVirology'
    const daktariManagerUsername = 'daktari_manager'
    const daktariManagerPassword = 'daktari-manager-pass'
    let daktariManagerUserId
    let daktariManagerAuthAccessToken
    before(async () => {
      daktariManagerUserId = await createUser(
        'Partner One',
        'US',
        daktariManagerUsername,
        daktariManagerPassword,
        [
          {
            jobFunctionExternalId: 'manager',
            deviceTypeExternalId: daktariVirologyDeviceTypeExternalId,
          },
        ]
      )
      daktariManagerAuthAccessToken = await getAccessToken(
        daktariManagerUsername,
        daktariManagerPassword
      )
    })

    after(async () => removeUser(daktariManagerUserId))

    it("should constrain devices returned based on the user's job context", async () => {
      const devicesReponse = await server
        .get(path)
        .set('Authorization', `Bearer ${daktariManagerAuthAccessToken}`)
      assert.isAbove(devicesReponse.body.data.length, 0)
      const { name: daktariVirologyDeviceTypeName } = await knex('DeviceType')
        .where('externalId', daktariVirologyDeviceTypeExternalId)
        .first('name')
      devicesReponse.body.data.forEach(device => {
        assert.equal(device.type, daktariVirologyDeviceTypeName)
      })
    })
  })

  describe('POST', () => {
    describe('Device Maintenance - Calibration and Warranty', () => {
      let deviceMaintenanceIdsToRestore
      let deviceMaintenanceIdsToDelete = []

      beforeEach(() =>
        runTest(async knex => {
          const deviceMaintenanceTypeIds = await knex('DeviceMaintenanceType')
            .whereIn('externalId', ['calibration', 'warranty'])
            .select('id')
            .map(x => x.id)
          deviceMaintenanceIdsToRestore = await knex('DeviceMaintenance')
            .whereIn('deviceMaintenanceTypeId', deviceMaintenanceTypeIds)
            .where({ deviceId, current: 1 })
            .select('id')
            .map(x => x.id)
        })
      )
      afterEach(() =>
        runTest(async knex => {
          // make sure we delete only new items and not existing, accidentally
          deviceMaintenanceIdsToDelete = deviceMaintenanceIdsToDelete.filter(
            x => !deviceMaintenanceIdsToRestore.includes(x)
          )

          await knex('DeviceMaintenance')
            .whereIn('id', deviceMaintenanceIdsToDelete)
            .del()

          await knex('DeviceMaintenance')
            .whereIn('id', deviceMaintenanceIdsToRestore)
            .update({ current: 1 })
        })
      )

      // actual tests
      checkMaintenance('calibration', 'calibrationDate', 'calibrationNotes')
      checkMaintenance('warranty', 'warrantyDueDate', 'warrantyNotes')

      // -----------------------------
      // helper functions
      // -----------------------------
      function assertBase(request, response, { datePropName, notesPropName }) {
        const { contextDate, notes } = request
        assert.typeOf(response, 'Object')
        assert.property(response, 'data')
        assert.property(response, 'deviceMaintenanceId')
        const { data: device, deviceMaintenanceId } = response
        assert.property(device, datePropName)
        assert.property(device, notesPropName)
        // values in request and response should match
        assert.equal(deviceId, device.id)
        assert.equal(
          new Date(device[datePropName]).toDateString(),
          new Date(contextDate).toDateString()
        )
        assert.equal(device[notesPropName], notes)
        // additional assertions
        assert.isAbove(deviceMaintenanceId, 0)

        deviceMaintenanceIdsToDelete.push(deviceMaintenanceId)
      }

      // -----------------------------
      async function checkMaintenance(externalId, datePropName, notesPropName) {
        it(`${externalId} - should create new entry in DeviceMaintenance table, update it, and create another new`, done => {
          const options = { datePropName, notesPropName }
          let notes = 'Some sample notes'
          let prevDeviceMaintenanceId
          let reqData
          // ----------------------
          // post new date
          let contextDate = new Date('2077-12-31').toISOString()
          reqData = { contextDate, notes, externalId }
          server
            .post(`${path}/maintenance/${deviceId}`)
            .set('Authorization', `Bearer ${shared.token}`)
            .send(reqData)
            .end((err, res) => {
              assert.equal(res.status, 200)
              assertBase(reqData, res.body, options)

              prevDeviceMaintenanceId = res.body.deviceMaintenanceId

              // ----------------------
              // post same date
              notes = 'Another notes but date remains unchanged'
              reqData = { contextDate, notes, externalId }
              server
                .post(`${path}/maintenance/${deviceId}`)
                .set('Authorization', `Bearer ${shared.token}`)
                .send(reqData)
                .end((err, res) => {
                  assert.equal(res.status, 200)
                  assertBase(reqData, res.body, options)
                  // we updated DeviceMaintenance, so id did not change
                  assert.equal(
                    prevDeviceMaintenanceId,
                    res.body.deviceMaintenanceId
                  )

                  // ----------------------
                  // post new date
                  notes = '' // empty note
                  contextDate = new Date('2088-10-10').toISOString()
                  reqData = { contextDate, notes, externalId }
                  server
                    .post(`${path}/maintenance/${deviceId}`)
                    .set('Authorization', `Bearer ${shared.token}`)
                    .send(reqData)
                    .end((err, res) => {
                      assert.equal(res.status, 200)
                      assertBase(reqData, res.body, options)
                      // we inserted new entry into DeviceMaintenance - so id's differ
                      assert.notEqual(
                        prevDeviceMaintenanceId,
                        res.body.deviceMaintenanceId
                      )

                      done()
                    })
                })
            })
        })
      }
    })
  })
})
