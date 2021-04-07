const chai = require('chai')

const { assert, expect } = chai
const subDays = require('date-fns/subDays')
const formatISO = require('date-fns/formatISO')
const format = require('date-fns/format')
const { formatToTimeZone } = require('date-fns-timezone')
const isValid = require('date-fns/isValid')
const Promise = require('bluebird')
const find = require('lodash/find')
const range = require('lodash/range')
const random = require('lodash/random')
const last = require('lodash/last')

const server = require('../utils/testUtils')
const {
  createGxConnectTestContext,
} = require('../deviceApi/geneXpert/gxconnect_utils')
const { knex } = require('../../src/db')
const shared = require('../utils/sharedToken')
const {
  allDeviceMaintenanceStatusToId,
} = require('../../src/shared/dictionary')

describe('Maintenance Reports', () => {
  const path = '/api/device/maintenance-over-time'
  const pathLastReported = '/api/device/maintenance-last-reported'
  let context
  let deviceId

  shared.checkToken(server, path)

  afterEach(async () => {
    await context.cleanUp()
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
    const statuses = await allDeviceMaintenanceStatusToId()
    const { id: personId } = await knex('Person')
      .where({ name: 'Admin' })
      .first()
    await knex('Site')
      .where({ id: siteId })
      .update({ latitude: 1, longitude: 5 })

    // Inserting logs for 01/01, 01/02 and 01/03 UTC: inserting directly the string will prevent unexpected timezone conversions
    const logEntryBase = {
      deviceId,
      deviceMaintenanceStatusId: statuses.active,
      data: JSON.stringify({}),
      createdOn: new Date(),
      createdBy: personId,
    }
    await knex('DeviceMaintenanceStatusLog').insert({
      ...logEntryBase,
      day: '2020-01-01',
    })
    await knex('DeviceMaintenanceStatusLog').insert({
      ...logEntryBase,
      day: '2020-01-02',
    })
    await knex('DeviceMaintenanceStatusLog').insert({
      ...logEntryBase,
      deviceMaintenanceStatusId: statuses.inactiveDownForRepair,
      day: '2020-01-03',
    })
    const [deviceMaintenanceStatusLogId] = await knex(
      'DeviceMaintenanceStatusLog'
    ).insert({
      ...logEntryBase,
      day: '2020-01-03',
    })
    await knex('Device')
      .where({ id: deviceId })
      .update({ deviceMaintenanceStatusLogId })

    // Inserting results for the last 30 days
    const resultsBaseDate = new Date(2020, 1, 3, 0, 0, 0, 0)
    await Promise.each(range(1, 4), async () => {
      // As the base date is 3rd, we subtract between 0 and 30 days: this will ensure the result will be inserted in the last 30 days
      const daysForSubstracting = random(0, 30, false)
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

  const evaluateCorrectDailyStatus = (done, offset) => {
    // From the Web we will always send the start of each day of the range, so we are just concatenating the offset
    const minDate = '2019-12-03T00:00:00.000' + offset
    const maxDate = '2020-01-03T00:00:00.000' + offset

    // Then, in the API we consider the same dates but in UTC (without conversion)
    // The resulting date range for statuses will always be '2019-12-03T00:00:00.000Z' to '2020-01-03T00:00:00.000Z', no matter the given offset
    server
      .get(`${path}?minDate=${encodeURIComponent(minDate)}&maxDate=${encodeURIComponent(maxDate)}`)
      .set('Authorization', `Bearer ${shared.token}`)
      .end((err, res) => {
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')
        assert.property(res.body, 'data')
        assert.typeOf(res.body.data, 'array')

        const tamagotchi = find(res.body.data, d => d.id === deviceId)
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

        done()
      })
  }

  it('should get the correct daily status for negative timezones', done => {
    evaluateCorrectDailyStatus(done, '-03:00')
  })

  it('should get the correct daily status for positive timezones', done => {
    evaluateCorrectDailyStatus(done, '+03:00')
  })

  it('should get the correct current status', done => {
    server
      .get(`${pathLastReported}`)
      .set('Authorization', `Bearer ${shared.token}`)
      .end((err, res) => {
        assert.equal(res.status, 200)
        assert.typeOf(res.body, 'Object')
        assert.property(res.body, 'data')
        assert.typeOf(res.body.data, 'array')
        const tamagotchi = find(res.body.data, d => d.id === deviceId)
        assert.isNotNull(tamagotchi)
        assert.equal(tamagotchi.latitude, 1)
        assert.equal(tamagotchi.longitude, 5)
        expect(tamagotchi.maintenanceStatusExternalId).equals('active')
        done()
      })
  })
})
