const { subDays } = require('date-fns')
const { daysToCalculate } = require('./common/constants')
const { replaceOffset, startOfDayUtc } = require('../shared/date')

const bulkInsertThreshold = 1000

async function onFactCalculateInventoryConsumptionRates(action, { messageContext }) {
  return messageContext.run(async knex => {
    const items = await knex('InventoryItem').groupBy('siteId', 'consumableId').select('siteId', 'consumableId')

    let inventoryConsumptionRates = []
    for (const { siteId, consumableId } of items) {
      // eslint-disable-next-line no-await-in-loop
      const rates = await getConsumptionRates(knex, siteId, consumableId)
      inventoryConsumptionRates.push(...rates)

      if (inventoryConsumptionRates.length > bulkInsertThreshold) {
        // eslint-disable-next-line no-await-in-loop
        await upsertConsumptionRates(knex, inventoryConsumptionRates)
        inventoryConsumptionRates = []
      }
    }

    if (inventoryConsumptionRates.length > 0) {
      await upsertConsumptionRates(knex, inventoryConsumptionRates)
    }
  })
}

function upsertConsumptionRates(knex, inventoryConsumptionRates) {
  return knex('FactInventoryConsumptionRate')
    .insert(inventoryConsumptionRates)
    .onConflict(['siteId', 'consumableId', 'days'])
    .merge()
}

/** Recalculates rates for provided siteId and consumableId
 * @param {Object} knex - knex object
 * @param {Number} siteId - Site Id to recalculate
 * @param {Number} consumableId - Consumable Id to recalculate
 */
async function getConsumptionRates(knex, siteId, consumableId) {
  const updatedOn = new Date()
  const consumptionTotals = await getConsumptions(knex, siteId, consumableId)
  const inventoryConsumptionRates = consumptionTotals.map(consumptionTotal => ({
    siteId,
    consumableId,
    days: consumptionTotal.days,
    /*
     * TODO: Rename column rate to total
     * in GxAlert we stored totals in field 'rate', so same here.
     * to get actual rate - do rate/days
     */
    rate: consumptionTotal.total,
    updatedOn,
  }))

  return inventoryConsumptionRates
}

async function getConsumptions(knex, siteId, consumableId) {
  const totals = []
  const now = new Date()
  const { timeZone: timeZoneIANA } = await knex('Site as s')
    .join('Geography as g', 'g.id', 's.geographyId')
    .join('Country as c', 'c.id', 'g.countryId')
    .join('TimeZone as tz', 'c.timezone', 'tz.id')
    .first('tz.timeZone')
    .where('s.id', siteId)

  // --------------------
  // daily rate -
  // use most recent N days with at least one test
  // --------------------
  const limitItems = 10
  const lastDaysWithTest = await knex
    .from(function () {
      this.from('Result as r')
        .innerJoin('Assay as a', 'r.assayId', 'a.id')
        .innerJoin('ConsumableAssay as ca', 'a.id', 'ca.assayId')
        .innerJoin('Device as d', 'r.deviceId', 'd.id')
        .where('d.siteId', siteId)
        .where('ca.consumableId', consumableId)
        .distinct(knex.raw('date(r.endedOn) as endedOn'))
        .orderBy('endedOn', 'desc')
        .limit(limitItems)
        .as('t1')
    })
    .first(knex.raw('min(endedOn) as dateFrom'), knex.raw('max(endedOn) as dateTo'))

  if (!lastDaysWithTest) {
    return totals
  }

  const [consumed = { total: 0 }] =
    (await knex('Result as r')
      .innerJoin('Assay as a', 'r.assayId', 'a.id')
      .innerJoin('ConsumableAssay as ca', 'a.id', 'ca.assayId')
      .innerJoin('Device as d', 'r.deviceId', 'd.id')
      .whereRaw('date(r.endedOn) >= ?', [lastDaysWithTest.dateFrom])
      .whereRaw('date(r.endedOn) <= ?', [lastDaysWithTest.dateTo])
      .where('d.siteId', siteId)
      .where('ca.consumableId', consumableId)
      .sum('ca.quantity as total')
      .groupBy('d.siteId', 'ca.consumableId')) || []

  totals.push({ days: 1, total: consumed.total / limitItems })

  // --------------------
  // other rates
  // --------------------
  const daysToRate = daysToCalculate.filter(x => x > 1 && x < 9999)
  const fields = daysToRate.map(days => {
    const from = replaceOffset(startOfDayUtc(subDays(now, days)), timeZoneIANA)

    return knex.raw(`sum(case when r.endedOn >= '${from}' then ca.quantity else 0 end) as total${days}`)
  })

  const consumedTotals = await knex('Result as r')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .innerJoin('ConsumableAssay as ca', 'a.id', 'ca.assayId')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .whereRaw('r.endedOn >= DATE_ADD(NOW(), INTERVAL -1 YEAR)')
    .where('d.siteId', siteId)
    .where('ca.consumableId', consumableId)
    .groupBy('d.siteId', 'ca.consumableId')
    .first(...fields)

  daysToRate.forEach(days => {
    const totalItems = consumedTotals && consumedTotals[`total${days}`]
    const total = typeof totalItems === 'number' ? totalItems : 0
    totals.push({ days, total })
  })

  return totals
}
module.exports = {
  onFactCalculateInventoryConsumptionRates,
}
