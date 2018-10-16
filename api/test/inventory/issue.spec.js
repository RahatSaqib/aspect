const _ = require('lodash')
const { addDays, subDays } = require('date-fns')
const { assert, expect } = require('chai')
const subHours = require('date-fns/sub_hours')

const { queuePurge } = require('../utils/mqUtils')
const { run } = require('../../src/db')
const {
  createMessageContext,
  waitForIdle,
  waitForAction,
} = require('../utils/mqUtils')
const {
  processUsingHandlebarsSyntax,
} = require('../../src/stringTemplate/service')
// action creators
const {
  inventoryStockout,
  inventoryStockExpiring,
} = require('../../src/inventory/actions')
const { escalateIssues } = require('../../src/issue/actions')
const { refreshConsumptionRates } = require('../../src/fact/service')
const {
  getPartner,
  getSite,
  getIssue,
  getIssueNotifications,
  cleanUpIssues,
} = require('../utils/issueUtils')
const { loadPlugin } = require('../../src/plugin/registration')
const {
  resultWorkflowStatusToId,
  resultSourceToId,
  resultTypeToId,
  resultCategoryToId,
  sampleTypeToId,
} = require('../../src/shared/dictionary')

const USER_LU_NAME_PREFIX = 'myanmar_lab'
const USER_RO_NAME_PREFIX = 'myanmar_ro'

