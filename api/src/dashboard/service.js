const _ = require('lodash')
const { knex } = require('../db')
const {
  getConstraints,
  addConstraints,
  canViewSites,
  canViewDevices,
  canViewResults,
} = require('../auth/constraints')
const Promise = require('bluebird')
const subDays = require('date-fns/sub_days')

const i18nKeys = {
  sitesTitle: 'sitesTitle',
  devicesTitle: 'devicesTitle',
  runningLowStatus: 'runningLowStatus',
  expiringStockStatus: 'expiringStockStatus',
  fullyOperationalStatus: 'fullyOperationalStatus',
  withQCIssuesStatus: 'withQCIssuesStatus',
  needServicingStatus: 'needServicingStatus',
  notReportingStatus: 'notReportingStatus',
  needCalibrationStatus: 'needCalibrationStatus',
  highFailuresRatesStatus: 'highFailuresRatesStatus',
  reportingStatus: 'reportingStatus',
  withStockIssues: 'withStockIssues',
  withDeviceIssues: 'withDeviceIssues',
  withQualityIssues: 'withQualityIssues',
  countOfTotalDevicesTitle: 'countOfTotalDevicesTitle',
  countOfTotalSitesTitle: 'countOfTotalSitesTitle',
}

const mockData = {
  inventorySummary: {
    TB: [
      {
        key: 0,
        count: 4,
        titleI18nKey: i18nKeys.sitesTitle,
        subI18nKey: i18nKeys.runningLowStatus,
      },
      {
        key: 1,
        count: 2,
        titleI18nKey: i18nKeys.sitesTitle,
        subI18nKey: i18nKeys.expiringStockStatus,
      },
    ],
    HIV: [
      {
        key: 2,
        count: 3,
        titleI18nKey: i18nKeys.sitesTitle,
        subI18nKey: i18nKeys.runningLowStatus,
      },
      {
        key: 3,
        count: 0,
        titleI18nKey: i18nKeys.sitesTitle,
        subI18nKey: i18nKeys.expiringStockStatus,
      },
    ],
  },
  deviceSummary: {
    operational: {
      count: 67,
      total: 83,
      titleI18nKey: i18nKeys.countOfTotalDevicesTitle,
      subI18nKey: i18nKeys.fullyOperationalStatus,
    },
    qualityControl: {
      count: 7,
      titleI18nKey: i18nKeys.devicesTitle,
      subI18nKey: i18nKeys.withQCIssuesStatus,
    },
    servicing: {
      count: 4,
      titleI18nKey: i18nKeys.devicesTitle,
      subI18nKey: i18nKeys.needServicingStatus,
    },
    uploadingData: {
      count: 12,
      titleI18nKey: i18nKeys.devicesTitle,
      subI18nKey: i18nKeys.notReportingStatus,
    },
    calibration: {
      count: 3,
      titleI18nKey: i18nKeys.devicesTitle,
      subI18nKey: i18nKeys.needCalibrationStatus,
    },
    testFailures: {
      count: 4,
      titleI18nKey: i18nKeys.devicesTitle,
      subI18nKey: i18nKeys.highFailuresRatesStatus,
    },
  },
  siteSummary: {
    onlineNow: {
      count: 23,
      total: 27,
      titleI18nKey: i18nKeys.countOfTotalSitesTitle,
      subI18nKey: i18nKeys.reportingStatus,
    },
    stockManagement: {
      count: 2,
      titleI18nKey: i18nKeys.sitesTitle,
      subI18nKey: i18nKeys.withStockIssues,
    },
    servicing: {
      count: 1,
      titleI18nKey: i18nKeys.sitesTitle,
      subI18nKey: i18nKeys.withDeviceIssues,
    },
    uploadingData: {
      count: 3,
      titleI18nKey: i18nKeys.sitesTitle,
      subI18nKey: i18nKeys.notReporting,
    },
    testQuality: {
      count: 7,
      titleI18nKey: i18nKeys.sitesTitle,
      subI18nKey: i18nKeys.withQualityIssues,
    },
  },
}

