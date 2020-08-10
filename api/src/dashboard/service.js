const _ = require('lodash')
const addDays = require('date-fns/addDays')
const parseISO = require('date-fns/parseISO')
const subDays = require('date-fns/subDays')
const isAfter = require('date-fns/isAfter')
const isWeekend = require('date-fns/isWeekend')
const differenceInDays = require('date-fns/differenceInDays')
const subMonths = require('date-fns/subMonths')
const formatDate = require('date-fns/format')
const { knex, filterParams } = require('../db')
const {
  getConstraints,
  addConstraints,
  canViewSites,
  canViewDevices,
  canViewResults,
  canViewInventories,
  canEditInventories,
} = require('../auth/constraints')
const { getUser, hasPermissions } = require('../auth/service')
const { processDynamicMessage } = require('../stringTemplate/service')
const { getArrayOfDaysInRange } = require('../shared/date')
const { queryValue } = require('../shared/sql-2-knex')
const { canView } = require('../auth/constraints')
const { allMessageStatusToId } = require('../shared/dictionary')

const i18nKeys = {
  // Dashboard
  sitesTitle: 'sitesTitle',
  devicesTitle: 'devicesTitle',
  runningLowStatus: 'runningLowStatus',
  expiringStockStatus: 'expiringStockStatus',
  fullyOperationalStatus: 'fullyOperationalStatus',
  notReportingStatus: 'notReportingStatus',
  warrantyExpiringStatus: 'warrantyExpiringStatus',
  needCalibrationStatus: 'needCalibrationStatus',
  highFailuresRatesStatus: 'highFailuresRatesStatus',
  reportingStatus: 'reportingStatus',
  withStockIssues: 'withStockIssues',
  withDeviceIssues: 'withDeviceIssues',
  withQualityIssues: 'withQualityIssues',
  ofTotalDevicesTitle: 'ofTotalDevicesTitle',
  ofTotalSitesTitle: 'ofTotalSitesTitle',
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
  const { layout, dashboard = 'home' } = options
  const tableName =
    layout === 'target' ? 'DashboardWidgetTarget' : 'DashboardWidgetStat'
  const widgets = knex('DashboardWidget as w')
    .innerJoin(`${tableName} as sw`, 'w.id', 'sw.dashboardWidgetId')
    .innerJoin('JobFunctionDashboardWidget as jfw', 'w.id', 'jfw.widgetId')
    .innerJoin('JobFunction as jf', 'jfw.jobFunctionId', 'jf.id')
    .innerJoin('Job as j', 'j.jobFunctionId', 'jf.id')
    .innerJoin('Person as ps', 'j.personId', 'ps.id')
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
    .select(['w.*', 'sw.*'])
    .orderBy(['w.sortOrder'])
  return widgets
}

function getWidgetLink(widget, auth) {
  const linkParts = widget.link ? widget.link.split('/') : []
  if (
    linkParts.length === 3 &&
    linkParts[1] === 'browse' &&
    (!canView(auth, `${linkParts[2]}:`) || !canView(auth, 'browse:'))
  ) {
    return null
  }
  return widget.link
}

async function summaryDashboard(request) {
  const { auth, query } = request
  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const user = await getUser(auth.credentials.name)
  const { dashboard } = query
  const widgets = await getDashboardWidget(user, { layout: 'stat', dashboard })
  const data = await Promise.all(
    widgets.map(async widget => {
      widget.link = getWidgetLink(widget, request.auth)

      const count = await queryValue(
        widget.sqlForIndicator,
        dataConstraints,
        query
      )
      const unit = await queryValue(
        widget.sqlForStatUnit,
        dataConstraints,
        query
      )
      const extra = await queryValue(widget.sqlForExtra, dataConstraints, query)
      return _.assign(
        _.omit(widget, [
          'sqlForIndicator',
          'sqlForStatUnit',
          'sqlForExtra',
          'sortOrder',
        ]),
        {
          count: count ? count.cnt : 0,
          unit: unit ? unit.cnt : null,
          extra: extra ? extra.cnt : null,
        }
      )
    })
  )
  return { ok: true, data }
}

async function targetDashboard(request) {
  const { auth, query } = request
  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const user = await getUser(auth.credentials.name)
  const widgets = await getDashboardWidget(user, { layout: 'target' })

  let targetDivide = 1

  const days = differenceInDays(query.maxDate, query.minDate)

  if (days <= 35) {
    targetDivide = 12
  } else if (days <= 150) {
    targetDivide = 4
  }

  const data = await Promise.all(
    widgets.map(async widget => {
      const count = await queryValue(
        widget.sqlForIndicator,
        dataConstraints,
        query
      )

      const target = await knex('Target as t')
        .innerJoin('Geography as g', 't.geographyId', 'g.id')
        .where({ 't.targetToken': widget.targetToken })
        .modify(addConstraints, dataConstraints, {
          geography: 'g',
        })
        .sum('t.targetValue as cnt')
        .first()

      const dataCollection = await queryValue(
        widget.sqlForDataCollection,
        dataConstraints,
        query
      )

      return _.assign(
        _.pick(widget, [
          'id',
          'title',
          'thresholdPercentageDataCollection',
          'link',
        ]),
        {
          count: count ? count.cnt : 0,
          target: target ? Math.round(target.cnt / targetDivide) : 0,
          dataCollection: dataCollection ? dataCollection.cnt : 0,
        }
      )
    })
  )
  return { ok: true, data }
}

