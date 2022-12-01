const _ = require('lodash')
const { knex, filterParams, sortPageParams, filterDateRangeParams } = require('../../db')
const { allResultCategoryToId } = require('../../shared/dictionary')
const { addConstraints } = require('../../auth/constraints')
const { getBaseQuery: getResultBaseQuery, modifiers } = require('../../result/query')

function getDeviceBaseExtendedQuery(
  query,
  dataConstraints,
  showUnapprovedDevices = false,
  showDecommissionedDevices = false
) {
  const deviceQuery = knex('Device as d')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .leftJoin('Assay as a', 'dt.id', 'a.deviceTypeId')
    .innerJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
    .innerJoin('DeviceTypeCategory as dc', 'dt.deviceTypeCategoryId', 'dc.id')
    .innerJoin('Site as s', 'd.siteId', 's.id')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as lg', 'g.lgaId', 'lg.id')
    .where(queryBuilder => {
      if (!query.deviceIds) {
        return
      }
      queryBuilder.whereIn('d.id', query.deviceIds.split(','))
    })
    .modify(queryBuilder => {
      if (query.assayId || query.assayExternalId) queryBuilder.innerJoin('Assay as a', 'dt.id', 'a.deviceTypeId')
      if (query.assayId) {
        const { assayId } = query
        const assayIds = _.isArray(assayId) ? assayId : [assayId]
        queryBuilder.whereIn('a.id', assayIds)
      }
      if (query.assayExternalId) queryBuilder.where('a.externalId', query.assayExternalId)
      if (query.resultCategoryId)
        queryBuilder
          .innerJoin('ResultCategoryAssay as rca', 'a.id', 'rca.assayId')
          .where('rca.resultCategoryId', query.resultCategoryId)

      if (query.resultCategory2Id)
        queryBuilder
          .innerJoin('ResultCategoryAssay as rca2', 'a.id', 'rca2.assayId')
          .where('rca2.resultCategoryId', query.resultCategory2Id)
    })
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      deviceName: 'd.name',
      deviceApprovalId: 'd.deviceApprovalId',
      deviceTypeId: 'd.deviceTypeId',
      deviceType: 'dt.externalId',
      hasConnectivity: 'dc.hasConnectivity',
      hasResults: 'dc.hasResults',
      category: 'dc.name',
      type: 'dt.name',
      siteExternalId: 's.externalId',
      siteName: 's.name',
    })
    .modify(addConstraints, dataConstraints, {
      assay: 'a',
      device: 'd',
      deviceType: 'dt',
      geography: 'g',
      site: 's',
      showDecommissionedDevices,
      showUnapprovedDevices,
    })
  return deviceQuery
}

async function getBasicsForDevicesReport(dataConstraints, query) {
  const resultCategoryIds = await allResultCategoryToId()
  const deviceQuery = getDeviceBaseExtendedQuery(query, dataConstraints)

  // get total count for paging
  const getCount = deviceQuery.clone().countDistinct('d.id').as('count').first()
  const queryResults = knex('Result as r')
    .leftJoin('Sample as sa', 'r.sampleId', 'sa.id')
    .modify(addConstraints, dataConstraints, {
      result: 'r',
      sample: 'sa',
    })
    .whereRaw('r.deviceId = d.id')
    .modify(filterDateRangeParams, query, 'r.endedOn')

  return {
    getCount,
    queryResults,
    deviceQuery,
    resultCategoryIds,
  }
}

async function getSourceDevices(sourceDevicesIds) {
  return knex('Device').whereIn('id', sourceDevicesIds).select('id', 'lastPingOn', 'siteId', 'deviceTypeId')
}

async function getTargetDevice(targetDeviceId) {
  return knex('Device').where('id', targetDeviceId).first('id', 'siteId', 'deviceTypeId')
}

/**
 * Builds a knex query object including all 'join' and 'where' for managing constraints.
 * @param {object} dataConstraints
 * @param {object} options An object representing the dataConstraints options, including the constraint-table-name definition, and also additional configurations like showUnapprovedDevices and showDecommissionedDevices. For example: { assay: 'a', showUnapprovedDevices: true, showDecommissionedDevices: true }
 * @returns The knex query object.
 */
