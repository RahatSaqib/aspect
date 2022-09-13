const _ = require('lodash')
const subDays = require('date-fns/subDays')
const differenceInDays = require('date-fns/differenceInDays')
const { knex } = require('../db')
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
const { queryValue } = require('../shared/sql-2-knex')
const { addExtraData } = require('./options')

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
  const { layout, dashboard = 'home' } = options
  const tableName = layout === 'target' ? 'DashboardWidgetTarget' : 'DashboardWidgetStat'
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
    .distinct(['w.*', 'sw.*'])
    .orderBy(['w.sortOrder'])
  return widgets
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
      const { sqlForExtra, sqlForIndicator, sqlForStatUnit, options } = widget
      const unit = await queryValue(sqlForStatUnit, dataConstraints, query)
      const extra = await queryValue(sqlForExtra, dataConstraints, query)
      const { cnt: countCnt, ...restCountProps } = (await queryValue(sqlForIndicator, dataConstraints, query)) || {
        cnt: null,
      }

      widget = _.assign(_.omit(widget, ['sqlForIndicator', 'sqlForStatUnit', 'sqlForExtra', 'sortOrder']), {
        count: countCnt || 0,
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
      const count = await queryValue(widget.sqlForIndicator, dataConstraints, query)

      const target = await knex('Target as t')
        .innerJoin('Geography as g', 't.geographyId', 'g.id')
        .where({ 't.targetToken': widget.targetToken })
        .modify(addConstraints, dataConstraints, {
          geography: 'g',
        })
        .sum('t.targetValue as cnt')
        .first()

      const dataCollection = await queryValue(widget.sqlForDataCollection, dataConstraints, query)

      return _.assign(_.pick(widget, ['id', 'title', 'thresholdPercentageDataCollection', 'link']), {
        count: count ? count.cnt : 0,
        target: target ? Math.round(target.cnt / targetDivide) : 0,
        dataCollection: dataCollection ? dataCollection.cnt : 0,
      })
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
    .select('s.id', 's.name', 'st.abbreviation as stateAbbr', 's.latitude', 's.longitude')
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
            .select('rc.externalId as resultCategory1ExternalId', 'a.assayTypeId', 'd.siteId')
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
              knex.raw('GROUP_CONCAT(rc.externalId) as rawResultCategoryExternalIds'),
              knex.raw('GROUP_CONCAT(rc.name) as rawResultCategoryNames')
            ),
        ]
      : [[], [], []]
  )
  const resultCntBySiteIdByAssayTypeId = _.mapValues(_.groupBy(resultCnt, 'assayTypeId'), it => _.groupBy(it, 'siteId'))
  const resultCntBySiteId = _.groupBy(resultCnt, 'siteId')
  siteList.forEach(it => _.set(it, 'count', _.sum(_.map(resultCntBySiteId[it.id], 'cnt'))))

  const resultSummaryList = assayTypes
    .map(({ id, assayTypeName, rawResultCategoryExternalIds, rawResultCategoryNames }) => {
      const resultCategoryExternalIds = _.uniq(rawResultCategoryExternalIds.split(','))
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
        resultCategories: _.zipWith(resultCategoryExternalIds, resultCategoryNames, (externalId, name) => ({
          externalId,
          name,
        })),
      }
    })
    .filter(({ data }) => !_.isEmpty(data))

  const result = {
    data: {
      siteList,
      resultSummaryList,
    },
  }

  return result
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
          const { consumableId, consumableName, consumableExternalId, i18nKey } = list[0]
          acc.push({
            consumableId,
            consumableExternalId,
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

async function getDeviceList(auth, dataConstraints) {
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
      knex.raw("sum(ist.externalId not in ('Inactive', 'OK', 'Resolved')) as totalIssues"),
      knex.raw(
        "sum((it.externalId = 'DeviceNoResults' or it.externalId = 'DeviceOffline') and ist.externalId not in ('Inactive', 'OK', 'Resolved')) as cntNoResults"
      ),
      knex.raw(
        "sum((it.externalId like 'Machine%' or it.externalId like 'Module%' or it.externalId like 'Reagent%') and ist.externalId not in ('Inactive', 'OK', 'Resolved')) as cntErrorRate"
      )
    )
    .then(items =>
      items.reduce((memo, { id, siteId, totalIssues, cntNoResults, cntErrorRate }) => {
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
      }, [])
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

  const result = {
    data: {
      deviceList,
    },
  }

  return result
}

async function siteDashboard(request) {
  const { auth } = request

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const siteList = await getSiteList(auth, dataConstraints)
  const assayResultCategoryList = await getAssayResultCategoryList(dataConstraints)

  const result = {
    data: {
      assayResultCategoryList,
      siteList,
    },
  }

  return result
}

async function actionDashboard(request) {
  const { auth, query } = request
  const user = await getUser(auth.credentials.name)
  const dataConstraints = await getConstraints(auth.credentials, 'actionDashboard')

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

  const alertMessagesByIssue = _.map(_.values(_.groupBy(alertMessages, 'issueId')), issueMessages => {
    const highestLevelMessage = _.head(_.orderBy(issueMessages, 'notificationTypeLevel', 'desc'))
    highestLevelMessage.message = processDynamicMessage(highestLevelMessage.message)
    if (highestLevelMessage.canAcknowledge && highestLevelMessage.personId !== user.personId) {
      highestLevelMessage.canAcknowledge = 0
    }
    return highestLevelMessage
  })
  const shouldAddStockLevelUpdateActions = await hasPermissions(auth, ['dashboard:actionInventoryLevelUpdate'])

  if (shouldAddStockLevelUpdateActions) {
    await addStockLevelUpdateActions(auth, dataConstraints, alertMessagesByIssue, query.siteId)
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

async function addStockLevelUpdateActions(auth, dataConstraints, actionDashboardAlertMessages, siteId = null) {
  const inventoryCutoff = subDays(new Date(), 30)
  let inventoryOutdated = false

  if (canViewInventories(auth)) {
    const { id: assayId } = await knex('Assay').where('externalId', 'GxMtbRif').first('id')

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
            inventoryOutdated = inventoryItem.updatedOn ? inventoryItem.updatedOn < inventoryCutoff : false
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
    _.forEach(inventoryItemsBySite, ([{ siteId, siteName, totalInStock, consumableId }]) => {
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
        statusI18nKey: totalInStock <= 0 ? 'issueStatusActive' : 'issueStatusOk',
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
    })
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
    .select(knex.raw(`CONCAT(at.id,'-',rc.id) as id`), knex.raw(`CONCAT(at.name,': ',rc.name) as name`))

  return assayResultCategory
}

module.exports = {
  summaryDashboard,
  targetDashboard,
  resultDashboard,
  inventoryItemDashboard,
  deviceDashboard,
  siteDashboard,
  actionDashboard,
  resultsTransmittedDashboard,
  activityOverTimeDashboard,
}
