const { expect, assert } = require('chai')
const { addDays, subDays } = require('date-fns')
const { deviceMaintenanceTypeToId, resultCategoryToId, consumableReasonToId } = require('../../src/shared/dictionary')
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
let deviceApiKeyIds

describe('Merge Devices', () => {
  before(async () => shared.checkToken(server, path))

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

  before(async () => {
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

    deviceApiKeyIds = await knex('Device').whereIn('id', [targetDevice.id, sourceDeviceId]).pluck('deviceApiKeyId')

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
  })

  after(async () => {
    // Wait a bit to ensure any background fact generation operations complete
    await new Promise(resolve => setTimeout(resolve, 100))

    await knex('Notification')
      .whereIn('issueId', knex('Issue').whereIn('deviceId', [sourceDeviceId, targetDevice.id]).select('id'))
      .del()
    await knex('Issue').whereIn('deviceId', [sourceDeviceId, targetDevice.id]).del()

    await knex('DeviceOperation').whereIn('deviceApiKeyId', deviceApiKeyIds).del()
    await knex('Device').whereIn('id', [targetDevice.id, sourceDeviceId]).update({ deviceApiKeyId: null })
    await knex('DeviceApiKey').whereIn('id', deviceApiKeyIds).del()
    await knex('InventoryLog').whereIn('siteId', [targetSiteId, sourceSiteId]).del()
    await knex('Result').whereIn('deviceId', [sourceDeviceId, targetDevice.id]).del()
    await knex('Sample').whereIn('originSiteId', [sourceSiteId, targetSiteId]).del()
    await knex('InventoryItem').whereIn('siteId', [targetSiteId, sourceSiteId]).del()
    await knex('Site').whereIn('id', [targetSiteId, sourceSiteId]).del()
    await knex('DeviceLog').whereIn('deviceApiKeyId', deviceApiKeyIds).del()
    await knex('DeviceApprovalLog').whereIn('deviceId', [sourceDeviceId, targetDevice.id]).del()
    await knex('DeviceMaintenance').whereIn('deviceId', [sourceDeviceId, targetDevice.id]).del()
    await knex('Instrument').whereIn('deviceId', [sourceDeviceId, targetDevice.id]).del()

    // Delete fact tables sequentially to avoid deadlocks
    await knex('FactDeviceFlag').whereIn('deviceId', [sourceDeviceId, targetDevice.id]).del()
    await knex('FactResultsDevice').whereIn('deviceId', [sourceDeviceId, targetDevice.id]).del()
    await knex('FactResultsDeviceByAssay').whereIn('deviceId', [sourceDeviceId, targetDevice.id]).del()
    await knex('FactResultsDeviceByCategory1').whereIn('deviceId', [sourceDeviceId, targetDevice.id]).del()
    await knex('FactResultsDeviceByTimeFrame').whereIn('deviceId', [sourceDeviceId, targetDevice.id]).del()

    await knex('Device').whereIn('id', [targetDevice.id, sourceDeviceId]).del()
  })

  it('If source device pings in the last 24 hs should throw validation', async () => {
    await knex('Device').where('id', sourceDeviceId).update({ lastPingOn: new Date() })
    await server
      .post(path)
      .send({ sourceDevicesIds: [sourceDeviceId], targetDeviceId: targetDevice.id })
      .set('Authorization', `Bearer${shared.token}`)
      .expect(422)
  })

  it('Devices should be correctly merged', async () => {
    await setSourceDeviceInactiveForLast24Hs()
    await setSourceFirstResultAsDuplicateInTarget(targetDevice.id, repeatedSourceResultId)
    await setSamplesToTargetSite()
    /**
     * create InventoryItem and keep quantityOnHand value before device merge
     */
    const { quantityOnHand: quantityOnHandBefore, inventoryItemId } = await setInventoryItemAndInventoryLog(
      repeatedSourceResultId
    )
    /**
     * Add instruments to source and target device
     */
    await knex('Instrument').insert({
      deviceId: sourceDeviceId,
      serial: 'SRCINST1',
      macAddress: 'SRCMAC1',
      active: true,
      createdOn: new Date(),
      updatedOn: new Date(),
    })
    await knex('Instrument').insert({
      deviceId: sourceDeviceId,
      serial: 'DUPLICATEINST',
      macAddress: 'SRCMAC2',
      active: true,
      createdOn: new Date(),
      updatedOn: new Date(),
    })
    await knex('Instrument').insert({
      deviceId: targetDevice.id,
      serial: 'TGTINST1',
      macAddress: 'TGTMAC1',
      active: true,
      createdOn: new Date(),
      updatedOn: new Date(),
    })
    await knex('Instrument').insert({
      deviceId: targetDevice.id,
      serial: 'DUPLICATEINST',
      macAddress: 'TGTMAC2',
      active: false,
      createdOn: new Date(),
      updatedOn: new Date(),
    })
    /**
     * do device merge
     */
    await server
      .post(path)
      .send({ sourceDevicesIds: [sourceDeviceId], targetDeviceId: targetDevice.id })
      .set('Authorization', `Bearer${shared.token}`)
      .expect(200)

    const sourceDevices = await knex('Device').where('id', sourceDeviceId)
    expect(sourceDevices).to.have.lengthOf(0, 'Source device should be deleted')

    const targetResults = (await knex('Result').where('deviceId', targetDevice.id).select('id')).map(r => r.id)
    expect(targetResults).to.have.lengthOf(2, 'Target device should have 2 results')
    expect(targetResults).to.have.members(
      [repeatedTargetResultId, uniqueSourceResultId],
      'Repeated source result should not be present in target device'
    )

    const targetIssues = await knex('Issue').where('deviceId', targetDevice.id).select('id', 'deviceId', 'resultId')

    expect(targetIssues).to.have.lengthOf(
      2,
      'All issues from with only device or pointing to merged results are now in target device'
    )

    expect(targetIssues.find(i => i.id === issueIdOnRepeatedSourceResult).resultId).to.be.equal(
      repeatedTargetResultId,
      'Issues on repeated source result should be in target repeated result'
    )

    // Assert instruments are merged
    const instrumentsOnTarget = await knex('Instrument').where('deviceId', targetDevice.id)
    const instrumentSerials = instrumentsOnTarget.map(i => i.serial)
    expect(instrumentSerials).to.include('SRCINST1')
    expect(instrumentSerials).to.include('TGTINST1')
    expect(instrumentSerials.filter(serial => serial === 'DUPLICATEINST')).to.have.lengthOf(1)
    const mergedDuplicateInstrument = instrumentsOnTarget.find(i => i.serial === 'DUPLICATEINST')
    assert.exists(mergedDuplicateInstrument)
    expect(Boolean(mergedDuplicateInstrument.active)).to.equal(true)
    // Source device should have no instruments
    const instrumentsOnSource = await knex('Instrument').where('deviceId', sourceDeviceId)
    expect(instrumentsOnSource).to.have.lengthOf(0)

    await assertFactTables(sourceDeviceId)
    /**
     * new value of InventoryItem.quantityOnHand should increase on 1
     */
    const { quantityOnHand: quantityOnHandAfter } = await knex('InventoryItem').where('id', inventoryItemId).first()
    assert.equal(quantityOnHandAfter - 1, quantityOnHandBefore, 'quantityOnHand should be increased on 1')
  })
})

