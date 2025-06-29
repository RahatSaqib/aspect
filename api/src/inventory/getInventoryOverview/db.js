const { max, min, subDays, subYears, startOfDay, differenceInDays, parseISO } = require('date-fns')
const { knex, filterDateRangeParams } = require('../../db')
const { getUnreconciledQuantitiesSubquery } = require('../common/db')
const { addConstraints } = require('../../auth/constraints')
const { SITE_TYPE_EXTERNAL_IDS } = require('../../shared/constants')

module.exports = async function (query, constraints) {
  const sixMonthsBeforeToday = startOfDay(subDays(new Date(), 180))
  const now = new Date()
  if (!query?.maxDate) {
    query.maxDate = new Date()
  }
  if (!query?.minDate) {
    query.minDate = startOfDay(subYears(new Date(), 5))
  }

  const { id: consumableId } = await knex('Consumable').where('externalId', query.consumableExternalId).first()

  const overviewQuery = knex
    .from(
      knex
        .from('Site as s')
        .leftJoin('SiteType as stype', 's.siteTypeId', 'stype.id')
        .leftJoin('Geography as g', 's.geographyId', 'g.id')
        .leftJoin('Result as r', 'r.siteId', 's.id')
        .leftJoin('ConsumableAssay as ca', 'r.assayId', 'ca.assayId')
        .leftJoin('Assay as a', 'a.id', 'ca.assayId')
        .leftJoin('Consumable as c', 'c.id', 'ca.consumableId')
        .leftJoin('Unit as u', 'c.unit', 'u.id')
        .where(r =>
          r
            .whereNull('r.id')
            .orWhere(r2 =>
              r2.modify(filterDateRangeParams, { minDate: query.minDate, maxDate: query.maxDate }, 'r.endedOn')
            )
        )
        .modify(addConstraints, constraints, { geography: 'g', site: 's' })
        .where(q => q.where('c.id', consumableId).orWhereNull('c.externalId'))
        .groupBy('s.id', 'c.id')
        .select([
          's.id as id',
          'c.id as consumableId',
          'ca.assayId as assayId',
          's.name as lab',
          'stype.externalId as type',
          's.parentWarehouseId as parentWarehouseId',
          knex.raw(
            'IFNULL(SUM(CASE WHEN r.endedOn BETWEEN ? AND ? THEN ca.quantity ELSE 0 END),0) as usedLastSixMonths',
            [sixMonthsBeforeToday.toISOString(), now.toISOString()]
          ),
          knex.raw(
            'IFNULL(SUM(CASE WHEN r.endedOn BETWEEN ? AND ? THEN ca.quantity ELSE 0 END),0) as usedInDateRange',
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
    )
    .join('ConsumableAssay as ca', 'ca.consumableId', consumableId)
    .leftJoin('InventoryItem as ii', builder => {
      builder
        .on('site.id', 'ii.siteId')
        .andOn(knex.raw('ii.inTransitFromSiteId IS NULL'))
        .andOn('ii.consumableId', consumableId)
    })
    .groupBy('site.id', 'site.lab', 'site.type', 'site.geographyId', 'site.countryId', 'site.stateId', 'site.lgaId')
    .select([
      knex.raw('SUM(IFNULL(ii.quantityOnHand,0)) as quantity'),
      'site.id',
      'site.lab',
      'site.type',
      'site.geographyId',
      'site.countryId',
      'site.stateId',
      'site.lgaId',
      'site.assayId',
      'site.parentWarehouseId',
      knex.raw('SUM(IFNULL(site.usedLastSixMonths,0)) as usedLastSixMonths'),
      knex.raw('SUM(IFNULL(site.usedInDateRange,0)) as usedInDateRange'),
      knex.raw('MIN(IFNULL(site.firstResultDateInLastSixMonths,0)) as firstResultDateInLastSixMonths'),
    ])

  // Add unreconciled quantities
  const unreconciledQuantitiesSubquery = getUnreconciledQuantitiesSubquery('uq')

  overviewQuery
    .leftJoin(unreconciledQuantitiesSubquery, function () {
      this.on('site.id', 'uq.siteId').andOn('ca.assayId', 'uq.assayId')
    })
    .select('uq.unreconciledQuantity')

  const sites = await overviewQuery

  sites
    .filter(s => s.type !== SITE_TYPE_EXTERNAL_IDS.WAREHOUSE)
    .forEach(site => {
      addDailyConsumptionRateInDateRange(site, query.minDate, query.maxDate)

      site.consumptionRateLastSixMonths = site.firstResultDateInLastSixMonths
        ? +(
            site.usedLastSixMonths / Math.min(180, differenceInDays(now, parseISO(site.firstResultDateInLastSixMonths)))
          ).toFixed(2)
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
    max([minDate, min([parseISO(site.firstResultDateInLastSixMonths), maxDate])])
  )
  site.dailyConsumptionRate =
    daysToDivideResultCount > 0 ? +(site.usedInDateRange / daysToDivideResultCount).toFixed(2) : 0
}
