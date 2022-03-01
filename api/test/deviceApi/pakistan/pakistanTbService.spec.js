const chai = require('chai')
const chaiSubset = require('chai-subset')
const Promise = require('bluebird')
const _ = require('lodash')
const { subDays } = require('date-fns')
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
const errorCode = null
const baseResultDetails = {
  consumableLot: 'Lot 0',
  moduleName: 'Module J',
  moduleSerial: 'M-123456-0',
  instrumentSerial: 'S-1234-0',
  errorCode,
  errorNotes: errorCode ? 'Some error notes' : null,
}
const alaskavalidGeographyId = 39
describe('Pakistan stats api', async () => {
  const encodedFrom = encodeURIComponent('2022-02-03T00:00:00+05:00')
  const fromUtc = '2022-02-02T19:00:00.000Z'
  const to = encodeURIComponent('2022-03-15T00:00:00.00+05:00')
  const toUtc = '2022-03-14T19:00:00.000Z'

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

    await ntpContext.createSites(['pakistanTbService.spec query site'])
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
      .update({ siteId, geographyId: alaskavalidGeographyId })
    await knex('Site')
      .where('id', siteId)
      .update({ geographyId: alaskavalidGeographyId })
    contextAlaskaDevice.device.geographyId = alaskavalidGeographyId
    contextAlaskaDevice.device.siteId = siteId
    contextAlaskaDevice.site.geographyId = alaskavalidGeographyId
  })

  before('Create Results', async () => {
    const { Detected, NotDetected } = await allResultCategoryToId()

    const tests = Promise.each(_.range(0, 2), async () => {
      await contextAlaskaDevice.createResultForThisDevice({
        resultDetails: {
          ...baseResultDetails,
          ...{
            startedOn: subDays(new Date(), -1),
            endedOn: subDays(new Date(), -1),
            resultCategory1: NotDetected,
            resultCategory2: NotDetected,
          },
        },
      })
    })

    const cases = Promise.each(_.range(0, 2), async () => {
      await contextAlaskaDevice.createResultForThisDevice({
        resultDetails: {
          ...baseResultDetails,
          ...{
            startedOn: subDays(new Date(), -1),
            endedOn: subDays(new Date(), -1),
            resultCategory1: Detected,
            resultCategory2: NotDetected,
          },
        },
      })
    })

    const drcases = Promise.each(_.range(0, 2), async () => {
      await contextAlaskaDevice.createResultForThisDevice({
        resultDetails: {
          ...baseResultDetails,
          ...{
            startedOn: subDays(new Date(), -1),
            endedOn: subDays(new Date(), -1),
            resultCategory1: Detected,
            resultCategory2: Detected,
          },
        },
      })
    })
    await Promise.all([tests, cases, drcases].flat())
  })

  after(async () => {
    knex('ResultFollowUp').del()
    knex('ResultStatusLog').del()
    knex('Sample').del()
    knex('Result').del()
    await contextAlaskaDevice.cleanUp()
    await ntpContext.afterEach()
  })

  it('Should return correct stats by state', async () => {
    // const path = `/device/result/pakistan`
    const path = `/device/result/pakistan?from=${encodedFrom}&to=${to}&states=AK`
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
          total: 2,
        },
        {
          stateCode: 'AK',
          state: 'Alaska',
          resultType: 'TB Cases',
          total: 4,
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

  it('Shourld return correct stats for country, including from', async () => {
    const path = `/device/result/pakistan?from=${encodedFrom}&to=${to}`
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
          total: 2,
        },
        {
          stateCode: '',
          state: 'Whole country',
          resultType: 'TB Cases',
          total: 4,
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

  it('Should exclude Results by date', async () => {
    const path = `/device/result/pakistan?from=${to}&to=${to}&states=AK`
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
      from: toUtc,
      to: toUtc,
      states: ['AK'],
      result: [
        {
          stateCode: 'AK',
          state: 'Alaska',
          resultType: 'DRTB Cases',
          total: 0,
        },
        {
          stateCode: 'AK',
          state: 'Alaska',
          resultType: 'TB Cases',
          total: 0,
        },
        {
          stateCode: 'AK',
          state: 'Alaska',
          resultType: 'TB Tests',
          total: 0,
        },
      ],
    })
  })
})
