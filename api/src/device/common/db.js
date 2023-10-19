const _ = require('lodash')
const Promise = require('bluebird')
const { knex, filterParams, sortPageParams, filterDateRangeParams } = require('../../db')
const { allResultCategoryToId, resultCategoryToId, deviceMaintenanceTypeToId } = require('../../shared/dictionary')
const { getConstraints, addConstraints } = require('../../auth/constraints')
const { getBaseQuery: getResultBaseQuery, modifiers } = require('../../result/query')
const { getDateTimeProjectionInUserTimeZone } = require('../../shared/date')
const { usedAssay } = require('../../assay/common/db')
const { INTERNAL_DEVICE_IDS } = require('../../shared/constants')

const SELECT_SHOW_FIELDS = [
  'd.id',
  'd.name',
  'd.shortName',
  'd.createdOn',
  'd.lastPingOn',
  'd.lastSeenOn as lastSeen',
  'd.implementingPartnerId',
  'ip.name as implementingPartnerName',
  'da.name as approval',
  'dms.externalId as maintenanceStatus',
  'dms.i18nKey as maintenanceStatusI18nKey',
  'dms.name as maintenanceStatusName',
  'dms.active as maintenanceStatusActive',
  'dms.manuallySet as maintenanceStatusManuallySet',
  'da.token as approvalToken',
  'da.i18nKey as approvalStatusI18nKey',
  'dc.name as category',
  'dc.hasResults',
  'dc.hasConnectivity',
  'd.siteId',
  's.name as siteName',
  'd.hostId',
  'd.deviceTypeId',
  'd.deviceApprovalId',
  'd.instrumentsConnected',
  'd.gx6cModulesCount',
  'd.gx10cModulesCount',
  'd.configurationData',
  'd.notes',
  'd.serial',
  'dt.id as deviceTypeId',
  'dt.name as deviceTypeName',
  'dt.externalId as deviceTypeExternalId',
  'dt.configurationDataSchema',
  'dt.deviceOperationSchema',
  'dp.dailyCapacity',
  'dp.id as dailyCapacityId',
  'dp.modules as dailyCapacityModules',
  'dp.i18nKey as dailyCapacityModulesI18nKey',
  'frd30.resultCount as resultCountThisMonth',
  'frd60.resultCount as resultCount60',
  knex.raw('ifnull(frd30Errors.resultCount, 0) as errorCountThisMonth'),
  knex.raw('ifnull(frd60Errors.resultCount, 0) as errorCount60'),
  knex.raw("dmsl.data->>'$.options.data.notes' as maintenanceStatusNotes"),
  knex.raw("dmsl.data->>'$.options.data.expectedBackOnline' as expectedBackOnline"),
  'dmC.contextDate as calibrationDate',
  'dmC.notes as calibrationNotes',
  'dmW.contextDate as warrantyDueDate',
  'dmW.notes as warrantyNotes',
]

