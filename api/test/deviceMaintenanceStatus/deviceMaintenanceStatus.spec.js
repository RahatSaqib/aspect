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
} = require('../../src/shared/date')
const shared = require('../utils/sharedToken')
const {
  allDeviceMaintenanceStatusToId,
} = require('../../src/shared/dictionary')

describe('Maintenance Reports', () => {
  let context
  let deviceId

  async function insertMaintenanceStatusLogs(goingBackFrom = new Date()) {
    const statuses = await allDeviceMaintenanceStatusToId()
    const { id: personId } = await knex('Person')
      .where({ name: 'Admin' })
      .first()
    // Inserting logs for last Wednesday, Thursday and Friday UTC: inserting date formatted without time prevent unexpected timezone conversions
    const logEntryBase = {
      deviceId,
      deviceMaintenanceStatusId: statuses.active,
      data: JSON.stringify({}),
      day: dateFormat(goingBackFrom, 'yyyy-MM-dd'),
      createdOn: new Date(),
      createdBy: personId,
    }
    await knex('DeviceMaintenanceStatusLog').insert({
      ...logEntryBase,
      day: dateFormat(subDays(goingBackFrom, 2), 'yyyy-MM-dd'),
    })
    await knex('DeviceMaintenanceStatusLog').insert({
      ...logEntryBase,
      day: dateFormat(subDays(goingBackFrom, 1), 'yyyy-MM-dd'),
    })
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

  async function getMaintenanceStatusOverTimeResponse(offset) {
    // From the Web we will always send the start of each day of the range, so we are just concatenating the offset
    const minDate = `${dateFormat(
      monthAgo,
      'yyyy-MM-dd'
    )}T00:00:00.000${offset}`
    const maxDate = `${dateFormat(
      lastFriday,
      'yyyy-MM-dd'
    )}T00:00:00.000${offset}`

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
      const maintenanceStatusOverTime = await getMaintenanceStatusOverTimeResponse(
        offset
      )
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
              maintenanceStatusExternalId: 'inactiveNoResultsReported',
              maintenanceStatusI18nKey: 'inactiveNoResultsReported',
              maintenanceStatusName: 'No Results Reported',
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
      const maintenanceStatusOverTime = await getMaintenanceStatusOverTimeResponse(
        'Z'
      )
      const minDate = returnIso8601StringWithoutTimeZoneOffset(
        subMonths(new Date(), 12)
      )
      const maxDate = returnIso8601StringWithoutTimeZoneOffset(new Date())
      const deviceActivityPercentData = await getDeviceActivityPercentReport(
        { credentials: { name: 'admin' } },
        {
          minDate,
          maxDate,
        }
      )

      console.log(
        'maintenanceStatusOverTime',
        maintenanceStatusOverTime.body.data.map(ms => ({
          id: ms.id,
          maintenanceStatusHistory: JSON.stringify(ms.maintenanceStatusHistory),
        }))
      )
      console.log('deviceActivityPercentData', deviceActivityPercentData.data)
    })
  })
})
