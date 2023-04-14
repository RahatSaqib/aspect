const _ = require('lodash')
const Boom = require('@hapi/boom')
const Promise = require('bluebird')
const setMilliseconds = require('date-fns/setMilliseconds')
const { findConsumables, findConsumableReason } = require('../../consumable/consumableService')
const { getDevice } = require('../../device/service')
const { createUniqueIdForResult } = require('../../result/service')
const { parseDateOrDefault } = require('../../shared/date')

const { updateDeviceDetails } = require('../../deviceApi/device')
const { shouldTriggerModuleDisabled } = require('../utils')
const {
  result1CategoryMapping,
  mapResultCategory2,
  getResultCategoriesHivVL,
  getVLCopies,
  getDetectedResistanceCategoryTypes,
} = require('./GxConnect/resultCategories/resultCategoriesMapping')
const { splitResultTextValues, sanitizeResultTextValue } = require('./GxConnect/resultCategories/utils')
const { mapPayloadWithCustomFields } = require('./customFields')
const { getInventoryStrategy, changeInventoryQuantity } = require('../../inventory/utils')

/*
The purpose of this plugin is to ensure that results are captured
even when the site is unknown to Aspect
If the device is unknown, ignore this request
If the site for the device in unknown, create a site and link it to the device
*/
async function preProcessAddDeviceData({ knex, device, payload, now, messageContext }) {
  if (_.isEmpty(device)) {
    throw Boom.notFound(`Cannot find device ${JSON.stringify(device)}`)
  }
  const configurationData = _.get(payload, 'configuration.data') || {}
  const site = await getOrCreateSite(knex, device, payload, now)
  const deviceDetails = {
    lastSeenOn: now,
    updatedOn: now,
    updatedBy: null,
  }
  if (device.siteId !== site.id) {
    deviceDetails.siteId = site.id
  }
  if (device.geographyId !== site.geographyId) {
    deviceDetails.geographyId = site.geographyId
  }
  // A ping from GxConnect is just a configuration POST with a MAC address,
  // host ID, device Serial and country abbreviation
  // A ping from GxConnect forwarded by GxAlert is the same as a ping cooming
  // directly from GxConnect but also includes gxAlertDeviceId
  if (
    !_.isEmpty(configurationData) &&
    _.every(Object.keys(configurationData), configurationDataKey =>
      ['macAddress', 'shortName', 'gxAlertDeviceId', 'hostId', 'deviceSerialNumber', 'country', 'lastPingOn'].includes(
        configurationDataKey
      )
    )
  ) {
    deviceDetails.lastPingOn = parseDateOrDefault(configurationData.lastPingOn, now)
  }
  await knex.from('Device').where({ id: device.id }).update(deviceDetails)
  if (configurationData.disabledModules) {
    await Promise.each(configurationData.disabledModules, modules =>
      shouldTriggerModuleDisabled(knex, messageContext, device, modules)
    )
  }
}

