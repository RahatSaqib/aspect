const _ = require('lodash')
const { knex } = require('../db')
const { getConstraints, addConstraints, canViewSites, canViewInventories } = require('../auth/constraints')
const { getUser } = require('../auth/service')
const { queryValue } = require('../shared/sql-2-knex')
const { addExtraData } = require('./options')
const knexWidgets = require('./widgets')
const resultsTransmittedDashboard = require('./resultsTransmitted')
const activityOverTimeDashboard = require('./activityOverTime')

const i18nKeys = {
  // Dashboard
  sitesTitle: 'sitesTitle',
  devicesTitle: 'devicesTitle',
  runningLowStatus: 'runningLowStatus',
  expiringStockStatus: 'expiringStockStatus',
  // Operational
  stockOutsTitle: 'stockOutsTitle',
  expiringTitle: 'expiringTitle',
  siteWithProblems: 'siteWithProblems',
  daysUnavailable: 'daysUnavailable',
  testFailures: 'testFailures',
  calibrationCompliance: 'calibrationCompliance',
  deviceWithProblems: 'deviceWithProblems',
  deviceCalibrationsUpToDate: 'deviceCalibrationsUpToDate',
}

async function getDashboardWidget({ id, partnerId }, options) {
  // const { layout, dashboard = 'home', country } = options
  const { layout, dashboard = 'home' } = options
  const tableName = layout === 'target' ? 'DashboardWidgetTarget' : 'DashboardWidgetStat'
  const widgets = knex('DashboardWidget as w')
    .innerJoin(`${tableName} as sw`, 'w.id', 'sw.dashboardWidgetId')
    .innerJoin('JobFunctionDashboardWidget as jfw', 'w.id', 'jfw.widgetId')
    .innerJoin('JobFunction as jf', 'jfw.jobFunctionId', 'jf.id')
    .innerJoin('JobContext as jc', 'jc.jobFunctionId', 'jf.id')
    .innerJoin('Person as ps', 'jc.personId', 'ps.id')
    .where({
      'ps.userId': id,
      'jf.partnerId': partnerId,
    })
    .where(function () {
      this.whereRaw(`JSON_EXTRACT(w.dashboards , '$.${dashboard}') IS NOT NULL`)

      if (dashboard === 'home') {
        this.orWhereNull('w.dashboards')
      }
    })
    .distinct(['w.*', 'sw.*'])
    .orderBy(['w.sortOrder'])
  return widgets
}

async function summaryDashboard(request) {
  const { auth, query } = request
  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const user = await getUser(auth.credentials.name)
  const { dashboard, country } = query
  const widgets = await getDashboardWidget(user, { layout: 'stat', dashboard, country })
  const data = await Promise.all(
    widgets.map(async widget => {
      const { externalId, sqlForExtra, options } = widget
      const { sqlForIndicator, sqlForStatUnit } = widget

      const unitQueryPromise = queryValue(sqlForStatUnit, dataConstraints, query, user.timezoneIANA)
      const extraQueryPromise = queryValue(sqlForExtra, dataConstraints, query, user.timezoneIANA)
      const indicatorQueryPromise =
        !sqlForIndicator && knexWidgets[externalId]
          ? Promise.resolve(knexWidgets[externalId](knex, dataConstraints) || { cnt: null }).then(
              r => r || { cnt: null }
            )
          : queryValue(sqlForIndicator, dataConstraints, query, user.timezoneIANA).then(r => r || { cnt: null })

      const [unit, extra, indicatorQueryResult] = await Promise.all([
        unitQueryPromise,
        extraQueryPromise,
        indicatorQueryPromise,
      ])

      const { cnt, ...restCountProps } = indicatorQueryResult

      widget = _.assign(_.omit(widget, ['sqlForIndicator', 'sqlForStatUnit', 'sqlForExtra', 'sortOrder']), {
        count: cnt || 0,
        unit: unit ? unit.cnt : null,
        extra: extra ? extra.cnt : null,
        ...restCountProps,
      })

      if (!_.isEmpty(options)) {
        widget.options = JSON.parse(options)
        addExtraData(widget)
      }

      return widget
    })
  )
  return { ok: true, data }
}

