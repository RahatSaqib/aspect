const { expect } = require('chai')
const { subDays } = require('date-fns')
const { deviceApprovalToId } = require('../../src/shared/dictionary')
const { createGxConnectTestContext } = require('../deviceApi/geneXpert/gxconnect_utils')
const { resultCategoryToId } = require('../../src/shared/dictionary')
const shared = require('../utils/sharedToken')
const server = require('../utils/testUtils')
const { knex } = require('../../src/db')

const path = '/api/device/mergedevices'
let sourceSiteId
let sourceDeviceId
let targetSiteId
let targetDevice
let issueId

describe('Merge Devices', () => {
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
    const { device: sourceDevice } = sourceDeviceContext
    sourceDeviceId = sourceDevice.id
    sourceSiteId = sourceDevice.siteId

    await targetDeviceContext.beforeRegisterAndSetDevice()

    const { device: device2 } = targetDeviceContext
    targetDevice = device2
    targetSiteId = targetDevice.siteId

    await setSameSiteForSeededDevices(sourceSiteId, targetDevice.id)

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

    const firstSourceResultId = await sourceDeviceContext.createResultForThisDevice({
      resultDetails,
    })

    await targetDeviceContext.createResultForThisDevice({
      resultDetails,
    })

    await seedDeviceOperation()
    await seedDeviceMaintenance()
    issueId = await seedIssue(sourceSiteId)
    await seedNotification(issueId, firstSourceResultId)
    await seedFactTables(sourceSiteId)
    await sourceDeviceContext.createResultForThisDevice({
      resultDetails,
    })
  })

  afterEach(async () => {
    await knex('DeviceApiKey').where('siteId', targetSiteId).orWhere({ deviceId: targetDevice.id }).del()
    await knex('Notification').where({ issueId }).del()
    await knex('Issue').where({ id: issueId }).del()
    await knex('Result').where('deviceId', targetDevice.id).del()
    await knex('DeviceLog').where('deviceId', targetDevice.id).del()
    await knex('DeviceApprovalLog').where('deviceId', targetDevice.id).del()
    await knex('Device').where('id', targetDevice.id).del()
    await knex('Sample').where('originSiteId', targetSiteId).del()
  })

  it('If source device is active should throw validation', async () => {
    const res = await server
      .post(path)
      .send({ sourceDeviceId, targetDeviceId: targetDevice.id })
      .set('Authorization', `Bearer${shared.token}`)
    expect(res.statusCode).to.equal(422)
  })

  it.only('Devices should be correctly merged', async () => {
    // TODO: tune seeding so the devices belongs to the same site, then enable same site validation on mergeDevicesValidator.js
    await setSourceDeviceInactive()
    await setSourceFirstResultAsDuplicateInTarget(targetDevice.id)
    await setSamplesToTargetSite()
    // const issuesQuery = knex('Result')
    //   .whereIn('deviceId', [sourceDeviceId, targetDevice.id])
    //   .select('id', 'deviceId', 'externalId')
    // const issues = await issuesQuery

    // console.log('\x1b[1;36m', '🚀 ➜ issueId ➜ line 103 ➜ issues', issues)
    const results = await knex('Result')
      .whereIn('deviceId', [sourceDeviceId, targetDevice.id])
      .select('id', 'deviceId', 'externalId')

    const res = await server
      .post(path)
      .send({ sourceDeviceId, targetDeviceId: targetDevice.id })
      .set('Authorization', `Bearer${shared.token}`)

    expect(res.statusCode).to.equal(200)

    const sourceDevices = await knex('Device').where('id', sourceDeviceId)
    expect(sourceDevices).to.have.lengthOf(0, 'Source device should be deleted')

    const targetResults = await knex('Result').where('deviceId', targetDevice.id).select('id')
    expect(targetResults).to.have.lengthOf(2, 'Target device should have 2 results')
  })
})

