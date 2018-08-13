const _ = require('lodash')
const Boom = require('boom')
const setMilliseconds = require('date-fns/set_milliseconds')
const {
  findConsumables,
  findConsumableReason,
} = require('../../../consumable/consumableService')
const {
  increaseInventory,
  decreaseInventory,
} = require('../../../inventory/service')
const { getDevice } = require('../../../device/service')
const { parseDateOrDefault } = require('../../../shared/date')
const { updateDeviceDetails } = require('../../../deviceApi/device')
const { macAddressValid } = require('./requestValidation')

async function findDevices(availableDeviceDetails, knex) {
  const {
    deviceId,
    partnerId,
    hostId,
    deviceSerialNumber,
    countryCode,
    deviceIdFromGxAlertSource,
  } = availableDeviceDetails
  const fields = [
    'd.id',
    'd.partnerId',
    'd.siteId',
    'd.name',
    'd.serial',
    'd.macAddress',
    'd.configurationData',
    'd.lastSeenOn',
    'ds.token as status',
    'dt.externalId as deviceType',
    'dt.plugin as deviceTypePluginName',
    'dtc.name as deviceTypeCategory',
  ]
  const deviceQuery = knex
    .from('Device as d')
    .leftJoin('Site as s', 's.id', 'd.siteId')
    .innerJoin('Geography as g', function() {
      this.on('d.geographyId', 'g.id').orOn('s.geographyId', 'g.id')
    })
    .innerJoin('Country as c', 'g.countryId', 'c.id')
    .leftJoin('DeviceStatus as ds', 'd.deviceStatusId', 'ds.id')
    .leftJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .leftJoin('DeviceTypeCategory as dtc', 'dtc.id', 'dt.deviceTypeCategoryId')
  if (deviceId) {
    return deviceQuery
      .clone()
      .where('d.id', deviceId)
      .select(fields)
  }
  let matchingDevices = []
  if (partnerId) {
    if (deviceIdFromGxAlertSource) {
      matchingDevices = await deviceQuery
        .clone()
        .whereRaw(
          `JSON_EXTRACT(d.configurationData, "$.gxAlertDeviceId") = ${deviceIdFromGxAlertSource}`
        )
        .andWhere('d.partnerId', partnerId)
        .select(fields)
    }
    if (_.isEmpty(matchingDevices) && countryCode) {
      if (hostId && deviceSerialNumber) {
        matchingDevices = await deviceQuery
          .clone()
          .where('d.partnerId', partnerId)
          .andWhere('d.hostId', hostId)
          .andWhere('d.serial', deviceSerialNumber)
          .andWhere('c.abbreviation', countryCode)
          .select(fields)
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
  } = availableResultDetails
  const selectFields = [
    'r.id',
    'r.externalId',
    'r.resultData',
    'rc1.externalId as resultCategory1',
    'rc2.externalId as resultCategory2',
  ]
  const queryStart = knex
    .from('Result as r')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .where('r.partnerId', partnerId)
  let matchingResults = []
  let matchingResult = null
  if (gxAlertUniqueId) {
    matchingResults = await queryStart
      .clone()
      .andWhere('r.externalId', gxAlertUniqueId)
      .select(selectFields)
  }
  if (matchingResults.length === 1) {
    ;[matchingResult] = matchingResults
  } else if (matchingResults.length > 1 && geneXpertTestId) {
    matchingResults = _.filter(
      matchingResults,
      result =>
        _.get(JSON.parse(result.resultData), 'geneXpertTestId') ===
        geneXpertTestId
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
    matchingResults = await queryStart
      .clone()
      .andWhereRaw(
        'JSON_EXTRACT(r.resultData, "$.geneXpertTestId") = ?',
        geneXpertTestId
      )
      .select(selectFields)
    if (matchingResults.length === 1) {
      ;[matchingResult] = matchingResults
    }
    if (matchingResults.length > 1 && gxAlertUniqueId) {
      matchingResults = _.filter(matchingResults, {
        externalId: gxAlertUniqueId,
      })
      if (matchingResults.length === 1) {
        ;[matchingResult] = matchingResults
      }
    }
  }

  if (_.isEmpty(matchingResult) && geneXpertTestId) {
    matchingResults = await queryStart
      .clone()
      .andWhere('r.externalId', geneXpertTestId)
      .select(selectFields)
    if (matchingResults.length === 1) {
      ;[matchingResult] = matchingResults
    } else if (matchingResults.length > 1) {
      matchingResults = _.filter(
        matchingResults,
        result =>
          _.get(JSON.parse(result.resultData), 'geneXpertTestId') ===
          geneXpertTestId
      )
      if (matchingResults.length === 1) {
        ;[matchingResult] = matchingResults
      }
    }
  }

  if (_.isEmpty(matchingResult) && cartridgeSerial && instrumentSerial) {
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
        result =>
          _.get(JSON.parse(result.resultData), 'geneXpertTestId') ===
          geneXpertTestId
      )
      if (matchingResults.length === 1) {
        ;[matchingResult] = matchingResults
      }
    }
  }
  return matchingResult
}

async function getOrCreateSite(
  knex,
  device,
  payload,
  now,
  countryCode,
  deviceName,
  fromGxAlert
) {
  let sites = []
  if (!countryCode) {
    countryCode = _.get(payload, 'configuration.data.country')
    if (!countryCode) {
      if (!countryCode && device) {
        ;[countryCode] = await knex('Device as d')
          .leftJoin('Site as s', 's.id', 'd.siteId')
          .innerJoin('Geography as g', function() {
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
  if (deviceName && countryCode) {
    if (device.siteId && !fromGxAlert) {
      sites = await knex
        .from('Site as s')
        .where('s.id', device.siteId)
        .select()
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
        .andWhere(function() {
          this.where({ 's.name': deviceName })
            .orWhere({ 's.shortName': deviceName })
            .orWhere({ 's.externalId': deviceName })
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
        const country = await knex
          .from('Country as c')
          .where({ abbreviation: countryCode })
          .first('c.id')
        if (country == null) {
          throw Boom.notFound(
            `Cannot determine the country from ${countryCode}.`
          )
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
          shortName: deviceName,
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
        sites = await knex
          .from('Site as s')
          .where('s.id', newSiteId)
          .select()
      }
    }
  } else {
    throw Boom.notFound('Cannot determine which site this request came from')
  }
  return _.head(sites)
}

async function postProcessAddDeviceOperation({ device, payload, now }) {
  let inventoryItemIds = []
  const inventoryChanges = _.get(payload, 'data.inventoryChanges')
  if (!_.isEmpty(inventoryChanges)) {
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
          const matchingConsumableReason = await findConsumableReason(
            inventoryChange.consumableReasonName
          )
          if (matchingConsumableReason) {
            const absoluteQuantity = Math.abs(inventoryChange.quantity)
            const isDecrease =
              (matchingConsumableReason.reset &&
                inventoryChange.quantity < 0) ||
              matchingConsumableReason.decrease
            const adjustInventory = isDecrease
              ? decreaseInventory
              : increaseInventory
            if (!device.siteId && device.id) {
              const deviceData = await getDevice(device.id)
              device.siteId = deviceData.siteId
            }
            if (!device.siteId) {
              throw Boom.notFound(
                'Cannot determine which site this request came from'
              )
            }
            const changeParameters = {
              siteId: device.siteId,
              consumableId: matchingConsumable.id,
              expiresOn: parseDateOrDefault(inventoryChange.expirationDate),
              quantity: absoluteQuantity,
              quantityOnHand: inventoryChange.resultingQuantityOnHand,
              reasonId: matchingConsumableReason.id,
              dateAdjustedFrom: inventoryChange.dateChanged
                ? setMilliseconds(
                    parseDateOrDefault(inventoryChange.dateChanged),
                    0
                  )
                : null,
              now,
            }
            changeParameters.operation = isDecrease
              ? 'remove from GxConnect'
              : 'add from GxConnect'
            return adjustInventory(changeParameters)
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

async function postProcessUpdateDeviceConfiguration({
  knex,
  payload,
  device: { id: deviceId },
  now,
}) {
  let device = {}
  if (!_.isEmpty(_.get(payload, 'data'))) {
    const {
      data: {
        macAddress,
        hostId,
        culture,
        timezone,
        deviceSerialNumber,
        lastPingOn,
        state,
        lga,
        latitude,
        longitude,
      },
    } = payload
    const deviceDetails = {
      hostId,
      culture,
      timezone,
      lastSeenOn: parseDateOrDefault(lastPingOn, now),
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
        .innerJoin('Geography as g', function() {
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
        if (
          newStateId !== currentDeviceGeography.stateId ||
          newLgaId !== currentDeviceGeography.lgaId
        ) {
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
        if (
          !_.isUndefined(latitude) &&
          currentDeviceGeography.latitude !== latitude
        ) {
          siteUpdateDetails.latitude = latitude
        }
        if (
          !_.isUndefined(longitude) &&
          currentDeviceGeography.longitude !== longitude
        ) {
          siteUpdateDetails.longitude = longitude
        }
        if (!_.isEmpty(siteUpdateDetails)) {
          await knex('Site')
            .where({ id: currentDeviceGeography.siteId })
            .update(siteUpdateDetails)
        }
      }
    }
    device = await updateDeviceDetails(
      knex,
      deviceId,
      _.omitBy(deviceDetails, _.isNil),
      now
    )
  }
  return { device }
}

module.exports = {
  findDevices,
  findExistingResult,
  getOrCreateSite,
  postProcessAddDeviceOperation,
  postProcessUpdateDeviceConfiguration,
}