async function getConsumablesList(auth, dataConstraints) {
  if (!canViewInventories(auth)) {
    return []
  }

  const consumables = await knex('Consumable as c')
    .innerJoin('ConsumableAssay as ca', 'c.id', 'ca.consumableId')
    .innerJoin('Assay as a', 'ca.assayId', 'a.id')
    .innerJoin('DeviceType as dt', 'a.deviceTypeId', 'dt.id')
    .innerJoin('Device as d', 'dt.id', 'd.deviceTypeId')
    .innerJoin('Site as s', 'd.siteId', 's.id')
    .leftOuterJoin('Issue as i', function () {
      this.on('s.id', 'i.siteId').andOn('c.id', 'i.consumableId')
    })
    .leftOuterJoin('IssueType as it', 'i.issueTypeId', 'it.id')
    .leftOuterJoin('IssueStatus as ist', 'i.issueStatusId', 'ist.id')
    .modify(addConstraints, dataConstraints, {
      site: 's',
      device: 'd',
      assay: 'a',
    })
    .groupBy('c.id', 'c.externalId', 's.id')
    .select(
      's.id as siteId',
      'c.id as consumableId',
      'c.externalId as consumableExternalId',
      'c.i18nKey as i18nKey',
      'a.id as assayId',
      'c.name as consumableName',
      knex.raw(
        "sum(it.externalId = 'InventoryStockout' and ist.externalId not in ('Inactive', 'OK', 'Resolved')) as cntStockout"
      ),
      knex.raw(
        "sum(it.externalId = 'InventoryStockExpiring' and ist.externalId not in ('Inactive', 'OK', 'Resolved')) as cntExpiring"
      )
    )
  return consumables
}

async function inventoryItemDashboard(request) {
  const { auth } = request

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)
  const siteList = await getSiteList(auth, dataConstraints)
  const consumables = await getConsumablesList(auth, dataConstraints)

  const inventoryConsumableSummaryList = _.reduce(
    _.groupBy(consumables, 'consumableId'),
    (acc, list) => {
      if (!_.isEmpty(list)) {
        const { stockoutCount, expiringCount, affectedSiteIds } = list.reduce(
          (result, it) => {
            result.stockoutCount += it.cntStockout ? 1 : 0
            result.expiringCount += it.cntExpiring ? 1 : 0
            if (it.cntStockout || it.cntExpiring) {
              result.affectedSiteIds.push(it.siteId)
            }
            return result
          },
          {
            stockoutCount: 0,
            expiringCount: 0,
            affectedSiteIds: [],
          }
        )

        const result = _.filter(
          [
            // to show <SummaryItemsBlock> only when there is issue 'Stockout' add 'runningLowCount > 0 && {...'
            {
              key: 0,
              count: stockoutCount,
              titleI18nKey: i18nKeys.sitesTitle,
              subI18nKey: i18nKeys.runningLowStatus,
            },
            // to show <SummaryItemsBlock> only when there is issue 'StockExpiring' add 'expiringCount > 0 && {...'
            {
              key: 1,
              count: expiringCount,
              titleI18nKey: i18nKeys.sitesTitle,
              subI18nKey: i18nKeys.expiringStockStatus,
            },
          ],
          _.isObject
        )
        if (!_.isEmpty(result)) {
          const { consumableId, consumableName, consumableExternalId, assayId, i18nKey } = list[0]
          acc.push({
            consumableId,
            consumableExternalId,
            assayId,
            consumableName,
            i18nKey,
            data: result,
            affectedSiteIds,
          })
        }
      }
      return acc
    },
    []
  )

  const result = {
    data: {
      siteList,
      inventoryConsumableSummaryList,
    },
  }

  return result
}

async function getSiteList(auth, dataConstraints) {
  if (!canViewSites(auth)) {
    return []
  }
  const siteList = await knex('Site as s')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .modify(addConstraints, dataConstraints, {
      site: 's',
      geography: 'g',
    })
    .select('s.id', 's.name', 'st.abbreviation as stateAbbr', 's.latitude', 's.longitude')
  return siteList
}

module.exports = {
  summaryDashboard,
  inventoryItemDashboard,
  resultsTransmittedDashboard,
  activityOverTimeDashboard,
}
