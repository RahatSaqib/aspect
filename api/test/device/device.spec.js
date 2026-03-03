const chai = require('chai')
const chaiSubset = require('chai-subset')
const _ = require('lodash')
const { addDays, subDays, subMonths, startOfToday, startOfMonth, endOfMonth, setMilliseconds } = require('date-fns')
const shared = require('../utils/sharedToken')
const { createMessageContext, waitForAction, waitForIdle } = require('../utils/mqUtils')
const { assertPropertiesOfListItem } = require('../utils/assertPropertiesOfDeviceItem')
const { getAccessToken, createUser, removeUser } = require('../utils/authUtils')
const { INTERNAL_DEVICE_IDS } = require('../../src/shared/constants')
const {
  allDeviceMaintenanceStatusToId,
  allDeviceApprovalToId,
  allIssueTypeToId,
  allIssueStatusToId,
} = require('../../src/shared/dictionary')
const {
  formatDateOrDefault,
  getLocalDateInUtc,
  getArrayOfDaysInRange,
  startOfDayUtc,
} = require('../../src/shared/date')
const { knex } = require('../../src/db')
const { logDeviceMaintenanceStatus } = require('../../src/device/actions')
const { resultLogged } = require('../../src/result/actions')
const { createGxConnectTestContext } = require('../deviceApi/geneXpert/gxconnect_utils')

const { createTestContext } = require('../deviceApi/utils')

const server = require('../utils/testUtils')

const { assert, expect } = chai.use(chaiSubset)