/*
The purpose of this plugin is to ensure that results are captured
even when the assay name in the result is unknown to Aspect
If the device is unknown, ignore this request
If an unknown assay is detected, create it
*/
async function preProcessMergeResult({ knex, deviceId, payload }) {
  if (!deviceId) {
    throw Boom.notFound('Cannot find device')
  }
  const startedOn = _.get(payload, 'startedOn') || _.get(payload, 'endedOn')
  const endedOn = _.get(payload, 'endedOn') || startedOn
  if (!startedOn) {
    throw Boom.badRequest('Start date or end date is required for a result from GxConnect')
  }
  const [device] = await knex
    .from('Device as d')
    .leftJoin('Site as s', 'd.siteId', 's.id')
    .leftJoin('Geography as g', 'd.geographyId', 'g.id')
    .leftJoin('Country as c', 'g.countryId', 'c.id')
    .where({ 'd.id': deviceId })
    .select(
      'd.id',
      'd.siteId',
      'd.partnerId',
      'd.deviceTypeId',
      'c.abbreviation as countryCode',
      knex.raw('coalesce(d.timezone, s.timezoneId, c.timezone) as timezone')
    )
  if (_.isEmpty(device)) {
    throw Boom.notFound(`Cannot find device ${deviceId}`)
  }
  if (!_.isEmpty(payload.data)) {
    payload.category = getResultCategories(payload)
  } else {
    payload.data = {}
  }
  const instrumentSerial = _.get(payload, 'instrument.serial', null)
  const cartridgeSerial = _.get(payload, 'consumable[0].serial', null)
  const sampleId = _.get(payload, 'sample.id')

  if (payload.id) {
    payload.data.geneXpertTestId = payload.id
  }
  const generatedExternalId = createUniqueIdForResult(instrumentSerial, startedOn, endedOn, sampleId)
  const gxAlertUniqueId = _.get(payload, 'data.gxAlertTestUniqueId', generatedExternalId)
  const geneXpertTestId = _.get(payload, 'id') || _.get(payload, 'data.id')

  const potentialAssayIds = [_.get(payload, 'assay.id')]
  if (potentialAssayIds.includes('GxMtbRif') && !potentialAssayIds.includes('GxMtbRifUltra')) {
    potentialAssayIds.push('GxMtbRifUltra')
  }
  if (potentialAssayIds.includes('GxMtbRifUltra') && !potentialAssayIds.includes('GxMtbRif')) {
    potentialAssayIds.push('GxMtbRif')
  }
  if (potentialAssayIds.includes('GxHiv1Vl')) {
    const copies = getVLCopies(_.get(payload, 'data.resultText'))
    if (copies) _.set(payload, 'data.copies', copies)
  }

  if (potentialAssayIds.includes('GxMtbXdr')) {
    const detectedResistanceCategoryTypes = getDetectedResistanceCategoryTypes(_.get(payload, 'data.resultText'))
    _.set(payload, 'data.detectedResistance', detectedResistanceCategoryTypes)
  }
  const existingResult = await findExistingResult(
    {
      partnerId: device.partnerId,
      geneXpertTestId,
      gxAlertUniqueId,
      cartridgeSerial,
      instrumentSerial,
      potentialSampleIds: [sampleId],
      siteId: device.siteId,
      potentialAssayIds,
      startedOn: payload.startedOn,
    },
    knex
  )
  if (!existingResult) {
    // Only assign assay to GxUnknown if result is new
    await assignGxUnknownAssayIfNotExists(knex, payload)

    // Only set workflow status to "Deliverable" by default if result is new and not an error
    if (
      !_.get(payload, 'workflow.status.id') &&
      !payload.error &&
      (!_.get(payload, 'data.resultText') || _.get(payload, 'data.resultText').toUpperCase().indexOf('ERROR') === -1)
    ) {
      _.set(payload, 'workflow.status.id', 'Deliverable')
    }
  } else {
    // Are we setting this result to NO RESULT?
    if (!_.isEmpty(_.get(payload, 'category', [])) && _.every(_.get(payload, 'category'), { id: 'NoResult' })) {
      // Has the result already been determined?
      if (
        (_.get(existingResult, 'resultCategory1') && _.get(existingResult, 'resultCategory1') !== 'NoResult') ||
        (_.get(existingResult, 'resultCategory2') && _.get(existingResult, 'resultCategory2') !== 'NoResult')
      ) {
        // We should never merge an incomplete result over a complete result
        throw Boom.conflict('A later version of this result already exists')
      }
    }
    if (_.get(existingResult, 'externalId') !== generatedExternalId) {
      await knex('Result').where('id', existingResult.id).update({ externalId: generatedExternalId })
    }
  }
  payload.id = generatedExternalId

  // if the module name is not part of the payload, try to get it from
  // existing results on the device
  const moduleNamePath = 'instrument.module.name'
  const moduleSerial = _.get(payload, 'instrument.module.serial')
  if (!_.get(payload, moduleNamePath) && moduleSerial) {
    const moduleName = await getModuleNameForResult(deviceId, moduleSerial, payload.startedOn, knex)
    if (moduleName) _.set(payload, moduleNamePath, moduleName)
    else _.unset(payload, moduleNamePath)
  }

  mapPayloadWithCustomFields(
    payload,
    device.countryCode,
    device.partnerId,
    _.get(existingResult, 'assayId'),
    _.get(existingResult, 'diseaseId')
  )
}