function* statusDashboard(request) {
  const { auth } = request
  const now = new Date()

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

  const resultsTotalQuery30d = knex('Result as r')
    .innerJoin('Site as s', 's.id', 'r.siteId')
    .innerJoin('Device as d', 'd.id', 'r.deviceId')
    .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .innerJoin('DeviceTypeCategory as dc', 'dc.id', 'dt.deviceTypeCategoryId')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .whereBetween('r.endedOn', [subDays(now, 30), now])
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      site: 's',
      geography: 'g',
    })

  const resultsTotalQuery1d = knex('Result as r')
    .innerJoin('Site as s', 's.id', 'r.siteId')
    .innerJoin('Device as d', 'd.id', 'r.deviceId')
    .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .innerJoin('DeviceTypeCategory as dc', 'dc.id', 'dt.deviceTypeCategoryId')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .whereBetween('r.endedOn', [subDays(now, 1), now])
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      site: 's',
      geography: 'g',
    })

  // to do - limit users by job
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
      ? resultsTotalQuery30d.clone().count('r.id as cnt')
      : null,
    canViewResults(auth)
      ? resultsTotalQuery1d.clone().count('r.id as cnt')
      : null,
    usersTotalQuery,
  ])

  const siteQuery = knex('Site as s')
    .innerJoin('Geography as g', 's.geographyId', 'g.id')
    .innerJoin('State as st', 'g.stateId', 'st.id')
    .select(
      's.name',
      'st.abbreviation as stateAbbr',
      's.latitude',
      's.longitude'
    )
    .modify(addConstraints, dataConstraints, {
      site: 's',
    })
  const [siteList, resultCnt, assayTypes] = yield Promise.all(
    canViewResults(auth)
      ? [
          canViewSites(auth) ? siteQuery : [],
          resultsTotalQuery30d
            .clone()
            .innerJoin('Assay as a', 'r.assayId', 'a.id')
            .innerJoin('ResultCategory as rc', 'r.resultCategory1', 'rc.id')
            .groupBy('rc.name', 'a.assayTypeId', 's.name')
            .select(
              'rc.name as resultCategory1Label',
              'a.assayTypeId',
              's.name as siteName'
            )
            .count('r.id as cnt'),
          knex('AssayType as at')
            .innerJoin('Assay as a', 'at.id', 'a.assayTypeId')
            .leftJoin('ResultCategoryAssay as rca', 'a.id', 'rca.assayId')
            .innerJoin('ResultCategory as rc', 'rca.resultCategoryId', 'rc.id')
            .groupBy('at.id')
            .select(
              'at.id',
              'at.name as assayTypeName',
              knex.raw('GROUP_CONCAT(rc.name) as resultCategoryNames')
            ),
        ]
      : [[], [], []]
  )
  const resultCntBySiteNameByAssayTypeId = _.mapValues(
    _.groupBy(resultCnt, 'assayTypeId'),
    it => _.groupBy(it, 'siteName')
  )
  const resultCntBySiteName = _.groupBy(resultCnt, 'siteName')
  siteList.forEach(it =>
    _.set(it, 'count', _.sum(_.map(resultCntBySiteName[it.name], 'cnt')))
  )

  const resultSummaryList = assayTypes
    .map(({ id, assayTypeName, resultCategoryNames }) => {
      const resultCategory1LabelList = _.uniq(resultCategoryNames.split(','))
      const data = _.map(
        resultCntBySiteNameByAssayTypeId[`${id}`],
        (it, siteName) =>
          _.reduce(
            it,
            (acc, { resultCategory1Label, cnt }) => {
              acc[resultCategory1Label] = cnt
              acc.total += cnt
              return acc
            },
            _.reduce(
              resultCategory1LabelList,
              (acc, name) => {
                acc[name] = 0
                return acc
              },
              { siteName, total: 0 }
            )
          )
      )

      return {
        assayTypeName,
        data,
        resultCategory1LabelList,
      }
    })
    .filter(({ data }) => !_.isEmpty(data))

  const result = {
    data: Object.assign({}, mockData, {
      sitesTotal: sitesTotal ? sitesTotal[0].cnt : null,
      devicesTotal: devicesTotal ? devicesTotal[0].cnt : null,
      // TODO: Remove magic numbers below when moving to "real" dashboard
      resultsTotal30d: resultsTotal30d ? resultsTotal30d[0].cnt : null,
      resultsTotal1d: resultsTotal1d ? resultsTotal1d[0].cnt : null,
      usersTotal: usersTotal[0].cnt,

      siteList,
      resultSummaryList,
    }),
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
  statusDashboard,
  operationalDashboard,
}
