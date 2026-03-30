const _ = require('lodash')
const Promise = require('bluebird')
const { format } = require('date-fns')
const { knex, filterParams, sortPageParams, filterDateRangeParams } = require('../../db')
const { allResultCategoryToId, resultCategoryToId, deviceMaintenanceTypeToId } = require('../../shared/dictionary')
const { getConstraints, addConstraints } = require('../../auth/constraints')
const { getBaseQuery: getResultBaseQuery, modifiers } = require('../../result/query')
const { usedAssay } = require('../../assay/common/db')
const { INTERNAL_DEVICE_IDS } = require('../../shared/constants')
const { XDR_RESISTANCES } = require('../../shared/constants')
const { getUser } = require('../../auth/service')
const { transformUTCDateTimeToZoned } = require('../../plugin/deviceType/transformPayload')

const SELECT_SHOW_FIELDS = [
  'd.id',
  'd.name',
  'd.shortName',
  'd.createdOn',
  'd.lastPingOn',
  'd.dailyTestCapacity',
  'd.lastSeenOn as lastSeen',
  'd.implementingPartnerId',
  'ip.name as implementingPartnerName',
  'da.name as approval',
  'dms.externalId as maintenanceStatus',
  knex.raw(`
    CASE
      WHEN dmsl.day >= DATE(DATE_ADD(NOW(), INTERVAL -1 DAY)) THEN
        CASE
          WHEN deviceResult.totalCurrentDay = 0 AND dms.externalId = 'active' THEN 'inactiveUnknown'
          ELSE dms.i18nKey
        END
      ELSE NULL
    END AS maintenanceStatusI18nKey`),
  'dms.name as maintenanceStatusName',
  knex.raw(
    `CASE
      WHEN dmsl.day >= DATE(DATE_ADD(NOW(), INTERVAL -1 DAY)) THEN
        CASE
          WHEN deviceResult.totalCurrentDay = 0 AND dms.active THEN 0
          ELSE dms.active
        END
      ELSE NULL
    END AS maintenanceStatusActive`
  ),
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
  'd.gx6cModulesCount',
  'd.gx10cModulesCount',
  'd.configurationData',
  'd.notes',
  'd.serial',
  'd.moduleBayCapacity',
  'dt.id as deviceTypeId',
  'dt.name as deviceTypeName',
  'dt.externalId as deviceTypeExternalId',
  'dt.configurationDataSchema',
  'dt.deviceOperationSchema',
  'd.dailyTestCapacity as dailyCapacity',
  'd.moduleBayCapacity as dailyCapacityModules',
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
  'd.stickerInstrumentSerial',
  'd.instrumentModel',
  'd.softwareType',
  'd.isDaisyChained',
]

async function getDeviceInfo(credentials, query) {
  const dataConstraints = await getConstraints(credentials)
  const getDeviceQuery = knex('Device as d')
    .innerJoin('Site as s', 's.id', 'd.siteId')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as lga', 'g.lgaId', 'lga.id')
    .count({
      cntDevices: knex.raw('d.id'),
    })
    .sum({
      cntModules: knex.raw('d.moduleBayCapacity'),
    })
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      site: 's',
      geography: 'g',
      state: 'st',
    })
    .modify(filterParams, query, {
      stateId: 'st.id',
      lgaId: 'lga.id',
      siteName: 's.name',
    })
  return getDeviceQuery
}

