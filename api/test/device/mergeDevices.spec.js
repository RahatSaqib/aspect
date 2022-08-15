const { expect, assert } = require('chai')
const { subDays } = require('date-fns')
const {
  deviceMaintenanceTypeToId,
  deviceApprovalToId,
  resultCategoryToId,
  assayToId,
} = require('../../src/shared/dictionary')
const { createGxConnectTestContext } = require('../deviceApi/geneXpert/gxconnect_utils')
const shared = require('../utils/sharedToken')
const server = require('../utils/testUtils')
const { knex } = require('../../src/db')

const path = '/api/device/mergedevices'
let sourceSiteId
let sourceDeviceId
let targetSiteId
let targetDevice
let issueIdOnRepeatedSourceResult
let repeatedSourceResultId
let uniqueSourceResultId
let repeatedTargetResultId

describe('Merge Devices', () => {
  before(async () => {
    shared.checkToken(server, path)
  })

  const sourceDeviceContext = createGxConnectTestContext(server, {
    countryCode: 'US',
    adminUsername: 'admin',
    adminPassword: 'test07',
    deviceName: `Source Device`,
    macAddress: `d1mac`,
    hostId: `hostId`,
    deviceSerialNumber: `d1serial`,
  })
  const targetDeviceContext = createGxConnectTestContext(server, {
    countryCode: 'US',
    adminUsername: 'admin',
    adminPassword: 'test07',
    deviceName: `Target Device`,
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

    repeatedSourceResultId = await sourceDeviceContext.createResultForThisDevice({
      resultDetails,
    })

    repeatedTargetResultId = await targetDeviceContext.createResultForThisDevice({
      resultDetails,
    })

    uniqueSourceResultId = await sourceDeviceContext.createResultForThisDevice({
      resultDetails,
    })

    await seedDeviceOperation()
    await seedDeviceMaintenance()
    issueIdOnRepeatedSourceResult = await seedIssue(sourceDevice, repeatedSourceResultId)
    await seedIssue(sourceDevice, uniqueSourceResultId)
    await seedIssue(sourceDevice)
    await seedNotification(issueIdOnRepeatedSourceResult, uniqueSourceResultId)
    await seedFactTables(sourceSiteId)
  })

  afterEach(async () => {
    await knex('Notification').where({ issueId: issueIdOnRepeatedSourceResult }).del()
    await knex('Issue').where({ deviceId: targetDevice.id }).del()
    await knex('DeviceApiKey').where('siteId', targetSiteId).orWhere({ deviceId: targetDevice.id }).del()
    await knex('Result').where('deviceId', targetDevice.id).del()
    await knex('Sample').where('originSiteId', targetSiteId).del()
    await knex('DeviceLog').where('deviceId', targetDevice.id).del()
    await knex('DeviceApprovalLog').where('deviceId', targetDevice.id).del()
    await knex('Device').where('id', targetDevice.id).del()
  })

  it('If source device is active should throw validation', async () => {
    const res = await server
      .post(path)
      .send({ sourceDevicesIds: [sourceDeviceId], targetDeviceId: targetDevice.id })
      .set('Authorization', `Bearer${shared.token}`)
    expect(res.statusCode).to.equal(422)
  })

  it.only('Devices should be correctly merged', async () => {
    await setSourceDeviceInactive()
    await setSourceFirstResultAsDuplicateInTarget(targetDevice.id, repeatedSourceResultId)
    await setSamplesToTargetSite()

    const res = await server
      .post(path)
      .send({ sourceDevicesIds: [sourceDeviceId], targetDeviceId: targetDevice.id })
      .set('Authorization', `Bearer${shared.token}`)

    expect(res.statusCode).to.equal(200)

    const sourceDevices = await knex('Device').where('id', sourceDeviceId)
    expect(sourceDevices).to.have.lengthOf(0, 'Source device should be deleted')

    const targetResults = (await knex('Result').where('deviceId', targetDevice.id).select('id')).map(r => r.id)
    expect(targetResults).to.have.lengthOf(2, 'Target device should have 2 results')
    expect(targetResults).to.have.members(
      [repeatedTargetResultId, uniqueSourceResultId],
      'Repeated source result should not be present in target device'
    )

    const targetIssues = await knex('Issue').where('deviceId', targetDevice.id).select('id', 'deviceId', 'resultId')
    expect(targetIssues).to.have.lengthOf(3, 'All issues are now in target device')
    expect(targetIssues.find(i => i.id === issueIdOnRepeatedSourceResult).resultId).to.be.equal(
      repeatedTargetResultId,
      'Issues on repeated source result should be in target repeated result'
    )

    await assertFactTables(sourceDeviceId)
  })
})

