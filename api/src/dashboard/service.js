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
const Promise = require('bluebird')
const addDays = require('date-fns/add_days')
const isAfter = require('date-fns/is_after')

const i18nKeys = {
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
}

function* summaryDashboard(request) {
  const { auth } = request

  // get data constraints
  const dataConstraints = yield getConstraints(auth.credentials)

  const sitesTotalQuery = knex('Site as s')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .modify(addConstraints, dataConstraints, { site: 's', geography: 'g' })

  const devicesTotalQuery = knex('Device as d')
    .innerJoin('Site as s', 's.id', 'd.siteId')
    .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .innerJoin('DeviceTypeCategory as dc', 'dc.id', 'dt.deviceTypeCategoryId')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .where('dc.hasResults', 1)
    .modify(addConstraints, dataConstraints, { site: 's', geography: 'g' })

  const resultsTotalQuery = knex('FactResultCountDevice as f')
    .innerJoin('Device as d', 'd.id', 'f.deviceId')
    .innerJoin('Site as s', 's.id', 'd.siteId')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .where('assayId', null)
    .where('resultCategory1', null)
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      site: 's',
      geography: 'g',
    })

  // TODO: - limit users by job
  const usersTotalQuery = knex('User as u').count('u.id as cnt')

  const [
    sitesTotal,
    devicesTotal,
    resultsTotal30d,
    resultsTotal1d,
    usersTotal,
  ] = yield Promise.all([
    canViewSites(auth) ? sitesTotalQuery.clone().count('s.id as cnt') : null,
    canViewDevices(auth)
      ? devicesTotalQuery.clone().count('d.id as cnt')
      : null,
    canViewResults(auth)
      ? resultsTotalQuery
          .clone()
          .where('f.days', 30)
          .sum('f.resultCount as cnt')
      : null,
    canViewResults(auth)
      ? resultsTotalQuery.clone().where('f.days', 1).sum('f.resultCount as cnt')
      : null,
    usersTotalQuery,
  ])

  const result = {
    data: {
      sitesTotal: sitesTotal ? sitesTotal[0].cnt : null,
      devicesTotal: devicesTotal ? devicesTotal[0].cnt : null,
      resultsTotal30d: resultsTotal30d ? resultsTotal30d[0].cnt : null,
      resultsTotal1d: resultsTotal1d ? resultsTotal1d[0].cnt : null,
      usersTotal: usersTotal[0].cnt,
    },
  }

  return result
}

