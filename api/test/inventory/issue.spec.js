const subMinutes = require('date-fns/sub_minutes')

// const chai = require('chai')
const { assert } = require('chai')

const { queuePurge } = require('../utils/mqUtils')
const { run } = require('../../src/db')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')
const {
  createMessageContext,
  waitForIdle,
  waitForAction,
} = require('../utils/mqUtils')

// action creators
const {
  inventoryStockout,
  inventoryStockExpiring,
} = require('../../src/inventory/actions')

const { refreshConsumptionRates } = require('../../src/fact/service')

describe('Inventory Stock Issues Endpoint', () => {
  let siteId
  let consumableId
  let issueEventIds
  let messageContext

  before(async () =>
    run(async knex => {
      const inventoryItem = await knex('InventoryItem').first(
        'siteId as sid',
        'consumableId as cid'
      )
      siteId = inventoryItem.sid
      consumableId = inventoryItem.cid
      issueEventIds = []
      messageContext = await createMessageContext()
      messageContext.bindActionCreators({
        inventoryStockout,
        inventoryStockExpiring,
      })
    })
  )

  afterEach(async () =>
    run(async knex => {
      await waitForIdle()

      if (issueEventIds.length > 0) {
        await knex('IssueEvent')
          .whereIn('id', issueEventIds)
          .delete()
      }

      issueEventIds = []

      await queuePurge()
    })
  )

  it('just calculated consumption rates should match rates in db for all periods', () => {
    runTestWithKnex(async knex => {
      // calculate rates
      const rates = await refreshConsumptionRates(knex, siteId, consumableId)

      // read from db
      const ratesDb = await knex('FactInventoryConsumptionRate')
        .where({ siteId, consumableId })
        .select('days', 'rate')

      rates.forEach(justCalculated => {
        const fromDb = ratesDb.find(x => x.days === justCalculated.days)

        assert.exists(
          fromDb,
          `No rate entry in db for period ${justCalculated.days} days`
        )

        // 2 decimals only
        assert.equal(
          Math.floor(justCalculated.rate * 100) / 100,
          Math.floor(fromDb.rate * 100) / 100,
          `Rates do not match for period ${justCalculated.days} days`
        )
      })
    })
  })

  // Stockout
  it('should create Stockout issue', () =>
    runTestWithKnex(async knex => {
      await testIssue(
        knex,
        siteId,
        consumableId,
        issueEventIds,
        30,
        'InventoryStockout',
        messageContext.inventoryStockout,
        inventoryStockout
      )
    }))

  // StockExpiring
  it('should create StockExpiring issue', () =>
    runTestWithKnex(async knex => {
      await testIssue(
        knex,
        siteId,
        consumableId,
        issueEventIds,
        30,
        'InventoryStockExpiring',
        messageContext.inventoryStockExpiring,
        inventoryStockExpiring
      )
    }))
})

// -----------------------------------
// helper functions
// -----------------------------------
async function testIssue(
  knex,
  siteId,
  consumableId,
  issueEventIds,
  daysDue,
  issueType,
  dispatch,
  actionCreator
) {
  let action
  if (issueType === 'InventoryStockout') {
    action = actionCreator(siteId, consumableId, daysDue)
    await dispatch(siteId, consumableId, daysDue)
  } else {
    action = actionCreator(siteId, consumableId, daysDue, 100)
    await dispatch(siteId, consumableId, daysDue, 100)
  }
  await waitForAction(action)
  await waitForIdle()
  const dateFrom = subMinutes(new Date(), 10)

  // get issues for last 10 mins for curent siteId and issueType
  const issues = await knex('Issue as i')
    .innerJoin('IssueType as it', 'i.issueTypeId', 'it.id')
    .innerJoin('IssueStatus as is', 'i.issueStatusId', 'is.id')
    .innerJoin('IssueEvent as ie', 'i.id', 'ie.issueId')
    .where({ 'i.siteId': siteId, 'it.externalId': issueType })
    .where('ie.createdOn', '>', dateFrom)
    .select(
      'i.id',
      'ie.id as isuueEventId',
      'ie.data',
      'it.externalId as issueType',
      'is.externalId as issueStatus'
    )
  issueEventIds.push(...issues.map(x => x.isuueEventId))

  assert.isAtLeast(
    issues.length,
    1,
    `number of issues ${issues.length} fetched should be at least equal 1`
  )

  const issue = issues[0]
  assert.equal(
    issue.issueType,
    issueType,
    `issueType's do not match - ${issueType} and ${issues[0].issueType}`
  )

  assert.equal(
    issue.issueStatus,
    'Active',
    `issueStatus (${issue.issueStatus}) is not Active`
  )

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
      100,
      `action.totalWasted (100) does not match totalWasted in db (${
        action2.totalWasted
      })`
    )
  }
}
