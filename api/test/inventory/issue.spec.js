const subMinutes = require('date-fns/sub_minutes')

// const chai = require('chai')
const { assert } = require('chai')

const { createIssueTestContext } = require('./utils')
const {
  createMessageContext,
  waitForIdle,
  waitForAction,
} = require('../utils/mqUtils')

// get test context with created sample messageId
const context = createIssueTestContext()

// action creators
const {
  inventoryStockout,
  inventoryStockExpiring,
} = require('../../src/inventory/actions')

describe('Inventory Stock Issues Endpoint', () => {
  const { runTest } = context

  afterEach(context.afterEach)

  it('should create a inventory Stockout and Stock Expiring issues', () =>
    runTest(async knex => {
      // get MQ context
      const messageContext = await createMessageContext()
      messageContext.bindActionCreators({
        inventoryStockout,
        inventoryStockExpiring,
      })

      // helper function which tests both Stackout and StackExpiring issues
      const testIssue = async (
        siteId,
        consumableId,
        daysDue,
        issueType,
        dispatch,
        actionCreator
      ) => {
        const action = actionCreator(siteId, consumableId, daysDue)
        await dispatch(siteId, consumableId, daysDue)
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
        context.issueEventIds.push(...issues.map(x => x.isuueEventId))
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
      }

      // Stockout
      await testIssue(
        context.siteId,
        context.consumableId,
        20,
        'InventoryStockout',
        messageContext.inventoryStockout,
        inventoryStockout
      )

      // Stock Expiting
      await testIssue(
        context.siteId,
        context.consumableId,
        10,
        'InventoryStockExpiring',
        messageContext.inventoryStockExpiring,
        inventoryStockExpiring
      )
    }))
})