async function transformMergeResultPayload({ deviceId, payload, knex }) {
  const resultCoordinates = _.get(payload, 'location')
  if (deviceId && (_.isEmpty(resultCoordinates) || (!resultCoordinates.latitude && !resultCoordinates.longitude))) {
    const siteCoordinates = await knex('Device as d')
      .join('Site as s', 'd.siteId', 's.id')
      .where('d.id', deviceId)
      .first('s.latitude', 's.longitude')

    if (!_.isEmpty(siteCoordinates) && (siteCoordinates.longitude || siteCoordinates.latitude)) {
      payload.location = siteCoordinates
    }
  }
  return Promise.resolve(payload)
}

async function postProcessAddDeviceOperation({ device, payload, now, messageContext, userId }) {
  let inventoryItemIds = []
  const inventoryChanges = _.get(payload, 'data.inventoryChanges')
  if (!_.isEmpty(inventoryChanges)) {
    const { partnerId, id: deviceId } = device
    const inventoryStrategy = await getInventoryStrategy({ partnerId, deviceId })

    const sortedInventoryChanges = _.sortBy(inventoryChanges, inventoryChange =>
      parseDateOrDefault(inventoryChange.dateChanged)
    )
    inventoryItemIds = await Promise.all(
      _.map(sortedInventoryChanges, async inventoryChange => {
        const matchingConsumables = await findConsumables({
          name: inventoryChange.consumableName,
        })
        if (matchingConsumables.length === 1) {
          const matchingConsumable = matchingConsumables[0]
          const matchingConsumableReason = await findConsumableReason(inventoryChange.consumableReasonName)
          if (matchingConsumableReason) {
            const absoluteQuantity = Math.abs(inventoryChange.quantity)
            const isDecrease =
              (matchingConsumableReason.reset && inventoryChange.quantity < 0) || matchingConsumableReason.decrease
            if (!device.siteId && device.id) {
              const deviceData = await getDevice(device.id)
              device.siteId = deviceData.siteId
            }
            if (!device.siteId) {
              throw Boom.notFound('Cannot determine which site this request came from')
            }

            const { siteId } = device
            const consumableId = matchingConsumable.id
            const expiresOn = parseDateOrDefault(inventoryChange.expirationDate)

            const operation = isDecrease ? 'remove' : 'add'

            const inventoryItemId = await changeInventoryQuantity(inventoryStrategy, {
              consumableId,
              siteId,
              expiresOn,
              // lotNumber, // <--- lot is not set here
              quantity: absoluteQuantity,
              operation,
              now,
              messageContext,
              userId,
              logProps: {
                consumableReasonId: matchingConsumableReason.id,
                adjustedFrom: inventoryChange.dateChanged
                  ? setMilliseconds(parseDateOrDefault(inventoryChange.dateChanged), 0)
                  : null,
                operation: `${operation} from GxConnect`,
              },
            })
            return inventoryItemId
          }
        }
        return -1
      })
    )
  }
  return {
    inventoryItemIds: _.filter(inventoryItemIds, id => id > 0),
  }
}