async function assertFactTables(deviceId) {
  const dataInFactDeviceExternalSource = await knex('FactDeviceExternalSource').where({ deviceId }).select('deviceId')
  assert.equal(dataInFactDeviceExternalSource.length, 0, 'FactDeviceExternalSource should be empty')

  const dataInFactDeviceFlag = await knex('FactDeviceFlag').where({ deviceId }).select('deviceId')
  assert.equal(dataInFactDeviceFlag.length, 0, 'FactDeviceFlag should be empty')

  const dataInFactResultsDevice = await knex('FactResultsDevice').where({ deviceId }).select('deviceId')
  assert.equal(dataInFactResultsDevice.length, 0, 'FactResultsDevice should be empty')

  const dataInFactResultsDeviceByAssay = await knex('FactResultsDeviceByAssay').where({ deviceId }).select('deviceId')
  assert.equal(dataInFactResultsDeviceByAssay.length, 0, 'FactResultsDeviceByAssay should be empty')

  const dataInFactResultsDeviceByCategory1 = await knex('FactResultsDeviceByCategory1')
    .where({ deviceId })
    .select('deviceId')
  assert.equal(dataInFactResultsDeviceByCategory1.length, 0, 'FactResultsDeviceByCategory1 should be empty')

  const dataInFactResultsDeviceByCategory1And2 = await knex('FactResultsDeviceByCategory1And2')
    .where({ deviceId })
    .select('deviceId')
  assert.equal(dataInFactResultsDeviceByCategory1And2.length, 0, 'FactResultsDeviceByCategory1And2 should be empty')

  const dataInFactResultsDeviceByTimeFrame = await knex('FactResultsDeviceByTimeFrame')
    .where({ deviceId })
    .select('deviceId')
  assert.equal(dataInFactResultsDeviceByTimeFrame.length, 0, 'FactResultsDeviceByTimeFrame should be empty')
}

async function seedDeviceOperation() {
  await knex('DeviceOperation').insert({
    deviceId: sourceDeviceId,
    startedOn: new Date(),
    data: '{"someJsonData": "someValue"}',
  })
}

async function seedDeviceMaintenance() {
  const deviceMaintenanceTypeId = await deviceMaintenanceTypeToId('calibration')

  await knex('DeviceMaintenance').insert({
    deviceId: sourceDeviceId,
    deviceMaintenanceTypeId,
    notes: 'some notes',
    contextDate: new Date(),
    current: 1,
    createdOn: new Date(),
  })
}

async function seedIssue(device, resultId) {
  const { id: issueTypeId } = await knex('IssueType').first('id')

  const { id: issueStatusId } = await knex('IssueStatus').first('id')

  const [issueId] = await knex('Issue').insert({
    issueTypeId,
    issueStatusId,
    partnerId: device.partnerId,
    geographyId: device.geographyId,
    siteId: device.siteId,
    deviceId: device.id,
    resultId,
    level: 1,
    createdOn: new Date(),
  })
  return issueId
}

async function seedNotification(issueId, resultId) {
  const { id: notificationTypeId } = await knex('NotificationType').first('id')

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

async function setSourceFirstResultAsDuplicateInTarget(targetDeviceId, resultToForceId) {
  const targetResult = await knex('Result').where('deviceId', targetDeviceId).first('id', 'externalId')
  await knex('Result').where('id', resultToForceId).update({ externalId: targetResult.externalId })
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

  const assayId = await assayToId('GeneXpert MTB/XDR')
  const resultCategory1 = await resultCategoryToId('Detected')

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
