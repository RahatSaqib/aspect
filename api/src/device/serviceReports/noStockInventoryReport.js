const _ = require('lodash')
const { subDays } = require('date-fns')

const { knex, filterDateRangeParams } = require('../../db')
const { getDeviceBaseExtendedQuery } = require('../common/db')
const { allDeviceMaintenanceStatusToId } = require('../../shared/dictionary')

async function getNoStockInventoryReport(dataConstraints, query) {
  const deviceMaintenanceStatusToId = await allDeviceMaintenanceStatusToId()

  if (!query.maxDate) {
    const now = new Date()
    query.maxDate = now.toISOString()
  }
  if (!query.minDate) {
    query.minDate = subDays(new Date(query.maxDate), 90).toISOString()
  }

  const deviceQuery = getDeviceBaseExtendedQuery(query, dataConstraints)
  /**
   * sub-query from Result/Assay tables to get actual assays reported for
   * this device and get their names for dynamic headers
   */
  const subResults = knex('Result as r2')
    .leftJoin('Assay as a2', 'a2.id', 'r2.assayId')
    .modify(filterDateRangeParams, query, 'r2.endedOn')
    .groupBy('r2.deviceId', 'r2.assayId')
    .select(
      'r2.deviceId',
      'r2.assayId',
      /**
       * get assay's i18nKey and abbreviation for showing in a spanned cells
       * in the table header in Excel sheet.
       */
      'a2.abbreviation as assayAbbreviation',
      'a2.i18nKey as assayI18nKey'
    )
  /**
   * sub-query from DeviceMaintenanceStatusLog to get number of days
   * explicitly set as No-Stock (i.e. inactiveOutOfInventory) for
   * this deviceId in specified date range
   */
  const subStatuses = knex('DeviceMaintenanceStatusLog')
    .modify(filterDateRangeParams, query, 'day')
    .groupBy('deviceId')
    .count({
      daysWithNoStock: knex.raw(
        `
        DISTINCT
        CASE WHEN deviceMaintenanceStatusId = ? THEN id ELSE null END
        `,
        [deviceMaintenanceStatusToId.inactiveOutOfInventory]
      ),
    })
    .select('deviceId')

  const devicesRaw = await deviceQuery
    .clone()
    .leftJoin('ConsumableAssay as ca', 'ca.assayId', 'a.id')
    .leftJoin('Consumable as c', 'c.id', 'ca.consumableId')
    .leftJoin('FactInventoryConsumptionRate as ficr', function () {
      this.on('ficr.siteId', 's.id').on('ficr.consumableId', 'c.id').on('ficr.days', 1)
    })
    .leftJoin('Assay as a2', 'a2.id', 'ca.assayId')
    .leftJoin('InventoryItem as ii', function () {
      this.on('ii.siteId', 's.id')
        .on('ii.consumableId', 'c.id')
        .onNull('ii.inTransitFromSiteId')
        .onNotNull('ii.quantityOnHand')
        .onNotNull('ii.expiresOn')
        .on(knex.raw(`ii.expiresOn >= '${query.maxDate}'`))
    })
    .leftJoin(subResults.as('subR'), function () {
      this.on('subR.deviceId', 'd.id').on('subR.assayId', 'a2.id')
    })
    .leftJoin(subStatuses.as('dmsl'), 'dmsl.deviceId', 'd.id')
    .where('dc.hasResults', true)
    .groupBy('d.id', 'c.id')
    .select({
      deviceId: 'd.id',
      deviceName: 'd.name',
      siteName: 's.name',
      stateName: 'st.name',
      assayId: 'subR.assayId',
      consumableId: 'c.id',

      stockLastChangedOn: knex.raw(
        '(select max(ilog.createdOn) from InventoryLog as ilog where ilog.siteId = s.id and ilog.consumableId = c.id)'
      ),
      daysWithNoStock: 'dmsl.daysWithNoStock',
      /**
       * sum of all quantityOnHand's from items with expiresOn greater than maxDate
       * (see `on` conditions in left-join above)
       */
      quantityOnHand: knex.raw(`sum( ifnull(ii.quantityOnHand, 0) )`),
    })

  let allConsumables = await knex('Consumable').select('id', 'name', 'externalId', 'i18nKey')
  allConsumables = _.reduce(allConsumables, (acc, it) => ({ ...acc, [it.id]: it }), {})

  /**
   * construct structure with all needed data
   * {
   *    [deviceId]: {
   *      ...device props,
   *      consumables: {
   *        [consumableId]: {
   *          quantityOnHand,
   *          stockLastChangedOn,
   *        },
   *        ...
   *      },
   *    },
   *    ...
   * }
   */
  const devicesById = _.reduce(
    devicesRaw,
    (acc, it) => {
      const { deviceId, deviceName, siteName, consumableId, stockLastChangedOn, quantityOnHand, daysWithNoStock } = it
      acc[deviceId] = acc[deviceId] || {
        deviceId,
        deviceName,
        siteName,
        daysWithNoStock,
        consumables: {},
      }

      if (consumableId) {
        const item = acc[deviceId]
        item.consumables[consumableId] = item.consumables[consumableId] || {
          quantityOnHand,
          stockLastChangedOn,
        }
      }

      return acc
    },
    {}
  )
  /**
   * from above structure `devicesById` get plain list of `data` and
   * array of `dynamicColumns`
   */
  let dynamicColumns = {}
  const data = _.reduce(
    _.keys(devicesById),
    (acc, deviceId) => {
      const { deviceName, siteName, consumables, daysWithNoStock } = devicesById[deviceId] || {}
      const item = {
        deviceId,
        deviceName,
        siteName,
        daysWithNoStock,
      }
      _.keys(consumables).forEach(consumableId => {
        const fieldCurrentQuantity = `currentQuantity_${consumableId}`
        const fieldLastStockChangedOn = `lastStockChangedOn_${consumableId}`
        dynamicColumns[consumableId] = dynamicColumns[consumableId] || {
          header: allConsumables[consumableId]?.name,
          subHeaders: [
            {
              key: fieldCurrentQuantity,
              text: 'Current Quantity**',
              style: { width: 14 },
            },
            {
              key: fieldLastStockChangedOn,
              text: 'Last Stock Changed On',
              style: { width: 14 },
            },
          ],
        }

        item[fieldCurrentQuantity] = consumables[consumableId].quantityOnHand
        item[fieldLastStockChangedOn] = consumables[consumableId].stockLastChangedOn
      })

      acc = [...acc, item]
      return acc
    },
    []
  )
  dynamicColumns = _.reduce(
    _.keys(dynamicColumns),
    (acc, consumableId) => {
      acc = [...acc, dynamicColumns[consumableId]]
      return acc
    },
    []
  )

  return {
    data: _.orderBy(data, ['deviceName'], ['asc']),
    dynamicColumns,
  }
}

module.exports = {
  getNoStockInventoryReport,
}