async function getDeviceByDeviceId({ deviceId, credentials, fields = SELECT_SHOW_FIELDS }) {
  const dataConstraints = await getConstraints(credentials)

  const maintenanceCalibrationId = await deviceMaintenanceTypeToId('calibration')
  const maintenanceWarrantyId = await deviceMaintenanceTypeToId('warranty')

  const resultCategoryErrorId = await resultCategoryToId('Error')

  const device = await getDeviceByIdBaseQuery(dataConstraints, deviceId, fields, true, true)
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
    .innerJoin('DeviceTypeCategory as dc', 'dt.deviceTypeCategoryId', 'dc.id')
    .leftJoin('DeviceCapacity as dp', 'd.deviceCapacityId', 'dp.id')
    .leftJoin('FactResultsDevice as frd30', function () {
      this.on('d.id', 'frd30.deviceId').andOn('frd30.days', 30)
    })
    .leftJoin('FactResultsDevice as frd60', function () {
      this.on('d.id', 'frd60.deviceId').andOn('frd60.days', 60)
    })
    .leftJoin('FactResultsDeviceByCategory1 as frd30Errors', function () {
      this.on('d.id', 'frd30Errors.deviceId')
        .andOn('frd30Errors.days', 30)
        .andOn('frd30Errors.resultCategory1', resultCategoryErrorId)
    })
    .leftJoin('FactResultsDeviceByCategory1 as frd60Errors', function () {
      this.on('d.id', 'frd60Errors.deviceId')
        .andOn('frd60Errors.days', 60)
        .andOn('frd60Errors.resultCategory1', resultCategoryErrorId)
    })
    // device calibration
    .leftOuterJoin('DeviceMaintenance as dmC', function () {
      this.on('d.id', 'dmC.deviceId')
        .andOn('dmC.current', 1)
        .andOn('dmC.deviceMaintenanceTypeId', maintenanceCalibrationId)
    })
    // device warranty
    .leftOuterJoin('DeviceMaintenance as dmW', function () {
      this.on('d.id', 'dmW.deviceId')
        .andOn('dmW.current', 1)
        .andOn('dmW.deviceMaintenanceTypeId', maintenanceWarrantyId)
    })
    .leftJoin('DeviceMaintenanceStatusLog as dmsl', 'd.deviceMaintenanceStatusLogId', 'dmsl.id')
    .leftJoin('DeviceMaintenanceStatus as dms', 'dmsl.deviceMaintenanceStatusId', 'dms.id')
    .leftJoin('Partner as ip', 'd.implementingPartnerId', 'ip.id')
    .modify(
      addConstraints,
      dataConstraints,
      {
        device: 'd',
        deviceType: 'dt',
      },
      { showUnapprovedDevices: true, showDecommissionedDevices: true }
    )

  if (!device) {
    return null
  }

  device.configurationData = JSON.parse(device.configurationData) || {}
  device.deviceType = {
    id: device.deviceTypeId,
    name: device.deviceTypeName,
    externalId: device.deviceTypeExternalId,
    configurationDataSchema: JSON.parse(device.configurationDataSchema) || {},
    deviceOperationSchema: JSON.parse(device.deviceOperationSchema) || {},
  }
  delete device.deviceTypeId
  delete device.deviceTypeName
  delete device.deviceTypeExternalId
  delete device.configurationDataSchema
  delete device.deviceOperationSchema

  device.resultCountLastMonth = device.resultCount60 - device.resultCountThisMonth
  device.errorCountLastMonth = device.errorCount60 - device.errorCountThisMonth

  device.utilizationRateThisMonth = device.dailyCapacity
    ? device.resultCountThisMonth / (device.dailyCapacity * 30)
    : null

  device.errorRateThisMonth = device.resultCountThisMonth
    ? device.errorCountThisMonth / device.resultCountThisMonth
    : null

  return device
}

function getDeviceByIdBaseQuery(
  dataConstraints,
  deviceId,
  fields = 'd.*',
  showUnapprovedDevices = false,
  showDecommissionedDevices = false
) {
  const query = knex('Device as d')
    .innerJoin('Partner as p', 'd.partnerId', 'p.id')
    .innerJoin('Site as s', 'd.siteId', 's.id')
    .innerJoin('Geography as g', 's.geographyId', 'g.id')
    .modify(
      addConstraints,
      dataConstraints,
      {
        partner: 'p',
        geography: 'g',
        site: 's',
        device: 'd',
      },
      { showUnapprovedDevices, showDecommissionedDevices }
    )
    .where('d.id', +deviceId)
    .first(fields)

  return query
}

