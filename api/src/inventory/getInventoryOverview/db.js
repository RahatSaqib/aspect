const { max, min, subDays, startOfDay, differenceInDays } = require('date-fns')
const { knex, filterDateRangeParams } = require('../../db')

const { addConstraints } = require('../../auth/constraints')

module.exports = async function (query, constraints) {
  const sixMonthsdaysBeforeToday = startOfDay(subDays(new Date(), 180))
  const now = new Date()
  if (!query?.maxDate) {
    query.maxDate = new Date()
  }
  if (!query?.minDate) {
    query.minDate = sixMonthsdaysBeforeToday
  }

  const sitesQuery = knex
    .from('Site as s')
    .leftJoin('SiteType as stype', 's.siteTypeId', 'stype.id')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('Country as co', 'g.countryId', 'co.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as l', 'g.lgaId', 'l.id')
    .leftJoin('Result as r', 'r.siteId', 's.id')
    .leftJoin('ConsumableAssay as ca', 'r.assayId', 'ca.assayId')
    .leftJoin('Assay as a', 'a.id', 'ca.assayId')
    .leftJoin('Consumable as c', 'c.id', 'ca.consumableId')
    .leftJoin('Unit as u', 'c.unit', 'u.id')
    .modify(
      filterDateRangeParams,
      { minDate: min(sixMonthsdaysBeforeToday, query.minDate), maxDate: query.maxDate },
      'r.endedOn'
    )
    .modify(addConstraints, constraints, { geography: 'g', site: 's' })
    .where('c.externalId', query.consumableExternalId)
    .orWhere('stype.externalId', 'warehouse')
    .groupBy('s.id', 'c.id')
    .select([
      's.id as id',
      'c.id as consumableId',
      's.name as lab',
      'stype.externalId as type',
      knex.raw(
        'IFNULL(SUM(CASE WHEN r.endedOn >= ? AND r.endedOn <= ? THEN ca.quantity ELSE 0 END),0) as usedLastSixMonths',
        [sixMonthsdaysBeforeToday.toISOString(), now.toISOString()]
      ),
      knex.raw(
        'IFNULL(SUM(CASE WHEN r.endedOn >= ? AND r.endedOn <= ? THEN ca.quantity ELSE 0 END),0) as usedInDateRange',
        [query.minDate.toISOString(), query.maxDate.toISOString()]
      ),
      // auxiliar fields
      'g.id as geographyId',
      'g.countryId',
      'g.stateId',
      'g.lgaId',
      knex.raw('min(r.endedOn) as firstResultDateInLastSixMonths'),
    ])
    .as('site')

  const overviewQuery = knex
    .from(sitesQuery)
    .leftJoin('InventoryItem as ii', builder => {
      builder
        .on('site.id', 'ii.siteId')
        .andOn('site.consumableId', 'ii.consumableId')
        .andOn(knex.raw('ii.inTransitFromSiteId IS NULL'))
    })
    .groupBy('site.id')
    .select([knex.raw('SUM(IFNULL(ii.quantityOnHand,0)) as quantity'), 'site.*'])

  const sites = await overviewQuery

  sites
    .filter(s => s.type !== 'warehouse')
    .forEach(site => {
      addDailyConsumptionRateInDateRange(site, query.minDate, query.maxDate)

      site.consumptionRateLastSixMonths = site.firstResultDateInLastSixMonths
        ? +(site.usedLastSixMonths / Math.min(180, differenceInDays(now, site.firstResultDateInLastSixMonths))).toFixed(
            2
          )
        : 0

      site.daysOfInventoryLeft = Math.round(site.quantity / site.consumptionRateLastSixMonths)
    })

  return sites
}

/** Adds dailyConsumptionRate to a site.
 * @param {Object} site - site object
 * @param {date} minDate - query.minDate
 * @param {date} maxDate - query.maxDate
 * @description contemplate that device could started to operate:
 * before minDate => divide by maxDate - minDate
 * between range => divide by maxDate - start of operations date
 * after maxDate => 0
 */
function addDailyConsumptionRateInDateRange(site, minDate, maxDate) {
  // contemplate that device could started to operate:
  // * before minDate => usedInDateRange divided by (maxDate - minDate)
  // * between range => usedInDateRange divided by (maxDate - start of operations date)
  // * after maxDate => 0
  const daysToDivideResultCount = differenceInDays(
    maxDate,
    max([minDate, min([site.firstResultDateInLastSixMonths, maxDate])])
  )
  site.dailyConsumptionRate =
    daysToDivideResultCount > 0 ? +(site.usedInDateRange / daysToDivideResultCount).toFixed(2) : 0
}