async function postProcessUpdateDeviceConfiguration({ knex, payload, device: { id: deviceId }, now }) {
  let device = {}
  if (!_.isEmpty(_.get(payload, 'data'))) {
    const {
      data: { macAddress, hostId, culture, timezone, deviceSerialNumber, lastPingOn, state, lga, latitude, longitude },
    } = payload

    const deviceDetails = {
      hostId,
      culture,
      timezone,
      lastSeenOn: now,
      updatedOn: now,
      updatedBy: null,
    }
    if (macAddress && macAddressValid(macAddress)) {
      deviceDetails.macAddress = macAddress
    }
    if (lastPingOn) {
      deviceDetails.lastPingOn = parseDateOrDefault(lastPingOn)
    }
    if (deviceSerialNumber) {
      deviceDetails.serial = deviceSerialNumber
    }
    if (state || !_.isUndefined(latitude) || !_.isUndefined(latitude)) {
      const currentDeviceGeography = await knex('Device as d')
        .leftJoin('Site as s', 'd.siteId', 's.id')
        .innerJoin('Geography as g', function () {
          this.on('d.geographyId', 'g.id').orOn('s.geographyId', 'g.id')
        })
        .leftJoin('State as st', 'g.stateId', 'st.id')
        .leftJoin('Lga as l', 'g.lgaId', 'l.id')
        .where('d.id', deviceId)
        .first(
          'g.countryId',
          'g.stateId',
          'st.name as stateName',
          'g.lgaId',
          'l.name as lgaName',
          'd.siteId',
          's.latitude',
          's.longitude'
        )
      const siteUpdateDetails = {}
      if (!_.isEmpty(currentDeviceGeography)) {
        let newStateId = currentDeviceGeography.stateId
        let newLgaId = currentDeviceGeography.lgaId
        if (state !== currentDeviceGeography.stateName) {
          ;[newStateId] = await knex('Geography as g')
            .join('State as s', 'g.stateId', 's.id')
            .where('g.countryId', currentDeviceGeography.countryId)
            .andWhere('s.name', state)
            .pluck('s.id')
        }
        if (newStateId && lga) {
          if (lga !== currentDeviceGeography.lgaName) {
            ;[newLgaId] = await knex('Geography as g')
              .join('Lga as l', 'g.lgaId', 'l.id')
              .where('g.stateId', newStateId)
              .andWhere('l.name', lga)
              .pluck('l.id')
          } else if (newStateId !== currentDeviceGeography.stateId) {
            newLgaId = null
          }
        }
        newStateId = newStateId || null
        newLgaId = newLgaId || null
        if (newStateId !== currentDeviceGeography.stateId || newLgaId !== currentDeviceGeography.lgaId) {
          const newGeography = await knex('Geography as g')
            .where({
              countryId: currentDeviceGeography.countryId,
              stateId: newStateId,
              lgaId: newLgaId,
            })
            .first('g.id')
          if (newGeography) {
            if (currentDeviceGeography.siteId) {
              siteUpdateDetails.geographyId = newGeography.id
            }
            deviceDetails.geographyId = newGeography.id
          }
        }
        if (!_.isUndefined(latitude) && currentDeviceGeography.latitude !== latitude) {
          siteUpdateDetails.latitude = latitude
        }
        if (!_.isUndefined(longitude) && currentDeviceGeography.longitude !== longitude) {
          siteUpdateDetails.longitude = longitude
        }
        if (!_.isEmpty(siteUpdateDetails)) {
          await knex('Site').where({ id: currentDeviceGeography.siteId }).update(siteUpdateDetails)
        }
      }
    }
    device = await updateDeviceDetails(knex, deviceId, _.omitBy(deviceDetails, _.isNil), now)
  }
  return { device }
}

