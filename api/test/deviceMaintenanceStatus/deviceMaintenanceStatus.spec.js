const chai = require('chai')

const { assert, expect } = chai
const subDays = require('date-fns/subDays')
const subMonths = require('date-fns/subMonths')
const isValid = require('date-fns/isValid')
const dateFormat = require('date-fns/format')
const Promise = require('bluebird')
const find = require('lodash/find')
const range = require('lodash/range')
const random = require('lodash/random')
const last = require('lodash/last')
const reduce = require('lodash/reduce')

const server = require('../utils/testUtils')
const {
  createGxConnectTestContext,
} = require('../deviceApi/geneXpert/gxconnect_utils')
const {
  getDeviceActivityPercentReport,
} = require('../../src/deviceMaintenanceStatus/serviceReports')
const { knex } = require('../../src/db')
const {
  returnIso8601StringWithoutTimeZoneOffset,
  dayOfYear,
} = require('../../src/shared/date')
const shared = require('../utils/sharedToken')

describe('Maintenance Reports', () => {
  let context
  let deviceId
  let deviceMaintenanceStatuses
  let activeDeviceMaintenanceStatusExternalIds
  let statuses
  let personId

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

  async function insertMaintenanceStatusLogs(goingBackFrom = new Date()) {
    // Inserting logs for last Wednesday, Thursday and Friday UTC: inserting date formatted without time prevent unexpected timezone conversions
    const logEntryBase = {
      deviceId,
      deviceMaintenanceStatusId: statuses.active,
      data: JSON.stringify({}),
      day: dateFormat(goingBackFrom, 'yyyy-MM-dd'),
      createdOn: new Date(),
      createdBy: personId,
    }
    const activeLogDate1 = subDays(goingBackFrom, 2)
    await knex('DeviceMaintenanceStatusLog').insert({
      ...logEntryBase,
      day: dateFormat(activeLogDate1, 'yyyy-MM-dd'),
    })
    if (dayOfYear(goingBackFrom) % 3 === 0) {
      await context.createResultForThisDevice({
        resultDetails: {
          consumableLot: 'Lot 0',
          moduleName: 'Module A',
          moduleSerial: 'MOD-SER12345',
          instrumentSerial: 'SER1-02349',
          startedOn: activeLogDate1,
          endedOn: activeLogDate1,
        },
      })
    }
    const activeLogDate2 = subDays(goingBackFrom, 1)
    await knex('DeviceMaintenanceStatusLog').insert({
      ...logEntryBase,
      day: dateFormat(activeLogDate2, 'yyyy-MM-dd'),
    })
    if (dayOfYear(goingBackFrom) % 5 === 0) {
      await context.createResultForThisDevice({
        resultDetails: {
          consumableLot: 'Lot 1',
          moduleName: 'Module B',
          moduleSerial: 'MOD-SER12346',
          instrumentSerial: 'SER1-02349',
          startedOn: activeLogDate2,
          endedOn: activeLogDate2,
        },
      })
    }
    await knex('DeviceMaintenanceStatusLog').insert({
      ...logEntryBase,
      deviceMaintenanceStatusId: statuses.inactiveDownForRepair,
      day: dateFormat(goingBackFrom, 'yyyy-MM-dd'),
    })
    const [deviceMaintenanceStatusLogId] = await knex(
      'DeviceMaintenanceStatusLog'
    ).insert({
      ...logEntryBase,
      day: dateFormat(goingBackFrom, 'yyyy-MM-dd'),
    })
    if (dayOfYear(goingBackFrom) % 7 === 0) {
      await context.createResultForThisDevice({
        resultDetails: {
          consumableLot: 'Lot 2',
          moduleName: 'Module D',
          moduleSerial: 'MOD-SER12347',
          instrumentSerial: 'SER1-02349',
          startedOn: goingBackFrom,
          endedOn: goingBackFrom,
        },
      })
    }
    await knex('Device')
      .where({ id: deviceId })
      .update({ deviceMaintenanceStatusLogId })
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
    await insertMaintenanceStatusLogs(lastFriday)
    // Inserting results for the last 30 days
    const resultsBaseDate = new Date(
      lastFriday.getFullYear(),
      lastFriday.getMonth(),
      lastFriday.getDate(),
      0,
      0,
      0,
      0
    )
    await Promise.each(range(1, 4), async () => {
      const daysForSubstracting = random(2, 30, false)
      const testDate = subDays(resultsBaseDate, daysForSubstracting)
      await context.createResultForThisDevice({
        resultDetails: {
          startedOn: testDate,
          endedOn: testDate,
        },
      })
    })

    // Inserting one result out of the last 30 days
    await context.createResultForThisDevice({
      resultDetails: {
        startedOn: subDays(resultsBaseDate, 33),
        endedOn: subDays(resultsBaseDate, 33),
      },
    })
  })

  afterEach(async () => context.cleanUp())

  const maintenanceOverTimePath = '/api/device/maintenance-over-time'
  shared.checkToken(server, maintenanceOverTimePath)

  async function getMaintenanceStatusOverTimeResponse(
    offset,
    fromDate = monthAgo,
    toDate = lastFriday
  ) {
    // From the Web we will always send the start of each day of the range, so we are just concatenating the offset
    const minDate = `${dateFormat(
      fromDate,
      'yyyy-MM-dd'
    )}T00:00:00.000${offset}`
    const maxDate = `${dateFormat(toDate, 'yyyy-MM-dd')}T00:00:00.000${offset}`

    // Then, in the API we consider the same dates but in UTC (without conversion)
    return server
      .get(
        `${maintenanceOverTimePath}?minDate=${encodeURIComponent(
          minDate
        )}&maxDate=${encodeURIComponent(maxDate)}`
      )
      .set('Authorization', `Bearer ${shared.token}`)
  }

  describe('device/maintenance-over-time', () => {
    const evaluateCorrectDailyStatus = async offset => {
      const maintenanceStatusOverTime =
        await getMaintenanceStatusOverTimeResponse(offset)
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
      const tamagotchiLastStatus = last(tamagotchi.maintenanceStatusHistory)
      expect(tamagotchiLastStatus).to.have.containSubset(
        tamagotchiLastStatus.totalResults > 0
          ? {
              maintenanceStatusExternalId: 'active',
              maintenanceStatusI18nKey: 'active',
              maintenanceStatusName: 'Active',
            }
          : {
              maintenanceStatusExternalId: 'inactiveUnknown',
              maintenanceStatusI18nKey: 'inactiveUnknown',
              maintenanceStatusName: 'Unknown',
            }
      )
      assert.isBoolean(tamagotchiLastStatus.isWeekend)
      assert.isNumber(tamagotchiLastStatus.weekNumber)
      assert.isTrue(isValid(new Date(tamagotchiLastStatus.day)))
    }

    it('should get the correct daily status for negative timezones', async () =>
      evaluateCorrectDailyStatus('-03:00'))

    it('should get the correct daily status for positive timezones', async () =>
      evaluateCorrectDailyStatus('+03:00'))
  })

  describe('maintenance-last-reported', () => {
    const pathLastReported = '/api/device/maintenance-last-reported'

    shared.checkToken(server, pathLastReported)

    it('should get the correct current status', async () => {
      await knex('DeviceMaintenanceStatusLog').where({ deviceId }).del()
      await insertMaintenanceStatusLogs()
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
      expect(tamagotchi.maintenanceStatusExternalId).equals('active')
    })
  })

  describe('device_activity_percent', () => {
    it('should balance with device active rate in /api/device/maintenance-over-time', async () => {
      await Promise.each(range(1, 12), async month =>
        insertMaintenanceStatusLogs(subMonths(monthAgo, month))
      )
      const minDate = subMonths(new Date(), 12)
      const maxDate = new Date()
      const maintenanceStatusOverTime =
        await getMaintenanceStatusOverTimeResponse('Z', minDate, maxDate)
      const minDateString = returnIso8601StringWithoutTimeZoneOffset(minDate)
      const maxDateString = returnIso8601StringWithoutTimeZoneOffset(maxDate)
      const deviceActivityPercentData = await getDeviceActivityPercentReport(
        { credentials: { name: 'admin' } },
        {
          minDateString,
          maxDateString,
        }
      )
      const convergingMaintenanceStatusOverTime =
        maintenanceStatusOverTime.body.data.filter(device =>
          deviceActivityPercentData.data
            .map(activityPercent => activityPercent.id)
            .includes(device.id)
        )
      expect(convergingMaintenanceStatusOverTime).to.have.lengthOf.above(0)
      const convergingDeviceActivityPercentData =
        deviceActivityPercentData.data.filter(deviceActivityPercentData =>
          convergingMaintenanceStatusOverTime
            .map(device => device.id)
            .includes(deviceActivityPercentData.id)
        )
      expect(convergingDeviceActivityPercentData).to.have.lengthOf(
        convergingMaintenanceStatusOverTime.length
      )
      convergingDeviceActivityPercentData.forEach(deviceActivityPercent => {
        Object.keys(deviceActivityPercent)
          .filter(deviceActivityPercentKey =>
            /^\d{4}-\d{2}$/.test(deviceActivityPercentKey)
          )
          .forEach(deviceActivityPercentMonth => {
            const maintenanceStatusOverTimeDevice =
              convergingMaintenanceStatusOverTime.find(
                device => device.id === deviceActivityPercent.id
              )
            const maintenanceStatusHistoryForMonth =
              maintenanceStatusOverTimeDevice.maintenanceStatusHistory.filter(
                day =>
                  !day.isWeekend &&
                  day.day.substring(0, deviceActivityPercentMonth.length) ===
                    deviceActivityPercentMonth
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
            if (deviceActivityPercent[deviceActivityPercentMonth] === '0.00%') {
              expect(activeMaintenanceStatusHistoryForMonth).to.have.lengthOf(0)
            } else {
              expect(
                `${(
                  (activeMaintenanceStatusHistoryForMonth.length /
                    maintenanceStatusHistoryForMonth.length) *
                  100
                ).toFixed(2)}%`
              ).to.equal(deviceActivityPercent[deviceActivityPercentMonth])
            }
          })
      })
    })
  })
})