function getDeviceBaseQuery(dataConstraints, options) {
  return knex('Device as d')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceTypeCategory as dtc', 'dt.deviceTypeCategoryId', 'dtc.id')
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      deviceType: 'dt',
      ...(options || {}),
    })
}

const getNotDecommissionedDevices = dataConstraints =>
  getDeviceBaseQuery(dataConstraints, { showUnapprovedDevices: true })

async function mergeIssuesFromDuplicatedResults(devicesToMerge, trknex) {
  const {
    sourceDevice: { id: sourceDeviceId },
    targetDevice: { id: targetDeviceId },
  } = devicesToMerge

  await trknex('Issue as i')
    .update('i.deviceId', targetDeviceId)
    .update('i.resultId', trknex.raw('pivot.targetResultId'))
    .join(
      knex('Result as sr')
        .join('Result as tr', 'sr.externalId', 'tr.externalId')
        .where('sr.deviceId', sourceDeviceId)
        .where('tr.deviceId', targetDeviceId)
        .select({ sourceResultId: 'sr.id', targetResultId: 'tr.id', externalId: 'sr.externalId' })
        .as('pivot'),
      'i.resultId',
      'pivot.sourceResultId'
    )
    .where('i.id', '>', 0)
}

async function mergeDeviceLevelIssues(devicesToMerge, trknex) {
  const {
    sourceDevice: { id: sourceDeviceId },
    targetDevice: { id: targetDeviceId },
  } = devicesToMerge

  await trknex('Issue').where('deviceId', sourceDeviceId).whereNull('resultId').update('deviceId', targetDeviceId)
}

async function mergeNonRepeatedResults(devicesToMerge, trknex) {
  const {
    sourceDevice: { id: sourceDeviceId },
    targetDevice: { id: targetDeviceId },
  } = devicesToMerge

  const repeatedResultsQuery = trknex(
    trknex('Result')
      .where('deviceID', targetDeviceId)
      .where('externalId', knex.raw(`sourceResults.externalId`))
      .select('externalId')
      .as('t')
  ).select('t.externalId')

  await trknex('Result as sourceResults')
    .where({ deviceId: sourceDeviceId })
    .whereNotIn('sourceResults.externalId', repeatedResultsQuery)
    .update('deviceId', targetDeviceId)

  await trknex('DeviceLog').where({ deviceId: sourceDeviceId }).update({ deviceId: targetDeviceId })
}

async function mergeMessages(devicesToMerge, trknex) {
  const {
    sourceDevice: { id: sourceDeviceId },
    targetDevice: { id: targetDeviceId },
  } = devicesToMerge

  const messagesToMergeFilter = qb =>
    qb
      .where({ deviceId: sourceDeviceId })
      .where(qb =>
        qb
          .whereIn('m.resultId', knex('Result as r').where('r.deviceId', targetDeviceId).select('id'))
          .orWhereNull('m.resultId')
      )

  await trknex('AlertMessage as m').modify(messagesToMergeFilter).update('deviceId', targetDeviceId)

  await trknex('EmailMessage as m').modify(messagesToMergeFilter).update('deviceId', targetDeviceId)

  await trknex('PushNotificationMessage as m').modify(messagesToMergeFilter).update('deviceId', targetDeviceId)

  await trknex('SmsMessage as m').modify(messagesToMergeFilter).update('deviceId', targetDeviceId)

  await trknex('WebhookMessage as m').modify(messagesToMergeFilter).update('deviceId', targetDeviceId)
}

async function getDevicesIdsCheckingConstraints(allDevicesIds, dataConstraints) {
  return knex('Device as d')
    .whereIn('d.id', allDevicesIds)
    .join('Site as s', 'd.siteId', 's.id')
    .modify(addConstraints, dataConstraints, { site: 's' })
    .select('d.id')
}

// Delete device
async function deleteNotifications(deviceId, trknex) {
  await trknex('Notification').whereIn('resultId', trknex('Result').where('deviceId', deviceId).select('id')).del()
  await trknex('Notification').whereIn('issueId', trknex('Issue').where('deviceId', deviceId).select('id')).del()
}

async function deleteIssues(deviceId, trknex) {
  await trknex('Issue').where('deviceId', deviceId).del()
}