function getDeviceBaseExtendedQuery(
  query,
  dataConstraints,
  {
    showUnapprovedDevices = false,
    showDecommissionedDevices = false,
    excludeInternalDevices = true,
    extendJoinToAssays = false,
  } = {
    showUnapprovedDevices: false,
    showDecommissionedDevices: false,
    excludeInternalDevices: true,
    extendJoinToAssays: false,
  }
) {
  const deviceQuery = knex('Device as d')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
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
      if (extendJoinToAssays) queryBuilder.leftJoin('Assay as a', 'dt.id', 'a.deviceTypeId')
      else if (query.assayExternalId)
        queryBuilder.innerJoin('Assay as a', 'dt.id', 'a.deviceTypeId').where('a.externalId', query.assayExternalId)

      if (query.resultCategoryId)
        queryBuilder
          .innerJoin('ResultCategoryAssay as rca', 'a.id', 'rca.assayId')
          .where('rca.resultCategoryId', query.resultCategoryId)

      if (query.resultCategory2Id)
        queryBuilder
          .innerJoin('ResultCategoryAssay as rca2', 'a.id', 'rca2.assayId')
          .where('rca2.resultCategoryId', query.resultCategory2Id)

      if (excludeInternalDevices) queryBuilder.whereNotIn('dt.externalId', INTERNAL_DEVICE_IDS)
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
      assayId: 'a.id',
    })
    .modify(
      addConstraints,
      dataConstraints,
      {
        assay: 'a',
        device: 'd',
        deviceType: 'dt',
        geography: 'g',
        site: 's',
      },
      { showDecommissionedDevices, showUnapprovedDevices }
    )
  return deviceQuery
}

