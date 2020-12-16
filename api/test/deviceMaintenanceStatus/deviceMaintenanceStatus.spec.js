const chai = require('chai')

const { assert } = chai
const subDays = require('date-fns/subDays')
const formatISO = require('date-fns/formatISO')
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

describe('Maintenance', () => {
  const path = '/api/maintenance/over-time'
  let context
  let deviceId

  shared.checkToken(server, path)

  const now = new Date()
  const monthAgo = subDays(now, 30)

  describe('Over Time', () => {
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
      const now = new Date()
      const { id: personId } = await knex('Person')
        .where({ name: 'Admin' })
        .first()

      await knex('Site')
        .where({ id: siteId })
        .update({ latitude: 1, longitude: 5 })

      const logEntryBase = {
        deviceId,
        deviceMaintenanceStatusId: statuses.active,
        data: JSON.stringify({}),
        day: now,
        createdOn: new Date(),
        createdBy: personId,
      }

      await knex('DeviceMaintenanceStatusLog').insert({
        ...logEntryBase,
        day: subDays(now, 2),
      })

      await knex('DeviceMaintenanceStatusLog').insert({
        ...logEntryBase,
        day: subDays(now, 1),
      })

      await knex('DeviceMaintenanceStatusLog').insert({
        ...logEntryBase,
        deviceMaintenanceStatusId: statuses.inactiveDownForRepair,
        day: now,
      })

      const [deviceMaintenanceStatusLogId] = await knex(
        'DeviceMaintenanceStatusLog'
      ).insert({
        ...logEntryBase,
        day: now,
      })
      await knex('Device')
        .where({ id: deviceId })
        .update({ deviceMaintenanceStatusLogId })

      await Promise.each(range(1, 4), async () => {
        const daysForSubstracting = random(0, 30, false)
        await context.createResultForThisDevice({
          resultDetails: {
            startedOn: subDays(new Date(), daysForSubstracting),
            endedOn: subDays(new Date(), daysForSubstracting),
          },
        })
      })

      await context.createResultForThisDevice({
        resultDetails: {
          startedOn: subDays(new Date(), 33),
          endedOn: subDays(new Date(), 33),
        },
      })
    })

    it('should get the correct current and day status', done => {
      const minDate = formatISO(monthAgo, { representation: 'date' })
      const maxDate = formatISO(now, { representation: 'date' })
      server
        .get(`${path}?minDate=${minDate}&maxDate=${maxDate}`)
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
          assert.equal(
            tamagotchiLastStatus.maintenanceStatusExternalId,
            'active'
          )
          assert.equal(tamagotchiLastStatus.maintenanceStatusI18nKey, 'active')
          assert.equal(tamagotchiLastStatus.maintenanceStatusName, 'Active')
          assert.isBoolean(tamagotchiLastStatus.isWeekend)
          assert.isNumber(tamagotchiLastStatus.weekNumber)
          assert.isTrue(isValid(new Date(tamagotchiLastStatus.day)))

          done()
        })
    })
  })
})
