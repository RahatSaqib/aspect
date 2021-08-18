const chai = require('chai')

const { assert, expect } = chai
const subDays = require('date-fns/subDays')
const subMonths = require('date-fns/subMonths')
const Promise = require('bluebird')
const find = require('lodash/find')
const range = require('lodash/range')
const reduce = require('lodash/reduce')

const server = require('../utils/testUtils')
const {
  createGxConnectTestContext,
} = require('../deviceApi/geneXpert/gxconnect_utils')
const {
  getDeviceActivityPercentReport,
} = require('../../src/deviceMaintenanceStatus/serviceReports')
const { knex } = require('../../src/db')
const shared = require('../utils/sharedToken')

describe('Maintenance Reports', () => {
  let context
  let deviceId
  let deviceMaintenanceStatuses
  let activeDeviceMaintenanceStatusExternalIds
  let statuses
  let personId

  async function insertMaintenanceStatusLogs() {
    const logEntryBase = {
      deviceId,
      deviceMaintenanceStatusId: statuses.active,
      data: JSON.stringify({}),
      createdOn: new Date(),
      createdBy: personId,
    }

    const activeDates = ['2019-01-01', '2019-01-02', '2019-01-03']

    await Promise.each(activeDates, async date => {
      // Creating results generates active dates
      await context.createResultForThisDevice({
        resultDetails: {
          consumableLot: 'Lot 0',
          moduleName: 'Module A',
          moduleSerial: 'MOD-SER12345',
          instrumentSerial: 'SER1-02349',
          startedOn: date,
          endedOn: date,
        },
      })
      await knex('DeviceMaintenanceStatusLog').insert({
        ...logEntryBase,
        deviceMaintenanceStatusId: statuses.active,
        day: date,
      })
    })

    const [deviceMaintenanceStatusLogId] = await knex(
      'DeviceMaintenanceStatusLog'
    ).insert({
      ...logEntryBase,
      deviceMaintenanceStatusId: statuses.inactiveDownForRepair,
      day: '2019-01-04',
    })

    await knex('Device')
      .where({ id: deviceId })
      .update({ deviceMaintenanceStatusLogId })
  }

  async function getMaintenanceStatusOverTimeResponse(minDate, maxDate) {
    // Then, in the API we consider the same dates but in UTC (without conversion)
    return server
      .get(
        `${maintenanceOverTimePath}?minDate=${encodeURIComponent(
          minDate
        )}&maxDate=${encodeURIComponent(maxDate)}`
      )
      .set('Authorization', `Bearer ${shared.token}`)
  }

  const evaluateCorrectDailyStatus = async (minDate, maxDate, assertions) => {
    const maintenanceStatusOverTime =
      await getMaintenanceStatusOverTimeResponse(minDate, maxDate)
    assert.equal(maintenanceStatusOverTime.status, 200)
    assert.typeOf(maintenanceStatusOverTime.body, 'Object')
    assert.property(maintenanceStatusOverTime.body, 'data')
    assert.typeOf(maintenanceStatusOverTime.body.data, 'array')

    const tamagotchi = find(
      maintenanceStatusOverTime.body.data,
      d => d.id === deviceId
    )
    assert.isNotNull(tamagotchi)
    assert.equal(tamagotchi.latitude, 1)
    assert.equal(tamagotchi.longitude, 5)
    assert.isAtLeast(tamagotchi.totalResults, 1)
    // const tamagotchiLastStatus = last(tamagotchi.maintenanceStatusHistory)

    assertions.forEach(({ day, ...fields }) => {
      expect(
        tamagotchi.maintenanceStatusHistory.find(status =>
          status.day.includes(day)
        )
      ).to.containSubset({
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

  before(async () => {
    deviceMaintenanceStatuses = await knex('DeviceMaintenanceStatus').select()
    activeDeviceMaintenanceStatusExternalIds = deviceMaintenanceStatuses
      .filter(dms => dms.active)
      .map(dms => dms.externalId)
    statuses = reduce(
      deviceMaintenanceStatuses,
      (memo, deviceMaintenanceStatus) => {
        memo[deviceMaintenanceStatus.externalId] = deviceMaintenanceStatus.id
        return memo
      },
      {}
    )
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

    const { id, siteId } = context.device
    deviceId = id
    await knex('Site')
      .where({ id: siteId })
      .update({ latitude: 1, longitude: 5 })

    await insertMaintenanceStatusLogs()
  })

  afterEach(async () => context.cleanUp())

  const maintenanceOverTimePath = '/api/device/maintenance-over-time'
  shared.checkToken(server, maintenanceOverTimePath)

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
      evaluateCorrectDailyStatus(
        '2019-01-01T00:00:00.000-03:00',
        '2019-01-31T00:00:00.000-03:00',
        [
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
        ]
      ))

    it('should get the correct daily status for positive timezones', async () =>
      evaluateCorrectDailyStatus(
        '2019-01-01T00:00:00.000+03:00',
        '2019-01-31T00:00:00.000+03:00',
        assertionsForNotNegativeTz
      ))

    it('should get the correct daily status for Z timezone', async () =>
      evaluateCorrectDailyStatus(
        '2019-01-01T00:00:00.000Z',
        '2019-01-31T00:00:00.000Z',
        assertionsForNotNegativeTz
      ))
  })

  describe('maintenance-last-reported', () => {
    const pathLastReported = '/api/device/maintenance-last-reported'

    shared.checkToken(server, pathLastReported)

    it('should get the correct current status', async () => {
      const lastReportedStatus = await server
        .get(`${pathLastReported}`)
        .set('Authorization', `Bearer ${shared.token}`)

      assert.equal(lastReportedStatus.status, 200)
      assert.typeOf(lastReportedStatus.body, 'Object')
      assert.property(lastReportedStatus.body, 'data')
      assert.typeOf(lastReportedStatus.body.data, 'array')
      const tamagotchi = find(
        lastReportedStatus.body.data,
        d => d.id === deviceId
      )
      assert.isNotNull(tamagotchi)
      assert.equal(tamagotchi.latitude, 1)
      assert.equal(tamagotchi.longitude, 5)
      expect(tamagotchi.maintenanceStatusExternalId).equals(
        'inactiveDownForRepair'
      )
    })
  })

  describe('device_activity_percent', () => {
    it('should balance with device active rate in /api/device/maintenance-over-time', async () => {
      // Status over time report
      const maintenanceStatusOverTime =
        await getMaintenanceStatusOverTimeResponse(
          '2019-01-01T00:00:00.000Z',
          '2019-01-31T00:00:00.000Z'
        )

      // Device activity percent report
      const deviceActivityPercentData = await getDeviceActivityPercentReport(
        { credentials: { name: 'admin' } },
        {
          minDate: '2019-01-01T00:00:00.000',
          maxDate: '2019-01-31T00:00:00.000',
        }
      )

      // Get only status over time report for Tamagotchi device
      const tamagotchiMaintenanceStatusByDay =
        maintenanceStatusOverTime.body.data.find(
          device => device.id === deviceId
        )
      assert.isNotNull(tamagotchiMaintenanceStatusByDay)

      // Get only device activity percent report for Tamagotchi device
      const tamagotchiActivityPercentReport =
        deviceActivityPercentData.data.find(
          deviceActivityPercentData => deviceActivityPercentData.id === deviceId
        )
      assert.isNotNull(tamagotchiActivityPercentReport)

      const deviceActivityPercentForMonth =
        tamagotchiActivityPercentReport['2019-01']
      const maintenanceStatusHistoryForMonth =
        tamagotchiMaintenanceStatusByDay.maintenanceStatusHistory.filter(
          day => !day.isWeekend
        )

      const activeMaintenanceStatusHistoryForMonth =
        maintenanceStatusHistoryForMonth.filter(
          msh =>
            !msh.isWeekend &&
            ((msh.totalResults > 0 && msh.maintenanceStatusExternalId) ||
              (activeDeviceMaintenanceStatusExternalIds.includes(
                msh.maintenanceStatusExternalId
              ) &&
                msh.maintenanceStatusExternalId !== 'active'))
        )
      const activityPercentFromStatusOverTime = (
        (activeMaintenanceStatusHistoryForMonth.length /
          maintenanceStatusHistoryForMonth.length) *
        100
      ).toFixed(2)
      expect(`${activityPercentFromStatusOverTime}%`).to.equal(
        deviceActivityPercentForMonth
      )
    })
  })

  describe('Daily Status graph', () => {
    it('should have more than 1 day with same maintenance status', async () => {
      await Promise.each(range(1, 2), async month =>
        insertMaintenanceStatusLogs(subMonths(monthAgo, month))
      )
      const maintenanceStatusOverTime =
        await getMaintenanceStatusOverTimeResponse(
          '2019-01-01T00:00:00.000Z',
          '2019-01-31T00:00:00.000Z'
        )

      const data = maintenanceStatusOverTime.body.data
        .find(device => device.id === deviceId)
        .maintenanceStatusHistory.filter(
          x => !!x.maintenanceStatusExternalId && x.daysInSameStatus > 1
        )

      // more than 1 day is expected
      expect(data).to.have.lengthOf.above(1)
    })
  })
})