async function findDevices(availableDeviceDetails, knex) {
  const { deviceId, partnerId, hostId, deviceSerialNumber, macAddress, countryCode, deviceIdFromGxAlertSource } =
    availableDeviceDetails
  const fields = [
    'd.id',
    'd.partnerId',
    'd.siteId',
    'd.geographyId',
    'd.name',
    'd.serial',
    'd.hostId',
    'd.macAddress',
    'd.configurationData',
    'd.lastSeenOn',
    'd.putInService',
    'da.token as approval',
    'dt.externalId as deviceType',
    'dt.plugin as deviceTypePluginName',
    'p.plugin as partnerPluginName',
    'dtc.name as deviceTypeCategory',
  ]
  const deviceQuery = knex
    .from('Device as d')
    .leftJoin('Site as s', 's.id', 'd.siteId')
    .innerJoin('Geography as g', function () {
      this.on('d.geographyId', 'g.id').orOn('s.geographyId', 'g.id')
    })
    .innerJoin('Country as c', 'g.countryId', 'c.id')
    .leftJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
    .leftJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .leftJoin('DeviceTypeCategory as dtc', 'dtc.id', 'dt.deviceTypeCategoryId')
    .leftJoin('Partner as p', 'd.partnerId', 'p.id')
  if (deviceId) {
    return deviceQuery.clone().where('d.id', deviceId).select(fields)
  }
  let matchingDevices = []
  if (partnerId) {
    const partnerDeviceQuery = deviceQuery.clone().modify(queryBuilder => {
      queryBuilder.where('d.partnerId', partnerId)
      if (countryCode) {
        queryBuilder.andWhere('c.abbreviation', countryCode)
      }
    })
    if (deviceIdFromGxAlertSource) {
      matchingDevices = await partnerDeviceQuery
        .clone()
        .andWhereRaw(`JSON_EXTRACT(d.configurationData, "$.gxAlertDeviceId") = ${deviceIdFromGxAlertSource}`)
        .select(fields)
    }
    if (_.isEmpty(matchingDevices) && countryCode) {
      const partnerCountryDeviceQuery = partnerDeviceQuery.clone().andWhere('c.abbreviation', countryCode)
      if (hostId && deviceSerialNumber) {
        matchingDevices = await partnerCountryDeviceQuery
          .clone()
          .andWhere('d.hostId', hostId)
          .andWhere('d.serial', deviceSerialNumber)
          .select(fields)
      }
      if (hostId) {
        if (_.isEmpty(matchingDevices)) {
          matchingDevices = await partnerCountryDeviceQuery.clone().andWhere('d.hostId', hostId).select(fields)
          // There are multiple devices using this Host ID
          //  therefore the Host ID cannot be used as a device identifier
          if (matchingDevices.length > 1) {
            matchingDevices = []
          }
        } else if (matchingDevices.length > 1) {
          matchingDevices = matchingDevices.filter(d => d.hostId === hostId)
        }
      }
      if (deviceSerialNumber) {
        if (_.isEmpty(matchingDevices)) {
          matchingDevices = await partnerCountryDeviceQuery
            .clone()
            .andWhere('d.serial', deviceSerialNumber)
            .select(fields)
          // There are multiple devices using this computer name
          //  therefore the device serial number cannot be used as a device identifier
          if (matchingDevices.length > 1) {
            matchingDevices = []
          }
        } else if (matchingDevices.length > 1) {
          matchingDevices = matchingDevices.filter(d => d.serial === deviceSerialNumber)
        }
      }
      if (macAddress && macAddress !== 'MAC') {
        if (_.isEmpty(matchingDevices)) {
          matchingDevices = await partnerCountryDeviceQuery.clone().andWhere('d.macAddress', macAddress).select(fields)
          // There are multiple devices using this MAC address
          //  therefore the MAC address cannot be used as a device identifier
          if (matchingDevices.length > 1) {
            matchingDevices = []
          }
        } else if (matchingDevices.length > 1) {
          matchingDevices = matchingDevices.filter(d => d.macAddress === macAddress)
        }
      }
    }
  }
  return _.uniqBy(matchingDevices, 'id')
}

