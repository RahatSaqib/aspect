const supertest = require('supertest')
const chai = require('chai')
const _ = require('lodash')
const {
  addDays,
  startOfToday,
  startOfMonth,
  setMilliseconds,
} = require('date-fns')

const shared = require('../utils/sharedToken')
const {
  createMessageContext,
  waitForAction,
  waitForIdle,
} = require('../utils/mqUtils')
const {
  assertPropertiesOfListItem,
} = require('../utils/assertPropertiesOfDeviceItem')
const { getAccessToken, createUser, removeUser } = require('../utils/authUtils')
const {
  allDeviceMaintenanceStatusToId,
  allDeviceApprovalToId,
} = require('../../src/shared/dictionary')
const { formatDateOrDefault } = require('../../src/shared/date')
const { knex } = require('../../src/db')
const { logDeviceMaintenanceStatus } = require('../../src/device/actions')

const server = supertest.agent('http://localhost:8080')
const { assert, expect } = chai

describe('Device routes', () => {
  const path = '/api/device'
  let deviceId

  describe('GET', () => {
    shared.checkToken(server, path)

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
          assertPropertiesOfListItem(res)
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
          assertPropertiesOfListItem(res)
          assert.equal(
            _.every(res.body.data, d => d.hasResults === 1),
            true
          )
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
          assertPropertiesOfListItem(res)
          assert.equal(
            _.every(res.body.data, d => d.hasConnectivity === 1),
            true
          )
        })
    })

    it('should return only devices that have are configured for tb disease', async () => {
      const res = await server
        .get(`${path}?page=0&size=100&diseaseId=1`)
        .set('Authorization', `Bearer ${shared.token}`)

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
      assert.property(res.body.data[0], 'approval')
      assert.property(res.body.data[0], 'resultCountLastMonth')
      assert.property(res.body.data[0], 'resultCountThisMonth')
      assert.typeOf(res.body.data[0].error, 'Object')
      assert.typeOf(res.body.data[0].availability, 'Object')
      assert.property(res.body.data[0], 'deliveredLastMonth')
      assert.property(res.body.data[0], 'deliveredThisMonth')
      assert.property(res.body, 'total')
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
          assert.property(res.body.data, 'approval')
          assert.property(res.body.data, 'approvalToken')
          assert.property(res.body.data, 'category')
          assert.property(res.body.data, 'hasResults')
          assert.property(res.body.data, 'hasConnectivity')
          assert.property(res.body.data, 'siteId')
          assert.property(res.body.data, 'siteName')
          assert.property(res.body.data, 'hostId')
          assert.property(res.body.data, 'deviceApprovalId')
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

    it('should return details of a filter device from a site', async () => {
      await server
        .get(
          `${path}?sortCol=name&sortDir=asc&page=0&size=10&siteId=1&hasResults=1`
        )
        .set('Authorization', `Bearer ${shared.token}`)
        .then(res => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data[0], 'Object')
          assertPropertiesOfListItem(res)
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

    describe('/maintenance-status', () => {
      const maintenanceStatusPath = `${path}/maintenance-status`
      it('should return a list of devices with a snapshot of each device maintenance status during the month', async () => {
        const devicesReponse = await server
          .get(maintenanceStatusPath)
          .set('Authorization', `Bearer ${shared.token}`)
        assert.isOk(devicesReponse.body.ok)
        assert.equal(devicesReponse.body.length, devicesReponse.body.total)
        assert.equal(
          devicesReponse.body.length,
          devicesReponse.body.data.length
        )
        assert.property(devicesReponse.body.data[0], 'id')
        assert.property(devicesReponse.body.data[0], 'name')
        assert.property(devicesReponse.body.data[0], 'shortName')
        assert.property(devicesReponse.body.data[0], 'resultCount')
        assert.property(devicesReponse.body.data[0], 'days')
        assert.isAbove(devicesReponse.body.data[0].days.length, 0)
        assert.property(devicesReponse.body.data[0].days[0], 'date')
        assert.property(devicesReponse.body.data[0].days[0], 'externalId')
        assert.property(devicesReponse.body.data[0].days[0], 'isWeekend')
        assert.property(devicesReponse.body.data[0].days[0], 'data')
      })

      it('should filter based on device maintenance status', async () => {
        const deviceMaintenanceStatuses = await allDeviceMaintenanceStatusToId()
        let filterOnDeviceMaintenanceStatus = ['active', 'inactiveConnectivity']
        let devicesReponse = await server
          .get(
            `${maintenanceStatusPath}?${filterOnDeviceMaintenanceStatus
              .map(
                status =>
                  `deviceMaintenanceStatusId=${deviceMaintenanceStatuses[status]}`
              )
              .join('&')}`
          )
          .set('Authorization', `Bearer ${shared.token}`)
        assert.isOk(devicesReponse.body.ok)
        assert.isAbove(devicesReponse.body.length, 0)
        assert.equal(
          devicesReponse.body.length,
          devicesReponse.body.data.length
        )
        devicesReponse.body.data.forEach(device => {
          assert.isAbove(
            device.days.filter(day =>
              filterOnDeviceMaintenanceStatus.includes(day.externalId)
            ).length,
            0
          )
        })

        filterOnDeviceMaintenanceStatus = ['inactiveDownForRepair']
        devicesReponse = await server
          .get(
            `${maintenanceStatusPath}?${filterOnDeviceMaintenanceStatus
              .map(
                status =>
                  `deviceMaintenanceStatusId=${deviceMaintenanceStatuses[status]}`
              )
              .join('&')}`
          )
          .set('Authorization', `Bearer ${shared.token}`)
        assert.isOk(devicesReponse.body.ok)
        assert.isAbove(devicesReponse.body.length, 0)
        assert.equal(
          devicesReponse.body.length,
          devicesReponse.body.data.length
        )
        devicesReponse.body.data.forEach(device => {
          assert.isAbove(
            device.days.filter(day =>
              filterOnDeviceMaintenanceStatus.includes(day.externalId)
            ).length,
            0
          )
        })
      })

      it('should show a device status for each day of the current month by default', async () => {
        const devicesReponse = await server
          .get(maintenanceStatusPath)
          .set('Authorization', `Bearer ${shared.token}`)
        const days = []
        let day = startOfMonth(new Date())
        while (day <= startOfToday()) {
          days.push(day)
          day = addDays(day, 1)
        }
        devicesReponse.body.data.forEach(device => {
          assert.equal(device.days.length, days.length)
        })
      })

      it('should show a device status for each day in between the date filters', async () => {
        const fromDate = new Date(2020, 3, 5)
        const toDate = new Date(2020, 4, 13)
        const devicesReponse = await server
          .get(
            `${maintenanceStatusPath}?minDate=${formatDateOrDefault(
              fromDate,
              'yyyy-MM-dd'
            )}&maxDate=${formatDateOrDefault(toDate, 'yyyy-MM-dd')}`
          )
          .set('Authorization', `Bearer ${shared.token}`)
        const days = []
        let day = fromDate
        while (day <= toDate) {
          days.push(day)
          day = addDays(day, 1)
        }
        devicesReponse.body.data.forEach(device => {
          assert.equal(device.days.length, days.length)
        })
      })
    })

    describe('/maintenance-status/{deviceId}', () => {
      const maintenanceStatusPath = `${path}/maintenance-status`
      it('should return the latest maintenance status log for the devices current status', async () => {
        const deviceMaintenanceStatuses = await allDeviceMaintenanceStatusToId()
        const filterOnDeviceMaintenanceStatus = [
          'inactiveUnknown',
          'inactiveNoResultsReported',
          'inactiveDownForRepair',
          'inactiveConnectivity',
        ]
        let devicesReponse = await server
          .get(
            `${maintenanceStatusPath}?${filterOnDeviceMaintenanceStatus
              .map(
                status =>
                  `deviceMaintenanceStatusId=${deviceMaintenanceStatuses[status]}`
              )
              .join('&')}`
          )
          .set('Authorization', `Bearer ${shared.token}`)
        const { id: deviceId } = devicesReponse.body.data[0]
        const newDeviceMaintenanceStatusLog = {
          deviceId,
          deviceMaintenanceStatusId:
            deviceMaintenanceStatuses.inactiveOutOfInventory,
          day: startOfToday(),
          data: JSON.stringify({
            options: { data: { notes: 'More cartridges expected next month' } },
          }),
          createdOn: setMilliseconds(new Date(), 0),
        }
        const [lastLogId] = await knex('DeviceMaintenanceStatusLog').insert(
          newDeviceMaintenanceStatusLog
        )
        await knex('Device').where('id', deviceId).update({
          deviceMaintenanceStatusLogId: lastLogId,
        })
        const deviceWithLogWithNote = await knex('Device as d')
          .join(
            'DeviceMaintenanceStatusLog as dmsl',
            'd.deviceMaintenanceStatusLogId',
            'dmsl.id'
          )
          .where(queryBuilder => {
            queryBuilder.whereRaw(
              `IFNULL(JSON_UNQUOTE(JSON_EXTRACT(IFNULL(dmsl.data, '{}'), '$.options.data.notes')), '') <> ''`
            )
          })
          .orderByRaw('dmsl.day desc, dmsl.createdOn desc, dmsl.id desc')
          .first('dmsl.*')
        deviceWithLogWithNote.data = JSON.parse(deviceWithLogWithNote.data)
        devicesReponse = await server
          .get(`${maintenanceStatusPath}/${deviceWithLogWithNote.deviceId}`)
          .set('Authorization', `Bearer ${shared.token}`)
        assert.isOk(devicesReponse.body.ok)
        expect(devicesReponse.body.data).to.containSubset({
          ...newDeviceMaintenanceStatusLog,
          day: newDeviceMaintenanceStatusLog.day.toISOString(),
          createdOn: newDeviceMaintenanceStatusLog.createdOn.toISOString(),
          data: JSON.parse(newDeviceMaintenanceStatusLog.data),
          notes: JSON.parse(newDeviceMaintenanceStatusLog.data).options.data
            .notes,
        })
      })
    })

    describe('/maintenance-statuses', () => {
      const maintenanceStatusesPath = `${path}/maintenance-statuses`
      it('should return a list of different maintenance statuses that a device can be in', async () => {
        const devicesReponse = await server
          .get(maintenanceStatusesPath)
          .set('Authorization', `Bearer ${shared.token}`)
        assert.isOk(devicesReponse.body.ok)
        assert.equal(devicesReponse.body.length, devicesReponse.body.total)
        assert.equal(
          devicesReponse.body.length,
          devicesReponse.body.data.length
        )
        expect(devicesReponse.body.data).to.containSubset([
          {
            name: 'Active',
            i18nKey: 'active',
            externalId: 'active',
            active: 1,
            manuallySet: 0,
          },
          {
            name: 'Reported Active',
            i18nKey: 'reportedActive',
            externalId: 'reportedActive',
            active: 1,
            manuallySet: 1,
          },
          {
            name: 'Unknown',
            i18nKey: 'inactiveUnknown',
            externalId: 'inactiveUnknown',
            active: 0,
            manuallySet: 1,
          },
          {
            name: 'No Results Reported',
            i18nKey: 'inactiveNoResultsReported',
            externalId: 'inactiveNoResultsReported',
            active: 0,
            manuallySet: 0,
          },
          {
            name: 'Out of Inventory',
            i18nKey: 'inactiveOutOfInventory',
            externalId: 'inactiveOutOfInventory',
            active: 0,
            manuallySet: 1,
          },
          {
            name: 'Down for Repair',
            i18nKey: 'inactiveDownForRepair',
            externalId: 'inactiveDownForRepair',
            active: 0,
            manuallySet: 1,
          },
          {
            name: 'Connectivity',
            i18nKey: 'inactiveConnectivity',
            externalId: 'inactiveConnectivity',
            active: 0,
            manuallySet: 1,
          },
          {
            name: 'Decommissioned',
            i18nKey: 'inactiveDecommissioned',
            externalId: 'inactiveDecommissioned',
            active: 0,
            manuallySet: 1,
          },
        ])
      })
    })
  })

  describe('POST', () => {
    describe('Device Maintenance - Calibration and Warranty', () => {
      let deviceMaintenanceIdsToRestore
      let deviceMaintenanceIdsToDelete = []

      beforeEach(async () => {
        const deviceMaintenanceTypeIds = await knex('DeviceMaintenanceType')
          .whereIn('externalId', ['calibration', 'warranty'])
          .pluck('id')
        deviceMaintenanceIdsToRestore = await knex('DeviceMaintenance')
          .whereIn('deviceMaintenanceTypeId', deviceMaintenanceTypeIds)
          .where({ deviceId, current: 1 })
          .pluck('id')
      })
      afterEach(async () => {
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

    describe('/maintenance-status/{deviceId}', () => {
      const maintenanceStatusPath = `${path}/maintenance-status`
      it('should save the maintenance status of the device', async () => {
        const editableDeviceMaintenanceStatusIds = await knex(
          'DeviceMaintenanceStatus'
        )
          .where('manuallySet', true)
          .andWhere('externalId', '<>', 'inactiveDownForRepair')
          .select('id')
          .pluck('id')
        const { id: deviceId } = await knex('DeviceTypeCategory as dtc')
          .join('DeviceType as dt', 'dtc.id', 'dt.deviceTypeCategoryId')
          .join('Device as d', 'dt.id', 'd.deviceTypeId')
          .where('dtc.hasResults', true)
          .first('d.id')
        const [deviceMaintenanceStatusLogId] = await knex(
          'DeviceMaintenanceStatusLog'
        ).insert({
          deviceId,
          deviceMaintenanceStatusId: editableDeviceMaintenanceStatusIds[0],
          data: '{}',
          day: startOfToday(),
          createdOn: new Date(),
        })
        await knex('Device').where({ id: deviceId }).update({
          deviceMaintenanceStatusLogId,
        })

        const devicesWithEditableStatus = await server
          .get(
            `${path}?${editableDeviceMaintenanceStatusIds
              .map(statusId => `deviceMaintenanceStatusId=${statusId}`)
              .join('&')}`
          )
          .set('Authorization', `Bearer ${shared.token}`)

        const deviceWithEditableStatus = devicesWithEditableStatus.body.data[0]
        const payload = {
          externalId: 'inactiveDownForRepair',
          options: {
            data: {
              notes:
                "Service engineer visited yesterday and couldn't finish by 3:30 PM",
            },
          },
        }
        const updateMaintenanceStatusResponse = await server
          .post(`${maintenanceStatusPath}/${deviceWithEditableStatus.id}`)
          .set('Authorization', `Bearer ${shared.token}`)
          .send(payload)
        assert.isOk(updateMaintenanceStatusResponse.body.ok)
        assert.isOk(
          updateMaintenanceStatusResponse.body.data.deviceMaintenanceStatusLogId
        )
        const deviceMaitnenanceStatusLog = await knex(
          'DeviceMaintenanceStatusLog'
        )
          .where(
            'id',
            updateMaintenanceStatusResponse.body.data
              .deviceMaintenanceStatusLogId
          )
          .first()
        deviceMaitnenanceStatusLog.data = JSON.parse(
          deviceMaitnenanceStatusLog.data
        )
        expect(deviceMaitnenanceStatusLog.data).to.containSubset(payload)
      })

      it('should provide shallow access to write to data.options.data.notes', async () => {
        const editableDeviceMaintenanceStatusIds = await knex(
          'DeviceMaintenanceStatus'
        )
          .where('manuallySet', true)
          .andWhere('externalId', '<>', 'inactiveDownForRepair')
          .select('id')
          .pluck('id')

        const { id: deviceId } = await knex('DeviceTypeCategory as dtc')
          .join('DeviceType as dt', 'dtc.id', 'dt.deviceTypeCategoryId')
          .join('Device as d', 'dt.id', 'd.deviceTypeId')
          .where('dtc.hasResults', true)
          .first('d.id')
        const [deviceMaintenanceStatusLogId] = await knex(
          'DeviceMaintenanceStatusLog'
        ).insert({
          deviceId,
          deviceMaintenanceStatusId: editableDeviceMaintenanceStatusIds[0],
          data: '{}',
          day: startOfToday(),
          createdOn: new Date(),
        })
        await knex('Device').where({ id: deviceId }).update({
          deviceMaintenanceStatusLogId,
        })

        const devicesWithEditableStatus = await server
          .get(
            `${path}?${editableDeviceMaintenanceStatusIds
              .map(statusId => `deviceMaintenanceStatusId=${statusId}`)
              .join('&')}`
          )
          .set('Authorization', `Bearer ${shared.token}`)

        const deviceWithEditableStatus = devicesWithEditableStatus.body.data[0]
        const payload = {
          externalId: 'inactiveDownForRepair',
          notes: 'Service engineer never pitched up',
        }
        const updateMaintenanceStatusResponse = await server
          .post(`${maintenanceStatusPath}/${deviceWithEditableStatus.id}`)
          .set('Authorization', `Bearer ${shared.token}`)
          .send(payload)
        assert.isOk(updateMaintenanceStatusResponse.body.ok)
        assert.isOk(
          updateMaintenanceStatusResponse.body.data.deviceMaintenanceStatusLogId
        )
        const deviceMaitnenanceStatusLog = await knex(
          'DeviceMaintenanceStatusLog'
        )
          .where(
            'id',
            updateMaintenanceStatusResponse.body.data
              .deviceMaintenanceStatusLogId
          )
          .first()
        deviceMaitnenanceStatusLog.data = JSON.parse(
          deviceMaitnenanceStatusLog.data
        )
        expect(deviceMaitnenanceStatusLog.data).to.containSubset({
          options: {
            data: {
              notes: payload.notes,
            },
          },
        })
      })
    })
  })

  describe('Message Queue', () => {
    describe('DEVICE_MAINTENANCE_STATUS_LOG_SCHEDULED', () => {
      it('should log the maintenance status of each un-logged device', async () => {
        const diagnosticDevices = await knex('Device as d')
          .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
          .join(
            'DeviceTypeCategory as dtc',
            'dt.deviceTypeCategoryId',
            'dtc.id'
          )
          .where('dtc.hasResults', true)
          .select('d.id')
        const { id: activeUnloggedDeviceId } = diagnosticDevices[0]
        const { id: decommissionedDeviceId } = diagnosticDevices[1]
        const {
          id: inactiveOutOfInventoryUnloggedDeviceId,
        } = diagnosticDevices[2]
        await knex('DeviceMaintenanceStatusLog')
          .whereIn('deviceId', [
            activeUnloggedDeviceId,
            inactiveOutOfInventoryUnloggedDeviceId,
          ])
          .andWhere('day', startOfToday())
          .del()
        const deviceApprovals = await allDeviceApprovalToId()
        const deviceMaintenanceStatuses = await allDeviceMaintenanceStatusToId()
        await knex('DeviceMaintenanceStatusLog')
          .where('deviceId', decommissionedDeviceId)
          .andWhere(
            'deviceMaintenanceStatusId',
            deviceMaintenanceStatuses.inactiveDecommissioned
          )
          .andWhere('day', startOfToday())
          .del()
        await knex('Device').where('id', activeUnloggedDeviceId).update({
          deviceApprovalId: deviceApprovals.approved,
          deviceMaintenanceStatusId: deviceMaintenanceStatuses.active,
        })
        await knex('Device')
          .where('id', inactiveOutOfInventoryUnloggedDeviceId)
          .update({
            deviceApprovalId: deviceApprovals.approved,
            deviceMaintenanceStatusId:
              deviceMaintenanceStatuses.inactiveOutOfInventory,
          })
        await knex('Device').where('id', decommissionedDeviceId).update({
          deviceApprovalId: deviceApprovals.decommissioned,
          deviceMaintenanceStatusId: deviceMaintenanceStatuses.active,
        })
        const getDeviceDetails = async () =>
          knex('Device as d')
            .leftJoin('DeviceMaintenanceStatusLog as dmsl', queryBuilder => {
              queryBuilder
                .on('d.id', 'dmsl.deviceId')
                .andOn('dmsl.day', knex.raw('?', [startOfToday()]))
            })
            .leftJoin(
              'DeviceMaintenanceStatus as dmsl_dms',
              'dmsl.deviceMaintenanceStatusId',
              'dmsl_dms.id'
            )
            .leftJoin('DeviceApproval as da', 'da.id', 'd.deviceApprovalId')
            .leftJoin(
              'DeviceMaintenanceStatus as dms',
              'dms.id',
              'd.deviceMaintenanceStatusId'
            )
            .whereIn('d.id', [
              activeUnloggedDeviceId,
              inactiveOutOfInventoryUnloggedDeviceId,
              decommissionedDeviceId,
            ])
            .select(
              'd.id',
              'dms.externalId as maintenanceStatusExternalId',
              'dmsl_dms.externalId as loggedMaintenanceStatusExternalId',
              'da.token as approvalToken'
            )
        const devicesWithNoMaintenanceLogForTheDay = await getDeviceDetails()
        expect(devicesWithNoMaintenanceLogForTheDay).to.containSubset([
          {
            id: activeUnloggedDeviceId,
            maintenanceStatusExternalId: 'active',
            loggedMaintenanceStatusExternalId: null,
            approvalToken: 'approved',
          },
          {
            id: inactiveOutOfInventoryUnloggedDeviceId,
            maintenanceStatusExternalId: 'inactiveOutOfInventory',
            loggedMaintenanceStatusExternalId: null,
            approvalToken: 'approved',
          },
          {
            id: decommissionedDeviceId,
            maintenanceStatusExternalId: 'active',
            loggedMaintenanceStatusExternalId: null,
            approvalToken: 'decommissioned',
          },
        ])
        const messageContext = await createMessageContext()
        const action = logDeviceMaintenanceStatus()
        await messageContext.dispatch(action)
        await waitForAction(action)
        await waitForIdle(2000)
        const devicesAfterDailyLog = await getDeviceDetails()
        expect(devicesAfterDailyLog).to.containSubset([
          {
            id: activeUnloggedDeviceId,
            maintenanceStatusExternalId: 'active',
            loggedMaintenanceStatusExternalId: 'active',
            approvalToken: 'approved',
          },
          {
            id: inactiveOutOfInventoryUnloggedDeviceId,
            maintenanceStatusExternalId: 'inactiveOutOfInventory',
            loggedMaintenanceStatusExternalId: 'inactiveOutOfInventory',
            approvalToken: 'approved',
          },
          {
            id: decommissionedDeviceId,
            maintenanceStatusExternalId: 'inactiveDecommissioned',
            loggedMaintenanceStatusExternalId: 'inactiveDecommissioned',
            approvalToken: 'decommissioned',
          },
        ])
      })
    })
  })
})
