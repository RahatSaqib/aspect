const _ = require('lodash')
const { assert, expect } = require('chai')
const subHours = require('date-fns/subHours')

const { queuePurge } = require('../utils/mqUtils')
const { knex } = require('../../src/db')
const { createMessageContext, waitForIdle, waitForAction } = require('../utils/mqUtils')

// action creators
const { inventoryStockout, inventoryStockExpiring } = require('../../src/inventory/actions')
const { escalateIssues } = require('../../src/issue/actions')
const { getPartner, getSite, cleanUpIssues } = require('../utils/issueUtils')
const { loadPlugin } = require('../../src/plugin/loadPlugin')
const {
  deviceTypeToId,
  deviceApprovalToId,
  resultSourceToId,
  resultTypeToId,
  resultCategoryToId,
  sampleTypeToId,
} = require('../../src/shared/dictionary')

describe('Inventory Stock Issues Endpoint', () => {
  const partnerName = 'MoHS'
  const countryAbbreviation = 'MM'

  let messageContext
  let baseProps = {
    issueEventIds: [],
  }
  let issueIds = []
  const resultIds = []
  let partner = null
  before(async () => {
    partner = await getPartner(knex, partnerName)
    assert.isOk(partner, `Cannot find Partner ${partnerName}`)
    const {
      s: { id: siteId, geographyId },
      regionalOfficer: siteRegionalOfficer,
    } = await getSite(knex, {
      partnerId: partner.id,
      countryAbbreviation,
      requireInventory: false,
    })

    const inventoryItem = await createTestInventory(knex, siteId, partner.id)

    const [deviceId] = await createTestDevice(knex, siteId, geographyId, partner.id)

    const device = await knex('Device').where({ id: deviceId }).first()

    const resultId = await createTestResult(knex, device)
    resultIds.push(resultId)

    const { displayPreferences = {} } = await loadPlugin(partner.plugin, undefined, 'settings')
    baseProps = {
      siteId,
      siteRegionalOfficer,
      consumableId: inventoryItem.consumableId,
      issueEventIds: [],
      daysDue: 30,
      displayPreferences,
    }

    messageContext = await createMessageContext()
    messageContext.bindActionCreators({
      inventoryStockout,
      inventoryStockExpiring,
      escalateIssues,
    })
  })

  after(async () => {
    if (resultIds.length > 0) {
      const deviceIds = await knex('Result').whereIn('id', resultIds).pluck('deviceId')
      const sampleIds = await knex('Result').whereIn('id', resultIds).pluck('sampleId')
      const { consumableId } = await knex('Consumable')
        .where({ externalId: 'DaktariCartridge' })
        .first('id as consumableId')
      await knex('InventoryItem').where({ consumableId }).delete()
      await knex('FactInventoryConsumptionRate').where({ consumableId }).delete()
      await knex('ConsumableAssay').where({ consumableId }).delete()
      await knex('PartnerConsumable').where({ consumableId, partnerId: partner.id }).delete()
      const issuesId = await knex('Issue').where({ consumableId }).pluck('id')
      await knex('Notification').whereIn('issueId', issuesId).delete()
      await knex('Issue').whereIn('id', issuesId).delete()
      await knex('Consumable').where({ id: consumableId }).delete()

      await knex('Result').whereIn('id', resultIds).delete()
      await knex('Sample').whereIn('id', sampleIds).delete()
      await knex('Device').whereIn('id', deviceIds).delete()
    }
    deleteConsumableTestData(knex, baseProps.consumableId)
  })

  afterEach(async () => {
    // make sure MQ finished it's job before removing sample message
    await waitForIdle(2000)

    // clean IssueEvent if any items added
    if (baseProps.issueEventIds.length > 0) {
      await knex('IssueEvent').whereIn('id', baseProps.issueEventIds).delete()
    }
    await cleanUpIssues(knex, issueIds)

    await queuePurge()

    baseProps.issueEventIds = []
    issueIds = []
  })

  // ---------------------------------------------------------------------------
  // trigger base issues
  // ---------------------------------------------------------------------------
  // Stockout
  it('should create Stockout issue', async () => {
    const stockoutIssueId = await triggerInitialIssue({
      knex,
      ...baseProps, // i.e. siteId, consumableId, issueEventIds, daysDue
      issueType: 'InventoryStockout',
      dispatch: messageContext.inventoryStockout,
      actionCreator: inventoryStockout,
    })
    issueIds.push(stockoutIssueId)
  })

  // StockExpiring
  it('should create StockExpiring issue', async () => {
    const stockExpiringIssueId = await triggerInitialIssue({
      knex,
      ...baseProps, // i.e. siteId, consumableId, issueEventIds, daysDue
      issueType: 'InventoryStockExpiring',
      dispatch: messageContext.inventoryStockExpiring,
      actionCreator: inventoryStockExpiring,
    })
    issueIds.push(stockExpiringIssueId)
  })
})