async function findExistingResult(availableResultDetails, knex) {
  const {
    partnerId,
    geneXpertTestId = null, // GxConnect -> GxAlert -> Aspect: result.data.id, GxConnect -> Aspect: result.id
    gxAlertUniqueId = null, // GxConnect/Listener -> GxAlert -> Aspect: result.data.gxAlertTestUniqueId
    cartridgeSerial = null, // GxAlert -> Aspect: result.consumable.serial
    instrumentSerial = null, // GxAlert -> Aspect: result.instrument.serial
    potentialSampleIds = [],
    siteId = null,
    potentialAssayIds = [],
    startedOn = null,
  } = availableResultDetails
  const selectFields = [
    'r.id',
    'r.externalId',
    'r.resultData',
    'r.siteId',
    'rc1.externalId as resultCategory1',
    'rc2.externalId as resultCategory2',
    'a.externalId as assayId',
    's.externalId as sampleId',
    knex.raw('r.resultData->>"$.geneXpertTestId" as geneXpertTestId'),
  ]
  const queryStart = knex
    .from('Result as r')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .leftJoin('Assay as a', 'r.assayId', 'a.id')
    .leftJoin('Sample as s', 'r.sampleId', 's.id')
    .where('r.partnerId', partnerId)
  let matchingResults = []
  let matchingResult = null
  if (gxAlertUniqueId) {
    matchingResults = await queryStart.clone().andWhere('r.externalId', gxAlertUniqueId).select(selectFields)
  }
  if (matchingResults.length === 1) {
    ;[matchingResult] = matchingResults
  } else if (matchingResults.length > 1 && geneXpertTestId) {
    matchingResults = _.filter(
      matchingResults,
      result => _.get(JSON.parse(result.resultData), 'geneXpertTestId') === geneXpertTestId
    )
    if (matchingResults.length === 1) {
      ;[matchingResult] = matchingResults
    } else if (matchingResults.length > 1 && gxAlertUniqueId) {
      matchingResults = _.filter(matchingResults, {
        externalId: gxAlertUniqueId,
      })
      if (matchingResults.length === 1) {
        ;[matchingResult] = matchingResults
      }
    }
  }

  if (_.isEmpty(matchingResult) && geneXpertTestId) {
    matchingResults = await queryStart.clone().andWhere('r.externalId', geneXpertTestId).select(selectFields)
    if (matchingResults.length === 1) {
      ;[matchingResult] = matchingResults
    } else if (matchingResults.length > 1) {
      matchingResults = _.filter(
        matchingResults,
        result => _.get(JSON.parse(result.resultData), 'geneXpertTestId') === geneXpertTestId
      )
      if (matchingResults.length === 1) {
        ;[matchingResult] = matchingResults
      }
    }
  }

  if (_.isEmpty(matchingResult) && cartridgeSerial && instrumentSerial && cartridgeSerial.length > 5) {
    matchingResults = await queryStart
      .clone()
      .andWhere('r.consumableSerial', cartridgeSerial)
      .andWhere('r.instrumentSerial', instrumentSerial)
      .select(selectFields)
    if (matchingResults.length === 1) {
      ;[matchingResult] = matchingResults
    } else if (matchingResults.length > 1) {
      matchingResults = _.filter(
        matchingResults,
        result => _.get(JSON.parse(result.resultData), 'geneXpertTestId') === geneXpertTestId
      )
      if (matchingResults.length === 1) {
        ;[matchingResult] = matchingResults
      }
    }
  }
  if (
    _.isEmpty(matchingResult) &&
    !_.isEmpty(_.filter(potentialSampleIds, elem => elem)) &&
    siteId &&
    !_.isEmpty(_.filter(potentialAssayIds, elem => elem)) &&
    startedOn
  ) {
    matchingResults = await queryStart
      .clone()
      .whereIn('s.externalId', potentialSampleIds)
      .andWhere('r.siteId', siteId)
      .whereIn('a.externalId', potentialAssayIds)
      .andWhere('r.startedOn', startedOn)
      .select(selectFields)
    if (matchingResults.length === 1) {
      ;[matchingResult] = matchingResults
    } else if (matchingResults.length > 1) {
      if (geneXpertTestId) {
        matchingResults = _.filter(
          matchingResults,
          result => _.get(JSON.parse(result.resultData), 'geneXpertTestId') === geneXpertTestId
        )
      }
      if (matchingResults.length > 1) {
        if (geneXpertTestId) {
          matchingResults = _.filter(matchingResults, result => result.externalId === geneXpertTestId)
        }
      }
      if (matchingResults.length > 1) {
        if (!_.isEmpty(potentialSampleIds) && siteId && !_.isEmpty(potentialAssayIds)) {
          matchingResults = _.filter(
            matchingResults,
            result =>
              potentialSampleIds.includes(result.sampleId) &&
              result.siteId === siteId &&
              potentialAssayIds.includes(result.assayId)
          )
        }
      }
      if (matchingResults.length > 1) {
        if (cartridgeSerial && instrumentSerial) {
          matchingResults = _.filter(
            matchingResults,
            result => result.consumableSerial === cartridgeSerial && result.instrumentSerial === instrumentSerial
          )
        }
      }
      if (matchingResults.length === 1) {
        ;[matchingResult] = matchingResults
      }
    }
  }
  // if we find an existing result we are going to add an extra validation to compare the externalId or
  // the genexpert test id which is generated by the devices. If match with one of them we are going to take that as a match.
  // if not we are not going to take that as a match.
  if (
    !_.isEmpty(matchingResult) &&
    (!geneXpertTestId || !matchingResult.geneXpertTestId || _.isEqual(geneXpertTestId, matchingResult.geneXpertTestId))
  )
    return matchingResult
  return null
}

