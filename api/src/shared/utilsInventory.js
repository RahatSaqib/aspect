const _ = require('lodash')
const { issueTypeToId, issueStatusToId } = require('../shared/dictionary')

// -----------------------------
// auditInventoryStockout
// -----------------------------
async function auditInventoryStockout({
  knex,
  site: { siteId, consumableId },
  dailyRate,
  dueDays,
  trigger,
  resolver,
  escalator,
}) {
  // trigger issue if condition meets
  const days = await totalDaysUnexpiredInventoryItemsLast({
    knex,
    siteId,
    consumableId,
    dailyRate,
    dueDays,
  })
  if (days < dueDays) {
    trigger(siteId, consumableId, days)
  }

  // resolve or escalate issue
  await resolveEscalate({
    knex,
    siteId,
    issueType: 'InventoryStockout',
    resolver,
    escalator,
  })
}
// -----------------------------
// totalDaysUnexpiredInventoryItemsLast - is used also in plugin Myanmar/issueResolutions.js
// -----------------------------
async function totalDaysUnexpiredInventoryItemsLast({
  knex,
  siteId,
  consumableId,
  dailyRate,
  dueDays,
}) {
  // get all un-expired inventory items for provided site/consumable
  const items = await knex('InventoryItem')
    .where(function() {
      this.whereNull('expiresOn') // if is null
        .orWhere('expiresOn', '>', new Date()) // or unexpired
    })
    .where({ siteId, consumableId })
    .select(
      'quantityOnHand',
      'expiresOn',
      knex.raw(
        `CAST(
          DATEDIFF(
            IFNULL(
              expiresOn,
              DATE_ADD(NOW(), INTERVAL ? DAY)
            ),
            NOW()
          )
          AS SIGNED INTEGER
        ) AS expiresInDays`,
        [dueDays + 1]
      )
    )

  // take into account expiration dates - calculate how long items last
  const days = _.reduce(
    items,
    (sum, item) => {
      const lastsInDays = item.quantityOnHand / dailyRate
      const lastsActual = Math.min(lastsInDays, item.expiresInDays)
      const daysLeft = lastsActual - sum
      const cntDays = Math.max(0, daysLeft)
      return sum + cntDays
    },
    0
  )

  return days
}
// -----------------------------
// auditInventoryStockExpiring
// -----------------------------
async function auditInventoryStockExpiring({
  knex,
  site: { siteId, consumableId },
  dailyRate,
  dueDays,
  trigger,
  resolver,
  escalator,
}) {
  // trigger issue if condition meets
  const totalWasted = await totalWastedInventoryItems({
    knex,
    siteId,
    consumableId,
    dailyRate,
  })
  if (totalWasted > 0) {
    trigger(siteId, consumableId, dueDays, totalWasted)
  }

  // resolve or escalate issue
  await resolveEscalate({
    knex,
    siteId,
    issueType: 'InventoryStockExpiring',
    resolver,
    escalator,
  })
}
// -----------------------------
// totalWastedInventoryItems - is used also in plugin Myanmar/issueResolutions.js
// -----------------------------
async function totalWastedInventoryItems({
  knex,
  siteId,
  consumableId,
  dailyRate,
}) {
  // get all un-expired inventory items for provided site/consumable
  const items = await knex('InventoryItem')
    .where({ siteId, consumableId })
    .whereNotNull('expiresOn') // is NOT null
    .where('expiresOn', '>', new Date()) // and unexpired
    .select(
      'quantityOnHand',
      'expiresOn',
      knex.raw(
        `CAST(GREATEST(DATEDIFF(expiresOn, NOW()), 0) AS SIGNED INTEGER) AS expiresInDays`
      )
    )

  // take into account expiration dates - calculate how long items last
  const now = new Date()
  const totalWasted = _.reduce(
    items,
    (sum, item) => {
      const lastsInDays = item.quantityOnHand / dailyRate
      const wasted =
        item.expiresInDays < lastsInDays
          ? item.expiresOn > now
            ? dailyRate * (lastsInDays - item.expiresInDays)
            : item.quantityOnHand
          : 0

      return sum + wasted
    },
    0
  )

  return totalWasted
}
// -----------------------------
// resolveEscalate
// -----------------------------
async function resolveEscalate({
  knex,
  siteId,
  issueType,
  resolver,
  escalator,
}) {
  // get all Active issues of this type for current siteId
  const issueTypeId = await issueTypeToId(issueType)
  const issueStatusId = await issueStatusToId('Active')
  const issues = await knex('Issue')
    .where({ siteId, issueTypeId, issueStatusId })
    .select('id')

  // loop through all active issues and
  _.each(issues, ({ id: issueId }) => {
    // try to resolve issue (i.e. for Myanmar it runs function in /plugin/partner/Myanmar/issueResolutions.js)
    if (resolver) resolver(issueId)

    // try to escalate issue
    if (escalator) escalator(issueId)
  })
}

// -----------------------------
// isStockEmpty
// -----------------------------
async function isStockEmpty(knex, siteId, consumableId) {
  const inventoryItem = await knex('InventoryItem')
    .where({ siteId, consumableId })
    .first()
  const { quantityOnHand } = inventoryItem || {}
  // return true if quantityOnHand is null or 0
  return !quantityOnHand
}

module.exports = {
  // for Stockout issue
  auditInventoryStockout,
  totalDaysUnexpiredInventoryItemsLast,
  // for StockExpiring issue
  auditInventoryStockExpiring,
  totalWastedInventoryItems,
  resolveEscalate, // resolve-escalate specified issueType for specified siteId
  isStockEmpty,
}