async function resultDashboard(request) {
  const { auth } = request

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const siteQuery = knex('Site as s')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .select(
      's.id',
      's.name',
      'st.abbreviation as stateAbbr',
      's.latitude',
      's.longitude'
    )
    .modify(addConstraints, dataConstraints, {
      site: 's',
      geography: 'g',
    })
  const [siteList, resultCnt, assayTypes] = await Promise.all(
    canViewResults(auth)
      ? [
          canViewSites(auth) ? siteQuery : [],
          knex('FactResultsDeviceByCategory1 as f')
            .innerJoin('Device as d', 'd.id', 'f.deviceId')
            .innerJoin('Site as s', 's.id', 'd.siteId')
            .innerJoin('Assay as a', 'a.id', 'f.assayId')
            .innerJoin('ResultCategory as rc', 'rc.id', 'f.resultCategory1')
            .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
            .modify(addConstraints, dataConstraints, {
              device: 'd',
              site: 's',
              geography: 'g',
              assay: 'a',
            })
            .groupBy('rc.externalId', 'a.assayTypeId', 'd.siteId')
            .select(
              'rc.externalId as resultCategory1ExternalId',
              'a.assayTypeId',
              'd.siteId'
            )
            .sum('f.resultCount as cnt'),
          knex('AssayType as at')
            .innerJoin('Assay as a', 'at.id', 'a.assayTypeId')
            .leftJoin('ResultCategoryAssay as rca', 'a.id', 'rca.assayId')
            .innerJoin('ResultCategory as rc', 'rca.resultCategoryId', 'rc.id')
            .modify(addConstraints, dataConstraints, {
              assayType: 'at',
              assay: 'a',
            })
            .groupBy('at.id')
            .select(
              'at.id',
              'at.name as assayTypeName',
              knex.raw(
                'GROUP_CONCAT(rc.externalId) as rawResultCategoryExternalIds'
              ),
              knex.raw('GROUP_CONCAT(rc.name) as rawResultCategoryNames')
            ),
        ]
      : [[], [], []]
  )
  const resultCntBySiteIdByAssayTypeId = _.mapValues(
    _.groupBy(resultCnt, 'assayTypeId'),
    it => _.groupBy(it, 'siteId')
  )
  const resultCntBySiteId = _.groupBy(resultCnt, 'siteId')
  siteList.forEach(it =>
    _.set(it, 'count', _.sum(_.map(resultCntBySiteId[it.id], 'cnt')))
  )

  const resultSummaryList = assayTypes
    .map(
      ({
        id,
        assayTypeName,
        rawResultCategoryExternalIds,
        rawResultCategoryNames,
      }) => {
        const resultCategoryExternalIds = _.uniq(
          rawResultCategoryExternalIds.split(',')
        )
        const resultCategoryNames = _.uniq(rawResultCategoryNames.split(','))
        const data = _.sortBy(
          _.map(resultCntBySiteIdByAssayTypeId[`${id}`], (it, siteId) =>
            _.reduce(
              it,
              (acc, { resultCategory1ExternalId, cnt }) => {
                acc[resultCategory1ExternalId] = cnt
                acc.total += cnt
                return acc
              },
              _.reduce(
                resultCategoryExternalIds,
                (acc, name) => {
                  acc[name] = 0
                  return acc
                },
                { siteId, total: 0 }
              )
            )
          ),
          it => -1 * it.total
        )

        return {
          assayTypeName,
          data,
          resultCategories: _.zipWith(
            resultCategoryExternalIds,
            resultCategoryNames,
            (externalId, name) => ({
              externalId,
              name,
            })
          ),
        }
      }
    )
    .filter(({ data }) => !_.isEmpty(data))

  const result = {
    data: {
      siteList,
      resultSummaryList,
    },
  }

  return result
}