async function deleteResultDownloadLog(deviceId, trknex) {
  await trknex('ResultDownloadLog').whereIn('resultId', trknex('Result').where('deviceId', deviceId).select('id')).del()
}

async function deleteDeviceLog(deviceId, trknex) {
  await trknex('DeviceLog').whereIn('resultId', trknex('Result').where('deviceId', deviceId).select('id')).del()
}

async function deleteMessages(deviceId, trknex) {
  await trknex('EmailMessage').where('deviceId', deviceId).del()
  await trknex('PushNotificationMessage').where('deviceId', deviceId).del()
  await trknex('SmsMessage').where('deviceId', deviceId).del()
  await trknex('WebhookMessage').where('deviceId', deviceId).del()
}

async function deleteResults(deviceId, trknex) {
  await trknex('Result').where('deviceId', deviceId).del()
}

async function deleteDeviceFromDeviceOperation(deviceId, trknex) {
  await trknex('DeviceOperation').where('deviceId', deviceId).del()
}

async function deleteDeviceFromDeviceMaintenance(deviceId, trknex) {
  await trknex('DeviceMaintenance').where('deviceId', deviceId).del()
}

async function deleteDeviceFromDeviceApprovalLog(deviceId, trknex) {
  await trknex('DeviceApprovalLog').where('deviceId', deviceId).del()
}

async function deleteDeviceFromDeviceApiRaw(deviceId, trknex) {
  await trknex('DeviceApiRaw as dar')
    .whereIn('dar.deviceApiKeyId', trknex('DeviceApiKey as dak').where('dak.deviceId', deviceId).select('id'))
    .del()
}

async function deleteDeviceFromDeviceApiKey(deviceId, trknex) {
  await trknex('DeviceApiKey').where('deviceId', deviceId).del()
}

async function deleteDeviceFromDeviceSim(deviceId, trknex) {
  await trknex('DeviceSim').where('deviceId', deviceId).del()
}

async function deleteDeviceFromDeviceTag(deviceId, trknex) {
  await trknex('DeviceTag').where('deviceId', deviceId).del()
}

async function deleteDeviceFromFactTables(deviceId, trknex) {
  await trknex('FactDeviceExternalSource').where({ deviceId }).del()
  await trknex('FactDeviceFlag').where({ deviceId }).del()
  await trknex('FactResultsDevice').where({ deviceId }).del()
  await trknex('FactResultsDeviceByAssay').where({ deviceId }).del()
  await trknex('FactResultsDeviceByCategory1').where({ deviceId }).del()
  await trknex('FactResultsDeviceByCategory1And2').where({ deviceId }).del()
  await trknex('FactResultsDeviceByTimeFrame').where({ deviceId }).del()
}

async function deleteDeviceSiteHistory(deviceId, trknex) {
  await trknex('DeviceSiteHistory').where('id', deviceId).del()
}

async function deleteDevice(deviceId, trknex) {
  await trknex('Device').where('id', deviceId).del()
}

/**
 * Gets an object containing the i18n keys, the result categories ids, and category labels for the result category 1 and 2
 * @returns An object with the next shape:
 * {
 *   resultCategory1LabelI18nKey,   // The i18nKey of the resultCategory1 label for the assay
 *   resultCategory2LabelI18nKey,   // The i18nKey of the resultCategory2 label for the assay
 *   resultCategory1ResultsId,      // A csv containing the list of possible result category 1 ids for the assay
 *   resultCategory1ResultsI18nKey, // A csv containing the list of possible result category 1 i18n keys for the assay (same order than resultCategory1ResultsId)
 *   resultCategory2ResultsId,      // A csv containing the list of possible result category 2 ids for the assay
 *   resultCategory2ResultsId       // A csv containing the list of possible result category 2 i18n keys for the assay (same order than resultCategory2ResultsId)
 * }
 */