async function getOrCreateSite(knex, device, payload, now, countryCode, deviceName, deviceShortName, fromGxAlert) {
  let sites = []
  if (!countryCode) {
    countryCode = _.get(payload, 'configuration.data.country')
    if (!countryCode) {
      if (!countryCode && device) {
        ;[countryCode] = await knex('Device as d')
          .leftJoin('Site as s', 's.id', 'd.siteId')
          .innerJoin('Geography as g', function () {
            this.on('d.geographyId', 'g.id').orOn('s.geographyId', 'g.id')
          })
          .innerJoin('Country as c', 'g.countryId', 'c.id')
          .where('d.id', device.id)
          .pluck('c.abbreviation')
      }
    }
  }
  if (!deviceName) {
    deviceName = _.get(payload, 'name')
  }
  if (!deviceShortName) {
    deviceShortName = _.get(payload, 'configuration.data.shortName')
  }
  if (deviceName && countryCode) {
    if (device.siteId && !fromGxAlert) {
      sites = await knex.from('Site as s').where('s.id', device.siteId).select()
    }
    const payloadSiteId = _.get(payload, 'site.id')
    if (_.isEmpty(sites) && payloadSiteId) {
      sites = await knex
        .from('Site as s')
        .where({
          's.externalId': payloadSiteId,
          's.partnerId': device.partnerId,
        })
        .select()
    }
    if (_.isEmpty(sites) && device.id && !fromGxAlert) {
      sites = await knex
        .from('Device as d')
        .join('Site as s', 'd.siteId', 's.id')
        .where({ 'd.id': device.id })
        .select('s.*')
    }
    if (_.isEmpty(sites)) {
      const matchingSites = await knex
        .from('Site as s')
        .join('Geography as g', 's.geographyId', 'g.id')
        .join('Country as c', 'g.countryId', 'c.id')
        .where({
          's.partnerId': device.partnerId,
          'c.abbreviation': countryCode,
        })
        .andWhere(function () {
          if (deviceName) {
            this.where({ 's.name': deviceName }).orWhere({
              's.externalId': deviceName,
            })
          }
          if (deviceShortName) {
            this.orWhere({
              's.externalId': deviceShortName,
            })
          }
        })
        .select('s.*')
      if (matchingSites.length === 1) {
        sites = matchingSites.splice(0, 1)
      } else if (matchingSites.length > 1) {
        throw Boom.conflict(
          `Cannot uniquely determine which site this request came from using ${deviceName} in ${countryCode})`
        )
      }
      if (_.isEmpty(sites)) {
        // If we cannot determine the site by name, external ID or device
        // create a new site
        const country = await knex.from('Country as c').where({ abbreviation: countryCode }).first('c.id')
        if (country == null) {
          throw Boom.notFound(`Cannot determine the country from ${countryCode}.`)
        }
        const { id: countryId } = country
        const [geography] = await knex
          .from('Geography as g')
          .where({ 'g.countryId': countryId })
          .whereNull('g.stateId')
          .whereNull('g.lgaId')
          .select('g.id')
        if (_.isEmpty(geography)) {
          const [geographyId] = await knex('Geography').insert({ countryId })
          geography.id = geographyId
        }

        const newSite = {
          name: deviceName,
          shortName: deviceShortName || deviceName,
          externalId: deviceName,
          partnerId: device.partnerId,
          geographyId: geography.id,
          createdOn: now,
          updatedOn: now,
        }
        if (newSite.name.length > 255) {
          newSite.name = newSite.name.substr(0, 255)
        }
        if (newSite.shortName.length > 45) {
          newSite.shortName = newSite.shortName.substr(0, 45)
        }
        if (newSite.externalId.length > 255) {
          newSite.externalId = newSite.externalId.substr(0, 255)
        }
        const [newSiteId] = await knex.insert(newSite).into('Site')
        sites = await knex.from('Site as s').where('s.id', newSiteId).select()
      }
    }
  } else {
    throw Boom.notFound('Cannot determine which site this request came from')
  }
  return _.head(sites)
}

