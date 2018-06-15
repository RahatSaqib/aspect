const _ = require('lodash')
const cron = require('node-cron')
const {
  factGenerateDeviceConnectivity,
  factGenerateResultCounts,
  factCheckInventoryStock,
  factCalculateInventoryConsumptionRates,
} = require('./fact/actions')
const { escalateIssues, resolveIssues } = require('./issue/actions')

function startScheduler(queue) {
  // run hourly tasks on startup and cron every hour
  const dispatcher = createActionDispatcher(queue, {
    factGenerateResultCounts,
    factCheckInventoryStock,
    factGenerateDeviceConnectivity,
    factCalculateInventoryConsumptionRates,
    escalateIssues,
    resolveIssues,
  })
  dispatcher.factGenerateResultCounts()
  dispatcher.factGenerateDeviceConnectivity()
  dispatcher.factCalculateInventoryConsumptionRates()

  /*
  // ------------------------------------------------------------------------
  // scenario to check initial triggering of issue and then escalating it,
  // for example - InventoryStockout issue type:
  // ------------------------------------------------------------------------
  1. data preparation
    - recreate db, run migration/seed scripts (see README.md)
    - start api for the first time to make sure tabe FactInventoryConsumptionRate gets populated, stop api
    - open FactInventoryConsumptionRate, locate siteId=1124, consumableId=1, see that 
      daily (days=1) rate is >0, i.e. =2.9 in default dataset after seeding db
  2. trigger initial issue of level 1
    - in InventoryItem table locate needed entry (i.e. siteId=1124, consumableId=1) and set date of 
     'expiresOn' to 10 days ahead from today, and set 'quantityOnHand' to 5.
    - Uncomment below line 'dispatcher.factCheckInventoryStock()'
    - start api
    - in a minute or so check table Issue - should see entry for siteId=1124, level=1, issueTypeId=2
    - stop api
  3. escalating issue to level 2
    - open IssueEvent table, locate entry for above issue (with data siteId=1124, level=1, issueTypeId=2 in Issue table)
    - change 'createdOn' to 11 days back - double check table IssueEscalationTrigger for issueTypeId=2, escalateToLevel=2,
      see escalationConditions - it should have days:10, that is why change 'createdOn' to 11 days back in table IssueEvent
    - comment below line 'dispatcher.factCheckInventoryStock()'
    - uncomment below line 'dispatcher.escalateIssues()'
    - start api
    - in a minute check Issue table - level should change from 1 to 2 for our issue entry
    - stop api
  */
  // dispatcher.factCheckInventoryStock()
  // dispatcher.escalateIssues()
  // ------------------------------------------------------------------------

  cron.schedule('0 1 * * *', dispatcher.factCheckInventoryStock) // daily at 1 am
  cron.schedule('0 * * * *', dispatcher.factGenerateResultCounts) // run every hour as it changes
  cron.schedule('1 * * * *', dispatcher.factGenerateDeviceConnectivity) // run every hour at 1 minute past the hour
  cron.schedule('*/15 * * * *', dispatcher.escalateIssues) // run every 15 minutes
  cron.schedule(
    '25 */2 * * *', // run every 2 hours at 25th minute past the hour
    dispatcher.factCalculateInventoryConsumptionRates
  )
  cron.schedule('30 7,22,37,52 * * * *', dispatcher.resolveIssues) // run every 15 minutes starting at 7m and 30s
}

function createActionDispatcher(queue, actionCreators) {
  const dispatcher = {}
  _.each(actionCreators, (creator, name) => {
    dispatcher[name] = () =>
      queue.createMessageContext(`aspect_scheduler_${name}`).dispatch(creator())
  })
  return dispatcher
}

module.exports = {
  startScheduler,
}