function getResultCategoriesByAssay(assayId) {
  return knex('ResultCategoryGroup as rcg')
    .innerJoin('Assay as a', 'rcg.assayId', 'a.id')
    .leftJoin('ResultCategory as rc1', 'rcg.resultCategory1Id', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'rcg.resultCategory2Id', 'rc2.id')
    .where('a.id', assayId)
    .select({
      resultCategory1Label: 'a.resultCategory1Label',
      resultCategory2Label: 'a.resultCategory2Label',
      resultCategory1LabelI18nKey: 'a.resultCategory1I18nKey',
      resultCategory2LabelI18nKey: 'a.resultCategory2I18nKey',
      resultCategory1ResultsId: knex.raw('GROUP_CONCAT(DISTINCT rc1.id ORDER BY rc1.id)'),
      resultCategory1ResultsI18nKey: knex.raw('GROUP_CONCAT(DISTINCT rc1.i18nKey ORDER BY rc1.id)'),
      resultCategory2ResultsId: knex.raw('GROUP_CONCAT(DISTINCT rc2.id ORDER BY rc2.id)'),
      resultCategory2ResultsI18nKey: knex.raw('GROUP_CONCAT(DISTINCT rc2.i18nKey ORDER BY rc2.id)'),
      resultCategory2ResultsLabel: knex.raw('GROUP_CONCAT(DISTINCT rc2.name ORDER BY rc2.id)'),
      resultCategory1ResultsLabel: knex.raw('GROUP_CONCAT(DISTINCT rc1.name ORDER BY rc1.id)'),
    })
    .first()
}

function getFirstAndLastResults(dataConstraints, assayId) {
  return knex('Result as _r')
    .modify(addConstraints, dataConstraints, { result: '_r' })
    .groupBy('deviceId')
    .select({
      deviceId: 'deviceId',
      firstEndedOn: knex.raw('MIN(endedOn)'),
      lastEndedOn: knex.raw('MAX(endedOn)'),
    })
    .where('assayId', assayId)
    .as('firstAndLastResults')
}

async function getDeviceWorkload(extraColumns, dataConstraints, query) {
  const { assayId } = query
  const q = knex('Device as d')
    .innerJoin('Site as s', 'd.siteId', 's.id')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceTypeCategory as dtc', 'dt.deviceTypeCategoryId', 'dtc.id')
    .innerJoin('Geography as g', 's.geographyId', 'g.id')
    .innerJoin('State as st', 'g.stateId', 'st.id')
    .innerJoin('Lga as lg', 'g.lgaId', 'lg.id')
    .innerJoin('Assay as a', joinAssay => {
      joinAssay.on('dt.id', 'a.deviceTypeId').andOn('a.id', knex.raw(assayId))
    })
    .innerJoin('AssayType as at', 'a.assayTypeId', 'at.id')
    .leftJoin('Result as r', joinResultQuery => {
      joinResultQuery.on('d.id', 'r.deviceId').andOn('r.assayId', knex.raw(assayId))

      if (query.minDate) joinResultQuery.andOn('r.endedOn', '>', knex.raw(`'${query.minDate.toISOString()}'`))

      if (query.maxDate) joinResultQuery.andOn('r.endedOn', '<=', knex.raw(`'${query.maxDate.toISOString()}'`))
    })
    .leftJoin('DeviceMaintenanceStatusLog as dmsl', 'd.deviceMaintenanceStatusLogId', 'dmsl.id')
    .leftJoin('DeviceMaintenanceStatus as dms', 'dmsl.deviceMaintenanceStatusId', 'dms.id')
    .leftJoin(getFirstAndLastResults(dataConstraints, assayId), 'd.id', 'firstAndLastResults.deviceId')
    .modify(addConstraints, dataConstraints, { device: 'd', geography: 'g' })
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      deviceName: 'd.name',
      siteExternalId: 's.externalId',
      siteName: 's.name',
      siteId: 's.id',
      deviceMaintenanceStatusId: 'dms.id',
    })
    .andWhere('dtc.hasResults', true)

  const { total } = await q.clone().select(knex.raw('COUNT(DISTINCT d.id) as total')).first()
  const data = await q
    .modify(sortPageParams, query, 'name')
    .select(
      'd.name',
      'dms.i18nKey as deviceStatus',
      'dms.name as deviceStatusLabel',
      'd.lastPingOn',
      'firstAndLastResults.firstEndedOn as firstResultEndedOn',
      'firstAndLastResults.lastEndedOn as lastResultEndedOn',
      'st.name as stateName',
      'lg.name as lgaName',
      's.name as siteName',
      knex.raw('COUNT(r.id) as total')
    )
    .modify(q => {
      extraColumns.forEach(ec => q.select({ [ec.fieldId]: knex.raw(ec.selector) }))
    })
    .groupBy('d.id')
  const { length } = data
  return { total, data, length }
}