async function assignGxUnknownAssayIfNotExists(knex, payload) {
  const payloadAssayId = _.get(payload, 'assay.id', false)
  const assay = await knex.from('Assay as a').where({ 'a.externalId': payloadAssayId }).first('a.externalId')
  if (_.isEmpty(assay)) {
    _.set(payload, 'assay.id', 'GxUnknown')
  }
}

function getResultCategories(payload) {
  let payloadCategory = _.get(payload, 'category')
  if (_.isEmpty(payloadCategory)) {
    payloadCategory = []
    const payloadResultText = _.get(payload, 'data.resultText')
    if (payloadResultText) {
      const resultTextValues = splitResultTextValues(payloadResultText)
      const assayId = _.get(payload, 'assay.id')

      if (resultTextValues.length > 0) {
        const result1Text = sanitizeResultTextValue(resultTextValues[0])

        if (result1CategoryMapping[result1Text]) {
          payloadCategory = [{ id: result1CategoryMapping[result1Text] }]
        }
        if (assayId === 'GxHiv1Vl') {
          const externalId = getResultCategoriesHivVL(result1Text) || result1CategoryMapping[result1Text]
          if (externalId) payloadCategory = [{ id: externalId }]
        }
      }

      const resultCategory2 = mapResultCategory2(assayId, resultTextValues)
      if (resultCategory2) payloadCategory = [...payloadCategory, { id: resultCategory2 }]
    } else {
      const assayId = _.get(payload, 'assay.id')
      if (assayId === 'GxHiv1Vl') {
        return [{ id: getResultCategoriesHivVL(payloadResultText) }]
      }
    }
  }
  return payloadCategory
}

function macAddressValid(macAddress) {
  return (
    !_.isEmpty(macAddress) &&
    macAddress.indexOf('MAC') === 0 &&
    macAddress.trim().length > 3 &&
    macAddress !== 'MAC005345000000'
  )
}

async function getModuleNameForResult(deviceId, moduleSerial, startedOn, knex) {
  const latestResultOnModuleSerial = await knex('Result')
    .where({ deviceId, moduleSerial })
    .where('startedOn', '<=', startedOn)
    .whereNotNull('moduleName')
    .orderBy('endedOn', 'desc')
    .first('moduleName')

  return latestResultOnModuleSerial ? latestResultOnModuleSerial.moduleName : null
}

module.exports = {
  findDevices,
  getOrCreateSite,
  preProcessAddDeviceData,
  preProcessMergeResult,
  transformMergeResultPayload,
  postProcessAddDeviceOperation,
  postProcessUpdateDeviceConfiguration,
  getResultCategoriesHivVL,
  getResultCategories,
  getVLCopies,
  getModuleNameForResult,
}