function* resultDashboard(request) {
  const { auth } = request

  // get data constraints
  const dataConstraints = yield getConstraints(auth.credentials)

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
  const [siteList, resultCnt, assayTypes] = yield Promise.all(
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
        const data = _.map(
          resultCntBySiteIdByAssayTypeId[`${id}`],
          (it, siteId) =>
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

function* getInventoryItemList(auth, dataConstraints) {
  if (!canViewInventories(auth)) {
    return []
  }
  const inventoryItemList = yield knex('InventoryItem as ii')
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
    if (_.isString(it.expiresOn)) {
      it.expiring = isAfter(
        addDays(it.expiresOn, it.remainingDays),
        it.expiresOn
      )
    }
  })

  return inventoryItemList
}

function* inventoryItemDashboard(request) {
  const { auth } = request

  // get data constraints
  const dataConstraints = yield getConstraints(auth.credentials)

  const siteList = canViewSites(auth)
    ? yield knex('Site as s')
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
    : []

  const inventoryItemList = yield* getInventoryItemList(auth, dataConstraints)

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
        const {
          runningLowCount,
          expiringCount,
          affectedSiteIds,
        } = list.reduce(
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

function* getSiteList(auth, dataConstraints) {
  if (!canViewSites(auth)) {
    return []
  }
  return yield knex('Site as s')
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
}

function* getDeviceList(auth, dataConstraints) {
  if (!canViewDevices(auth)) {
    return []
  }
  return yield knex('Device as d')
    .innerJoin('Site as s', 's.id', 'd.siteId')
    .innerJoin('Partner as p', 'd.partnerId', 'p.id')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .select(
      'd.id',
      'd.siteId',
      'd.lastSeenOn'
      // TODO: 'p.offlineThresholdDays',
    )
    .modify(addConstraints, dataConstraints, {
      site: 's',
      geography: 'g',
    })
}

function* deviceDashboard(request) {
  const { auth } = request
  const now = new Date()

  // get data constraints
  const dataConstraints = yield getConstraints(auth.credentials)

  const siteList = yield* getSiteList(auth, dataConstraints)
  const deviceList = yield* getDeviceList(auth, dataConstraints)

  const siteById = _.keyBy(siteList, 'id')
  _.forEach(deviceList, it => {
    const site = siteById[it.siteId]
    it.stateAbbr = site.stateAbbr
    it.latitude = site.latitude
    it.longitude = site.longitude
  })

  const MOCK_PARTNER_OFFLINE_THRESHOLD_DAYS = 3

  const isDeviceOnline = it =>
    isAfter(addDays(it.lastSeenOn, MOCK_PARTNER_OFFLINE_THRESHOLD_DAYS), now)
  const isDeviceOffline = _.negate(isDeviceOnline)
  const isDeviceWarrantyExpiring = () => /* TODO */ _.random(10) > 7
  const isDeviceCalibrationDue = () => /* TODO */ _.random(10) > 7
  const isDeviceHighErrorRate = () => /* TODO */ _.random(10) > 7
  const isDeviceOperational = it =>
    !isDeviceOffline(it) &&
    !isDeviceWarrantyExpiring(it) &&
    !isDeviceCalibrationDue(it) &&
    !isDeviceHighErrorRate(it)

  const warrantyExpiringDeviceList = _.filter(
    deviceList,
    isDeviceWarrantyExpiring
  )
  const calibrationDueDeviceList = _.filter(deviceList, isDeviceCalibrationDue)
  const offlineDeviceList = _.filter(deviceList, isDeviceOffline)
  const highErrorRateDeviceList = _.filter(deviceList, isDeviceHighErrorRate)
  const operationalDeviceList = _.filter(deviceList, isDeviceOperational)

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

function* siteDashboard(request) {
  const { auth } = request
  const now = new Date()

  // get data constraints
  const dataConstraints = yield getConstraints(auth.credentials)

  const siteList = yield* getSiteList(auth, dataConstraints)
  const deviceList = yield* getDeviceList(auth, dataConstraints)
  const inventoryItemList = yield* getInventoryItemList(auth, dataConstraints)

  const MOCK_PARTNER_OFFLINE_THRESHOLD_DAYS = 3

  const isDeviceOnline = it =>
    isAfter(addDays(it.lastSeenOn, MOCK_PARTNER_OFFLINE_THRESHOLD_DAYS), now)
  const isDeviceOffline = _.negate(isDeviceOnline)
  const filteredLength = _.flowRight(_.size, _.filter)
  const siteIdAccumulator = (acc, it, siteId) => {
    if (it) {
      acc.push(siteId)
    }
    return acc
  }

  const allDeviceOnlineBySiteId = _.mapValues(
    _.groupBy(deviceList, 'siteId'),
    list => _.every(list, isDeviceOnline)
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
    list => filteredLength(list, isDeviceOffline) === 1
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

function* operationalDashboard(request) {
  const { query } = request

  const result = {
    ok: true,
    data: {
      inventory: [
        {
          key: 'stock-outs',
          title: 'Stock outs',
          isNormal: false,
          message: '1 site with problems',
          data: [
            { id: 1, value: 4, abnormal: false },
            { id: 2, value: 7, abnormal: false },
            { id: 3, value: 4, abnormal: false },
            { id: 4, value: 2, abnormal: false },
            { id: 5, value: 5, abnormal: false },
            { id: 6, value: 4, abnormal: false },
            { id: 7, value: 3, abnormal: false },
            { id: 8, value: 2, abnormal: false },
            { id: 9, value: 6, abnormal: false },
            { id: 10, value: 4, abnormal: false },
            { id: 11, value: 8, abnormal: false },
            { id: 12, value: 1, abnormal: true },
            { id: 13, value: 4, abnormal: false },
            { id: 14, value: 5, abnormal: false },
            { id: 15, value: 10, abnormal: false },
            { id: 16, value: 9, abnormal: false },
            { id: 17, value: 7, abnormal: false },
            { id: 18, value: 4, abnormal: false },
          ],
          averageValue: 1.75,
        },
        {
          key: 'low-supply',
          title: 'Low supply',
          isNormal: false,
          message: '3 sites with problems',
          data: [
            { id: 1, value: 4, abnormal: false },
            { id: 2, value: 7, abnormal: false },
            { id: 3, value: 8, abnormal: false },
            { id: 4, value: 9, abnormal: false },
            { id: 5, value: 6, abnormal: false },
            { id: 6, value: 5, abnormal: false },
            { id: 7, value: 2, abnormal: true },
            { id: 8, value: 10, abnormal: false },
            { id: 9, value: 4, abnormal: false },
            { id: 10, value: 5, abnormal: false },
            { id: 11, value: 2, abnormal: true },
            { id: 12, value: 3, abnormal: true },
            { id: 13, value: 3.5, abnormal: false },
            { id: 14, value: 4.5, abnormal: false },
            { id: 15, value: 3.5, abnormal: false },
            { id: 16, value: 4, abnormal: false },
            { id: 17, value: 7, abnormal: false },
            { id: 18, value: 4, abnormal: false },
          ],
          averageValue: 3.2,
        },
        {
          key: 'expiring',
          title: 'Expiring',
          isNormal: true,
          message: '0 site with problems',
          data: [
            { id: 1, value: 4, abnormal: false },
            { id: 2, value: 7, abnormal: false },
            { id: 3, value: 4, abnormal: false },
            { id: 4, value: 2, abnormal: false },
            { id: 5, value: 5, abnormal: false },
            { id: 6, value: 3.5, abnormal: false },
            { id: 7, value: 3, abnormal: false },
            { id: 8, value: 2, abnormal: false },
            { id: 9, value: 5, abnormal: false },
            { id: 10, value: 4, abnormal: false },
            { id: 11, value: 8, abnormal: false },
            { id: 12, value: 2, abnormal: false },
            { id: 13, value: 5, abnormal: false },
            { id: 14, value: 6, abnormal: false },
            { id: 15, value: 10, abnormal: false },
            { id: 16, value: 9, abnormal: false },
            { id: 17, value: 7, abnormal: false },
            { id: 18, value: 4, abnormal: false },
          ],
          averageValue: 12,
        },
        {
          key: 'time-to-alert-resolution',
          title: 'Time to alert resolution',
          isNormal: false,
          message: '1 site with problems',
          data: [
            { id: 1, value: 4, abnormal: false },
            { id: 2, value: 7, abnormal: false },
            { id: 3, value: 8, abnormal: false },
            { id: 4, value: 9, abnormal: true },
            { id: 5, value: 6, abnormal: false },
            { id: 6, value: 5, abnormal: false },
            { id: 7, value: 2, abnormal: false },
            { id: 8, value: 10, abnormal: false },
            { id: 9, value: 4, abnormal: false },
            { id: 10, value: 5, abnormal: false },
            { id: 11, value: 2, abnormal: false },
            { id: 12, value: 3, abnormal: false },
            { id: 13, value: 3.5, abnormal: false },
            { id: 14, value: 4.5, abnormal: false },
            { id: 15, value: 3.5, abnormal: false },
            { id: 16, value: 4, abnormal: false },
            { id: 17, value: 7, abnormal: false },
            { id: 18, value: 4, abnormal: false },
          ],
          averageValue: 7.5,
        },
      ],
      device: [
        {
          key: 'modules-unavailable',
          title: 'Modules unavailable',
          isNormal: false,
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
          key: 'days-unavailable',
          title: 'Days unavailable',
          isNormal: false,
          message: '8 site with problems',
          data: [
            { id: 1, value: 5, abnormal: false },
            { id: 2, value: 7, abnormal: false },
            { id: 3, value: 8, abnormal: false },
            { id: 4, value: 9, abnormal: true },
            { id: 5, value: 6, abnormal: false },
            { id: 6, value: 6.5, abnormal: true },
            { id: 7, value: 2, abnormal: false },
            { id: 8, value: 7, abnormal: true },
            { id: 9, value: 5, abnormal: false },
            { id: 10, value: 6, abnormal: false },
            { id: 11, value: 2, abnormal: true },
            { id: 12, value: 2.2, abnormal: false },
            { id: 13, value: 3, abnormal: true },
            { id: 14, value: 5, abnormal: true },
            { id: 15, value: 2, abnormal: true },
            { id: 16, value: 4, abnormal: true },
            { id: 17, value: 6, abnormal: true },
            { id: 18, value: 5, abnormal: false },
          ],
        },
        {
          key: 'test-failures',
          title: 'Test failures',
          isNormal: false,
          message: '4 site with problems',
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
            { id: 15, value: 14, abnormal: true },
            { id: 16, value: 12, abnormal: true },
            { id: 17, value: 10, abnormal: true },
            { id: 18, value: 7, abnormal: true },
          ],
        },
        {
          key: 'calibration-compliance',
          title: 'Calibration compliance',
          isNormal: false,
          message: '1 site with problems',
          data: [
            { id: 1, value: 7, abnormal: false },
            { id: 2, value: 9, abnormal: false },
            { id: 3, value: 10, abnormal: false },
            { id: 4, value: 11, abnormal: false },
            { id: 5, value: 8, abnormal: false },
            { id: 6, value: 7.5, abnormal: false },
            { id: 7, value: 2, abnormal: false },
            { id: 8, value: 9.5, abnormal: false },
            { id: 9, value: 5, abnormal: false },
            { id: 10, value: 8, abnormal: true },
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
        {
          key: 'maintenance-compliance',
          title: 'Maintenance compliance',
          isNormal: true,
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
          title: 'Data connectivity',
          isNormal: false,
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
          title: 'Utilisation',
          isNormal: true,
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
          title: 'Time to alert resolution',
          isNormal: false,
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
          title: 'High performing',
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
          title: 'Improving',
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
          isNormal: false,
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
            it.value = it.value * multiplier % 17
          }
        })
      )
    )
  }

  return result
}

module.exports = {
  summaryDashboard,
  resultDashboard,
  inventoryItemDashboard,
  deviceDashboard,
  siteDashboard,
  operationalDashboard,
}