async function seedDeviceOperation() {
  await knex('DeviceOperation').insert({
    deviceId: sourceDeviceId,
    startedOn: new Date(),
    data: '{"someJsonData": "someValue"}',
  })
}

async function seedDeviceMaintenance() {
  const deviceMaintenanceTypeId = 1 // TODO: read from db
  await knex('DeviceMaintenance').insert({
    deviceId: sourceDeviceId,
    deviceMaintenanceTypeId,
    notes: 'some notes',
    contextDate: new Date(),
    current: 1,
    createdOn: new Date(),
  })
}

async function seedIssue(deviceId, resultId) {
  const issueTypeId = 1 // TODO: read from db
  const issueStatusId = 2 // TODO: read from db

  const [issueId] = await knex('Issue').insert({
    issueTypeId,
    issueStatusId,
    partnerId: targetDevice.partnerId,
    geographyId: targetDevice.geographyId,
    siteId: targetDevice.siteId,
    deviceId,
    resultId,
    level: 1,
    createdOn: new Date(),
  })
  return issueId
}

async function seedNotification(issueId, resultId) {
  const notificationTypeId = 1 // TODO: read from db
  const [notificationId] = await knex('Notification').insert({
    notificationTypeId,
    issueId,
    resultId,
    createdOn: new Date(),
  })
  return notificationId
}

async function setSourceDeviceInactive() {
  const deviceApprovalAssignedId = await deviceApprovalToId('assigned')
  await knex('Device').where('id', sourceDeviceId).update({ deviceApprovalId: deviceApprovalAssignedId })
}

async function setSameSiteForSeededDevices(sourceSiteId, targetDeviceId) {
  await knex('Device').where('id', targetDeviceId).update({ siteId: sourceSiteId })
}

async function setSourceFirstResultAsDuplicateInTarget(targetDeviceId) {
  const targetResult = await knex('Result').where('deviceId', targetDeviceId).first('id', 'externalId')
  const { id: sourceFirstResultId } = await knex('Result').where('deviceId', sourceDeviceId).first('id')
  await knex('Result').where('id', sourceFirstResultId).update({ externalId: targetResult.externalId })
}

async function setSamplesToTargetSite() {
  await knex('Sample').where('originSiteId', sourceSiteId).update({ originSiteId: targetSiteId })
}

async function seedFactTables(deviceId) {
  knex('FactDeviceExternalSource').insert({ deviceId, sourceName: 'mergeDevice', updatedOn: new Date() })

  knex('FactDeviceFlag').insert({
    deviceId,
    offline: 0,
    noResults: 1,
    service: 0,
    calibration: 0,
    errorRate: 0,
    qcProblem: 0,
    lowInventory: 0,
    outOfInventory: 0,
    expiringInventory: 0,
    expiringWarranty: 0,
    updatedOn: new Date(),
    maintenance: 0,
  })

  knex('FactResultsDevice').insert({
    deviceId,
    days: 1,
    resultCount: 1,
    calculatedOn: new Date(),
  })

  const assayId = 1 // TODO: read from db
  const resultCategory1 = 1 // TODO: read from db

  knex('FactResultsDeviceByAssay').insert({
    deviceId,
    days: 1,
    assayId,
    resultCount: 1,
    calculatedOn: new Date(),
  })

  knex('FactResultsDeviceByCategory1').insert({
    deviceId,
    days: 1,
    assayId,
    resultCategory1,
    resultCount: 1,
    calculatedOn: new Date(),
  })

  knex('FactResultsDeviceByCategory1And2').insert({
    deviceId,
    days: 1,
    assayId,
    resultCategory1,
    resultCount: 1,
    calculatedOn: new Date(),
  })

  knex('FactResultsDeviceByTimeFrame').insert({
    deviceId,
    timeFrame: 'time frame',
    startedOn: new Date(),
    assayId,
    resultCategory1,
    resultCount: 1,
    calculatedOn: new Date(),
  })
}