async function joinModuleAvailability(dataConstraints, query) {
  const [issueTypeModuleDisabledId] = await knex('IssueType').where({ name: 'Module Disabled' }).pluck('id')
  const [issueStatusActiveId] = await knex('IssueStatus').where({ name: 'Active' }).pluck('id')

  const lastResults = getResultBaseQuery(knex, dataConstraints)
    .modify(modifiers.join.lastResultPerModuleBay, knex)
    .select(['r.deviceId', 'r.moduleSerial as moduleSerial'])
    .whereRaw('r.moduleName is not null')
    .modify(filterDateRangeParams, query, 'r.endedOn')

  const moduleAvailabilityQuery = knex
    .from(lastResults.as('lastResult'))
    .leftJoin('Issue as issueModuleDisabled', function () {
      this.on('issueModuleDisabled.deviceId', 'lastResult.deviceId')
        .andOn('lastResult.moduleSerial', knex.raw('issueModuleDisabled.data ->> "$.moduleSerial"'))
        .andOn('issueModuleDisabled.issueTypeId', issueTypeModuleDisabledId)
        .andOn('issueModuleDisabled.issueStatusId', issueStatusActiveId)
    })
    .select([
      'lastResult.deviceId',
      knex.raw('sum(case when issueModuleDisabled.id is null then 1 else 0 end) as enabled'),
      knex.raw('sum(case when issueModuleDisabled.id is null then 0 else 1 end) as disabled'),
    ])
    .groupBy('lastResult.deviceId')

  return queryBuilder => {
    queryBuilder.leftJoin(moduleAvailabilityQuery.as('moduleAvailability'), function () {
      this.on('moduleAvailability.deviceId', 'd.id')
    })
  }
}

function getResultCategoryGroupColumns() {
  return knex
    .from('Assay AS a')
    .innerJoin('AssayType AS at', 'a.assayTypeId', 'at.id')
    .innerJoin('Disease AS ds', 'at.diseaseId', 'ds.id')
    .innerJoin('ResultCategoryGroup AS rcg', 'a.id', 'rcg.assayId')
    .innerJoin('ResultCategory AS rc1', 'rcg.resultCategory1Id', 'rc1.id')
    .leftJoin('ResultCategory AS rc2', 'rcg.resultCategory2Id', 'rc2.id')
    .select([
      'rcg.assayId',
      'rcg.resultCategory1Id',
      'rcg.resultCategory2Id',
      knex.raw('CONCAT(rcg.assayId, "_",IFNULL(rc1.id, ""), "_", IFNULL(rc2.id, "")) AS columnKey'),
      knex.raw(
        'CONCAT(resultCategory1Label, " ", rc1.name, IFNULL(CONCAT(" ", resultCategory2Label, " ", rc2.name), "")) AS columnName'
      ),
    ])
}
module.exports = {
  getDeviceWorkload,
  getResultCategoriesByAssay,
  getDeviceBaseQuery,
  getDeviceBaseExtendedQuery,
  getBasicsForDevicesReport,
  getSourceDevices,
  getTargetDevice,
  mergeIssuesFromDuplicatedResults,
  mergeDeviceLevelIssues,
  deleteNotifications,
  deleteIssues,
  mergeNonRepeatedResults,
  mergeMessages,
  getDevicesIdsCheckingConstraints,
  deleteResultDownloadLog,
  deleteMessages,
  deleteResults,
  deleteDeviceLog,
  deleteDeviceFromDeviceOperation,
  deleteDeviceFromDeviceMaintenance,
  deleteDeviceFromDeviceApprovalLog,
  deleteDeviceFromDeviceApiRaw,
  deleteDeviceFromDeviceApiKey,
  deleteDeviceFromDeviceSim,
  deleteDeviceFromDeviceTag,
  deleteDeviceFromFactTables,
  deleteDeviceSiteHistory,
  deleteDevice,
  getNotDecommissionedDevices,
  joinModuleAvailability,
  getFirstAndLastResults,
  getResultCategoryGroupColumns,
}
