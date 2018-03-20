const _ = require('lodash')
const { knex } = require('../db')
const {
  getConstraints,
  addConstraints,
  canViewSites,
  canViewDevices,
  canViewResults,
  canViewInventories,
} = require('../auth/constraints')
const addDays = require('date-fns/add_days')
const isAfter = require('date-fns/is_after')
const differenceInDays = require('date-fns/difference_in_days')
const { getUser } = require('../auth/service')

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

function getDashboardWidget({ id, partnerId }, layout) {
  const layoutType = layout === 'target' ? 'target' : 'stat'
  return knex('DashboardWidget as w')
    .select('w.*')
    .innerJoin('JobFunctionDashboardWidget as jfw', 'w.id', 'jfw.widgetId')
    .innerJoin('JobFunction as jf', 'jfw.jobFunctionId', 'jf.id')
    .innerJoin('Job as j', 'j.jobFunctionId', 'jf.id')
    .innerJoin('Person as ps', 'j.personId', 'ps.id')
    .where({
      'ps.userId': id,
      'jf.partnerId': partnerId,
      'w.layout': layoutType,
    })
    .orderBy(['w.sortOrder'])
}

function getTableAlias(sql) {
  const tableAliasRegExp = new RegExp(
    /\b(?:from|join)\s+([a-zA-Z0-9_$#-]*)\s+as\s+([a-zA-Z0-9_$#-]*)\b/gi
  )
  let match
  const tableAlias = {}
  // eslint-disable-next-line no-cond-assign
  while ((match = tableAliasRegExp.exec(sql)) !== null) {
    if (match.length === 3) {
      const [, tableName, alias] = match
      tableAlias[tableName.toLowerCase()] = alias
    }
  }
  return tableAlias
}

function getSqlBuilder(sql) {
  const sqlRegExp = new RegExp(
    /\bselect\s+(.*?)\s?(?:\s+from\s+(.*?)\s*((?:(?:LEFT|RIGHT)?\s+(?:INNER|OUTER)?\s+join)\s+(?:.*?))?\s*(?:(?:\s+where)\s+(.*?))?\s*(?:(?:\s+having)\s(.*?))?)?$/gi
  )
  let match
  let sqlBuilder
  // eslint-disable-next-line no-cond-assign
  if ((match = sqlRegExp.exec(sql)) !== null) {
    if (match.length === 6) {
      sqlBuilder = knex.select(knex.raw(match[1])).from(match[2])
      if (match[3]) {
        sqlBuilder.joinRaw(match[3])
      }
      if (match[4]) {
        sqlBuilder.whereRaw(match[4])
      }
      if (match[5]) {
        sqlBuilder.havingRaw(match[5])
      }
    }
  }
  return sqlBuilder
}

function queryCount(sql, dataConstraints) {
  const sqlTableAlias = getTableAlias(sql)
  const sqlBuilder = getSqlBuilder(sql)
  const cnt = sqlBuilder
    ? sqlBuilder.modify(addConstraints, dataConstraints, sqlTableAlias)
    : null
  return cnt
}

async function summaryDashboard(request) {
  const { auth, query: { layout } } = request
  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const user = await getUser(auth.credentials.name)
  const widgets = await getDashboardWidget(user, layout)

  const data = await Promise.all(
    widgets.map(async widget => {
      const count = await queryCount(widget.sqlForIndicator, dataConstraints)
      const target = await queryCount(widget.sqlForTarget, dataConstraints)
      const unit = await queryCount(widget.sqlForStatUnit, dataConstraints)
      const extra = await queryCount(widget.sqlForExtra, dataConstraints)
      return _.assign(
        _.omit(widget, [
          'sqlForIndicator',
          'sqlForTarget',
          'sqlForStatUnit',
          'sqlForExtra',
          'sortOrder',
        ]),
        {
          count: count && count.length === 1 ? _.values(count[0])[0] : 0,
          target: target && target.length === 1 ? _.values(target[0])[0] : null,
          unit: unit && unit.length === 1 ? _.values(unit[0])[0] : null,
          extra: extra && extra.length === 1 ? _.values(extra[0])[0] : null,
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
          knex('FactResultCountDevice as f')
            .innerJoin('Device as d', 'd.id', 'f.deviceId')
            .innerJoin('Site as s', 's.id', 'd.siteId')
            .innerJoin('Assay as a', 'a.id', 'f.assayId')
            .innerJoin('ResultCategory as rc', 'rc.id', 'f.resultCategory1')
            .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
            .modify(addConstraints, dataConstraints, {
              device: 'd',
              site: 's',
              geography: 'g',
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
        addDays(it.expiresOn, it.remainingDays),
        it.expiresOn
      )
    }
  })

  return inventoryItemList
}

async function inventoryItemDashboard(request) {
  const { auth } = request

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)
  const siteList = await getSiteList(auth, dataConstraints)
  const inventoryItemList = await getInventoryItemList(auth, dataConstraints)

  const inventorySiteSummaryList = _.sortBy(
    _.reduce(
      _.groupBy(inventoryItemList, 'siteId'),
      (acc, list) => {
        if (!_.isEmpty(list)) {
          const minRemainingDays = _.minBy(list, 'remainingDays').remainingDays
          const { siteId } = list[0]

          acc.push({
            siteId,
            minRemainingDays,
          })
        }
        return acc
      },
      []
    ),
    it => -1 * it.minRemainingDays
  )

  const inventoryConsumableSummaryList = _.reduce(
    _.groupBy(inventoryItemList, 'consumableId'),
    (acc, list) => {
      if (!_.isEmpty(list)) {
        const { runningLowCount, expiringCount, affectedSiteIds } = list.reduce(
          (result, it) => {
            result.runningLowCount += it.runningLow ? 1 : 0
            result.expiringCount += it.expiring ? 1 : 0
            if (it.runningLow || it.expiring) {
              result.affectedSiteIds.push(it.siteId)
            }
            return result
          },
          {
            runningLowCount: 0,
            expiringCount: 0,
            affectedSiteIds: [],
          }
        )

        const result = _.filter(
          [
            runningLowCount > 0 && {
              key: 0,
              count: runningLowCount,
              titleI18nKey: i18nKeys.sitesTitle,
              subI18nKey: i18nKeys.runningLowStatus,
            },
            expiringCount > 0 && {
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
      inventorySiteSummaryList,
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
    .innerJoin('FactDeviceFlag as fdf', 'd.id', 'fdf.deviceId')
    .innerJoin('Site as s', 's.id', 'd.siteId')
    .innerJoin('Partner as p', 'd.partnerId', 'p.id')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .select('d.id', 'd.siteId', 'fdf.*')
    .modify(addConstraints, dataConstraints, {
      site: 's',
      geography: 'g',
    })
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

  const operationalDeviceList = _.filter(deviceList, {
    offline: 0,
    service: 0,
    calibration: 0,
    errorRate: 0,
    qcProblem: 0,
    lowInventory: 0,
    outOfInventory: 0,
    expiringInventory: 0,
  })
  const warrantyExpiringDeviceList = _.filter(deviceList, 'expiringWarranty')
  const calibrationDueDeviceList = _.filter(deviceList, 'calibration')
  const offlineDeviceList = _.filter(deviceList, 'offline')
  const highErrorRateDeviceList = _.filter(deviceList, 'errorRate')

  const deviceSummaryMap = {
    operational: {
      deviceIds: _.map(operationalDeviceList, 'id'),
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
    warrantyExpiring: {
      deviceIds: _.map(warrantyExpiringDeviceList, 'id'),
      items: [
        {
          key: 0,
          count: warrantyExpiringDeviceList.length,
          titleI18nKey: i18nKeys.devicesTitle,
          subI18nKey: i18nKeys.warrantyExpiringStatus,
        },
      ],
    },
    calibration: {
      deviceIds: _.map(calibrationDueDeviceList, 'id'),
      items: [
        {
          key: 0,
          count: calibrationDueDeviceList.length,
          titleI18nKey: i18nKeys.devicesTitle,
          subI18nKey: i18nKeys.needCalibrationStatus,
        },
      ],
    },
    uploadingData: {
      deviceIds: _.map(offlineDeviceList, 'id'),
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
    list => _.every(list, { offline: 0 })
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
      siteIds: [undefined /* TODO: ASP-520 */],
      items: [
        {
          key: 0,
          count: 1 /* TODO: ASP-520 */,
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
      siteList,
      siteSummaryMap,
    },
  }

  return result
}

const OPERATIONAL_TAKE_LIMIT = 20

const OPERATIONAL_INVENTORY_MIN_DAYS = 21
const OPERATIONAL_INVENTORY_MIN_EXPIRING = 0.15

async function inventoryItemOperational(request) {
  const { auth } = request

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const inventoryItemList = await getInventoryItemList(auth, dataConstraints)

  const stockOutsInventoryItemList = _.sortBy(
    _.reduce(
      _.groupBy(inventoryItemList, 'siteId'),
      (acc, list, siteId) => {
        if (!_.isEmpty(list)) {
          const minRemainingDays = _.minBy(list, 'remainingDays').remainingDays

          acc.push({
            id: siteId,
            value: minRemainingDays,
            abnormal: minRemainingDays < OPERATIONAL_INVENTORY_MIN_DAYS,
          })
        }
        return acc
      },
      []
    ),
    'value'
  )
  const stockOutsAbnormalList = _.filter(stockOutsInventoryItemList, 'abnormal')
  const expiringInventoryItemList = _.sortBy(
    _.reduce(
      _.groupBy(inventoryItemList, 'siteId'),
      (acc, list, siteId) => {
        if (!_.isEmpty(list)) {
          const { totalQuantityOnHand, totalExpiring } = _.reduce(
            list,
            (total, it) => {
              total.totalQuantityOnHand += it.quantityOnHand
              if (it.expiring) {
                total.totalExpiring += it.quantityOnHand
              }
              return total
            },
            { totalQuantityOnHand: 0, totalExpiring: 0 }
          )
          const value = totalExpiring / totalQuantityOnHand

          acc.push({
            id: siteId,
            value,
            abnormal: value > OPERATIONAL_INVENTORY_MIN_EXPIRING,
          })
        }
        return acc
      },
      []
    ),
    'value'
  )
  const expiringAbnormalList = _.filter(expiringInventoryItemList, 'abnormal')

  return [
    {
      key: 'stock-outs',
      titleI18nKey: i18nKeys.stockOutsTitle,
      someAbnormal: stockOutsAbnormalList.length > 0,
      messageI18nKey: i18nKeys.siteWithProblems,
      messageData: {
        count: stockOutsAbnormalList.length,
      },
      data: _.take(stockOutsInventoryItemList, OPERATIONAL_TAKE_LIMIT),
      averageValue:
        _.sumBy(stockOutsInventoryItemList, 'value') /
        stockOutsInventoryItemList.length,
    },
    {
      key: 'expiring',
      titleI18nKey: i18nKeys.expiringTitle,
      someAbnormal: expiringAbnormalList.length > 0,
      messageI18nKey: i18nKeys.siteWithProblems,
      messageData: {
        count: expiringAbnormalList.length,
      },
      data: _.take(expiringInventoryItemList, OPERATIONAL_TAKE_LIMIT),
      averageValue:
        _.sumBy(expiringInventoryItemList, 'value') /
        expiringInventoryItemList.length,
    },
  ]
}

async function deviceOperational(request) {
  const { auth } = request
  const now = new Date()
  const OPERATIONAL_DEVICE_TAKE_LIMIT = 10

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const deviceList = await getDeviceList(auth, dataConstraints)

  const MOCK_PARTNER_OFFLINE_THRESHOLD_DAYS = 7
  const MOCK_DEVICE_HIGH_ERROR_RATE_THRESHOLD = 0.05
  const MOCK_DEVICE_CALIBRATION_THRESHOLD_DAYS = 60

  const offlineDeviceList = _.sortBy(
    deviceList.map(it => ({
      id: it.id,
      value: differenceInDays(now, it.lastSeenOn),
      abnormal:
        differenceInDays(now, it.lastSeenOn) >
        MOCK_PARTNER_OFFLINE_THRESHOLD_DAYS,
    })),
    it => -1 * it.value
  )
  const offlineDeviceAbnormalList = _.filter(offlineDeviceList, 'abnormal')

  const highErrorRateDeviceList = _.sortBy(
    deviceList.map(it => {
      const value = _.random(0, 1, true)

      return {
        id: it.id,
        value,
        abnormal: value > MOCK_DEVICE_HIGH_ERROR_RATE_THRESHOLD,
      }
    }),
    it => -1 * it.value
  )
  const highErrorRateDeviceAbnormalList = _.filter(
    highErrorRateDeviceList,
    'abnormal'
  )

  const calibrationDeviceList = _.sortBy(
    deviceList.map(it => {
      const calibrationOn = addDays(now, _.random(55, 120))
      const value = differenceInDays(calibrationOn, now)

      return {
        id: it.id,
        value,
        abnormal: value < MOCK_DEVICE_CALIBRATION_THRESHOLD_DAYS,
      }
    }),
    it => -1 * it.value
  )
  const calibrationAbnormalList = _.filter(calibrationDeviceList, 'abnormal')

  return [
    {
      key: 'days-unavailable',
      titleI18nKey: i18nKeys.daysUnavailable,
      someAbnormal: offlineDeviceAbnormalList.length > 0,
      messageI18nKey: i18nKeys.deviceWithProblems,
      messageData: {
        count: offlineDeviceAbnormalList.length,
      },
      data: _.take(offlineDeviceList, OPERATIONAL_DEVICE_TAKE_LIMIT),
    },
    {
      key: 'test-failures',
      titleI18nKey: i18nKeys.testFailures,
      titleTooltip: '10% (20/200) 10/27/2017',
      someAbnormal: highErrorRateDeviceAbnormalList.length > 0,
      messageI18nKey: i18nKeys.deviceWithProblems,
      messageData: {
        count: highErrorRateDeviceAbnormalList.length,
      },
      data: _.take(highErrorRateDeviceList, OPERATIONAL_DEVICE_TAKE_LIMIT),
      averageValue:
        _.sumBy(highErrorRateDeviceList, 'value') /
        highErrorRateDeviceList.length,
    },
    {
      key: 'calibration-compliance',
      titleI18nKey: i18nKeys.calibrationCompliance,
      someAbnormal: calibrationAbnormalList.length > 0,
      messageI18nKey:
        calibrationAbnormalList.length > 0
          ? i18nKeys.deviceWithProblems
          : i18nKeys.deviceCalibrationsUpToDate,
      messageData: {
        count: calibrationAbnormalList.length,
      },
      data: _.take(calibrationAbnormalList, OPERATIONAL_DEVICE_TAKE_LIMIT),
    },
  ]
}

async function operationalDashboard(request) {
  const { query } = request

  const result = {
    ok: true,
    data: {
      device: [
        {
          key: 'modules-unavailable',
          title: 'modules unavailable',
          someAbnormal: true,
          message: '6 site with problems',
          data: [
            { id: 1, value: 2, abnormal: false },
            { id: 2, value: 3, abnormal: false },
            { id: 3, value: 2, abnormal: false },
            { id: 4, value: 1, abnormal: false },
            { id: 5, value: 2.5, abnormal: false },
            { id: 6, value: 1.5, abnormal: false },
            { id: 7, value: 1, abnormal: false },
            { id: 8, value: 0.8, abnormal: false },
            { id: 9, value: 3, abnormal: false },
            { id: 10, value: 2, abnormal: false },
            { id: 11, value: 4, abnormal: false },
            { id: 12, value: 2, abnormal: true },
            { id: 13, value: 2.2, abnormal: true },
            { id: 14, value: 5, abnormal: true },
            { id: 15, value: 4, abnormal: true },
            { id: 16, value: 3, abnormal: true },
            { id: 17, value: 2, abnormal: true },
          ],
        },
        {
          key: 'maintenance-compliance',
          title: 'maintenance compliance',
          someAbnormal: false,
          message: '0 site with problems',
          data: [
            { id: 1, value: 2, abnormal: false },
            { id: 2, value: 3, abnormal: false },
            { id: 3, value: 2, abnormal: false },
            { id: 4, value: 1, abnormal: false },
            { id: 5, value: 2.5, abnormal: false },
            { id: 6, value: 1.5, abnormal: false },
            { id: 7, value: 1, abnormal: false },
            { id: 8, value: 0.8, abnormal: false },
            { id: 9, value: 3, abnormal: false },
            { id: 10, value: 2, abnormal: false },
            { id: 11, value: 4, abnormal: false },
            { id: 12, value: 2, abnormal: false },
            { id: 13, value: 2.2, abnormal: false },
            { id: 14, value: 5, abnormal: false },
            { id: 15, value: 4, abnormal: false },
            { id: 16, value: 3, abnormal: false },
            { id: 17, value: 2, abnormal: false },
          ],
        },
        {
          key: 'data-connectivity',
          title: 'data connectivity',
          someAbnormal: true,
          message: '6 site with problems',
          data: [
            { id: 1, value: 5, abnormal: true },
            { id: 2, value: 7, abnormal: true },
            { id: 3, value: 8, abnormal: true },
            { id: 4, value: 9, abnormal: true },
            { id: 5, value: 6, abnormal: true },
            { id: 6, value: 6.5, abnormal: true },
            { id: 7, value: 2, abnormal: false },
            { id: 8, value: 7, abnormal: false },
            { id: 9, value: 5, abnormal: false },
            { id: 10, value: 6, abnormal: false },
            { id: 11, value: 2, abnormal: false },
            { id: 12, value: 2.2, abnormal: false },
            { id: 13, value: 3, abnormal: false },
            { id: 14, value: 5, abnormal: false },
            { id: 15, value: 2, abnormal: false },
            { id: 16, value: 4, abnormal: false },
            { id: 17, value: 6, abnormal: false },
            { id: 18, value: 5, abnormal: false },
          ],
        },
        {
          key: 'utilisation',
          title: 'utilisation',
          someAbnormal: false,
          message: '0 site with problems',
          data: [
            { id: 1, value: 7, abnormal: false },
            { id: 2, value: 10, abnormal: false },
            { id: 3, value: 7, abnormal: false },
            { id: 4, value: 3, abnormal: false },
            { id: 5, value: 8, abnormal: false },
            { id: 6, value: 6, abnormal: false },
            { id: 7, value: 4, abnormal: false },
            { id: 8, value: 3, abnormal: false },
            { id: 9, value: 9, abnormal: false },
            { id: 10, value: 7, abnormal: false },
            { id: 11, value: 11, abnormal: false },
            { id: 12, value: 2, abnormal: false },
            { id: 13, value: 7, abnormal: false },
            { id: 14, value: 8, abnormal: false },
            { id: 15, value: 14, abnormal: false },
            { id: 16, value: 12, abnormal: false },
            { id: 17, value: 10, abnormal: false },
            { id: 18, value: 7, abnormal: false },
          ],
        },
        {
          key: 'time-to-alert-resolution',
          title: 'time to alert resolution',
          someAbnormal: true,
          message: '1 site with problems',
          data: [
            { id: 1, value: 7, abnormal: false },
            { id: 2, value: 9, abnormal: false },
            { id: 3, value: 10, abnormal: false },
            { id: 4, value: 11, abnormal: true },
            { id: 5, value: 8, abnormal: false },
            { id: 6, value: 7.5, abnormal: false },
            { id: 7, value: 2, abnormal: false },
            { id: 8, value: 9.5, abnormal: false },
            { id: 9, value: 5, abnormal: false },
            { id: 10, value: 8, abnormal: false },
            { id: 11, value: 2, abnormal: false },
            { id: 12, value: 3, abnormal: false },
            { id: 13, value: 5, abnormal: false },
            { id: 14, value: 8, abnormal: false },
            { id: 15, value: 2, abnormal: false },
            { id: 16, value: 6, abnormal: false },
            { id: 17, value: 10, abnormal: false },
            { id: 18, value: 7, abnormal: false },
          ],
        },
      ],
      site: [
        {
          key: 'high-performing',
          title: 'high performing',
          data: [
            { id: 12, name: 'Site name 12', data: [3, 4, 8] },
            { id: 74, name: 'Site name 74', data: [1, 4, 7] },
            { id: 26, name: 'Site name 26', data: [2, 5, 9] },
            { id: 37, name: 'Site name 37', data: [4, 3, 10] },
            { id: 69, name: 'Site name 69', data: [3, 4, 6] },
            { id: 73, name: 'Site name 73', data: [1, 4, 10] },
            { id: 52, name: 'Site name 52', data: [2, 5, 9] },
            { id: 34, name: 'Site name 34', data: [4, 3, 8] },
          ],
        },
        {
          key: 'improving',
          title: 'improving',
          data: [
            { id: 25, name: 'Site name 25', data: [3, 4, 8] },
            { id: 34, name: 'Site name 34', data: [1, 4, 7] },
            { id: 93, name: 'Site name 93', data: [2, 5, 9] },
            { id: 27, name: 'Site name 27', data: [4, 3, 10] },
          ],
        },
        {
          key: 'worsening',
          title: 'worsening',
          data: [
            { id: 54, name: 'Site name 54', data: [4, 3, 8] },
            { id: 122, name: 'Site name 122', data: [3, 4, 8] },
            { id: 87, name: 'Site name 87', data: [1, 4, 7] },
            { id: 26, name: 'Site name 26', data: [2, 5, 9] },
            { id: 73, name: 'Site name 73', data: [4, 3, 10] },
          ],
        },
        {
          key: 'low-performing',
          title: 'low performing',
          data: [
            { id: 34, name: 'Site name 34', data: [4, 3, 8] },
            { id: 23, name: 'Site name 23', data: [3, 4, 8] },
            { id: 65, name: 'Site name 65', data: [1, 4, 7] },
            { id: 3, name: 'Site name 3', data: [2, 5, 9] },
            { id: 5, name: 'Site name 5', data: [4, 3, 10] },
            { id: 16, name: 'Site name 16', data: [3, 4, 6] },
            { id: 84, name: 'Site name 84', data: [1, 4, 10] },
          ],
        },
      ],
      staff: [
        {
          key: 'staff-with-high-error-rates',
          title: 'staff with high error rates',
          someAbnormal: true,
          message: '8 site with problems',
          data: [
            { id: 1, value: 7, abnormal: false },
            { id: 2, value: 10, abnormal: true },
            { id: 3, value: 7, abnormal: false },
            { id: 4, value: 3, abnormal: false },
            { id: 5, value: 8, abnormal: false },
            { id: 6, value: 6, abnormal: false },
            { id: 7, value: 4, abnormal: false },
            { id: 8, value: 3, abnormal: false },
            { id: 9, value: 9, abnormal: true },
            { id: 10, value: 7, abnormal: false },
            { id: 11, value: 11, abnormal: true },
            { id: 12, value: 2, abnormal: false },
            { id: 13, value: 7, abnormal: true },
            { id: 14, value: 8, abnormal: true },
            { id: 15, value: 14, abnormal: true },
            { id: 16, value: 12, abnormal: true },
            { id: 17, value: 10, abnormal: true },
            { id: 18, value: 7, abnormal: false },
          ],
          averageValue: 8.5,
        },
      ],
    },
  }

  const multiplier =
    _.sum(
      require('crypto')
        .createHash('md5')
        .update(JSON.stringify(query))
        .digest('base64')
        .split()
        .map(s => s.charCodeAt(0))
    ) % 29

  if (multiplier > 1) {
    _.forEach(result.data, v =>
      _.forEach(v, o =>
        _.forEach(o.data, it => {
          if (it.value) {
            it.value = (it.value * multiplier) % 17
          }
        })
      )
    )
  }

  return {
    ok: true,
    data: Object.assign(result.data, {
      inventory: await inventoryItemOperational(request),
      device: [...(await deviceOperational(request)), ...result.data.device],
    }),
  }
}

module.exports = {
  summaryDashboard,
  resultDashboard,
  inventoryItemDashboard,
  deviceDashboard,
  siteDashboard,
  operationalDashboard,
}