describe('Inventory Stock Issues Endpoint', () => {
  const partnerName = 'Myanmar'
  const countryAbbreviation = 'MM'

  let messageContext
  let baseProps = {
    issueEventIds: [],
  }
  let issueIds = []
  const resultIds = []

  before(async () =>
    run(async knex => {
      const partner = await getPartner(knex, partnerName)
      assert.isOk(partner, `Cannot find Partner ${partnerName}`)
      const {
        s: { id: siteId },
        regionalOfficer: siteRegionalOfficer,
      } = await getSite(knex, {
        partnerId: partner.id,
        countryAbbreviation,
        requireInventory: true,
      })
      const inventoryItem = await createTestInventory(knex, siteId, partner.id)

      const device = await knex('Device')
        .where({ partnerId: partner.id, siteId })
        .first()

      const resultId = await createTestResult(knex, device)
      resultIds.push(resultId)

      const { displayPreferences = {} } = await loadPlugin(
        [partner.plugin],
        'settings'
      )
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
  )

  after(async () =>
    run(async knex => {
      if (resultIds.length > 0) {
        await knex('Result')
          .whereIn('id', resultIds)
          .delete()
      }
      deleteConsumableTestData(knex, baseProps.consumableId)
    })
  )

  afterEach(async () =>
    run(async knex => {
      // make sure MQ finished it's job before removing sample message
      await waitForIdle(2000)

      // clean IssueEvent if any items added
      if (baseProps.issueEventIds.length > 0) {
        await knex('IssueEvent')
          .whereIn('id', baseProps.issueEventIds)
          .delete()
      }
      await cleanUpIssues(knex, issueIds)

      await queuePurge()

      baseProps.issueEventIds = []
      issueIds = []
    })
  )

  it('makes sure that calculated consumption rates match rates in db for all periods', async () => {
    await run(async knex => {
      const { siteId, consumableId } = baseProps
      // calculate rates
      const totals = await refreshConsumptionRates(knex, siteId, consumableId)

      // read from db
      const ratesDb = await knex('FactInventoryConsumptionRate')
        .where({ siteId, consumableId })
        .select('days', 'rate')

      totals.forEach(justCalculated => {
        const fromDb = ratesDb.find(x => x.days === justCalculated.days)

        assert.exists(
          fromDb,
          `No rate entry in db for period ${justCalculated.days} days`
        )

        assert.equal(
          justCalculated.total,
          fromDb.rate,
          `Rates do not match for period ${justCalculated.days} days`
        )
      })
    })
  })

  // ---------------------------------------------------------------------------
  // trigger base issues
  // ---------------------------------------------------------------------------
  // Stockout
  it('should create Stockout issue', async () => {
    await run(async knex => {
      const stockoutIssueId = await triggerInitialIssue({
        knex,
        ...baseProps, // i.e. siteId, consumableId, issueEventIds, daysDue
        issueType: 'InventoryStockout',
        dispatch: messageContext.inventoryStockout,
        actionCreator: inventoryStockout,
      })
      issueIds.push(stockoutIssueId)
    })
  })

  // StockExpiring
  it('should create StockExpiring issue', async () => {
    await run(async knex => {
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

  // ---------------------------------------------------------------------------
  // escalate issues
  // ---------------------------------------------------------------------------
  describe('Escalate to level 2 of just triggered Stockout issue', () => {
    let issueId
    beforeEach(async () =>
      run(async knex => {
        const { siteId, consumableId } = baseProps
        // calculate rates
        await refreshConsumptionRates(knex, siteId, consumableId)

        // Create stockout issue
        issueId = await triggerInitialIssue({
          knex,
          ...baseProps, // i.e. siteId, consumableId, issueEventIds, daysDue
          issueType: 'InventoryStockout',
          dispatch: messageContext.inventoryStockout,
          actionCreator: inventoryStockout,
        })
        issueIds.push(issueId)
      })
    )

    it('change stock level to make stock lasts for less than 14 days and dispatch escalate issue action', async () => {
      await run(async knex => {
        const { siteId, consumableId } = await knex('Issue')
          .where('id', issueId)
          .first()

        // get dailyRate
        const { rate: dailyRate } = (await knex('FactInventoryConsumptionRate')
          .where({ siteId, consumableId, days: 1 })
          .first('rate')) || { rate: 0 }

        // no need to read dueDaysInventoryStockout threshold from Partner table -
        // because we store threshold for level 1 only (for triggering issue).
        // It's equal 14 days for escalating to level 2
        const dueDays = 14

        // estimate quantity to let stock last for 2 days less than threshold
        const quantityOnHand = dailyRate * (dueDays - 2)

        // update InventoryItem assuming there are no lots defined
        await knex('InventoryItem')
          .update({
            quantityOnHand,
          })
          .where({ siteId, consumableId })

        // escalate
        const action = escalateIssues(issueId)
        await messageContext.escalateIssues(issueId)
        await waitForAction(action)
        await waitForIdle(1000)

        const issue = await getIssue(knex, issueId)
        assert.equal(issue.level, 2)

        // notifications should be created for the level that the issue has been escalated to
        const notificationsIssue = await getIssueNotifications(knex, issueId)
        expect(notificationsIssue).to.containSubset([
          {
            NotificationType: {
              level: 2,
            },
            Notification: {
              issueId,
              personId: baseProps.siteRegionalOfficer.id,
            },
          },
        ])
      })
    })
  })

  describe('Escalate to level 2 of just triggered Stock Expiring issue', () => {
    let issueId
    beforeEach(async () =>
      run(async knex => {
        const { siteId, consumableId } = baseProps
        // calculate rates
        await refreshConsumptionRates(knex, siteId, consumableId)

        // Create stockout issue
        issueId = await triggerInitialIssue({
          knex,
          ...baseProps, // i.e. siteId, consumableId, issueEventIds, daysDue
          issueType: 'InventoryStockExpiring',
          dispatch: messageContext.inventoryStockExpiring,
          actionCreator: inventoryStockExpiring,
        })
        issueIds.push(issueId)
      })
    )
    it('change createdOn value for just triggered Stock Expiring issue and dispatch escalate issue action', async () =>
      run(async knex => {
        // see seed/utils.js - search for 'knex('IssueEscalationTrigger').insert' -
        // level 2 - evaluationMethod: 'issue-age' and evaluationParameter: { days: 10 }
        // level 3 - evaluationMethod: 'issue-age' and evaluationParameter: { days: 20 }
        // So, change dates of these issues to 15 days back to meet escalation conditions
        const pastTime = subDays(new Date(), 15)
        await knex('IssueEvent')
          .update({
            createdOn: pastTime,
          })
          .where({ issueId })

        // escalate
        const action = escalateIssues(issueId)
        await messageContext.escalateIssues(issueId)
        await waitForAction(action)
        await waitForIdle(1000)

        const issue = await getIssue(knex, issueId)
        assert.equal(issue.level, 2)

        // notifications should be created for the level that the issue has been escalated to
        const notificationsIssue = await getIssueNotifications(knex, issueId)
        expect(notificationsIssue).to.containSubset([
          {
            NotificationType: {
              level: 2,
            },
            Notification: {
              issueId,
              personId: baseProps.siteRegionalOfficer.id,
            },
          },
        ])
      }))
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
  displayPreferences,
}) {
  const TO_BE_WASTED = 100

  // array with values in same order as in action creators
  const values = [siteId, consumableId, daysDue]
  if (issueType === 'InventoryStockExpiring') {
    values.push(TO_BE_WASTED)
  }

  // dispatch action
  const action = actionCreator(...values)
  dispatch(...values)

  // wait for MQ to handle
  await waitForAction(action)
  await waitForIdle(2000) // 2sec to let MQ handle all and save 1 LU and 2 RO's notifications

  // get latest issue for curent (siteId, issueType)
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
  assert.equal(
    issue.issueType,
    issueType,
    `issue types do not match - ${issueType} and ${issue.issueType}`
  )

  // issue should have status Active
  assert.equal(
    issue.issueStatus,
    'Active',
    `issueStatus (${issue.issueStatus}) is not Active`
  )

  // get issue notifications sorted by Job Function
  const notifications = await knex('Notification as n')
    .join('NotificationType as nt', 'nt.id', 'n.notificationTypeId')
    .join('JobFunction as jf', 'jf.id', 'nt.jobFunctionId')
    .join('Person as p', 'p.id', 'n.personId')
    .join('User as u', 'u.id', 'p.userId')
    .join('AlertMessage as am', 'am.id', 'n.alertMessageId')
    .where('n.issueId', issue.id)
    .orderBy('jf.name') // Lab User, Regional Officer
    .orderBy('nt.createdOn') // items are in same order as they happen
    .select(
      'u.name as userName',
      'jf.name as jobFunction',
      'nt.level',
      'nt.canAcknowledge',
      'am.message as alertMessage'
    )

  // should have 3 entries - 1 LU and 2 RO's
  expect(notifications.length).to.equal(3)
  const [notifLU, notifRO1, notifRO2] = notifications

  // helper func for asserting similar things for each notification
  const assertNotification = (
    notification,
    userNamePrefix,
    jobFunction,
    level,
    canAcknowledge
  ) => {
    expect(notification.userName).to.include(userNamePrefix)
    assert.equal(notification.jobFunction, jobFunction)
    assert.equal(notification.level, level)
    assert.equal(notification.canAcknowledge, canAcknowledge)
  }

  assertNotification(notifLU, USER_LU_NAME_PREFIX, 'Lab User', 1, 1)
  assertNotification(notifRO1, USER_RO_NAME_PREFIX, 'Regional Officer', 1, 0)
  const ack = issueType === 'InventoryStockout' ? 1 : 0
  assertNotification(notifRO2, USER_RO_NAME_PREFIX, 'Regional Officer', 1, ack)

  // check alert message
  if (issueType === 'InventoryStockout') {
    const date = addDays(new Date(), daysDue)
    assert.equal(
      notifLU.alertMessage,
      processUsingHandlebarsSyntax(
        `Stock-out expected {{formatDate date}} - Order Stock.`,
        { date, displayPreferences }
      )
    )
  }

  //
  const action2 = JSON.parse(issue.data)
  const consumableId2 = action2.consumableId
  const daysDue2 = action2.daysDue
  assert.equal(
    action2.consumableId,
    consumableId,
    `consumableId from action (${consumableId}) does not match consumableId in db (${consumableId2})`
  )
  assert.equal(
    action2.daysDue,
    daysDue,
    `action.daysDue (${daysDue}) does not match daysDue in db (${daysDue2})`
  )
  if (issueType === 'InventoryStockExpiring') {
    assert.equal(
      action2.totalWasted,
      TO_BE_WASTED,
      `action.totalWasted (${TO_BE_WASTED}) does not match totalWasted in db (${
        action2.totalWasted
      })`
    )
  }

  return issue.id
}
async function deleteConsumableTestData(knex, consumableId) {
  const inventoryItems = await knex('InventoryItem')
    .where({ consumableId })
    .select('id')
  const inventoryItemIds = _.map(inventoryItems, 'id')
  await deleteInventoryTestData(knex, inventoryItemIds)

  await knex('FactInventoryConsumptionRate')
    .where({ consumableId })
    .delete()
  await knex('PartnerConsumable')
    .where({ consumableId })
    .delete()
  await knex('ConsumableAssay')
    .where({ consumableId })
    .delete()
  await knex('Consumable')
    .where({ id: consumableId })
    .delete()
}

async function deleteInventoryTestData(knex, inventoryItemIds) {
  await knex('InventoryLog')
    .whereIn('inventoryItemId', inventoryItemIds)
    .delete()
  await knex('InventoryItem')
    .whereIn('id', inventoryItemIds)
    .delete()
}

async function createTestResult(knex, device) {
  const now = new Date()
  const admin = await knex('User')
    .where({ name: 'myanmar_admin' })
    .first()
  const gxMtbRifAssay = await knex('Assay')
    .where({ externalId: 'GxMtbRif' })
    .first()

  const resultWorkflowStatusId = await resultWorkflowStatusToId('OK')
  const resultSourceId = await resultSourceToId('DiagnosticDevice')
  const resultTypeId = await resultTypeToId('Patient')
  const sampleTypeId = await sampleTypeToId('DBS')
  const noResultCategoryId = await resultCategoryToId('NoResult')

  const { id: sampleId } = await knex('Sample')
    .where({
      sampleTypeId,
      originSiteId: device.siteId,
    })
    .first('id')
  const resultId = await knex('Result').insert({
    createdOn: now,
    createdBy: admin.id,
    updatedOn: now,
    updatedBy: admin.id,
    externalId: `NEW RESULT ${new Date().getTime()}`,
    assayId: gxMtbRifAssay.id,
    partnerId: device.partnerId,
    geographyId: device.geographyId,
    siteId: device.siteId,
    deviceId: device.id,
    resultWorkflowStatusId,
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
  const { id: assayId } = await knex('Assay')
    .where({ externalId: 'GxMtbRif' })
    .first('id')

  const [consumableId] = await knex('Consumable').insert(
    {
      name: 'Test Cartridge',
      unit: 1,
      canExpire: 1,
      manufacturer: 'Daktari',
    },
    'id'
  )
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

  const inventoryItemId = await knex('InventoryItem').insert(
    {
      consumableId,
      siteId,
      lotNumber: 'TEST-LOT',
      quantityOnHand: 500,
    },
    'id'
  )

  const inventoryItem = await knex('InventoryItem')
    .where({ id: inventoryItemId })
    .first()

  return inventoryItem
}
