const { addMonths, subMinutes } = require('date-fns')
const { assert, expect } = require('chai')

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
const { escalateIssues } = require('../../src/issue/actions')
const { refreshConsumptionRates } = require('../../src/fact/service')
const {
  getPartner,
  getSite,
  getIssue,
  getIssueNotifications,
  cleanUpIssues,
} = require('../utils/issueUtils')

describe('Inventory Stock Issues Endpoint', () => {
  const partnerName = 'Myanmar'
  const countryAbbreviation = 'MM'

  let partner
  let site
  let siteRegionalOfficer
  let siteId
  let consumableId
  let issueEventIds
  let messageContext
  let baseProps
  const issueIds = []

  before(async () =>
    run(async knex => {
      partner = await getPartner(knex, partnerName)
      const siteDetails = await getSite(knex, {
        partnerId: partner.id,
        countryAbbreviation,
      })
      site = siteDetails.s
      siteRegionalOfficer = siteDetails.regionalOfficer

      // take consumable of 1st inventory item
      const inventoryItem = await knex('InventoryItem as ii')
        .where('ii.siteId', site.id)
        .first('ii.consumableId as cid')

      siteId = site.id
      consumableId = inventoryItem.cid

      issueEventIds = []
      messageContext = await createMessageContext()
      messageContext.bindActionCreators({
        inventoryStockout,
        inventoryStockExpiring,
        escalateIssues,
      })

      baseProps = {
        siteId,
        consumableId,
        issueEventIds,
        daysDue: 30,
      }
    })
  )

  after(async () =>
    run(async knex => {
      await waitForIdle()

      if (issueEventIds.length > 0) {
        await knex('IssueEvent')
          .whereIn('id', issueEventIds)
          .delete()
      }

      issueEventIds = []

      await cleanUpIssues(knex, issueIds)

      await queuePurge()
    })
  )

  it('calculated consumption rates should match rates in db for all periods', () => {
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
          Math.round(justCalculated.rate * 100) / 100,
          fromDb.rate, // db float format is (8.2)
          `Rates do not match for period ${justCalculated.days} days`
        )
      })
    })
  })

  // ---------------------------------------------------------------------------
  // trigger base issues
  // ---------------------------------------------------------------------------
  // Stockout
  it('should create Stockout issue', () => {
    runTestWithKnex(async knex => {
      const issueId = await triggerInitialIssue({
        knex,
        ...baseProps, // i.e. siteId, consumableId, issueEventIds, daysDue
        issueType: 'InventoryStockout',
        dispatch: messageContext.inventoryStockout,
        actionCreator: inventoryStockout,
      })
      issueIds.push(issueId)
    })
  })

  // StockExpiring
  it('should create StockExpiring issue', () => {
    runTestWithKnex(async knex => {
      const issueId = await triggerInitialIssue({
        knex,
        ...baseProps, // i.e. siteId, consumableId, issueEventIds, daysDue
        issueType: 'InventoryStockExpiring',
        dispatch: messageContext.inventoryStockExpiring,
        actionCreator: inventoryStockExpiring,
      })
      issueIds.push(issueId)
    })
  })

  // ---------------------------------------------------------------------------
  // escalate issues
  // ---------------------------------------------------------------------------
  describe("dispatch ESCALATE_ISSUES with created issues ID's", () => {
    it('Stockout and StockExpiring issues should be escalated', () =>
      runTestWithKnex(async knex => {
        // change dates of these issues to 1 month back to meet escalation conditions
        const monthAgo = addMonths(new Date(), -1)
        await knex('Issue')
          .update({
            createdOn: monthAgo,
            updatedOn: monthAgo,
          })
          .whereIn('issueId', issueIds)

        // escalate
        issueIds.map(async issueId => {
          const action = escalateIssues(issueId)
          await messageContext.escalateIssues(issueId)
          await waitForAction(action)
          await waitForIdle()

          const issue = await getIssue(knex, issueId)
          assert.equal(issue.level, 2)
        })
      }))

    it('notifications should be created for the level that the issue has been escalated to', () =>
      runTestWithKnex(async knex => {
        issueIds.map(async issueId => {
          const notificationsIssue = await getIssueNotifications(knex, issueId)
          expect(notificationsIssue).to.containSubset([
            {
              NotificationType: {
                level: 2,
              },
              Notification: {
                issueId,
                personId: siteRegionalOfficer.id,
              },
            },
          ])
        })
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
}) {
  const TO_BE_WASTED = 100
  let action
  if (issueType === 'InventoryStockout') {
    action = actionCreator(siteId, consumableId, daysDue)
    await dispatch(siteId, consumableId, daysDue)
  } else {
    action = actionCreator(siteId, consumableId, daysDue, TO_BE_WASTED)
    await dispatch(siteId, consumableId, daysDue, TO_BE_WASTED)
  }
  await waitForAction(action)
  await waitForIdle()
  const dateFrom = subMinutes(new Date(), 5)

  // get issues for last 10 mins for curent siteId and issueType
  const issue = await knex('Issue as i')
    .innerJoin('IssueType as it', 'i.issueTypeId', 'it.id')
    .innerJoin('IssueStatus as is', 'i.issueStatusId', 'is.id')
    .innerJoin('IssueEvent as ie', 'i.id', 'ie.issueId')
    .where({ 'i.siteId': siteId, 'it.externalId': issueType })
    .where('ie.createdOn', '>', dateFrom)
    .first(
      'i.id',
      'ie.id as isuueEventId',
      'ie.data',
      'it.externalId as issueType',
      'is.externalId as issueStatus'
    )
  issueEventIds.push(issue.isuueEventId)

  assert.equal(
    issue.issueType,
    issueType,
    `issue types do not match - ${issueType} and ${issue.issueType}`
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
      TO_BE_WASTED,
      `action.totalWasted (${TO_BE_WASTED}) does not match totalWasted in db (${
        action2.totalWasted
      })`
    )
  }

  return issue.id
}
