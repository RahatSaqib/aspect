const chai = require('chai')
const { assert } = chai
const subDays = require('date-fns/subDays')
const formatISO = require('date-fns/formatISO')
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


describe('Device Maintenance Status', () => {
  const path = '/api/device-maintenance-status/over-time'
  let context
  let deviceId

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

    const { id } = context.device
    deviceId = id
    const statuses = await allDeviceMaintenanceStatusToId()
    const now = new Date()
    const { id: personId } = await knex('Person').where({ name: 'Admin' }).first()

    await knex('DeviceMaintenanceStatusLog').insert({
      deviceId,
      deviceMaintenanceStatusId: statuses.inactiveDownForRepair,
      day: now,
      createdOn: new Date(),
      createdBy: personId
    })
    
    const [deviceMaintenanceStatusLogId] = await knex('DeviceMaintenanceStatusLog').insert({
      deviceId,
      deviceMaintenanceStatusId: statuses.active,
      day: now,
      createdOn: new Date(),
      createdBy: personId
    })
    await knex('Device').where({ id: deviceId }).update({ deviceMaintenanceStatusLogId })

    const baseResultDetails = {
      consumableLot: 'Lot 0',
      moduleName: 'Module A',
      moduleSerial: 'M-123456-0',
      instrumentSerial: 'S-1234-0',
    }

    await Promise.each(range(1, 4), async () => {
      const daysForSubstracting = random(0, 30, false)
      await context.createResultForThisDevice({
        ...baseResultDetails,
        startedOn: subDays(new Date(), daysForSubstracting),
        endedOn: subDays(new Date(), daysForSubstracting),
      })
    })

    await context.createResultForThisDevice({
      ...baseResultDetails,
      startedOn: subDays(new Date(), 31),
      endedOn: subDays(new Date(), 33),
    })
  })

  afterEach(async () => {
    await context.cleanUp()
  })

  describe('GET', () => {
    shared.checkToken(server, path)

    const now = new Date()
    const monthAgo = subDays(now, 30)

    it('should get the correct current and day status', done => {
      server
        .get(`${path}?minDate=${formatISO(monthAgo)}&maxDate=${formatISO(now)}`)
        .set('Authorization', `Bearer ${shared.token}`)
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
          assert.property(res.body, 'data')
          assert.typeOf(res.body.data, 'array')

          const tamagotchi = find(res.body.data, d => d.id === deviceId)
          assert.equal(tamagotchi.currentStatusExternalId, 'active')
          assert.equal(tamagotchi.currentStatusI18nKey, 'active')
          assert.equal(tamagotchi.currentStatusName, 'Active')
          assert.equal(last(tamagotchi.maintenanceStatusHistory).externalId, 'active')

          done()
        })
    })
  })
})
