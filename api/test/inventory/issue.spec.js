const { addMonths, addDays } = require('date-fns')
const { assert, expect } = require('chai')

const { queuePurge } = require('../utils/mqUtils')
const { run } = require('../../src/db')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')
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

const USER_LU = 'myanmar_lab'
const USER_RO = 'myanmar_ro'

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

  before(async () => {
    await run(async knex => {
      partner = await getPartner(knex, partnerName)
      const siteDetails = await getSite(knex, {
        partnerId: partner.id,
        countryAbbreviation,
        requireInventory: true,
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

      const { displayPreferences = {} } = await loadPlugin(
        [partner.plugin],
        'settings'
      )

      baseProps = {
        siteId,
        consumableId,
        issueEventIds,
        daysDue: 30,
        displayPreferences,
      }
    })
  })

  after(async () => {
    await run(async knex => {
      await waitForIdle(4000)

      if (issueEventIds.length > 0) {
        await knex('IssueEvent')
          .whereIn('id', issueEventIds)
          .delete()
      }

      issueEventIds = []

      await cleanUpIssues(knex, issueIds)

      await queuePurge()
    })
  })

  it('makes sure that calculated consumption rates match rates in db for all periods', async () => {
    await runTestWithKnex(async knex => {
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
    await runTestWithKnex(async knex => {
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
  it('should create StockExpiring issue', async () => {
    await runTestWithKnex(async knex => {
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
    it('escalate triggered Stockout and StockExpiring issues to level 2', async () => {
      await runTestWithKnex(async knex => {
        // see seed/utils.js - search for 'knex('IssueEscalationTrigger').insert' -
        // level 2 - evaluationMethod: 'issue-age' and evaluationParameter: { days: 10 }
        // level 3 - evaluationMethod: 'issue-age' and evaluationParameter: { days: 20 }
        // So, change dates of these issues to 15 days back to meet escalation conditions
        const pastTime = addDays(new Date(), -15)
        await knex('IssueEvent')
          .update({
            createdOn: pastTime,
          })
          .whereIn('issueId', issueIds)

        // escalate
        await Promise.all(
          issueIds.map(async issueId => {
            const action = escalateIssues(issueId)
            await messageContext.escalateIssues(issueId)
            await waitForAction(action)
            await waitForIdle(1000)

            const issue = await getIssue(knex, issueId)
            assert.equal(issue.level, 2)
          })
        )
      })
    })

    it('notifications should be created for the level that the issue has been escalated to', async () => {
      await runTestWithKnex(async knex => {
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
      })
    })
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
  await waitForIdle(1000)

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
    .orderBy('nt.createdOn')
    .select(
      'u.name as userName',
      'jf.name as jobFunction',
      'nt.level',
      'nt.canAcknowledge',
      'am.message as alertMessage'
    )

  // should have 3 entries - 1 LU and 2 RO's
  expect(notifications.length).to.equal(3)
  const [notificationLU, notificationRO1, notificationRO2] = notifications

  // helper func for asserting similar things for each notification
  const assertNotification = (
    notification,
    userName,
    jobFunction,
    level,
    canAcknowledge
  ) => {
    expect(notification.userName).to.include(userName)
    assert.equal(notification.jobFunction, jobFunction)
    assert.equal(notification.level, level)
    assert.equal(notification.canAcknowledge, canAcknowledge)
  }

  assertNotification(notificationLU, USER_LU, 'Lab User', 1, 1)
  assertNotification(notificationRO1, USER_RO, 'Regional Officer', 1, 0)
  const ack = issueType === 'InventoryStockout' ? 1 : 0
  assertNotification(notificationRO2, USER_RO, 'Regional Officer', 1, ack)

  // check alert message
  if (issueType === 'InventoryStockout') {
    const date = addDays(new Date(), daysDue)
    assert.equal(
      notificationLU.alertMessage,
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
