const chai = require('chai')
const chaiSubset = require('chai-subset')
const Promise = require('bluebird')
const _ = require('lodash')
const { subDays } = require('date-fns')
const parseISO = require('date-fns/parseISO')
const { createTestContext } = require('../utils')
const { allResultCategoryToId } = require('../../../src/shared/dictionary')

const { knex } = require.main.require('../../../src/db')
const server = require('../../utils/testUtils')
const { createGxConnectTestContext } = require('../geneXpert/gxconnect_utils')

const { assert, expect } = chai.use(chaiSubset)

const adminUsername = 'admin'
const adminPassword = 'test07'
const countryCode = 'US'
const macAddress = `MAC${String(_.random(1, 99999999, false)).padStart(8, '0')}FAKE`

const testExternalId = 'Pakistan Api TEST GeneXpert'
const deviceSerialNumber = String(_.random(1, 99999999, false)).padStart(8, '0')
const hostId = 'BLH-Expert'
const partnerName = 'Partner One'
const ALASKA_VALID_GEOGRAPHY_ID = 39
const US_GEOGRAPHY_ID_WITHOUT_STATE = 38
describe('Pakistan stats api', async () => {
  const encodedFrom = encodeURIComponent('2022-02-03T00:00:00+05:00')
  const fromUtcString = '2022-02-02T19:00:00.000Z'
  const fromUtc = parseISO(fromUtcString)
  const encodedTo = encodeURIComponent('2022-03-15T00:00:00.00+05:00')
  const toUtcString = '2022-03-14T19:00:00.000Z'

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

  before('Create the context to query the Api', async () => {
    ntpContext = createTestContext(knex, server, {
      user: adminUsername,
      type: 'GxAlert',
      partner: partnerName,
    })

    // await ntpContext.createSites(['pakistanTbService.spec query site'])
    await ntpContext.createDeviceApiKey()
    await ntpContext.createDeviceWithApiKey()
    await knex('DeviceApiKey')
      .where({ token: ntpContext.deviceAuth.split(' ')[1] })
      .update({ geographyId: US_GEOGRAPHY_ID_WITHOUT_STATE })
  })

  before('Change test device site and geography', async () => {
    await contextAlaskaDevice.beforeRegisterAndSetDevice()
    // This is a hack: To create a device, createGxConnectTestContext makes Api Requests,
    // then the system sets the site and geography from the user authenticated, but in
    // order to create a device, the user has to have permissions, wich the admin user has, but
    // he has no state, so the device is created without state, and therefore the results are
    // generated without state too.
    // This hack force the state and geography of the newly created device.
    const seedSite = await knex('Site as s').where({ externalId: testExternalId }).first('s.id')
    const siteId = seedSite.id

    await knex('Device').where('macAddress', macAddress).update({ siteId, geographyId: ALASKA_VALID_GEOGRAPHY_ID })
    await knex('Site').where('id', siteId).update({ geographyId: ALASKA_VALID_GEOGRAPHY_ID })
    contextAlaskaDevice.device.geographyId = ALASKA_VALID_GEOGRAPHY_ID
    contextAlaskaDevice.device.siteId = siteId
    contextAlaskaDevice.site.geographyId = ALASKA_VALID_GEOGRAPHY_ID
  })

  before('Create Results', async () => {
    const { Detected, NotDetected } = await allResultCategoryToId()

    const tests = Promise.each(_.range(0, 2), async () => {
      await contextAlaskaDevice.createResultForThisDevice({
        resultDetails: {
          ...{
            startedOn: subDays(fromUtc, -1),
            endedOn: subDays(fromUtc, -2),
            resultCategory1: NotDetected,
            resultCategory2: NotDetected,
          },
        },
      })
    })

    const cases = Promise.each(_.range(0, 2), async () => {
      await contextAlaskaDevice.createResultForThisDevice({
        resultDetails: {
          ...{
            startedOn: subDays(fromUtc, -1),
            endedOn: subDays(fromUtc, -2),
            resultCategory1: Detected,
            resultCategory2: NotDetected,
          },
        },
      })
    })

    const drcases = Promise.each(_.range(0, 2), async () => {
      await contextAlaskaDevice.createResultForThisDevice({
        resultDetails: {
          ...{
            startedOn: subDays(fromUtc, -1),
            endedOn: subDays(fromUtc, -2),
            resultCategory1: Detected,
            resultCategory2: Detected,
          },
        },
      })
    })
    await Promise.all([tests, cases, drcases])
  })

  after(async () => {
    await contextAlaskaDevice.cleanUp()
    await ntpContext.afterEach()
  })

  it('Should return correct stats by state', async () => {
    const path = `/device/result/pakistan?from=${encodedFrom}&to=${encodedTo}`
    assert.isDefined(ntpContext, 'context')
    assert.isDefined(ntpContext.deviceAuth)

    const res = await server.get(path).set('Authorization', ntpContext.deviceAuth)

    assert.equal(res.status, 200)
    assert.typeOf(res.body, 'Object')

    res.body.should.to.containSubset(
      {
        from: fromUtcString,
        to: toUtcString,
      },
      'returned date range'
    )
    res.body.should.to.containSubset(
      {
        countryTotals: { tests: 6, cases: 4, drCases: 2 },
      },
      'country totals'
    )
    expect(res.body.stateTotals.length).to.equal(51)
    res.body.stateTotals.should.to.containSubset(
      [
        {
          stateCode: 'AK',
          state: 'Alaska',
          tests: 6,
          cases: 4,
          drCases: 2,
        },
      ],
      'queried state'
    )
  })

  it('Should exclude Results by date', async () => {
    const path = `/device/result/pakistan?from=${encodedTo}&to=${encodedTo}`
    assert.isDefined(ntpContext, 'context')
    assert.isDefined(ntpContext.deviceAuth)
    const res = await server.get(path).set('Authorization', ntpContext.deviceAuth)

    assert.equal(res.status, 200)
    assert.typeOf(res.body, 'Object')
    expect(res.body.stateTotals.length, 'Returned states count').to.equal(51)

    res.body.should.to.containSubset({
      from: toUtcString,
      to: toUtcString,
      countryTotals: { tests: 0, cases: 0, drCases: 0 },
      stateTotals: [
        {
          stateCode: 'AK',
          state: 'Alaska',
          tests: 0,
          cases: 0,
          drCases: 0,
        },
      ],
    })
  })
})