async function getInventoryItemList(auth, dataConstraints) {
  if (!canViewInventories(auth)) {
    return []
  }
  const inventoryItemList = await knex('InventoryItem as ii')
    .innerJoin('Site as s', 'ii.siteId', 's.id')
    .innerJoin('Geography as g', 's.geographyId', 'g.id')
    .innerJoin('Country as co', 'g.countryId', 'co.id')
    .innerJoin('Consumable as c', 'ii.consumableId', 'c.id')
    .modify(addConstraints, dataConstraints, {
      site: 's',
      geography: 'g',
    })
    .select(
      'co.inventoryDaysThreshold',
      'ii.id',
      'ii.expiresOn',
      'ii.quantityOnHand',
      'ii.siteId',
      'ii.consumableId',
      'c.name as consumableName'
    )

  const MOCK_CURRENT_CONSUMPTION_RATE = 20

  inventoryItemList.forEach(it => {
    it.runningLow =
      it.quantityOnHand <=
      it.inventoryDaysThreshold * MOCK_CURRENT_CONSUMPTION_RATE
    it.remainingDays = Math.floor(
      it.quantityOnHand / MOCK_CURRENT_CONSUMPTION_RATE
    )
    if (_.isDate(it.expiresOn)) {
      it.expiring = isAfter(
        addDays(parseISO(it.expiresOn), it.remainingDays),
        it.expiresOn
      )
    }
  })

  return inventoryItemList
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
    .groupBy('c.id', 's.id')
    .select(
      's.id as siteId',
      'c.id as consumableId',
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
          const { consumableId, consumableName } = list[0]
          acc.push({
            consumableId,
            consumableName,
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
    .select(
      's.id',
      's.name',
      'st.abbreviation as stateAbbr',
      's.latitude',
      's.longitude'
    )
  return siteList
}

async function getDeviceList(auth, dataConstraints) {
  if (!canViewDevices(auth)) {
    return []
  }

  const deviceList = await knex('Device as d')
    .innerJoin('Site as s', 's.id', 'd.siteId')
    .innerJoin('Partner as p', 'd.partnerId', 'p.id')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceTypeCategory as dtc', 'dt.deviceTypeCategoryId', 'dtc.id')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('Issue as i', 'd.id', 'i.deviceId')
    .leftOuterJoin('IssueType as it', 'i.issueTypeId', 'it.id')
    .leftOuterJoin('IssueStatus as ist', 'i.issueStatusId', 'ist.id')
    .whereIn('dtc.name', ['Lab', 'Integrated'])
    .modify(addConstraints, dataConstraints, {
      site: 's',
      geography: 'g',
      device: 'd',
      deviceType: 'dt',
    })
    .groupBy('d.id')
    .select(
      'd.id',
      'd.siteId',
      'it.externalId as issueType',
      knex.raw(
        "sum(ist.externalId not in ('Inactive', 'OK', 'Resolved')) as totalIssues"
      ),
      knex.raw(
        "sum((it.externalId = 'DeviceNoResults' or it.externalId = 'DeviceOffline') and ist.externalId not in ('Inactive', 'OK', 'Resolved')) as cntNoResults"
      ),
      knex.raw(
        "sum((it.externalId like 'Machine%' or it.externalId like 'Module%' or it.externalId like 'Reagent%') and ist.externalId not in ('Inactive', 'OK', 'Resolved')) as cntErrorRate"
      )
    )
    .then(items =>
      items.reduce(
        (memo, { id, siteId, totalIssues, cntNoResults, cntErrorRate }) => {
          let device = memo.find(x => x.id === id)
          if (!device) {
            device = {
              id,
              siteId,
              // Fully Operational = Devices that don't have any issues or all are OK/Resolved
              fullyOperational: true,
              // Not Reporting = Devices that have issue "Device No Results"
              offline: false,
              // High Failure rates = Devices that have any of the Machine/Module/Reagent/Unknown error
              errorRate: false,
            }
            memo.push(device)
          }

          if (totalIssues) {
            device.fullyOperational = false
          }

          if (cntNoResults) {
            device.offline = true
          }

          if (cntErrorRate) {
            device.errorRate = true
          }

          return memo
        },
        []
      )
    )

  return deviceList
}

async function deviceDashboard(request) {
  const { auth } = request

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const siteList = await getSiteList(auth, dataConstraints)
  const deviceList = await getDeviceList(auth, dataConstraints)

  const siteById = _.keyBy(siteList, 'id')
  _.forEach(deviceList, it => {
    const site = siteById[it.siteId]
    it.stateAbbr = site.stateAbbr
    it.latitude = site.latitude
    it.longitude = site.longitude
  })

  const operationalDeviceList = _.filter(deviceList, 'fullyOperational')
  const offlineDeviceList = _.filter(deviceList, 'offline')
  const highErrorRateDeviceList = _.filter(deviceList, 'errorRate')

  const deviceSummaryMap = {
    operational: {
      deviceIds: _.map(operationalDeviceList, 'id'),
      siteIds: _.uniq(_.map(operationalDeviceList, 'siteId')),
      items: [
        {
          key: 0,
          count: operationalDeviceList.length,
          total: deviceList.length,
          titleI18nKey: i18nKeys.ofTotalDevicesTitle,
          subI18nKey: i18nKeys.fullyOperationalStatus,
        },
      ],
    },
    uploadingData: {
      deviceIds: _.map(offlineDeviceList, 'id'),
      siteIds: _.uniq(_.map(offlineDeviceList, 'siteId')),
      items: [
        {
          key: 0,
          count: offlineDeviceList.length,
          titleI18nKey: i18nKeys.devicesTitle,
          subI18nKey: i18nKeys.notReportingStatus,
        },
      ],
    },
    testFailures: {
      deviceIds: _.map(highErrorRateDeviceList, 'id'),
      siteIds: _.uniq(_.map(highErrorRateDeviceList, 'siteId')),
      items: [
        {
          key: 0,
          count: highErrorRateDeviceList.length,
          titleI18nKey: i18nKeys.devicesTitle,
          subI18nKey: i18nKeys.highFailuresRatesStatus,
        },
      ],
    },
  }

  const result = {
    data: {
      deviceList,
      deviceSummaryMap,
    },
  }

  return result
}

async function siteDashboard(request) {
  const { auth } = request

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const siteList = await getSiteList(auth, dataConstraints)
  const assayResultCategoryList = await getAssayResultCategoryList(
    dataConstraints
  )
  const deviceList = await getDeviceList(auth, dataConstraints)
  const inventoryItemList = await getInventoryItemList(auth, dataConstraints)

  const filteredLength = _.flowRight(_.size, _.filter)
  const siteIdAccumulator = (acc, it, siteId) => {
    if (it) {
      acc.push(siteId)
    }
    return acc
  }

  const allDeviceOnlineBySiteId = _.mapValues(
    _.groupBy(deviceList, 'siteId'),
    list => _.every(list, { offline: false })
  )
  const allDeviceOnlineSiteIds = _.reduce(
    allDeviceOnlineBySiteId,
    siteIdAccumulator,
    []
  )

  const anyStockIssueBySiteId = _.mapValues(
    _.groupBy(inventoryItemList, 'siteId'),
    list =>
      _.some(
        list,
        it => it.runningLow || it.expiring || it.quantityOnHand === 0
      )
  )
  const anyStockIssueSiteIds = _.reduce(
    anyStockIssueBySiteId,
    siteIdAccumulator,
    []
  )

  const oneDeviceOfflineBySiteId = _.mapValues(
    _.groupBy(deviceList, 'siteId'),
    list => filteredLength(list, 'offline') === 1
  )
  const oneDeviceOfflineSiteIds = _.reduce(
    oneDeviceOfflineBySiteId,
    siteIdAccumulator,
    []
  )

  const anyDeviceWithIssueBySiteId = _.mapValues(
    _.groupBy(_.uniqBy(deviceList, 'siteId'), 'siteId'),
    list => _.every(list, { fullyOperational: false })
  )

  const sitesWithIssueSiteIds = _.sortedUniq(
    _.reduce(anyDeviceWithIssueBySiteId, siteIdAccumulator, []),
    'siteId'
  )

  const siteSummaryMap = {
    onlineNow: {
      siteIds: allDeviceOnlineSiteIds,
      items: [
        {
          key: 0,
          count: allDeviceOnlineSiteIds.length,
          total: siteList.length,
          titleI18nKey: i18nKeys.ofTotalSitesTitle,
          subI18nKey: i18nKeys.reportingStatus,
        },
      ],
    },
    stockManagement: {
      siteIds: anyStockIssueSiteIds,
      items: [
        {
          key: 0,
          count: anyStockIssueSiteIds.length,
          titleI18nKey: i18nKeys.sitesTitle,
          subI18nKey: i18nKeys.withStockIssues,
        },
      ],
    },
    deviceManagement: {
      siteIds: sitesWithIssueSiteIds,
      items: [
        {
          key: 0,
          count: sitesWithIssueSiteIds.length /* TODO: ASP-520 */,
          titleI18nKey: i18nKeys.sitesTitle,
          subI18nKey: i18nKeys.withDeviceIssues,
        },
      ],
    },
    uploadingData: {
      siteIds: oneDeviceOfflineSiteIds,
      items: [
        {
          key: 0,
          count: oneDeviceOfflineSiteIds.length,
          titleI18nKey: i18nKeys.sitesTitle,
          subI18nKey: i18nKeys.notReportingStatus,
        },
      ],
    },
  }

  const result = {
    data: {
      assayResultCategoryList,
      siteList,
      siteSummaryMap,
    },
  }

  return result
}

async function actionDashboard(request) {
  const { auth, query } = request
  const user = await getUser(auth.credentials.name)
  const dataConstraints = await getConstraints(
    auth.credentials,
    'actionDashboard'
  )

  const alertMessages = await knex('AlertMessage as am')
    .join('MessageStatus as ms', 'am.messageStatusId', 'ms.id')
    .join('Notification as n', 'am.id', 'n.alertMessageId')
    .join('NotificationType as nt', 'n.notificationTypeId', 'nt.id')
    .join('JobFunction as jf', 'nt.jobFunctionId', 'jf.id')
    .join('Issue as i', 'n.issueId', 'i.id')
    .join('IssueType as it', 'i.issueTypeId', 'it.id')
    .join('IssueCategory as ic', 'it.issueCategoryId', 'ic.id')
    .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
    .join('IssueStatusSeverity as iss', 'is.issueStatusSeverityId', 'iss.id')
    .join('Site as s', 'am.siteId', 's.id')
    .leftJoin('Device as d', function () {
      this.on('am.deviceId', '=', 'd.id').onNotIn('it.externalId', [
        'StockLevelUpdate',
        'InventoryStockout',
        'InventoryStockExpiring',
      ])
    })
    .leftJoin('AlertTemplate as at', 'am.alertTemplateId', 'at.id')
    .leftJoin('IssueStatusLog as isl', function () {
      this.on('i.id', 'isl.issueId').andOn('is.id', 'isl.issueStatusId')
    })
    .whereNotIn('is.externalId', ['Inactive', 'Resolved'])
    .andWhere('ms.externalId', 'Sent')
    .modify(addConstraints, dataConstraints, {
      site: 's',
      person: 'am',
      jobFunction: 'jf',
      allowAdminThrough: true,
    })
    .andWhere(function () {
      if (query.siteId) {
        this.where('hideWhenSiteFilterIsSelected', false).andWhere({
          'am.siteId': query.siteId,
        })
      } else {
        this.where('hideWhenSiteFilterIsNotSelected', false)
      }
    })
    .groupBy('am.id')
    .select(
      'am.id',
      'am.siteId',
      'am.deviceId',
      'am.resultId',
      'am.message',
      'am.personId',
      's.name as siteName',
      'd.name as deviceName',
      'i.id as issueId',
      'is.name as status',
      'is.i18nKey as statusI18nKey',
      'is.sortOrder as issueStatusSortOrder',
      'iss.externalId as issueStatusSeverityExternalId',
      'it.name as issueType',
      'it.externalId as issueTypeExternalId',
      'it.i18nKey as issueTypeI18nKey',
      'ic.externalId as issueCategory',
      'ic.i18nKey as issueCategoryI18nKey',
      'nt.name as notificationType',
      'nt.level as notificationTypeLevel',
      'nt.canAcknowledge',
      knex.raw('max(isl.changedOn) as statusDate'),
      'i.consumableId'
    )

  const alertMessagesByIssue = _.map(
    _.values(_.groupBy(alertMessages, 'issueId')),
    issueMessages => {
      const highestLevelMessage = _.head(
        _.orderBy(issueMessages, 'notificationTypeLevel', 'desc')
      )
      highestLevelMessage.message = processDynamicMessage(
        highestLevelMessage.message
      )
      if (
        highestLevelMessage.canAcknowledge &&
        highestLevelMessage.personId !== user.personId
      ) {
        highestLevelMessage.canAcknowledge = 0
      }
      return highestLevelMessage
    }
  )
  const shouldAddStockLevelUpdateActions = await hasPermissions(auth, [
    'dashboard:actionInventoryLevelUpdate',
  ])

  if (shouldAddStockLevelUpdateActions) {
    await addStockLevelUpdateActions(
      auth,
      dataConstraints,
      alertMessagesByIssue,
      query.siteId
    )
  }

  const allActionByCategory = _.flowRight(
    x => _.groupBy(x, 'issueCategory'),
    query.sortDir === 'desc' ? _.reverse : _.identity,
    x => _.sortBy(x, query.sortCol || _.identity)
  )(alertMessagesByIssue)

  const result = {
    ok: true,
    data: allActionByCategory,
  }

  return result
}

async function addStockLevelUpdateActions(
  auth,
  dataConstraints,
  actionDashboardAlertMessages,
  siteId = null
) {
  const inventoryCutoff = subDays(new Date(), 30)
  let inventoryOutdated = false

  if (canViewInventories(auth)) {
    const { id: assayId } = await knex('Assay')
      .where('externalId', 'GxMtbRif')
      .first('id')

    const inventoryItems = await knex('Site as s')
      .join('ConsumableAssay as ca', 'ca.assayId', assayId)
      .join('Consumable as c', 'c.id', 'ca.consumableId')
      .join('PartnerConsumable as pc', 'ca.consumableId', 'pc.consumableId')
      .leftJoin('InventoryItem as ii', function () {
        this.on('ii.siteId', 's.id').andOn('ii.consumableId', 'c.id')
      })
      .modify(queryBuilder => {
        addConstraints(queryBuilder, dataConstraints, { site: 's' })
        if (siteId) {
          queryBuilder.where({ 's.id': siteId })
        }
      })
      .where({
        'pc.partnerId': dataConstraints.partner.id,
        'pc.allowStockUpdateFromActionDashboard': true,
      })
      .groupBy('s.id', 'c.id')
      .distinct(
        's.id as siteId',
        's.name as siteName',
        'c.id as consumableId',
        knex.raw('max(ii.updatedOn) as updatedOn'),
        knex.raw('sum(coalesce(ii.quantityOnHand, 0)) as totalInStock')
      )

    // set consumable id, totalIn Stock on StockInHand issues
    const inventoryItemsBySite = _.groupBy(inventoryItems, 'siteId')
    _.forEach(actionDashboardAlertMessages, alertMessage => {
      alertMessage.canEdit = false
      if (alertMessage.issueTypeExternalId === 'StockLevelUpdate') {
        alertMessage.canEdit = canEditInventories(auth)
        if (alertMessage.siteId && inventoryItemsBySite[alertMessage.siteId]) {
          const [inventoryItem] = inventoryItemsBySite[alertMessage.siteId]
          if (inventoryItem) {
            alertMessage.totalInStock = inventoryItem.totalInStock
            alertMessage.consumableId = inventoryItem.consumableId
            inventoryOutdated = inventoryItem.updatedOn
              ? inventoryItem.updatedOn < inventoryCutoff
              : false
          } else {
            alertMessage.totalInStock = 0
            alertMessage.consumableId = null
            inventoryOutdated = false
          }
          delete inventoryItemsBySite[alertMessage.siteId]
        }
        if (alertMessage.totalInStock <= 0 || inventoryOutdated) {
          alertMessage.status = 'Active'
          alertMessage.statusI18nKey = 'issueStatusActive'
          alertMessage.issueStatusSortOrder = 0
          alertMessage.issueStatusSeverityExternalId = 'High'
        } else {
          alertMessage.status = 'OK'
          alertMessage.statusI18nKey = 'issueStatusOk'
          alertMessage.issueStatusSortOrder = 5
          alertMessage.issueStatusSeverityExternalId = 'Low'
        }
      }
    })
    // Add consumables by site that aren't in issues
    _.forEach(
      inventoryItemsBySite,
      ([{ siteId, siteName, totalInStock, consumableId }]) => {
        actionDashboardAlertMessages.push({
          // ID is needed in UI to distinguish table rows
          id: `inventoryLevelUpdate_${consumableId}_${siteId}`,
          siteId,
          deviceId: null,
          resultId: null,
          message: 'Stock Level', // TODO: i18n this message
          siteName,
          deviceName: null,
          issueId: null,
          status: totalInStock <= 0 ? 'Active' : 'OK',
          statusI18nKey:
            totalInStock <= 0 ? 'issueStatusActive' : 'issueStatusOk',
          issueStatusSortOrder: totalInStock <= 0 ? 0 : 5,
          issueStatusSeverityExternalId: totalInStock <= 0 ? 'High' : 'Low',
          statusDate: new Date(),
          issueType: 'Stock Level Update',
          issueTypeExternalId: 'StockLevelUpdate',
          issueTypeI18nKey: 'stockLevelUpdateIssue',
          issueCategory: 'ReagentHealth',
          issueCategoryI18nKey: 'issueCategoryReagentHealth',
          canAcknowledge: 0,
          canEdit: canEditInventories(auth),
          totalInStock,
          consumableId,
          personId: dataConstraints.person.id,
        })
      }
    )
  }
}

async function getAssayResultCategoryList(dataConstraints) {
  const assayResultCategory = await knex('ResultCategoryAssay as rca')
    .innerJoin('Assay as a', 'a.id', 'rca.assayId')
    .innerJoin('AssayType as at', 'at.id', 'a.assayTypeId')
    .innerJoin('ResultCategory as rc', 'rca.resultCategoryId', 'rc.id')
    .modify(addConstraints, dataConstraints, {
      assay: 'a',
      assayType: 'at',
    })
    .where('rca.requiresTreatment', 1)
    .groupBy('at.id', 'at.name', 'rc.name')
    .orderBy('at.name', 'rc.name')
    .select(
      knex.raw(`CONCAT(at.id,'-',rc.id) as id`),
      knex.raw(`CONCAT(at.name,': ',rc.name) as name`)
    )

  return assayResultCategory
}

async function operationalDataActivityOverTime(request) {
  const { auth, query } = request
  const dataConstraints = await getConstraints(auth.credentials)

  // build up array of days in date range. makes querying easier:
  const days = getArrayOfDaysInRange(query.minDate, query.maxDate, {
    devicesActive: 0,
    devicesInactive: 0,
    devicesTotal: 0,
  })

  // now, get all device IDs that user has access to (much better performance in following queries)
  const deviceIds = (
    await knex('Device as d')
      .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
      .join('DeviceTypeCategory as dtc', 'dt.deviceTypeCategoryId', 'dtc.id')
      .join('Site as s', 'd.siteId', 's.id')
      .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
      .whereIn('dtc.name', ['Lab', 'Integrated', 'Information System'])
      .where('dt.externalId', 'CepheidGeneXpert')
      .modify(addConstraints, dataConstraints, {
        site: 's',
        device: 'd',
      })
      .select('d.id')
  ).map(d => d.id)

  // First, get all devices along with when they conducted their first test
  // This is so we don't include devices in the activity stats before they were first active
  const devicesByCreatedOn = await knex('Device')
    .whereIn('id', deviceIds)
    .select('id', 'createdOn')

  // Get number of devices active (=conducting tests) by day
  const devicesActiveByDay = await knex('Result')
    .whereIn('deviceId', deviceIds)
    .groupBy('endedOnDate')
    .select(knex.raw('date(endedOn) as endedOnDate'))
    .countDistinct('deviceId as deviceCount')
    .modify(qb => {
      if (query.maxDate) {
        qb.where('endedOn', '<', addDays(query.maxDate, 1))
      }
      if (query.minDate) {
        qb.where('endedOn', '>=', query.minDate)
      }
    })
  // now we can update the total devices that were in the system per day:
  days.forEach(day => {
    const devices = devicesByCreatedOn.filter(c => c.createdOn <= day.date)
    const devicesActive = devicesActiveByDay.find(
      c =>
        c.endedOnDate.getDate() === day.date.getDate() &&
        c.endedOnDate.getMonth() === day.date.getMonth() &&
        c.endedOnDate.getFullYear() === day.date.getFullYear()
    )
    day.devicesTotal = devices.length
    day.devicesActive = devicesActive ? devicesActive.deviceCount : 0
    day.devicesInactive = day.devicesTotal - day.devicesActive
    day.isWeekendOrHoliday = isWeekend(day.date)
  })

  return {
    ok: true,
    data: days,
  }
}

async function resultsTransmittedDashboard(request) {
  const { auth, query } = request
  const dataConstraints = await getConstraints(auth.credentials)

  const messageStatusToId = await allMessageStatusToId()

  // get all assays which user can access
  const assaysQuery = knex('Assay as a')
    .innerJoin('AssayType as at', 'a.assayTypeId', 'at.id')
    .leftJoin('Disease as d', 'at.diseaseId', 'd.id')
    .innerJoin('DeviceType as dt', 'a.deviceTypeId', 'dt.id')
    .modify(addConstraints, dataConstraints, {
      assayType: 'at',
      assay: 'a',
      deviceType: 'dt',
      disease: 'd',
    })
    .modify(filterParams, query, { name: 'a.name' })
    .select(
      'a.id as assayId',
      'a.name as assayName',
      'a.externalId as assayExternalId',
      'a.i18nKey as assayI18nKey'
    )
    .orderBy('a.name')

  const { currentMonth = new Date() } = query
  const resultsQuery = knex('Result as r')
    .innerJoin('Assay as a', 'a.id', 'r.assayId')
    .innerJoin('Device as d', 'd.id', 'r.deviceId')
    .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .leftOuterJoin('Site as s', 's.id', 'r.siteId')
    .leftOuterJoin('ResultCategory as rc1', 'rc1.id', 'r.resultCategory1')
    .leftOuterJoin('ResultCategory as rc2', 'rc2.id', 'r.resultCategory2')
    .leftOuterJoin('Issue AS i', 'r.id', 'i.resultId')
    .leftOuterJoin('IssueType AS it', function () {
      this.on('i.issueTypeId', 'it.id')
        .andOnBetween('i.createdOn', [
          knex.raw(`DATE_FORMAT(NOW() - INTERVAL 1 MONTH, '%Y-%m-01')`),
          knex.raw('NOW()'),
        ])
        .andOnIn('it.externalId', ['ResultReceived', 'ResultUploaded'])
    })
    .leftOuterJoin('IssueStatus AS ist', 'i.issueStatusId', 'ist.id')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('EmailMessage as em', function () {
      this.on('r.id', 'em.resultId').andOn(
        'em.messageStatusId',
        messageStatusToId.Sent
      )
    })
    .leftOuterJoin('SmsMessage as sm', function () {
      this.on('r.id', 'sm.resultId').andOn(
        'sm.messageStatusId',
        messageStatusToId.Sent
      )
    })
    // only specified 'currentMonth' and previous onth
    .whereRaw(
      `
        (
          YEAR(r.endedOn) = YEAR(?)
          AND
          MONTH(r.endedOn) = MONTH(?)
        )
        OR
        (
          YEAR(r.endedOn) = YEAR(DATE_SUB(?, INTERVAL 1 MONTH))
          AND
          MONTH(r.endedOn) = MONTH(DATE_SUB(?, INTERVAL 1 MONTH))
        )
      `,
      [currentMonth, currentMonth, currentMonth, currentMonth]
    )
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      site: 's',
      geography: 'g',
      assay: 'a',
    })
    .modify(filterParams, query, {
      deviceId: 'd.id',
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      deviceName: 'd.name',
      siteName: 's.name',
    })
    .select(
      'a.name as assayName',
      'a.externalId as assayExternalId',
      // YYYY_MM field for grouping by
      knex.raw(`
        CONCAT_WS(
          '-', 
          CAST( YEAR(r.endedOn) AS CHAR ),
          LPAD(
            CAST( MONTH(r.endedOn) AS CHAR ),
            2,
            '0'
          )
        ) AS yearMonth
      `)
    )
    // all results
    .count({
      cntAll: knex.raw('DISTINCT r.id'),
    })
    // all Positive results
    .count({
      cntPositive: knex.raw(`
        DISTINCT
        CASE
          WHEN rc1.externalId = 'Positive' 
          THEN r.id
          ELSE null
        END
      `),
    })
    // all results with email sent out
    .count({
      cntReportedViaEmail: knex.raw(`
        DISTINCT
        CASE 
          WHEN 
            rc1.externalId = 'Positive'
            AND
            em.id IS NOT NULL
            AND
            ist.externalId IN ('Active', 'OK', 'Resolved')
          THEN r.id
          ELSE null
        END
      `),
    })
    // all results with sms sent out
    .count({
      cntReportedViaSms: knex.raw(`
        DISTINCT
        CASE 
          WHEN 
            rc1.externalId = 'Positive'
            AND
            sm.id IS NOT NULL
            AND
            ist.externalId IN ('Active', 'OK', 'Resolved')
          THEN r.id
          ELSE null
        END
      `),
    })
    // count results with either email or sms sent out
    .count({
      cntAllReported: knex.raw(`
        DISTINCT
        CASE 
          WHEN 
            rc1.externalId = 'Positive'
            AND (
              em.id IS NOT NULL
              OR
              sm.id IS NOT NULL
            )
            AND
            ist.externalId IN ('Active', 'OK', 'Resolved')
          THEN r.id
          ELSE null
        END
      `),
    })
    .count({
      cntWithin2Hours: knex.raw(`
        DISTINCT
        CASE
          WHEN
            rc1.externalId = 'Positive'
            AND (
              em.createdOn BETWEEN r.endedOn AND DATE_ADD(r.endedOn, INTERVAL 2 HOUR)
              OR
              sm.createdOn BETWEEN r.endedOn AND DATE_ADD(r.endedOn, INTERVAL 2 HOUR)
            )
            AND
            ist.externalId IN ('Active', 'OK', 'Resolved')
          THEN r.id
          ELSE null
        END
      `),
    })
    .groupBy('a.id', 'yearMonth')

  resultsQuery.where('dt.externalId', 'CepheidGeneXpert')
  assaysQuery.where('dt.externalId', 'CepheidGeneXpert')

  const items = await resultsQuery
  const assays = await assaysQuery

  // helper func for percentages
  const getPercent = (numerator, denominator) => {
    return denominator === 0 ? 0 : Math.round((100 * numerator) / denominator)
  }
  // calculate all percentages
  items.forEach(item => {
    item.percentPositive = getPercent(item.cntPositive, item.cntAll)
    item.percentReported = getPercent(item.cntAllReported, item.cntAll)
    item.percentViaEmail = getPercent(
      item.cntReportedViaEmail,
      item.cntAllReported
    )
    item.percentViaSms = getPercent(item.cntReportedViaSms, item.cntAllReported)
    item.percentWithin2Hours = getPercent(
      item.cntWithin2Hours,
      item.cntAllReported
    )
  })

  // helpers
  const currMonth = formatDate(currentMonth, 'yyyy-MM')
  const prevMonth = formatDate(subMonths(currentMonth, 1), 'yyyy-MM')
  const getChange = (pcCurr, pcPrev = null) => {
    if (pcPrev === null) {
      return 0
    }
    return pcCurr - pcPrev
  }
  const findItem = (yearMonth, assayExternalId) => item =>
    item.yearMonth === yearMonth && item.assayExternalId === assayExternalId

  const data = assays.map(({ assayName, assayExternalId }) => {
    // get items for current and previous month
    const currItem = items.find(findItem(currMonth, assayExternalId))
    const prevItem = items.find(findItem(prevMonth, assayExternalId)) || {}
    const {
      yearMonth,
      cntAll = 0,
      cntPositive = 0,
      cntAllReported = 0,
      cntReportedViaEmail = 0,
      cntReportedViaSms = 0,
      cntWithin2Hours = 0,
      percentPositive,
      percentReported,
      percentViaEmail,
      percentViaSms,
      percentWithin2Hours,
    } = currItem || {}

    return {
      assayName,
      yearMonth,
      // totals in current month
      cntAll,
      cntPositive,
      cntAllReported,
      cntReportedViaEmail,
      cntReportedViaSms,
      cntWithin2Hours,
      // percent in current month
      percentPositive,
      percentReported,
      percentViaEmail,
      percentViaSms,
      percentWithin2Hours,
      // changes since previous month
      percentPositiveChange: getChange(
        percentPositive,
        prevItem.percentPositive
      ),
      percentReportedChange: getChange(
        percentReported,
        prevItem.percentReported
      ),
      percentViaEmailChange: getChange(
        percentViaEmail,
        prevItem.percentViaEmail
      ),
      percentViaSmsChange: getChange(percentViaSms, prevItem.percentViaSms),
      percentWithin2HoursChange: getChange(
        percentWithin2Hours,
        prevItem.percentWithin2Hours
      ),
    }
  })

  return {
    ok: true,
    currentMonth,
    data,
  }
}

module.exports = {
  summaryDashboard,
  targetDashboard,
  resultDashboard,
  inventoryItemDashboard,
  deviceDashboard,
  siteDashboard,
  actionDashboard,
  operationalDataActivityOverTime,
  resultsTransmittedDashboard,
}
