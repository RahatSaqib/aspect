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
  resultSummary: [
    { name: 'Site1', data: [8, 1.5] },
    { name: 'Site2', data: [7, 0.5] },
    { name: 'Site3', data: [3, 2] },
    { name: 'Site4', data: [4, 1] },
    { name: 'Site5', data: [6, 2] },
    { name: 'Site6', data: [8, 1] },
    { name: 'Site7', data: [9, 2] },
    { name: 'Site8', data: [6, 2] },
    { name: 'newSite1', data: [4, 1] },
    { name: 'newSite2', data: [7, 0.6] },
    { name: 'newSite3', data: [9, 2] },
    { name: 'newSite4', data: [7, 1] },
    { name: 'newSite5', data: [6, 1.5] },
    { name: 'newSite6', data: [4, 1] },
    { name: 'newSite7', data: [9, 1] },
    { name: 'newSite8', data: [8, 2] },
  ],
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
    .count('s.id as cnt')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .modify(addConstraints, dataConstraints, { site: 's', geography: 'g' })

  const devicesTotalQuery = knex('Device as d')
    .count('d.id as cnt')
    .innerJoin('Site as s', 's.id', 'd.siteId')
    .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .innerJoin('DeviceTypeCategory as dc', 'dc.id', 'dt.deviceTypeCategoryId')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .where('dc.hasResults', 1)
    .modify(addConstraints, dataConstraints, { site: 's', geography: 'g' })

  const resultsTotalQuery30d = knex('Result as r')
    .count('r.id as cnt')
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
    .count('r.id as cnt')
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
    canViewSites(auth) ? sitesTotalQuery : null,
    canViewDevices(auth) ? devicesTotalQuery : null,
    canViewResults(auth) ? resultsTotalQuery30d : null,
    canViewResults(auth) ? resultsTotalQuery1d : null,
    usersTotalQuery,
  ])

  const result = {
    data: Object.assign(
      {
        sitesTotal: sitesTotal ? sitesTotal[0].cnt : null,
        devicesTotal: devicesTotal ? devicesTotal[0].cnt : null,
        // TODO: Remove magic numbers below when moving to "real" dashboard
        resultsTotal30d: resultsTotal30d ? resultsTotal30d[0].cnt : null,
        resultsTotal1d: resultsTotal1d ? resultsTotal1d[0].cnt : null,
        usersTotal: usersTotal[0].cnt,
      },
      mockData
    ),
  }

  return result
}

module.exports = {
  statusDashboard,
}