async function getDeviceByDeviceId({ deviceId, credentials, fields = SELECT_SHOW_FIELDS }) {
  const dataConstraints = await getConstraints(credentials)

  const { timezoneIANA } = await getUser(credentials.name)

  const now = new Date()
  // Get current date in ISO format
  const currentDateISO = format(now, 'yyyy-MM-dd')

  // Define start and end of current day
  const currentDayStart = `${currentDateISO}T00:00:00`
  const currentDayEnd = `${currentDateISO}T23:59:59`

  const maintenanceCalibrationId = await deviceMaintenanceTypeToId('calibration')
  const maintenanceWarrantyId = await deviceMaintenanceTypeToId('warranty')

  const resultCategoryErrorId = await resultCategoryToId('Error')

  const device = await getDeviceByIdBaseQuery(dataConstraints, deviceId, fields, true, true)
    .innerJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
    .innerJoin('DeviceTypeCategory as dc', 'dt.deviceTypeCategoryId', 'dc.id')
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
    .leftJoin(
      knex('Result as resDevice')
        .select({
          deviceId: 'deviceId',
          totalCurrentDay: knex.raw(
            `SUM(CASE WHEN CONVERT_TZ(resDevice.endedOn, '+00:00', '${timezoneIANA}') BETWEEN ? AND ? THEN 1 ELSE 0 END)`,
            [currentDayStart, currentDayEnd]
          ),
        })
        .groupBy('deviceId')
        .as('deviceResult'),
      'd.id',
      'deviceResult.deviceId'
    )
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

  device.isDaisyChained = !!device.isDaisyChained

  const firstResultRow = await knex('Result as r')
    .where('r.deviceId', deviceId)
    .select(knex.raw('MIN(r.endedOn) as firstEndedOn'))
    .first()
  device.firstResultEndedOn = firstResultRow?.firstEndedOn ?? null

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
    .leftJoin('Site as s', 'd.siteId', 's.id')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .modify(
      addConstraints,
      dataConstraints,
      {
        partner: 'p',
        geography: 'g',
        site: 's',
        device: 'd',
        deviceType: 'dt',
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
  } = {}
) {
  const conditionalAliases = {}

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
      if (extendJoinToAssays || query.assayId) {
        queryBuilder.leftJoin('Assay as a', 'dt.id', 'a.deviceTypeId')
        conditionalAliases.assay = 'a'
      }
      if (query.assayId) {
        queryBuilder.where('a.id', query.assayId)
      }

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
      deviceApprovalExternalId: 'da.token',
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
        ...conditionalAliases,
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
  const deviceQuery = getDeviceBaseExtendedQuery(query, dataConstraints, {
    extendJoinToAssays: true,
  })

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

async function deleteDeviceFromDeviceTag(deviceId, trknex) {
  await trknex('DeviceTag').where('deviceId', deviceId).del()
}

async function deleteDeviceFromFactTables(deviceId, trknex) {
  await trknex('FactDeviceFlag').where({ deviceId }).del()
  await trknex('FactDeviceModulesCount').where({ deviceId }).del()
  await trknex('FactResultsDevice').where({ deviceId }).del()
  await trknex('FactResultsDeviceByAssay').where({ deviceId }).del()
  await trknex('FactResultsDeviceByCategory1').where({ deviceId }).del()
  await trknex('FactResultsDeviceByTimeFrame').where({ deviceId }).del()
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

function getFirstAndLastResults(dataConstraints, assayId, deviceIds) {
  return knex('Result as _r')
    .modify(addConstraints, dataConstraints, { result: '_r' })
    .groupBy('deviceId')
    .select({
      deviceId: 'deviceId',
      firstEndedOn: knex.raw('MIN(endedOn)'),
      lastEndedOn: knex.raw('MAX(endedOn)'),
    })
    .whereIn('deviceId', deviceIds)
    .as('firstAndLastResults')
}

async function getDeviceWorkload(extraColumns, dataConstraints, query, auth) {
  const { assayId } = query

  const { timezoneIANA } = await getUser(auth.credentials.name)
  const q = knex('Device as d')
    .innerJoin('Site as s', 'd.siteId', 's.id')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceTypeCategory as dtc', 'dt.deviceTypeCategoryId', 'dtc.id')
    .innerJoin('Geography as g', 's.geographyId', 'g.id')
    .innerJoin('State as st', 'g.stateId', 'st.id')
    .innerJoin('Lga as lg', 'g.lgaId', 'lg.id')
    .innerJoin('Assay as a', joinAssay => {
      joinAssay.on(function () {
        if (assayId) {
          this.on('dt.id', 'a.deviceTypeId').andOn('a.id', knex.raw(assayId))
        } else {
          this.on('dt.id', 'a.deviceTypeId')
        }
      })
    })
    .innerJoin('AssayType as at', 'a.assayTypeId', 'at.id')
    .innerJoin('Result as r', joinResultQuery => {
      joinResultQuery.on(function () {
        if (assayId) {
          this.on('r.deviceId', 'd.id').andOn('r.assayId', knex.raw(assayId))
        } else {
          this.on('r.deviceId', 'd.id')
        }
      })
      if (query.minDate) joinResultQuery.andOn('r.endedOn', '>', knex.raw(`'${query.minDate.toISOString()}'`))

      if (query.maxDate) joinResultQuery.andOn('r.endedOn', '<=', knex.raw(`'${query.maxDate.toISOString()}'`))
    })
    .leftJoin('DeviceMaintenanceStatusLog as dmsl', 'd.deviceMaintenanceStatusLogId', 'dmsl.id')
    .leftJoin('DeviceMaintenanceStatus as dms', 'dmsl.deviceMaintenanceStatusId', 'dms.id')
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
    .modify(q => {
      extraColumns.forEach(ec => q.select({ [ec.fieldId]: knex.raw(ec.selector) }))
    })
    .select('r.deviceId', knex.raw('COUNT(DISTINCT r.id) as total'))

  const { totalRows } = await q.clone().select(knex.raw('COUNT(DISTINCT d.id) as totalRows')).first()

  const data = await q
    .modify(_q => {
      // For export, we don't provide sort and paging params - we should get all records
      if (query.size) _q.modify(sortPageParams, query, 'name')
    })
    .select(
      'd.id',
      'd.name',
      'dms.i18nKey as deviceStatus',
      'dms.name as deviceStatusLabel',
      'd.lastPingOn',
      'st.name as stateName',
      'lg.name as lgaName',
      's.name as siteName'
    )
    .groupBy('d.id')

  const deviceIds = data.map(device => device.id)

  const deviceFirstAndLastResult = await getFirstAndLastResults(dataConstraints, assayId, deviceIds)

  const deviceFirstAndLastResultMap = _.keyBy(deviceFirstAndLastResult, 'deviceId')

  const updatedData = _.map(data, ({ id, ...deviceResponse }) => {
    let firstResultEndedOn = _.get(deviceFirstAndLastResultMap, [id, 'firstEndedOn'], null)
    let lastResultEndedOn = _.get(deviceFirstAndLastResultMap, [id, 'lastEndedOn'], null)

    deviceResponse.total = deviceResponse.total || 0

    _.forEach(extraColumns, ({ fieldId }) => {
      deviceResponse[fieldId] = deviceResponse[fieldId] || 0
    })

    firstResultEndedOn = formatTimeZoneDate(firstResultEndedOn, timezoneIANA)
    lastResultEndedOn = formatTimeZoneDate(lastResultEndedOn, timezoneIANA)
    const lastPingOnWithTimeZone = formatTimeZoneDate(deviceResponse.lastPingOn, timezoneIANA)

    return {
      ...deviceResponse,
      firstResultEndedOn,
      lastResultEndedOn,
      lastPingOn: lastPingOnWithTimeZone,
    }
  })
  const { length } = data
  return { total: totalRows, data: updatedData, length }
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

async function getResultCategoryGroupColumns(dataConstraints, query, includeXdrResistances = true) {
  const resultCategoryGroupColumns = await knex
    .from('Assay AS a')
    .innerJoin('DeviceType AS dt', 'a.deviceTypeId', 'dt.id')
    .innerJoin('AssayType AS at', 'a.assayTypeId', 'at.id')
    .innerJoin('Disease AS ds', 'at.diseaseId', 'ds.id')
    .innerJoin('ResultCategoryGroup AS rcg', 'a.id', 'rcg.assayId')
    .innerJoin('ResultCategory AS rc1', 'rcg.resultCategory1Id', 'rc1.id')
    .leftJoin('ResultCategory AS rc2', 'rcg.resultCategory2Id', 'rc2.id')
    .join(usedAssay(dataConstraints).as('f'), 'a.id', 'f.assayId')
    .select([
      knex.raw('GROUP_CONCAT(DISTINCT a.externalId) AS assayExternalId'),
      knex.raw('GROUP_CONCAT(DISTINCT rcg.assayId) AS assayId'),
      'rcg.resultCategory1Id',
      'rcg.resultCategory2Id',
      knex.raw('NULL as xdrResistance'),
      knex.raw('CONCAT(rcg.assayId, "_",IFNULL(rc1.id, ""), "_", IFNULL(rc2.id, "")) AS columnKey'),
      knex.raw(
        'CONCAT(resultCategory1Label, " ", rc1.name, IFNULL(CONCAT(" ", resultCategory2Label, " ", rc2.name), "")) AS columnName'
      ),
      'rcg.abbreviation AS columnAbbreviation',
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
    .orderBy('assayId', 'columnName')

  const { assayId: xdrAssayId } = resultCategoryGroupColumns.find(rcg => rcg.assayExternalId?.includes('GxMtbXdr')) || {
    assayId: null,
  }
  const hasAccessToXdr = !_.isNil(xdrAssayId)

  if (includeXdrResistances && hasAccessToXdr) {
    // Adding the collection of columns of result xdr resistances
    const xdrIndex = _.findIndex(resultCategoryGroupColumns, rcg => rcg.assayExternalId?.includes('GxMtbXdr'))
    XDR_RESISTANCES.map(r => ({
      assayId: `${xdrAssayId}`,
      resultCategory1Id: null,
      resultCategory2Id: null,
      columnName: r,
      xdrResistance: r,
      columnKey: r,
    })).forEach(rcg => {
      // Add the XDR resistances right before the XDR result category groups
      resultCategoryGroupColumns.splice(xdrIndex, 0, rcg)
    })
  }
  return resultCategoryGroupColumns
}

function moduleDisabledIssues(onlyActiveIssues = false) {
  const query = knex('Issue as i2')
    .join('IssueType as it', 'i2.issueTypeId', 'it.id')
    .join('IssueStatus as is', 'i2.issueStatusId', 'is.id')
    .where('it.externalId', 'ModuleDisabled')
    .select(
      'i2.id',
      'i2.deviceId',
      knex.raw('i2.data->>"$.moduleSerial" as moduleSerial'),
      knex.raw('i2.data->>"$.disabledOn" as dateLastIssue'),
      'it.name as lastIssue'
    )
    .as('i')

  if (onlyActiveIssues) {
    query.where('is.externalId', 'Active')
  }

  return query
}

function modulesWithLastResult() {
  return knex('Result as r')
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
    .as('r')
}

function getResultWithUsedModules(knex, minDate, maxDate) {
  return knex('Result as r')
    .select('r.deviceId')
    .count('r.id as totalTests')
    .countDistinct('moduleName as modulesReporting')
    .whereBetween('endedOn', [minDate, maxDate])
    .groupBy('r.deviceId')
}

const formatTimeZoneDate = (date, timezoneIANA) => {
  if (!date) {
    return date
  }
  return transformUTCDateTimeToZoned(date.toISOString(), timezoneIANA)
}

async function getUnusedModulesReportData(dataConstraints, query) {
  return getResultWithUsedModules(knex, query.minDate, query.maxDate)
    .innerJoin('Device as d', 'd.id', 'r.deviceId')
    .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .innerJoin('Partner as p', 'p.id', 'd.partnerId')
    .innerJoin('Site as s', 's.id', 'd.siteId')
    .innerJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as lg', 'g.lgaId', 'lg.id')
    .whereNot('dt.externalId', 'GxAlert')
    .select([
      'd.name as deploymentName',
      'd.moduleBayCapacity as modulesAvailable',
      'd.lastInstrumentSerial as instrumentSerial',
      'st.name as State',
      'lg.name as Lga',
    ])
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      site: 's',
      geography: 'g',
      partner: 'p',
    })
    .modify(filterParams, query, {
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      siteName: 's.name',
    })
}

async function getDevicesIdsCheckingConstraints(allDevicesIds, dataConstraints) {
  return knex('Device as d')
    .whereIn('d.id', allDevicesIds)
    .leftJoin('Site as s', 'd.siteId', 's.id')
    .modify(addConstraints, dataConstraints, { site: 's' })
    .select('d.id')
}

module.exports = {
  getDeviceByDeviceId,
  getDeviceWorkload,
  getResultCategoriesByAssay,
  getDeviceBaseQuery,
  getDeviceBaseExtendedQuery,
  getBasicsForDevicesReport,
  deleteNotifications,
  deleteIssues,
  deleteResultDownloadLog,
  deleteInventoryLog,
  deleteMessages,
  deleteResults,
  deleteDeviceLog,
  deleteDeviceFromDeviceMaintenance,
  deleteDeviceFromDeviceApprovalLog,
  deleteDeviceFromDeviceApiRaw,
  deleteDeviceFromDeviceTag,
  deleteDeviceFromFactTables,
  deleteDevice,
  getNotDecommissionedDevices,
  joinModuleAvailability,
  getFirstAndLastResults,
  getResultCategoryGroupColumns,
  moduleDisabledIssues,
  modulesWithLastResult,
  getDeviceByIdBaseQuery,
  getUnusedModulesReportData,
  getDeviceInfo,
  getDevicesIdsCheckingConstraints,
}
