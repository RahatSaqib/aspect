const { expect } = require('chai')
// const { DeviceSeedHelper } = require('./deviceSeedHelper')
const { subDays } = require('date-fns')
const { deviceApprovalToId } = require('../../src/shared/dictionary')
const { createResult, getResult } = require('../result/result_utils')

const { createGxConnectTestContext } = require('../deviceApi/geneXpert/gxconnect_utils')
const { resultCategoryToId } = require('../../src/shared/dictionary')
const mergeDevices = require('../../src/device/mergeDevices')
const shared = require('../utils/sharedToken')
const server = require('../utils/testUtils')
const { knex } = require('../../src/db')

const path = '/api/device/mergedevices'
let sourceSiteId
let sourceDeviceId
let targetSiteId
let targetDeviceId

describe.only('Merge Devices', () => {
  before(async () => {
    shared.checkToken(server, path)
  })

  // const deviceSeedHelper = new DeviceSeedHelper()
  const sourceDeviceContext = createGxConnectTestContext(server, {
    countryCode: 'US',
    adminUsername: 'admin',
    adminPassword: 'test07',
    deviceName: `Device 1`,
    macAddress: `d1mac`,
    hostId: `hostId`,
    deviceSerialNumber: `d1serial`,
  })
  const targetDeviceContext = createGxConnectTestContext(server, {
    countryCode: 'US',
    adminUsername: 'admin',
    adminPassword: 'test07',
    deviceName: `Device 2`,
    macAddress: `d2mac`,
    hostId: `host`,
    deviceSerialNumber: `d2serial`,
  })

  beforeEach(async () => {
    const resultCategoryDetected = await resultCategoryToId('Detected')
    await sourceDeviceContext.beforeRegisterAndSetDevice()
    const { device: device1 } = sourceDeviceContext
    sourceDeviceId = device1.id
    sourceSiteId = device1.siteId

    await targetDeviceContext.beforeRegisterAndSetDevice()

    const { device: device2 } = targetDeviceContext
    targetDeviceId = device2.id
    targetSiteId = device2.siteId

    const resultDetails = {
      consumableLot: 'Test Lot',
      moduleName: 'Module A',
      moduleSerial: 'CommontTestModuleSerial',
      instrumentSerial: 'CommonTestInstSerial',
      endedOn: subDays(new Date(), 1),
      errorCode: null,
      errorNotes: null,
      resultCategory1: resultCategoryDetected,
    }

    await sourceDeviceContext.createResultForThisDevice({
      resultDetails,
    })
    await targetDeviceContext.createResultForThisDevice({
      resultDetails,
    })

    await sourceDeviceContext.createResultForThisDevice({
      resultDetails,
    })
  })

  afterEach(async () => {
    // await sourceDeviceContext.cleanUp()
    // await targetDeviceContext.cleanUp()
  })

  it('If source device is active should throw validation', async () => {
    const res = await server
      .post(path)
      .send({ sourceDeviceId, targetDeviceId })
      .set('Authorization', `Bearer${shared.token}`)
    expect(res.statusCode).to.equal(422)
  })

  it.only('Devices should be correctly merged', async () => {
    // TODO: tune seeding so the devices belongs to the same site, then enable same site validation on mergeDevicesValidator.js
    await setSourceDeviceInactive()
    await setSourceFirstResultAsDuplicateInTarget()
    // const issuesQuery = knex('Result')
    //   .whereIn('deviceId', [sourceDeviceId, targetDeviceId])
    //   .select('id', 'deviceId', 'externalId')
    // const issues = await issuesQuery

    // console.log('\x1b[1;36m', '🚀 ➜ file: mergeDevices.spec.js ➜ line 103 ➜ issues', issues)
    const results = await knex('Result')
      .whereIn('deviceId', [sourceDeviceId, targetDeviceId])
      .select('id', 'deviceId', 'externalId')

    console.log('\x1b[1;36m', '🚀 ➜ file: mergeDevices.spec.js ➜ line 106 ➜ results', results)

    const res = await server
      .post(path)
      .send({ sourceDeviceId, targetDeviceId })
      .set('Authorization', `Bearer${shared.token}`)

    // const issuesAfter = await issuesQuery
    // console.log('\x1b[1;36m', '🚀 ➜➜➜➜➜ ', issuesAfter)

    const sourceDevices = await knex('Device').where('id', sourceDeviceId)
    expect(sourceDevices).to.have.lengthOf(0, 'Source device should be deleted')
    expect(res.statusCode).to.equal(200)
  })
})

async function setSourceDeviceInactive() {
  const deviceApprovalAssignedId = await deviceApprovalToId('assigned')
  await knex('Device').where('id', sourceDeviceId).update({ deviceApprovalId: deviceApprovalAssignedId })
}

async function setSourceFirstResultAsDuplicateInTarget() {
  const targetResult = await knex('Result').where('deviceId', targetDeviceId).first('id', 'externalId')
  const { id: sourceFirstResultId } = await knex('Result').where('deviceId', sourceDeviceId).first('id')
  await knex('Result').where('id', sourceFirstResultId).update({ externalId: targetResult.externalId })
}