describe('Device routes', () => {
  const path = '/api/device'
  let deviceMaintenanceStatuses
  let deviceApprovals
  let issuesToDelete = []
  describe('GET', () => {
    const daktariVirologyDeviceTypeExternalId = 'DaktariVirology'
    const daktariManagerUsername = 'daktari_manager'
    const daktariManagerPassword = 'daktari-manager-pass'
    let daktariManagerUserId
    let daktariManagerAuthAccessToken

    // Status test
    let statusesToTest
    let theGreatestDeviceIEverCreated

    before(async () => {
      shared.checkToken(server, path)
      deviceMaintenanceStatuses = await allDeviceMaintenanceStatusToId()
      deviceApprovals = await allDeviceApprovalToId()
      const issueStatus = await allIssueStatusToId()
      const issueTypes = await allIssueTypeToId()

      daktariManagerUserId = await createUser('Partner One', 'US', daktariManagerUsername, daktariManagerPassword, [
        {
          jobFunctionExternalId: 'regionalAdmin',
          deviceTypeExternalId: daktariVirologyDeviceTypeExternalId,
        },
      ])
      daktariManagerAuthAccessToken = await getAccessToken(daktariManagerUsername, daktariManagerPassword)

      const device = await knex('Device as d')
        .join('Partner as p', 'd.partnerId', 'p.id')
        .join('Site as s', 'd.siteId', 's.id')
        .join('Geography as g', 's.geographyId', 'g.id')
        .join('Country as c', 'c.id', 'g.countryId')
        .where('p.name', 'Partner One')
        .where('c.abbreviation', 'US')
        .first('d.*')
      const { id: personId } = await knex('Person').where({ lastPartnerId: device.partnerId }).first()
      const { id: messageStatusSentId } = await knex('MessageStatus').where('externalId', 'Sent').first('id')
      const luAlertMessages = {
        [issueTypes.DeviceOffline.id]: 'Cannot reach network for 12 days',
        [issueTypes.DeviceNoResults.id]: 'No testing for 9 days',
        [issueTypes.ModuleFailureError.id]: 'Module A1: Critical errors; notify R.O.',
        [issueTypes.ModuleTemperatureError.id]: 'Temperature errors on Module A2; notify R.O.',
        [issueTypes.ModulePowerError.id]: 'Power errors on Module A3; notify RO',
        [issueTypes.MachineTemperatureError.id]: 'Temperature errors across machine, conduct troubleshooting',
        [issueTypes.MachinePowerError.id]: 'Power errors across machine, conduct troubleshooting',
        [issueTypes.ModuleProceduralError.id]: 'Module A2 errors, conduct troubleshooting',
        [issueTypes.MachineProceduralError.id]: 'Procedural errors across machine, conduct troubleshooting',
        [issueTypes.StockLevelUpdate.id]: 'Stock Level',
        [issueTypes.ReagentHealthError.id]: 'Cartridge-specific errors exceed 5%',
      }
      issuesToDelete = await Promise.all(
        [issueTypes.ModuleReplaced, issueTypes.ModuleDisabled].map(async issueTypeId => {
          const issueId = await knex('Issue').insert({
            issueTypeId,
            issueStatusId: issueTypeId === issueTypes.ModuleDisabled ? issueStatus.Resolved : issueStatus.Active,
            partnerId: device.partnerId,
            geographyId: device.geographyId,
            siteId: device.siteId,
            deviceId: device.id,
            createdOn: new Date(),
            updatedOn: new Date(),
          })

          const { id: alertTemplateId } = await knex('AlertTemplate').first()
          const [alertMessageId] = await knex('AlertMessage').insert({
            messageStatusId: messageStatusSentId,
            message: luAlertMessages[issueTypeId],
            createdOn: new Date(),
            updatedOn: new Date(),
            siteId: device.siteId,
            personId,
            deviceId: device.id,
            alertTemplateId,
          })
          const { id: notificationTypeId } = await knex('NotificationType')
            .where({ partnerId: device.partnerId })
            .first()

          await knex('Notification').insert({
            createdOn: new Date(),
            alertMessageId,
            issueId,
            personId,
            notificationTypeId,
          })

          return issueId
        })
      )

      // Status test
      statusesToTest = [
        // [approval status, maintenance status, expected status]
        [deviceApprovals.pendingDeployment, null, 'PendingDeployment'],
        [deviceApprovals.pendingDeployment, deviceMaintenanceStatuses.active, 'PendingDeployment'],
        [deviceApprovals.approved, null, 'Approved'],
        [deviceApprovals.approved, deviceMaintenanceStatuses.active, 'Active'],
        [deviceApprovals.approved, deviceMaintenanceStatuses.inactiveOutOfInventory, 'Out of Inventory'],
      ]
      const statusTestDeviceContext = createGxConnectTestContext(server, {
        macAddress: 'A really cool mac address',
        adminUsername: 'admin',
        adminPassword: 'test07',
        countryCode: 'US',
        deviceName: 'The greatest device I ever created',
        deviceSerialNumber: 'A very cool device serial number',
        hostId: 'The best host id ever',
      })
      await statusTestDeviceContext.registerAndSetDevice()
      theGreatestDeviceIEverCreated = await knex('Device').where({ name: 'The greatest device I ever created' }).first()
    })

    after(async () => {
      removeUser(daktariManagerUserId)
      const { id } = await knex('Device').where({ name: 'The greatest device I ever created' }).first()
      await knex('Notification').whereIn('issueId', issuesToDelete).delete()
      await knex('Issue').whereIn('id', issuesToDelete).delete()
      await knex('Device').where({ id }).update({ deviceApiKeyId: null })
      await knex('DeviceApiKey').where({ deviceId: id }).delete()
      await knex('DeviceLog')
        .where({ deviceApiKeyId: knex('Device').where({ id }).first('deviceApiKeyId') })
        .delete()
      await knex('DeviceApprovalLog').where({ deviceId: id }).delete()
      await knex('DeviceMaintenanceStatusLog').where({ deviceId: id }).delete()
      await knex('Device').where({ id }).delete()
    })

    it('should return a list of devices with the correspondent status', async () => {
      // Sequential execution required: each iteration mutates the same device and asserts
      /* eslint-disable no-await-in-loop */
      for (const [deviceApprovalId, deviceMaintenanceStatusId, expectedStatus] of statusesToTest) {
        if (deviceMaintenanceStatusId) {
          const [deviceMaintenanceStatusLogId] = await knex('DeviceMaintenanceStatusLog').insert({
            deviceId: theGreatestDeviceIEverCreated.id,
            deviceMaintenanceStatusId,
            data: '{}',
            day: new Date(),
            createdOn: new Date(),
          })
          await knex('Device').where({ id: theGreatestDeviceIEverCreated.id }).update({
            deviceMaintenanceStatusLogId,
            deviceApprovalId,
          })
        } else {
          await knex('Device').where({ id: theGreatestDeviceIEverCreated.id }).update({
            deviceMaintenanceStatusLogId: null,
            deviceApprovalId,
          })
        }

        const res = await server
          .get(`${path}?deviceName=The greatest device I ever created`)
          .set('Authorization', `Bearer ${shared.token}`)
        assert.equal(res.body.data[0].status, expectedStatus)
      }
      /* eslint-enable no-await-in-loop */
    })

    it('should return a list of devices when using valid token "approved"', async () => {
      const res = await server.get(path).set('Authorization', `Bearer ${shared.token}`)

      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')
      assert.property(res.body, 'data')
      assert.typeOf(res.body.data, 'array')
      assert.isAbove(res.body.data.length, 0)
      assertPropertiesOfListItem(res)
    })

    it('should return only medical devices if hasResults=1', async () => {
      const res = await server
        .get(`${path}?hasResults=1&page=0&size=100`)
        .set('Authorization', `Bearer ${shared.token}`)

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

    it('should return only devices that have connectivity hardware if hasConnectivity=1', async () => {
      const res = await server
        .get(`${path}?hasConnectivity=1&page=0&size=100`)
        .set('Authorization', `Bearer ${shared.token}`)

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

    it('should return only devices that have are configured for tb disease', async () => {
      const res = await server.get(`${path}?page=0&size=100&diseaseId=1`).set('Authorization', `Bearer ${shared.token}`)

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

      assert.property(res.body, 'total')
    })

    it.skip('should return only devices that have linked issues', async () => {
      const devicesWithIssues = devices =>
        _.filter(devices, device => device.issueCategories && device.issueCategories.length > 0)
      let res = await server.get(`${path}?onlyOpenIssues=1`).set('Authorization', `Bearer ${shared.token}`)

      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')
      assert.property(res.body, 'data')
      assert.typeOf(res.body.data, 'array')
      assert.equal(devicesWithIssues(res.body.data).length, 1)
      assertPropertiesOfListItem(res)

      res = await server
        .get(`${path}?onlyOpenIssues=1&issueTypeId=ModuleDisabled`)
        .set('Authorization', `Bearer ${shared.token}`)
      assert.isEmpty(devicesWithIssues(res.body.data))
      res = await server.get(`${path}?issueTypeId=ModuleDisabled`).set('Authorization', `Bearer ${shared.token}`)
      assert.equal(res.body.data.length, 1)
      res = await server
        .get(`${path}?onlyOpenIssues=1&issueTypeId=ModuleReplaced&issueTypeId=ModuleDisabled"`)
        .set('Authorization', `Bearer ${shared.token}`)
      assert.equal(res.body.data.length, 1)
    })

    it('should return details of a specific device', async () => {
      const res = await server.get(`${path}/1`).set('Authorization', `Bearer ${shared.token}`)

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

    it('should return details of a filter device from a site', async () => {
      const res = await server
        .get(`${path}?sortCol=name&sortDir=asc&page=0&size=10&siteId=1&hasResults=1`)
        .set('Authorization', `Bearer ${shared.token}`)

      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')
      assert.property(res.body, 'data')
      assert.typeOf(res.body.data[0], 'Object')
      assertPropertiesOfListItem(res)
    })

    it('should return performance report of a specific device', async () => {
      const res = await server.get(`${path}/performance/2`).set('Authorization', `Bearer ${shared.token}`)

      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')
      assert.property(res.body, 'utilizationRateAvg')
      assert.property(res.body, 'errorRateAvg')
      assert.property(res.body, 'data')
      assert.typeOf(res.body.data, 'array')
      assert.property(res.body.data[0], 'totalResult')
      assert.property(res.body.data[0], 'errorCount')
      assert.property(res.body.data[0], 'monthTested')
      assert.property(res.body.data[0], 'utilizationRate')
      assert.property(res.body.data[0], 'errorRate')
    })

    it("should constrain devices returned based on the user's job context", async () => {
      const devicesReponse = await server.get(path).set('Authorization', `Bearer ${daktariManagerAuthAccessToken}`)
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
        const devicesReponse = await server.get(maintenanceStatusPath).set('Authorization', `Bearer ${shared.token}`)
        assert.isOk(devicesReponse.body.ok)
        assert.equal(devicesReponse.body.length, devicesReponse.body.total)
        assert.equal(devicesReponse.body.length, devicesReponse.body.data.length)
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
        const filterOnDeviceMaintenanceStatus = ['inactiveDownForRepair']

        const url = `${maintenanceStatusPath}?minDate=${formatDateOrDefault(
          startOfMonth(subMonths(new Date(), 1)),
          'yyyy-MM-dd'
        )}&maxDate=${formatDateOrDefault(
          endOfMonth(subMonths(new Date(), 1)),
          'yyyy-MM-dd'
        )}&${filterOnDeviceMaintenanceStatus.map(status => `deviceMaintenanceStatusId=${status}`).join('&')}`

        const devicesResponse = await server.get(url).set('Authorization', `Bearer ${shared.token}`)

        assert.equal(devicesResponse.status, 200, `${url} - must return HTTP status 200`)
        assert.isOk(devicesResponse.body.ok)
        assert.isAbove(devicesResponse.body.length, 0)
        assert.equal(devicesResponse.body.length, devicesResponse.body.data.length)
        devicesResponse.body.data.forEach(device => {
          assert.isAbove(device.days.filter(day => filterOnDeviceMaintenanceStatus.includes(day.externalId)).length, 0)
        })
      })

      it('should show a device status for each day of the current month by default', async () => {
        const devicesReponse = await server.get(maintenanceStatusPath).set('Authorization', `Bearer ${shared.token}`)
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
        const fromDate = subMonths(new Date(), 1)
        const toDate = new Date()
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
        const filterOnDeviceMaintenanceStatus = ['inactiveUnknown', 'inactiveNoTestsPerformed', 'inactiveDownForRepair']
        let devicesReponse = await server
          .get(
            `${maintenanceStatusPath}?minDate=${formatDateOrDefault(
              startOfMonth(subMonths(new Date(), 1)),
              'yyyy-MM-dd'
            )}&maxDate=${formatDateOrDefault(
              endOfMonth(subMonths(new Date(), 1)),
              'yyyy-MM-dd'
            )}&${filterOnDeviceMaintenanceStatus.map(status => `deviceMaintenanceStatusId=${status}`).join('&')}`
          )
          .set('Authorization', `Bearer ${shared.token}`)
        const { id: deviceId } = devicesReponse.body.data[0]
        const newDeviceMaintenanceStatusLog = {
          deviceId,
          deviceMaintenanceStatusId: deviceMaintenanceStatuses.inactiveOutOfInventory,
          day: getLocalDateInUtc(startOfToday()),
          data: JSON.stringify({
            options: { data: { notes: 'More cartridges expected next month' } },
          }),
          createdOn: setMilliseconds(new Date(), 0),
        }
        const [lastLogId] = await knex('DeviceMaintenanceStatusLog').insert(newDeviceMaintenanceStatusLog)
        await knex('Device').where('id', deviceId).update({
          deviceMaintenanceStatusLogId: lastLogId,
        })
        const deviceWithLogWithNote = await knex('Device as d')
          .join('DeviceMaintenanceStatusLog as dmsl', 'd.deviceMaintenanceStatusLogId', 'dmsl.id')
          .where(queryBuilder => {
            queryBuilder.whereRaw(
              "IFNULL(JSON_UNQUOTE(JSON_EXTRACT(IFNULL(dmsl.data, '{}'), '$.options.data.notes')), '') <> ''"
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
          notes: JSON.parse(newDeviceMaintenanceStatusLog.data).options.data.notes,
        })
      })
    })

    describe('/maintenance-statuses', () => {
      const maintenanceStatusesPath = `${path}/maintenance-statuses`
      it('should return a list of different maintenance statuses that a device can be in', async () => {
        const devicesReponse = await server.get(maintenanceStatusesPath).set('Authorization', `Bearer ${shared.token}`)
        assert.isOk(devicesReponse.body.ok)
        assert.equal(devicesReponse.body.length, devicesReponse.body.total)
        assert.equal(devicesReponse.body.length, devicesReponse.body.data.length)
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
            name: 'No Tests Performed',
            i18nKey: 'inactiveNoTestsPerformed',
            externalId: 'inactiveNoTestsPerformed',
            active: 0,
            manuallySet: 0,
          },
          {
            name: 'Unknown',
            i18nKey: 'inactiveUnknown',
            externalId: 'inactiveUnknown',
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
            name: 'Decommissioned',
            i18nKey: 'inactiveDecommissioned',
            externalId: 'inactiveDecommissioned',
            active: 0,
            manuallySet: 0,
          },
        ])
      })
    })
  })

  describe('POST', () => {
    describe('Device Maintenance - Calibration and Warranty', () => {
      let deviceMaintenanceIdsToRestore
      let deviceMaintenanceIdsToDelete = []
      let deviceId

      before(async () => {
        const res = await server.get(path).set('Authorization', `Bearer ${shared.token}`)

        assert.equal(res.status, 200)
        ;[{ id: deviceId }] = _.reject(res.body.data, ['maintenanceStatus', 'inactiveDecommissioned'])
        assert.isAbove(deviceId, 0)
      })
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

        await knex('DeviceMaintenance').whereIn('id', deviceMaintenanceIdsToDelete).del()

        await knex('DeviceMaintenance').whereIn('id', deviceMaintenanceIdsToRestore).update({ current: 1 })
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
        assert.equal(new Date(device[datePropName]).toDateString(), new Date(contextDate).toDateString())
        assert.equal(device[notesPropName], notes)
        // additional assertions
        assert.isAbove(deviceMaintenanceId, 0)

        deviceMaintenanceIdsToDelete.push(deviceMaintenanceId)
      }

      // -----------------------------
      function checkMaintenance(externalId, datePropName, notesPropName) {
        it(`${externalId} - should create new entry in DeviceMaintenance table, update it, and create another new`, async () => {
          const options = { datePropName, notesPropName }
          let notes = 'Some sample notes'
          let reqData
          // ----------------------
          // post new date
          let contextDate = new Date('2077-12-31').toISOString()
          reqData = { contextDate, notes, externalId }
          const response1 = await server
            .post(`${path}/maintenance/${deviceId}`)
            .set('Authorization', `Bearer ${shared.token}`)
            .send(reqData)

          assert.equal(response1.status, 200)
          assertBase(reqData, response1.body, options)

          const prevDeviceMaintenanceId = response1.body.deviceMaintenanceId

          // ----------------------
          // post same date
          notes = 'Another notes but date remains unchanged'
          reqData = { contextDate, notes, externalId }
          const response2 = await server
            .post(`${path}/maintenance/${deviceId}`)
            .set('Authorization', `Bearer ${shared.token}`)
            .send(reqData)

          assert.equal(response2.status, 200)
          assertBase(reqData, response2.body, options)
          // we updated DeviceMaintenance, so id did not change
          assert.equal(prevDeviceMaintenanceId, response2.body.deviceMaintenanceId)

          // ----------------------
          // post new date
          notes = '' // empty note
          contextDate = new Date('2088-10-10').toISOString()
          reqData = { contextDate, notes, externalId }
          const response3 = await server
            .post(`${path}/maintenance/${deviceId}`)
            .set('Authorization', `Bearer ${shared.token}`)
            .send(reqData)

          assert.equal(response3.status, 200)
          assertBase(reqData, response3.body, options)
          // we inserted new entry into DeviceMaintenance - so id's differ
          assert.notEqual(prevDeviceMaintenanceId, response3.body.deviceMaintenanceId)
        })
      }
    })

    describe('/maintenance-status-by-period/{deviceId}', () => {
      const maintenanceStatusByPeriodPath = `${path}/maintenance-status-by-period`
      let statusTestDeviceContext
      let theGreatestDeviceIEverCreated
      const deviceName = 'Oh, this device is great'
      const deviceMaintenanceStatusExternalId = 'inactiveDownForRepair'

      before(async () => {
        statusTestDeviceContext = createGxConnectTestContext(server, {
          macAddress: 'It is not a Mac, it is a PC',
          adminUsername: 'admin',
          adminPassword: 'test07',
          countryCode: 'US',
          deviceName: 'Oh, this device is great',
          deviceSerialNumber: 'And look that serial! Amazing',
          hostId: 'What should I put here?',
        })
        await statusTestDeviceContext.registerAndSetDevice()
        theGreatestDeviceIEverCreated = await knex('Device').where({ name: 'Oh, this device is great' }).first()

        // Set the createdOn date to 6 days ago, so we can update the status log for a range of days
        await knex('Device')
          .where({ id: theGreatestDeviceIEverCreated.id })
          .update({ createdOn: new Date('2020-01-01T12:00:00.000Z') })
      })

      after(async () => {
        await statusTestDeviceContext.cleanUp()
      })

      const assertValidStatusInDateRange = async (
        dateFrom,
        dateTo,
        deviceMaintenanceStatusLogIds,
        deviceMaintenanceStatusExternalId
      ) => {
        const logs = await knex('DeviceMaintenanceStatusLog as dmsl')
          .innerJoin('Device as d', 'dmsl.deviceId', 'd.id')
          .innerJoin('DeviceMaintenanceStatus as dms', 'dmsl.deviceMaintenanceStatusId', 'dms.id')
          .whereIn('dmsl.id', deviceMaintenanceStatusLogIds)
          .select('d.name as deviceName', 'dms.externalId', knex.raw('DATE(dmsl.day) as day'))
        const logsByDay = []
        logs.forEach(log => {
          logsByDay[log.day.toISOString()] = _.omit(log, 'day')
        })
        getArrayOfDaysInRange(dateFrom, dateTo).forEach(day => {
          const utcDay = startOfDayUtc(day).toISOString()
          assert.equal(logsByDay[utcDay].deviceName, deviceName)
          assert.equal(logsByDay[utcDay].externalId, deviceMaintenanceStatusExternalId)
        })
        assert.equal(deviceMaintenanceStatusLogIds.length, 8)
      }

      it('should save the maintenance status of the device for a date range', async () => {
        const { id: deviceId } = theGreatestDeviceIEverCreated

        const dateFrom = '2020-12-12T00:00:00.000-03:00'
        const dateTo = '2020-12-19T00:00:00.000-03:00'
        const payload = {
          externalId: deviceMaintenanceStatusExternalId,
          dateFrom,
          dateTo,
          notes: "Service engineer visited yesterday and couldn't finish by 3:30 PM",
          expectedBackOnline: '2020-12-12T00:00:00.000-03:00',
        }

        // Should update to inactiveDownForRepair
        const toInactiveDownForRepairResponse = await server
          .post(`${maintenanceStatusByPeriodPath}/${deviceId}`)
          .set('Authorization', `Bearer ${shared.token}`)
          .send(payload)
        assert.isOk(toInactiveDownForRepairResponse.body.ok)
        await assertValidStatusInDateRange(
          dateFrom,
          dateTo,
          toInactiveDownForRepairResponse.body.data.deviceMaintenanceStatusLogIds,
          deviceMaintenanceStatusExternalId
        )

        const { deviceMaintenanceStatusLogIds } = toInactiveDownForRepairResponse.body.data

        // Change all the inserted logs to Active
        const [activeStatusId] = await knex('DeviceMaintenanceStatus').where({ externalId: 'active' }).pluck('id')
        await knex('DeviceMaintenanceStatusLog')
          .whereIn('id', deviceMaintenanceStatusLogIds)
          .update({ deviceMaintenanceStatusId: activeStatusId })

        // Active days cannot be changed
        const createdResultsIds = await statusTestDeviceContext.createResultForThisDevice({
          resultDetails: { endedOn: '2020-12-13T00:00:00.000-03:00' },
        })

        payload.externalId = 'inactiveDownForRepair'
        const fromActiveResponse = await server
          .post(`${maintenanceStatusByPeriodPath}/${deviceId}`)
          .set('Authorization', `Bearer ${shared.token}`)
          .send(payload)
        assert.equal(fromActiveResponse.body.statusCode, 400)
        assert.equal(
          fromActiveResponse.body.message,
          'You cannot change the status of a device in days when it was active'
        )

        await statusTestDeviceContext.removeResults([createdResultsIds])

        // Active status cannot be manuallyset
        payload.externalId = 'active'
        const toActiveResponse = await server
          .post(`${maintenanceStatusByPeriodPath}/${deviceId}`)
          .set('Authorization', `Bearer ${shared.token}`)
          .send(payload)
        assert.equal(toActiveResponse.body.statusCode, 400)
        assert.equal(toActiveResponse.body.message, "The status you are trying to assign can't be set manually")

        // TODO: add validations for 'You cannot change the status of a device to "Reported Active" for days when it was reported as "No Tests Performed"'
      })
    })

    describe('/maintenance-status/{deviceId}', () => {
      let editableDeviceMaintenanceStatusIds
      let device
      let deviceId
      let deviceMaintenanceStatusId
      let deviceMaintenanceStatusLogId = null
      before(async () => {
        const deviceMaintenanceStatuses = await allDeviceMaintenanceStatusToId()
        editableDeviceMaintenanceStatusIds = await knex('DeviceMaintenanceStatus')
          .where('manuallySet', true)
          .andWhere('externalId', '<>', 'inactiveDownForRepair')
          .pluck('externalId')
        const [deviceMaintenanceStatusExternalId] = editableDeviceMaintenanceStatusIds
        deviceMaintenanceStatusId = deviceMaintenanceStatuses[deviceMaintenanceStatusExternalId]

        device = await knex('DeviceTypeCategory as dtc')
          .join('DeviceType as dt', 'dtc.id', 'dt.deviceTypeCategoryId')
          .join('Device as d', 'dt.id', 'd.deviceTypeId')
          .join('Partner as p', 'd.partnerId', 'p.id')
          .where('p.name', 'Partner One')
          .andWhere('dtc.hasResults', true)
          .andWhere(qb => qb.whereNotIn('dt.externalId', INTERNAL_DEVICE_IDS))
          .first('d.id', 'd.deviceMaintenanceStatusLogId', 'd.createdOn')
        deviceId = device.id

        await knex('Device').where('id', deviceId).update('createdOn', subDays(startOfToday(), 6))
      })
      afterEach(async () => {
        if (deviceMaintenanceStatusLogId) {
          // restore original device.deviceMaintenanceStatusLogId
          await knex('Device').where({ id: deviceId }).update({
            deviceMaintenanceStatusLogId: device.deviceMaintenanceStatusLogId,
          })
          // remove inserted entry in DeviceMaintenanceStatusLog
          await knex('DeviceMaintenanceStatusLog').where('id', deviceMaintenanceStatusLogId).del()
          // reset value
          deviceMaintenanceStatusLogId = null
        }
      })

      after(async () => {
        await knex('Device').where('id', deviceId).update('createdOn', device.createdOn)
      })

      const maintenanceStatusPath = `${path}/maintenance-status`
      it('should save the maintenance status of the device', async () => {
        ;[deviceMaintenanceStatusLogId] = await knex('DeviceMaintenanceStatusLog').insert({
          deviceId,
          deviceMaintenanceStatusId,
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
              notes: "Service engineer visited yesterday and couldn't finish by 3:30 PM",
            },
          },
        }
        const updateMaintenanceStatusResponse = await server
          .post(`${maintenanceStatusPath}/${deviceWithEditableStatus.id}`)
          .set('Authorization', `Bearer ${shared.token}`)
          .send(payload)
        assert.isOk(updateMaintenanceStatusResponse.body.ok)
        assert.isOk(updateMaintenanceStatusResponse.body.data.deviceMaintenanceStatusLogId)
        const deviceMaitnenanceStatusLog = await knex('DeviceMaintenanceStatusLog')
          .where('id', updateMaintenanceStatusResponse.body.data.deviceMaintenanceStatusLogId)
          .first()
        deviceMaitnenanceStatusLog.data = JSON.parse(deviceMaitnenanceStatusLog.data)
        expect(deviceMaitnenanceStatusLog.data).to.containSubset(payload)
      })

      it('should provide shallow access to write to data.options.data.notes', async () => {
        ;[deviceMaintenanceStatusLogId] = await knex('DeviceMaintenanceStatusLog').insert({
          deviceId,
          deviceMaintenanceStatusId,
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
        assert.isOk(updateMaintenanceStatusResponse.body.data.deviceMaintenanceStatusLogId)
        const deviceMaitnenanceStatusLog = await knex('DeviceMaintenanceStatusLog')
          .where('id', updateMaintenanceStatusResponse.body.data.deviceMaintenanceStatusLogId)
          .first()
        deviceMaitnenanceStatusLog.data = JSON.parse(deviceMaitnenanceStatusLog.data)
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

  describe('Skips decommissioned device', () => {
    let deviceMaintenanceStatuses
    let devices
    let deviceDecommissioned
    let deviceMaintenanceStatusLog

    before(async () => {
      deviceMaintenanceStatuses = await allDeviceMaintenanceStatusToId()
      // get all devices
      const res = await server.get(path).set('Authorization', `Bearer ${shared.token}`)
      devices = res.body.data
      // get first device with non-Decommissioned maintenance status
      ;[deviceDecommissioned] = devices.filter(
        d => d.maintenanceStatus && d.maintenanceStatus !== 'inactiveDecommissioned'
      )
      // ... and it's current maintenance status log
      deviceMaintenanceStatusLog = await knex('Device as d')
        .innerJoin('DeviceMaintenanceStatusLog as dml', 'd.deviceMaintenanceStatusLogId', 'dml.id')
        .where('d.id', deviceDecommissioned.id)
        .first('dml.*')
    })

    after(async () => {
      const { id, deviceMaintenanceStatusId } = deviceMaintenanceStatusLog
      await knex('DeviceMaintenanceStatusLog').where({ id }).update({ deviceMaintenanceStatusId })
    })

    it('should set device maintenance status to "inactiveDecommissioned" and check that endpoint skips it', async () => {
      const liveDevices = devices.filter(d => d.maintenanceStatus !== 'inactiveDecommissioned')
      expect(liveDevices.length).to.be.greaterThan(0)

      // set device maintenance status to 'decommissioned'
      await knex('DeviceMaintenanceStatusLog').where('id', deviceMaintenanceStatusLog.id).update({
        deviceMaintenanceStatusId: deviceMaintenanceStatuses.inactiveDecommissioned,
      })

      // read new list of devices
      const res = await server.get(path).set('Authorization', `Bearer ${shared.token}`)
      const devicesNew = res.body.data
      const liveDevicesNew = devicesNew.filter(d => d.maintenanceStatus !== 'inactiveDecommissioned')
      // we set live device to 'decommissioned' state, so new
      // list of devices should be less than original list
      expect(liveDevicesNew.length).to.be.lessThan(liveDevices.length)
    })
  })

  describe('Message Queue', () => {
    describe('DEVICE_MAINTENANCE_STATUS_LOG_SCHEDULED', () => {
      const context = createTestContext(knex, server, {
        user: 'admin',
        type: 'DaktariVirology',
        partner: 'Partner One',
      })
      const startOfTodayUtc = getLocalDateInUtc(startOfToday())
      const startOfDayTwoDaysAgoUtc = getLocalDateInUtc(subDays(startOfToday(), 2))
      const dispatchDeviceMaintenanceStatusForDay = async day => {
        const messageContext = await createMessageContext()
        messageContext.bindActionCreators({ logDeviceMaintenanceStatus })
        await messageContext.logDeviceMaintenanceStatus(day)
        await waitForIdle()
      }

      before(async () => {
        deviceApprovals = await allDeviceApprovalToId()
        deviceMaintenanceStatuses = await allDeviceMaintenanceStatusToId()
      })

      beforeEach(async () => {
        // creates result for today (Result.endedOn = now)
        await context.createDeviceWithResult({ instrumentSerial: 'AA1' })
      })
      afterEach(context.afterEach)

      /**
       * helper funcs
       */
      // -----------------------------
      // same query pattern as in func onDeviceMaintenanceStatusLogScheduled()
      // in `onDeviceMaintenanceStatusLogScheduled`
      const getDeviceDetails = async (today, deviceId) =>
        knex('Device as d')
          .leftJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
          .leftJoin('DeviceMaintenanceStatusLog as today_dmsl', queryBuilder => {
            queryBuilder.on('d.id', 'today_dmsl.deviceId').andOn('today_dmsl.day', knex.raw('DATE(?)', [today]))
          })
          .leftJoin('DeviceMaintenanceStatus as today_dms', 'today_dmsl.deviceMaintenanceStatusId', 'today_dms.id')
          .leftJoin('DeviceMaintenanceStatusLog as current_dmsl', 'd.deviceMaintenanceStatusLogId', 'current_dmsl.id')
          .leftJoin(
            'DeviceMaintenanceStatus as current_dms',
            'current_dmsl.deviceMaintenanceStatusId',
            'current_dms.id'
          )
          .where('d.id', deviceId)
          .select(
            'd.id',
            'current_dms.externalId as currentMaintenanceStatusExternalId',
            'today_dms.externalId as todaysLoggedMaintenanceStatusExternalId',
            'da.token as approvalToken'
          )

      it.skip('should log the maintenance status `active` for un-logged device with result', async () => {
        const { deviceId } = context
        /**
         * set device.deviceMaintenanceStatusId to 'inactiveUnknown' as of 2 days ago
         */
        const [deviceMaintenanceStatusLogId] = await knex('DeviceMaintenanceStatusLog').insert({
          deviceId,
          deviceMaintenanceStatusId: deviceMaintenanceStatuses.inactiveUnknown,
          data: '{}',
          day: startOfDayTwoDaysAgoUtc,
          createdOn: new Date(),
        })
        await knex('Device').where('id', deviceId).update({
          deviceApprovalId: deviceApprovals.approved,
          deviceMaintenanceStatusLogId,
        })

        // check before dispatch
        let deviceDetails = await getDeviceDetails(startOfTodayUtc, deviceId)
        expect(deviceDetails).to.containSubset([
          {
            id: deviceId,
            currentMaintenanceStatusExternalId: 'inactiveUnknown',
            todaysLoggedMaintenanceStatusExternalId: null,
            approvalToken: 'approved',
          },
        ])

        await dispatchDeviceMaintenanceStatusForDay(startOfTodayUtc)

        // check after dispatch
        deviceDetails = await getDeviceDetails(startOfTodayUtc, deviceId)
        expect(deviceDetails).to.containSubset([
          {
            id: deviceId,
            currentMaintenanceStatusExternalId: 'active',
            todaysLoggedMaintenanceStatusExternalId: 'active',
            approvalToken: 'approved',
          },
        ])
      })

      it('Should re-log the last inactivity reason, when the device is inactive during the day to process and the latest log entry was for a previous day', async () => {
        const { deviceId } = context
        /**
         * 3 DAYS AGO - set device.deviceMaintenanceStatusId to 'inactiveOutOfInventory'
         */
        const [deviceMaintenanceStatusLogId] = await knex('DeviceMaintenanceStatusLog').insert({
          deviceId,
          deviceMaintenanceStatusId: deviceMaintenanceStatuses.inactiveOutOfInventory,
          data: '{}',
          day: getLocalDateInUtc(subDays(startOfToday(), 3)),
          createdOn: new Date(),
        })
        await knex('Device').where('id', deviceId).update({
          deviceApprovalId: deviceApprovals.approved,
          deviceMaintenanceStatusLogId,
        })

        let deviceDetails = await getDeviceDetails(startOfDayTwoDaysAgoUtc, deviceId)
        expect(deviceDetails).to.containSubset([
          {
            id: deviceId,
            currentMaintenanceStatusExternalId: 'inactiveOutOfInventory',
            todaysLoggedMaintenanceStatusExternalId: null,
            approvalToken: 'approved',
          },
        ])

        await dispatchDeviceMaintenanceStatusForDay(startOfDayTwoDaysAgoUtc)

        deviceDetails = await getDeviceDetails(startOfDayTwoDaysAgoUtc, deviceId)
        expect(deviceDetails).to.containSubset([
          {
            id: deviceId,
            currentMaintenanceStatusExternalId: 'inactiveOutOfInventory',
            todaysLoggedMaintenanceStatusExternalId: 'inactiveOutOfInventory',
            approvalToken: 'approved',
          },
        ])
      })

      it("Should NOT re-log the last inactivity reason and log a status 'inactiveUnknown', when the device is inactive during the day to process and the latest log entry was for a posterior day", async () => {
        const { deviceId } = context
        /**
         * 1 DAY AGO - Set maintenance status 'inactiveOutOfInventory'
         */
        const [deviceMaintenanceStatusLogId] = await knex('DeviceMaintenanceStatusLog').insert({
          deviceId,
          deviceMaintenanceStatusId: deviceMaintenanceStatuses.inactiveOutOfInventory,
          data: '{}',
          day: getLocalDateInUtc(subDays(startOfToday(), 1)),
          createdOn: new Date(),
        })
        await knex('Device').where('id', deviceId).update({
          deviceApprovalId: deviceApprovals.approved,
          deviceMaintenanceStatusLogId,
        })

        /**
         * Remove all device results for avoiding 'inactiveNoTestsPerformed' status
         */
        await knex('Result').where({ deviceId }).del()

        /**
         * 2 DAYS AGO - Should set maintenance status 'inactiveUnknown'
         */
        await dispatchDeviceMaintenanceStatusForDay(startOfDayTwoDaysAgoUtc)

        // check after dispatch
        const deviceDetails = await getDeviceDetails(startOfDayTwoDaysAgoUtc, deviceId)
        expect(deviceDetails).to.containSubset([
          {
            id: deviceId,
            currentMaintenanceStatusExternalId: 'inactiveOutOfInventory',
            todaysLoggedMaintenanceStatusExternalId: 'inactiveUnknown',
            approvalToken: 'approved',
          },
        ])
      })

      it('should log the maintenance status `inactiveNoTestsPerformed` for a day when the device has not log, but it has future results', async () => {
        const { deviceId } = context
        /**
         * TODAY - The created context created a result for today
         */
        await knex('Device').where('id', deviceId).update({
          deviceApprovalId: deviceApprovals.approved,
        })

        /**
         * 2 DAYS AGO - re-processing logs will insert a new log status 'inactiveNoTestsPerformed' as we have a test after then
         */
        await dispatchDeviceMaintenanceStatusForDay(startOfDayTwoDaysAgoUtc)

        // check after dispatch
        const deviceDetails = await getDeviceDetails(startOfDayTwoDaysAgoUtc, deviceId)
        expect(deviceDetails).to.containSubset([
          {
            id: deviceId,
            todaysLoggedMaintenanceStatusExternalId: 'inactiveNoTestsPerformed',
          },
        ])
      })

      it('should log the maintenance status `inactiveNoTestsPerformed` for a day when the device was `inactiveUnknown` but have future results', async () => {
        const { deviceId } = context
        /**
         * TODAY - The created context created a result for today
         * 2 DAYS AGO - create log 'inactiveUnknown'
         */
        const [deviceMaintenanceStatusLogId] = await knex('DeviceMaintenanceStatusLog').insert({
          deviceId,
          deviceMaintenanceStatusId: deviceMaintenanceStatuses.inactiveUnknown,
          data: '{}',
          day: startOfDayTwoDaysAgoUtc,
          createdOn: new Date(),
        })
        await knex('Device').where('id', deviceId).update({
          deviceApprovalId: deviceApprovals.approved,
          deviceMaintenanceStatusLogId,
        })

        /**
         * 2 DAYS AGO - re-processing logs will change 'inactiveUnknown' to 'noTestsPerformed' as we have a test after then
         */
        await dispatchDeviceMaintenanceStatusForDay(startOfDayTwoDaysAgoUtc)

        // check after dispatch
        const deviceDetails = await getDeviceDetails(startOfDayTwoDaysAgoUtc, deviceId)
        expect(deviceDetails).to.containSubset([
          {
            id: deviceId,
            todaysLoggedMaintenanceStatusExternalId: 'inactiveNoTestsPerformed',
          },
        ])
      })

      it('should log the maintenance status `inactiveDecommissioned` for a day when the device did not report tests and it was previously decommissioned', async () => {
        const { deviceId } = context
        /**
         * 2 DAYS AGO - set device approval as decommissioned
         */
        await knex('Device').where('id', deviceId).update({
          deviceApprovalId: deviceApprovals.decommissioned,
        })
        await knex('DeviceApprovalLog').insert({
          deviceId,
          deviceApprovalId: deviceApprovals.decommissioned,
          createdOn: getLocalDateInUtc(subDays(startOfToday(), 2)),
        })

        /**
         * 1 DAY AGO - processing logs will set 'inactiveDecommissioned', as we didn't perform tests and approval status was set to 'decommissioned' previously
         */
        const day = getLocalDateInUtc(subDays(startOfToday(), 1))
        await dispatchDeviceMaintenanceStatusForDay(day)

        // check after dispatch
        const deviceDetails = await getDeviceDetails(day, deviceId)
        expect(deviceDetails).to.containSubset([
          {
            id: deviceId,
            todaysLoggedMaintenanceStatusExternalId: 'inactiveDecommissioned',
          },
        ])
      })

      it('should log the maintenance status `inactiveUnknown` for a day when the device did not report tests and it was decommissioned in the future', async () => {
        const { deviceId } = context
        /**
         * 2 DAYS AGO - set device approval as decommissioned
         */
        await knex('Device').where('id', deviceId).update({
          deviceApprovalId: deviceApprovals.decommissioned,
        })
        await knex('DeviceApprovalLog').insert({
          deviceId,
          deviceApprovalId: deviceApprovals.decommissioned,
          createdOn: getLocalDateInUtc(startOfToday()),
        })
        await knex('Result').where({ deviceId }).del()

        /**
         * 1 DAY AGO - processing logs will set 'inactiveUnknown', as we didn't perform tests and approval status was set to 'decommissioned' after the processed date
         */
        const day = getLocalDateInUtc(subDays(startOfToday(), 1))
        await dispatchDeviceMaintenanceStatusForDay(day)

        // check after dispatch
        const deviceDetails = await getDeviceDetails(day, deviceId)
        expect(deviceDetails).to.containSubset([
          {
            id: deviceId,
            todaysLoggedMaintenanceStatusExternalId: 'inactiveUnknown',
          },
        ])
      })

      it('Should set the device maintenance status log to inactiveNoTestsPerformed when it is inactiveUnknown and a new result is created for a future date', async () => {
        const { deviceId } = context
        /**
         * 1 DAY AGO - Set maintenance status 'inactiveUnknown'
         */
        await knex('DeviceMaintenanceStatusLog').insert({
          deviceId,
          deviceMaintenanceStatusId: deviceMaintenanceStatuses.inactiveUnknown,
          data: '{}',
          day: getLocalDateInUtc(subDays(startOfToday(), 1)),
          createdOn: new Date(),
        })
        /**
         * 2 DAYS AGO - Set maintenance status 'inactiveDownForRepair'
         */
        await knex('DeviceMaintenanceStatusLog').insert({
          deviceId,
          deviceMaintenanceStatusId: deviceMaintenanceStatuses.inactiveDownForRepair,
          data: '{}',
          day: getLocalDateInUtc(subDays(startOfToday(), 2)),
          createdOn: new Date(),
        })
        /**
         * TODAY - We already have a result in the database, so we just take it and queue a new result logged action
         * We will update all the inactiveUnknowns that were set before the result endedOn date (today)
         */
        const [resultId] = await knex('Result').where({ deviceId }).pluck('id')
        const [deviceLogId] = await knex('DeviceLog').where({ resultId }).pluck('id')
        const messageContext = await createMessageContext()
        const action = resultLogged(resultId, deviceLogId)
        await messageContext.dispatch(action)
        await waitForAction(action)
        await waitForIdle()

        /**
         * 1 DAY AGO - The maintenance status log should be inactiveNoTestsPerformed
         */
        let deviceDetails = await getDeviceDetails(getLocalDateInUtc(subDays(startOfToday(), 1)), deviceId)
        expect(deviceDetails).to.containSubset([
          {
            id: deviceId,
            todaysLoggedMaintenanceStatusExternalId: 'inactiveNoTestsPerformed',
          },
        ])

        /**
         * 2 DAYS AGO - The maintenance status log should be inactiveDownForRepair (only inactiveUnknown(s) should be changed)
         */
        deviceDetails = await getDeviceDetails(getLocalDateInUtc(subDays(startOfToday(), 2)), deviceId)
        expect(deviceDetails).to.containSubset([
          {
            id: deviceId,
            todaysLoggedMaintenanceStatusExternalId: 'inactiveDownForRepair',
          },
        ])
      })
    })
  })
})
