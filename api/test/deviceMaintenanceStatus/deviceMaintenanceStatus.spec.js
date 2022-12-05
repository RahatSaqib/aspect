const chai = require('chai')
const chaiSubset = require('chai-subset')

const { assert, expect } = chai.use(chaiSubset)
const subDays = require('date-fns/subDays')
const subMonths = require('date-fns/subMonths')
const Promise = require('bluebird')
const find = require('lodash/find')
const range = require('lodash/range')
const { waitForIdle } = require('../utils/mqUtils')
const server = require('../utils/testUtils')
const { createGxConnectTestContext } = require('../deviceApi/geneXpert/gxconnect_utils')
const { getDeviceActivityPercentReport } = require('../../src/deviceMaintenanceStatus/serviceReports')
const { knex } = require('../../src/db')
const shared = require('../utils/sharedToken')
const { allDeviceMaintenanceStatusToId } = require('../../src/shared/dictionary')

describe('Maintenance Reports', () => {
  let context
  let deviceId
  let activeDeviceMaintenanceStatusExternalIds
  let statuses
  let personId

  async function insertMaintenanceStatusLogs() {
    const logEntryBase = {
      deviceId,
      deviceMaintenanceStatusId: statuses.active,
      data: JSON.stringify({}),
      createdBy: personId,
    }

    const statusByDay = [
      ['2018-12-31', statuses.active],
      ['2019-01-01', statuses.active],
      ['2019-01-02', statuses.active],
      ['2019-01-03', statuses.active],
      ['2019-01-04', statuses.inactiveDownForRepair],
      ['2019-02-01', statuses.active],
    ]

    await Promise.each(statusByDay, async ([day, deviceMaintenanceStatusId]) => {
      const createdOn = new Date()

      if (deviceMaintenanceStatusId === statuses.active) {
        // Creating results generates active dates
        await context.createResultForThisDevice({
          resultDetails: {
            consumableLot: 'Lot 0',
            moduleName: 'Module A',
            moduleSerial: 'MOD-SER12345',
            instrumentSerial: 'SER1-02349',
            startedOn: day,
            endedOn: day,
            createdOn,
          },
        })
      }
      await knex('DeviceMaintenanceStatusLog').insert({
        ...logEntryBase,
        deviceMaintenanceStatusId,
        day,
        createdOn,
      })
    })

    // await knex('DeviceMaintenanceStatusLog').insert({
    //   ...logEntryBase,
    //   deviceMaintenanceStatusId: statuses.inactiveDownForRepair,
    //   day: '2019-01-04',
    //   createdOn: new Date(),
    // })
  }

  async function getMaintenanceStatusOverTimeResponse(minDate, maxDate) {
    // Then, in the API we consider the same dates but in UTC (without conversion)
    return server
      .get(`${maintenanceOverTimePath}?minDate=${encodeURIComponent(minDate)}&maxDate=${encodeURIComponent(maxDate)}`)
      .set('Authorization', `Bearer ${shared.token}`)
  }

  const evaluateCorrectDailyStatus = async (minDate, maxDate, assertions) => {
    const maintenanceStatusOverTime = await getMaintenanceStatusOverTimeResponse(minDate, maxDate)
    assert.equal(maintenanceStatusOverTime.status, 200)
    assert.typeOf(maintenanceStatusOverTime.body, 'Object')
    assert.property(maintenanceStatusOverTime.body, 'data')
    assert.typeOf(maintenanceStatusOverTime.body.data, 'array')

    const device = find(maintenanceStatusOverTime.body.data, d => d.id === deviceId)
    assert.isNotNull(device)
    assert.equal(device.latitude, 1)
    assert.equal(device.longitude, 5)
    assert.isAtLeast(device.totalResults, 1)

    assertions.forEach(({ day, ...fields }) => {
      expect(device.maintenanceStatusHistory.find(status => status.day.includes(day))).to.containSubset({
        ...fields,
      })
    })
  }

  function getLastFriday() {
    let now = new Date()
    while (now.getDay() !== 5) {
      now = subDays(now, 1)
    }
    return now
  }
  const lastFriday = getLastFriday()
  const monthAgo = subDays(lastFriday, 30)

  const maintenanceOverTimePath = '/api/device/maintenance-over-time'

  before(async () => {
    shared.checkToken(server, maintenanceOverTimePath)
    statuses = await allDeviceMaintenanceStatusToId()
    activeDeviceMaintenanceStatusExternalIds = await knex('DeviceMaintenanceStatus')
      .where('active', true)
      .pluck('externalId')
    ;({ id: personId } = await knex('Person').where({ name: 'Admin' }).first())
  })

  beforeEach(async () => {
    context = createGxConnectTestContext(server, {
      countryCode: 'US',
      adminUsername: 'admin',
      adminPassword: 'test07',
      deviceName: 'Tamagotchi',
      macAddress: 'MAC00000000FAKE',
      hostId: 'TAMA-001',
      deviceSerialNumber: 'Tamagochi-PC-001',
    })

    await context.beforeRegisterAndSetDevice()

    await waitForIdle()

    const { id, siteId } = context.device
    deviceId = id
    await knex('Site').where({ id: siteId }).update({ latitude: 1, longitude: 5 })

    await insertMaintenanceStatusLogs()
  })

  afterEach(async () => context.cleanUp())

  describe('device/maintenance-over-time', () => {
    const assertionsForNotNegativeTz = [
      {
        day: '2019-01-01',
        maintenanceStatusExternalId: 'active',
        maintenanceStatusI18nKey: 'active',
        maintenanceStatusName: 'Active',
      },
      {
        day: '2019-01-02',
        maintenanceStatusExternalId: 'active',
        maintenanceStatusI18nKey: 'active',
        maintenanceStatusName: 'Active',
      },
      {
        day: '2019-01-03',
        maintenanceStatusExternalId: 'active',
        maintenanceStatusI18nKey: 'active',
        maintenanceStatusName: 'Active',
      },
      {
        day: '2019-01-04',
        maintenanceStatusExternalId: 'inactiveDownForRepair',
        maintenanceStatusI18nKey: 'inactiveDownForRepair',
        maintenanceStatusName: 'Down for Repair',
      },
    ]

    it('should get the correct daily status for negative timezones', async () =>
      /*
      For negative timezones:
      2019-01-01 - Active
      2019-01-02 - Active
      2019-01-03 - Unknown
      2019-01-04 - Down for Repair (originally Active, but overrited)

      For the day 2019-01-03 we don't find any results, so we take it as Unknown. Why? Considering a timezone -3, we can say that:
      - The inserted result's endedOn date is 2019-01-03T00:00:00.000Z
      - The device is Active for 2019-01-03 (we only save the date part)
      - We try to match the date 2019-01-03 with the number of results, so, we apply the filter 'where endedOn >= 2019-01-03T03:00:00.000Z' (we apply the user's timezone offset)
      - As the result's endedOn date is '2019-01-03T00:00:00.000Z' and we filter by >= 2019-01-03T03:00:00.000Z, we won't find any results
      - If the device is marked as Active, but no results were found for the user's timezone, then we consider the status = Unknown
      */
      evaluateCorrectDailyStatus('2019-01-01T00:00:00.000-03:00', '2019-01-31T00:00:00.000-03:00', [
        {
          day: '2019-01-01',
          maintenanceStatusExternalId: 'active',
          maintenanceStatusI18nKey: 'active',
          maintenanceStatusName: 'Active',
        },
        {
          day: '2019-01-02',
          maintenanceStatusExternalId: 'active',
          maintenanceStatusI18nKey: 'active',
          maintenanceStatusName: 'Active',
        },
        {
          day: '2019-01-03',
          maintenanceStatusExternalId: 'inactiveUnknown',
          maintenanceStatusI18nKey: 'inactiveUnknown',
          maintenanceStatusName: 'Unknown',
        },
        {
          day: '2019-01-04',
          maintenanceStatusExternalId: 'inactiveDownForRepair',
          maintenanceStatusI18nKey: 'inactiveDownForRepair',
          maintenanceStatusName: 'Down for Repair',
        },
      ]))

    /*
    For Z and positive timezones:
    2019-01-01 - Active
    2019-01-02 - Active
    2019-01-03 - Active
    2019-01-04 - Down for Repair (originally Active, but overrited)
    */
    it('should get the correct daily status for positive timezones', async () =>
      evaluateCorrectDailyStatus(
        '2019-01-01T00:00:00.000+03:00',
        '2019-01-31T00:00:00.000+03:00',
        assertionsForNotNegativeTz
      ))

    it('should get the correct daily status for Z timezone', async () =>
      evaluateCorrectDailyStatus('2019-01-01T00:00:00.000Z', '2019-01-31T00:00:00.000Z', assertionsForNotNegativeTz))
  })

  const pathLastReported = '/api/device/maintenance-last-reported'
  before(() => {
    shared.checkToken(server, pathLastReported)
  })

  describe('maintenance-last-reported', () => {
    it('should get the correct current status', async () => {
      const lastReportedStatus = await server.get(`${pathLastReported}`).set('Authorization', `Bearer ${shared.token}`)

      assert.equal(lastReportedStatus.status, 200)
      assert.typeOf(lastReportedStatus.body, 'Object')
      assert.property(lastReportedStatus.body, 'data')
      assert.typeOf(lastReportedStatus.body.data, 'array')
      const tamagotchi = find(lastReportedStatus.body.data, d => d.id === deviceId)
      assert.isNotNull(tamagotchi)
      assert.equal(tamagotchi.latitude, 1)
      assert.equal(tamagotchi.longitude, 5)
      expect(tamagotchi.maintenanceStatusExternalId).equals('active')
    })
  })

  describe('device_activity_percent', () => {
    it('should balance with device active rate in /api/device/maintenance-over-time', async () => {
      // Status over time report
      const maintenanceStatusOverTime = await getMaintenanceStatusOverTimeResponse(
        '2019-01-01T00:00:00.000Z',
        '2019-01-31T00:00:00.000Z'
      )

      // Device activity percent report
      const deviceActivityPercentData = await getDeviceActivityPercentReport(
        { credentials: { name: 'admin', personId: 1 } },
        {
          minDate: '2019-01-01T00:00:00.000',
          maxDate: '2019-01-31T00:00:00.000',
        }
      )

      // Get only status over time report for Tamagotchi device
      const tamagotchiMaintenanceStatusByDay = maintenanceStatusOverTime.body.data.find(
        device => device.id === deviceId
      )
      assert.isNotNull(tamagotchiMaintenanceStatusByDay)

      // Get only device activity percent report for Tamagotchi device
      const tamagotchiActivityPercentReport = deviceActivityPercentData.data.find(
        deviceActivityPercentData => deviceActivityPercentData.id === deviceId
      )
      assert.isNotNull(tamagotchiActivityPercentReport)

      const deviceActivityPercentForMonth = tamagotchiActivityPercentReport['2019-01']
      const maintenanceStatusHistoryForMonth = tamagotchiMaintenanceStatusByDay.maintenanceStatusHistory.filter(
        day => !day.isWeekend
      )

      const activeMaintenanceStatusHistoryForMonth = maintenanceStatusHistoryForMonth.filter(
        msh =>
          !msh.isWeekend &&
          ((msh.totalResults > 0 && msh.maintenanceStatusExternalId) ||
            (activeDeviceMaintenanceStatusExternalIds.includes(msh.maintenanceStatusExternalId) &&
              msh.maintenanceStatusExternalId !== 'active'))
      )
      const activityPercentFromStatusOverTime = (
        (activeMaintenanceStatusHistoryForMonth.length / maintenanceStatusHistoryForMonth.length) *
        100
      ).toFixed(2)
      expect(`${activityPercentFromStatusOverTime}%`).to.equal(deviceActivityPercentForMonth)
    })
  })

  describe('Daily Status graph', () => {
    it('should have more than 1 day with same maintenance status', async () => {
      await Promise.each(range(1, 2), async month => insertMaintenanceStatusLogs(subMonths(monthAgo, month)))
      const maintenanceStatusOverTime = await getMaintenanceStatusOverTimeResponse(
        '2019-01-01T00:00:00.000Z',
        '2019-01-31T00:00:00.000Z'
      )

      const data = maintenanceStatusOverTime.body.data
        .find(device => device.id === deviceId)
        .maintenanceStatusHistory.filter(x => !!x.maintenanceStatusExternalId && x.daysInSameStatus > 1)

      // more than 1 day is expected
      expect(data).to.have.lengthOf.above(1)
    })
  })
})
