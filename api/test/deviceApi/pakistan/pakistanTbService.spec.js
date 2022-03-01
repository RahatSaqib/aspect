const chai = require('chai')
const chaiSubset = require('chai-subset')
const Promise = require('bluebird')
const _ = require('lodash')
const { subDays } = require('date-fns')
const { getLocalDateTimeStringInUtc } = require('../../../src/shared/date')
const { createTestContext } = require('../utils')
const { allResultCategoryToId } = require('../../../src/shared/dictionary')

const { knex } = require.main.require('../../../src/db')
const server = require('../../utils/testUtils')
const { createGxConnectTestContext } = require('../geneXpert/gxconnect_utils')

const { assert } = chai.use(chaiSubset)

const adminUsername = 'admin'
const adminPassword = 'test07'
const countryCode = 'US'
const macAddress = `MAC${String(_.random(1, 99999999, false)).padStart(
  8,
  '0'
)}FAKE`

const testExternalId = 'Pakistan Api TEST GeneXpert'
const deviceSerialNumber = String(_.random(1, 99999999, false)).padStart(8, '0')
const hostId = 'BLH-Expert'
const partnerName = 'Partner One'

describe('Pakistan stats api', async () => {
  const from = '2022-02-03T21:00:00'
  const fromUtc = '2022-02-04T00:00:00.000Z'
  const to = '2022-03-15T21:00:00.00'
  const toUtc = '2022-03-16T00:00:00.000Z'

  const contextAlaskaDevice = createGxConnectTestContext(server, {
    countryCode,
    adminUsername,
    adminPassword,
    deviceName: testExternalId,
    macAddress,
    hostId,
    deviceSerialNumber,
  })

  let ntpContext

  const baseApiConfig = {
    requirePrinter: 'yes',
    adminPassword: 'pwd123',
    firmwareUpdateRequired: 'no',
  }

  before('Create the context to query the Api', async () => {
    ntpContext = createTestContext(knex, server, {
      user: adminUsername,
      type: 'GxAlert',
      partner: partnerName,
      baseApiConfig,
    })

    await ntpContext.createSites([
      'Query test site, maybe differ from Result device site',
    ])
    await ntpContext.createDeviceApiKey()
    await ntpContext.createDeviceWithApiKey()
  })

  before('Change test device site and geography', async () => {
    await contextAlaskaDevice.beforeRegisterAndSetDevice()
    // This is a hack: To create a device, createGxConnectTestContext makes Api Requests,
    // then the system sets the site and geography from the user authenticated, but in
    // order to create a device, the user has to have permissions, wich admin user has, but
    // he has no state, so the device is created without state and the results it's generate too.
    // Here the state and geography of the device is changed.
    const seedSite = await knex('Site as s')
      .where({ externalId: testExternalId })
      .first('s.id')
    const siteId = seedSite.id
    await knex('Device')
      .where('macAddress', macAddress)
      .update({ siteId, geographyId: 39 })
    await knex('Site').where('id', siteId).update({ geographyId: 39 })
    contextAlaskaDevice.device.geographyId = 39
    contextAlaskaDevice.device.siteId = siteId
    contextAlaskaDevice.site.geographyId = 39
  })

  before('Create Results', async () => {
    const errorCode = null
    const { Detected, NotDetected } = await allResultCategoryToId()
    // Post 4 new results
    await Promise.each(_.range(0, 3), async i => {
      const daysForSubstracting = 1 // _.random(200, 300, false)

      contextAlaskaDevice.createResultForThisDevice({
        resultDetails: {
          consumableLot: 'Lot 0',
          moduleName: 'Module J',
          moduleSerial: 'M-123456-0',
          instrumentSerial: 'S-1234-0',
          errorCode,
          startedOn: subDays(new Date(), daysForSubstracting),
          endedOn: subDays(new Date(), daysForSubstracting),
          errorNotes: errorCode ? 'Some error notes' : null,
          resultCategory1: Detected,
          resultCategory2: NotDetected,
        },
      })
    })
    await Promise.each(_.range(0, 3), async i => {
      const daysForSubstracting = 1 // _.random(200, 300, false)

      contextAlaskaDevice.createResultForThisDevice({
        resultDetails: {
          consumableLot: 'Lot 0',
          moduleName: 'Module J',
          moduleSerial: 'M-123456-0',
          instrumentSerial: 'S-1234-0',
          errorCode,
          startedOn: subDays(new Date(), daysForSubstracting),
          endedOn: subDays(new Date(), daysForSubstracting),
          errorNotes: errorCode ? 'Some error notes' : null,
          resultCategory1: Detected,
          resultCategory2: Detected,
        },
      })
    })
  })

  after(async () => {
    knex('ResultFollowUp').del()
    knex('ResultStatusLog').del()
    knex('Result').del()
    await contextAlaskaDevice.cleanUp()
    await ntpContext.afterEach()
  })

  it.only('Get correct stats by state', async () => {
    const path = `/device/result/pakistan?from=${from}&to=${to}&states=AK`
    assert.isDefined(ntpContext, 'context')
    assert.isDefined(ntpContext.deviceAuth)

    const res = await server
      .get(path)
      .set('Authorization', ntpContext.deviceAuth)
    if (res.status !== 200) {
      console.log(res.body)
    }
    assert.equal(res.status, 200)
    assert.typeOf(res.body, 'Object')

    res.body.should.to.containSubset({
      from: fromUtc,
      to: toUtc,
      states: ['AK'],
      result: [
        {
          stateCode: 'AK',
          state: 'Alaska',
          resultType: 'DRTB Cases',
          total: 3,
        },
        {
          stateCode: 'AK',
          state: 'Alaska',
          resultType: 'TB Cases',
          total: 6,
        },
        {
          stateCode: 'AK',
          state: 'Alaska',
          resultType: 'TB Tests',
          total: 6,
        },
      ],
    })
  })

  it.only('Get correct stats for country', async () => {
    const path = `/device/result/pakistan?from=${from}&to=${to}`
    assert.isDefined(ntpContext, 'context')
    assert.isDefined(ntpContext.deviceAuth)

    const res = await server
      .get(path)
      .set('Authorization', ntpContext.deviceAuth)
    if (res.status !== 200) {
      console.log(res.body)
    }
    assert.equal(res.status, 200)
    assert.typeOf(res.body, 'Object')

    res.body.should.to.containSubset({
      from: fromUtc,
      to: toUtc,
      states: [],
      result: [
        {
          stateCode: '',
          state: 'Whole country',
          resultType: 'DRTB Cases',
          total: 3,
        },
        {
          stateCode: '',
          state: 'Whole country',
          resultType: 'TB Cases',
          total: 6,
        },
        {
          stateCode: '',
          state: 'Whole country',
          resultType: 'TB Tests',
          total: 6,
        },
      ],
    })
  })
})