async function getBasicsForDevicesReport(dataConstraints, query) {
  const resultCategoryIds = await allResultCategoryToId()
  const deviceQuery = getDeviceBaseExtendedQuery(query, dataConstraints, { extendJoinToAssays: true })

  // get total count for paging
  const getCount = deviceQuery.clone().countDistinct('d.id as count').first()
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

async function getLastUploadDateBySites(siteIds, timeOffset) {
  return knex('Result as r')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('Site as s', 'd.siteId', 's.id')
    .whereIn('s.id', siteIds)
    .groupBy('s.id')
    .select({
      siteId: 's.id',
      lastUploadOn: getDateTimeProjectionInUserTimeZone(knex, 'MAX(r.endedOn)', timeOffset),
    })
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
 * @param {aliases} aliases An object representing the aliases for the tables used in the query.e.g. { assay: 'a'}
 * @param {object} options An object representing the dataConstraints options, like showUnapprovedDevices
 *  and showDecommissionedDevices.
 *  For example: { showUnapprovedDevices: true, showDecommissionedDevices: true }
 * @returns The knex query object.
 */
function getDeviceBaseQuery(dataConstraints, aliases, options = {}) {
  return knex('Device as d')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceTypeCategory as dtc', 'dt.deviceTypeCategoryId', 'dtc.id')
    .modify(
      addConstraints,
      dataConstraints,
      {
        device: 'd',
        deviceType: 'dt',
        ...aliases,
      },
      options
    )
}

const getNotDecommissionedDevices = dataConstraints =>
  getDeviceBaseQuery(dataConstraints, {}, { showUnapprovedDevices: true })

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

async function deleteInventoryLog(deviceId, trknex) {
  let inventoryItemIds = await trknex('InventoryLog')
    .whereIn('resultId', trknex('Result').where('deviceId', deviceId).select('id'))
    .pluck('inventoryItemId')
  if (inventoryItemIds.length > 0) {
    /**
     * just in case (because InventoryLog.inventoryItemId is nullable field) -
     * filter out `null` values
     */
    inventoryItemIds = inventoryItemIds.filter(it => !!it)
    /**
     * Count # of records in InventoryLog for each entry in array `inventoryItemIds`.
     * This is needed to correctly increase quantityOnHand in table InventoryItem.
     */
    const cntById = _.reduce(
      inventoryItemIds,
      (acc, id) => {
        acc[id] = acc[id] || { cnt: 0 }
        acc[id].cnt += 1
        return acc
      },
      {}
    )
    const distinctInventoryItemIds = _.keys(cntById)
    const inventoryItems = await trknex('InventoryItem')
      .whereIn('id', distinctInventoryItemIds)
      .select('id', 'quantityOnHand')
    await Promise.each(inventoryItems, async ({ id, quantityOnHand }) => {
      const { cnt } = cntById[id]
      if (cnt) {
        await trknex('InventoryItem')
          .where('id', id)
          .update({ quantityOnHand: quantityOnHand + cnt })
      }
    })
    /**
     * and finally remove from InventoryLog, if any records to delete exists
     */
    await trknex('InventoryLog').whereIn('resultId', trknex('Result').where('deviceId', deviceId).select('id')).del()
  }
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
    .modify(_q => {
      // For export, we don't provide sort and paging params - we should get all records
      if (query.size) _q.modify(sortPageParams, query, 'name')
    })
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

function getResultCategoryGroupColumns(dataConstraints, query) {
  return knex
    .from('Assay AS a')
    .innerJoin('DeviceType AS dt', 'a.deviceTypeId', 'dt.id')
    .innerJoin('AssayType AS at', 'a.assayTypeId', 'at.id')
    .innerJoin('Disease AS ds', 'at.diseaseId', 'ds.id')
    .innerJoin('ResultCategoryGroup AS rcg', 'a.id', 'rcg.assayId')
    .innerJoin('ResultCategory AS rc1', 'rcg.resultCategory1Id', 'rc1.id')
    .leftJoin('ResultCategory AS rc2', 'rcg.resultCategory2Id', 'rc2.id')
    .join(usedAssay(dataConstraints).as('f'), 'a.id', 'f.assayId')
    .select([
      knex.raw('GROUP_CONCAT(rcg.assayId) AS assayId'),
      'rcg.resultCategory1Id',
      'rcg.resultCategory2Id',
      knex.raw('CONCAT(rcg.assayId, "_",IFNULL(rc1.id, ""), "_", IFNULL(rc2.id, "")) AS columnKey'),
      knex.raw(
        'CONCAT(resultCategory1Label, " ", rc1.name, IFNULL(CONCAT(" ", resultCategory2Label, " ", rc2.name), "")) AS columnName'
      ),
    ])
    .groupBy(
      knex.raw(
        'CONCAT(resultCategory1Label, " ", rc1.name, IFNULL(CONCAT(" ", resultCategory2Label, " ", rc2.name), ""))'
      )
    ) // Equal to columnName
    .whereNot('dt.externalId', 'GxAlert')
    .modify(filterParams, query, {
      assayId: 'a.id',
    })
    .orderBy('columnName')
}

function moduleDisabledIssues(onlyActiveIssues = false) {
  const query = knex('Issue as i2')
    .join('IssueType as it', 'i2.issueTypeId', 'it.id')
    .join('IssueStatus as is', 'i2.issueStatusId', 'is.id')
    .where('it.externalId', 'ModuleDisabled')
    .whereIn('i2.id', function () {
      this.max('id').from('Issue').groupByRaw('deviceId, data->>"$.moduleName"')
    })
    .select(
      'i2.id',
      'i2.resultId',
      'i2.deviceId',
      knex.raw('i2.data->>"$.moduleName" as moduleName'),
      'i2.createdOn as dateLastIssue',
      'it.name as lastIssue'
    )
    .as('i')

  if (onlyActiveIssues) {
    query.where('is.externalId', 'Active')
  }

  return query
}

function modulesWithLastResultBeforeMinDate(minDate) {
  return knex('Result as r')
    .where('r.endedOn', '<', minDate)
    .select(
      'r.siteId',
      'r.deviceId',
      'r.moduleName',
      'r.moduleSerial',
      knex.raw('max(r.id) as id'),
      knex.raw('max(r.endedOn) as endedOn'),
      knex.raw('count(r.id) as totalTestsRun')
    )
    .groupBy('r.deviceId', 'r.moduleName', 'r.moduleSerial')
    .having('endedOn', '<', minDate) // only bays with last result before minDate -> inactive
    .as('r')
}

module.exports = {
  getDeviceByDeviceId,
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
  deleteInventoryLog,
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
  moduleDisabledIssues,
  modulesWithLastResultBeforeMinDate,
  getDeviceByIdBaseQuery,
  getLastUploadDateBySites,
}