async function assertFactTables(deviceId) {
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

  const dataInFactResultsDeviceByTimeFrame = await knex('FactResultsDeviceByTimeFrame')
    .where({ deviceId })
    .select('deviceId')
  assert.equal(dataInFactResultsDeviceByTimeFrame.length, 0, 'FactResultsDeviceByTimeFrame should be empty')
}

async function seedDeviceOperation() {
  await knex('DeviceOperation').insert({
    deviceApiKeyId: knex('Device').where('id', sourceDeviceId).first('deviceApiKeyId'),
    occurredOn: new Date(),
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
    updatedOn: new Date(),
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
    updatedOn: new Date(),
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

async function getOrCreateInventoryItemFor(siteId, consumableId) {
  const now = new Date()
  let inventoryItem = await knex('InventoryItem')
    .where({
      consumableId,
      siteId,
    })
    .first()
  if (!inventoryItem) {
    const [id] = await knex('InventoryItem').insert({
      consumableId,
      siteId,
      lotNumber: 12345,
      expiresOn: addDays(now, 30),
      quantityOnHand: 100,
      createdOn: now,
      updatedOn: now,
    })
    inventoryItem = await knex('InventoryItem').where({ id }).first()
  }
  return inventoryItem
}

async function setInventoryItemAndInventoryLog(repeatedSourceResultId) {
  const sourceResult = await knex('Result as r')
    .innerJoin('ConsumableAssay as ca', 'r.assayId', 'ca.assayId')
    .where('r.id', repeatedSourceResultId)
    .first('ca.consumableId', 'ca.quantity', 'r.siteId')
  const { consumableId, quantity, siteId } = sourceResult
  const inventoryItem = await getOrCreateInventoryItemFor(siteId, consumableId)
  const { id: inventoryItemId, quantityOnHand, lotNumber, expiresOn } = inventoryItem

  let { id: inventoryLogId } =
    (await knex('InventoryLog')
      .where({
        inventoryItemId,
        consumableId,
        siteId,
        resultId: repeatedSourceResultId,
      })
      .first()) || {}
  if (!inventoryLogId) {
    ;[inventoryLogId] = await knex('InventoryLog').insert({
      inventoryItemId,
      consumableId,
      siteId,
      consumableReasonId: await consumableReasonToId('test_conducted'),
      resultId: repeatedSourceResultId,
      lotNumber,
      expiresOn,
      quantity,
    })
  }

  return {
    quantityOnHand,
    inventoryItemId,
  }
}

async function setSourceDeviceInactiveForLast24Hs() {
  await knex('Device')
    .where('id', sourceDeviceId)
    .update({ lastPingOn: subDays(new Date(), 5) })
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