// -----------------------------------
// helper functions
// -----------------------------------
async function triggerInitialIssue({
  knex,
  siteId,
  consumableId,
  issueEventIds,
  daysDue,
  issueType,
  dispatch,
  actionCreator,
}) {
  const TO_BE_WASTED = 100

  // array with values in same order as in action creators
  const values = [siteId, consumableId, daysDue]
  if (issueType === 'InventoryStockExpiring') {
    values.push(TO_BE_WASTED)
  }

  // dispatch action
  const action = actionCreator(...values)
  await dispatch(...values)

  // wait for MQ to handle
  await waitForAction(action)
  await waitForIdle(2000) // 2sec to let MQ handle all and save 1 LU and 2 RO's notifications
  const issue = await knex('Issue as i')
    .innerJoin('IssueType as it', 'i.issueTypeId', 'it.id')
    .innerJoin('IssueStatus as is', 'i.issueStatusId', 'is.id')
    .innerJoin('IssueEvent as ie', 'i.id', 'ie.issueId')
    .where({
      'i.siteId': siteId,
      'it.externalId': issueType,
    })
    .orderBy('ie.createdOn', 'desc')
    .first(
      'i.id',
      'i.level',
      'ie.id as issueEventId',
      'ie.data',
      'it.externalId as issueType',
      'is.externalId as issueStatus'
    )
  issueEventIds.push(issue.issueEventId)

  // compare requested issueType with saved in db
  assert.equal(issue.issueType, issueType, `issue types do not match - ${issueType} and ${issue.issueType}`)

  // issue should have status Active
  assert.equal(issue.issueStatus, 'Active', `issueStatus (${issue.issueStatus}) is not Active`)

  // get issue notifications sorted by Job Function
  const notifications = await knex('Notification as n')
    .join('NotificationType as nt', 'nt.id', 'n.notificationTypeId')
    .join('Person as p', 'p.id', 'n.personId')
    .join('User as u', 'u.id', 'p.userId')
    .join('AlertMessage as am', 'am.id', 'n.alertMessageId')

    .where({
      'n.issueId': issue.id,
    })
    .distinct('nt.name as notificationTypeName', 'u.name as userName', 'am.message as alertMessage')

  // should have 3 entries - 1 LU and 2 RO's
  expect(notifications.length).to.greaterThanOrEqual(3)
  const action2 = JSON.parse(issue.data)
  const consumableId2 = action2.consumableId
  const daysDue2 = action2.daysDue
  assert.equal(
    action2.consumableId,
    consumableId,
    `consumableId from action (${consumableId}) does not match consumableId in db (${consumableId2})`
  )
  assert.equal(action2.daysDue, daysDue, `action.daysDue (${daysDue}) does not match daysDue in db (${daysDue2})`)
  if (issueType === 'InventoryStockExpiring') {
    assert.equal(
      action2.totalWasted,
      TO_BE_WASTED,
      `action.totalWasted (${TO_BE_WASTED}) does not match totalWasted in db (${action2.totalWasted})`
    )
  }

  return issue.id
}

async function deleteConsumableTestData(knex, consumableId) {
  const inventoryItems = await knex('InventoryItem').where({ consumableId }).select('id')
  const inventoryItemIds = _.map(inventoryItems, 'id')
  await deleteInventoryTestData(knex, inventoryItemIds)

  await knex('FactInventoryConsumptionRate').where({ consumableId }).delete()
  await knex('PartnerConsumable').where({ consumableId }).delete()
  await knex('ConsumableAssay').where({ consumableId }).delete()
  await knex('Consumable').where({ id: consumableId }).delete()
}

async function deleteInventoryTestData(knex, inventoryItemIds) {
  await knex('InventoryLog').whereIn('inventoryItemId', inventoryItemIds).delete()
  await knex('InventoryItem').whereIn('id', inventoryItemIds).delete()
}

async function createTestDevice(knex, siteId, geographyId, partnerId) {
  return knex('Device').insert({
    partnerId,
    siteId, // new site id
    deviceTypeId: await deviceTypeToId('CepheidGeneXpert'),
    deviceApprovalId: await deviceApprovalToId('approved'),
    name: 'Test Device',
    shortName: 'Test Device',
    lastSeenOn: new Date(),
  })
}

async function createTestResult(knex, device) {
  const now = new Date()
  const admin = await knex('User').where({ name: 'myanmar_admin' }).first()
  const gxMtbRifAssay = await knex('Assay').where({ externalId: 'GxMtbRif' }).first()

  const resultSourceId = await resultSourceToId('DiagnosticDevice')
  const resultTypeId = await resultTypeToId('Patient')
  const sampleTypeId = await sampleTypeToId('DBS')
  const noResultCategoryId = await resultCategoryToId('NoResult')

  const [sampleId] = await knex('Sample').insert({
    externalId: `NEW SAMPLE ${new Date().getTime()}`,
    collectedOn: now,
    sampleTypeId,
    originSiteId: device.siteId,
  })

  const [resultId] = await knex('Result').insert({
    createdOn: now,
    createdBy: admin.id,
    updatedOn: now,
    updatedBy: admin.id,
    externalId: `NEW RESULT ${new Date().getTime()}`,
    assayId: gxMtbRifAssay.id,
    partnerId: device.partnerId,
    siteId: device.siteId,
    deviceId: device.id,
    reportableSiteId: device.siteId,
    resultSourceId,
    resultTypeId,
    sampleId,
    resultCategory1: noResultCategoryId,
    resultCategory2: noResultCategoryId,
    startedOn: subHours(now, 2),
    endedOn: now,
  })
  return resultId
}

async function createTestInventory(knex, siteId, partnerId) {
  const { id: assayId } = await knex('Assay').where({ externalId: 'GxMtbRif' }).first('id')

  const [consumableId] = await knex('Consumable').insert({
    name: 'Test Cartridge',
    unit: 1,
    canExpire: 1,
    manufacturer: 'Daktari',
    externalId: 'DaktariCartridge',
    i18nKey: 'DaktariCartridge',
  })
  await knex('ConsumableAssay').insert({
    consumableId,
    assayId,
    quantity: 1,
  })

  await knex('PartnerConsumable').insert({
    partnerId,
    consumableId,
    allowStockUpdateFromActionDashboard: true,
  })

  const [inventoryItemId] = await knex('InventoryItem').insert({
    consumableId,
    siteId,
    lotNumber: 'TEST-LOT',
    quantityOnHand: 500,
  })

  const inventoryItem = await knex('InventoryItem').where({ id: inventoryItemId }).first()

  return inventoryItem
}
