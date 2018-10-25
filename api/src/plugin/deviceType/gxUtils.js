const _ = require('lodash')
const Boom = require('boom')

const setMilliseconds = require('date-fns/set_milliseconds')
const {
  findConsumables,
  findConsumableReason,
} = require('../../consumable/consumableService')
const {
  increaseInventory,
  decreaseInventory,
} = require('../../inventory/service')
const { getDevice } = require('../../device/service')
const { createUniqueIdForResult } = require('../../result/service')
const { parseDateOrDefault } = require('../../shared/date')
const { updateDeviceDetails } = require('../../deviceApi/device')

/*
The purpose of this plugin is to ensure that results are captured
even when the site is unknown to Aspect
If the device is unknown, ignore this request
If the site for the device in unknown, create a site and link it to the device
*/
async function preProcessAddDeviceData({ knex, device, payload, now }) {
  if (_.isEmpty(device)) {
    throw Boom.notFound(`Cannot find device ${JSON.stringify(device)}`)
  }
  const configurationData = _.get(payload, 'configuration.data') || {}
  const site = await getOrCreateSite(knex, device, payload, now)
  const deviceDetails = {
    lastSeenOn: parseDateOrDefault(configurationData.lastPingOn, now),
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
      [
        'macAddress',
        'gxAlertDeviceId',
        'hostId',
        'deviceSerialNumber',
        'country',
        'lastPingOn',
      ].includes(configurationDataKey)
    )
  ) {
    deviceDetails.lastPingOn = parseDateOrDefault(
      configurationData.lastPingOn,
      now
    )
  }
  await knex
    .from('Device')
    .where({ id: device.id })
    .update(deviceDetails)
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
    throw Boom.badRequest(
      'Start date or end date is required for a result from GxConnect'
    )
  }
  const [device] = await knex
    .from('Device as d')
    .where({ 'd.id': deviceId })
    .select('d.id', 'd.siteId', 'd.partnerId', 'd.deviceTypeId')
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
  const generatedExternalId = createUniqueIdForResult(
    instrumentSerial,
    startedOn,
    endedOn,
    sampleId
  )
  const gxAlertUniqueId = _.get(
    payload,
    'data.gxAlertTestUniqueId',
    generatedExternalId
  )
  const geneXpertTestId = _.get(payload, 'id') || _.get(payload, 'data.id')
  const existingResult = await findExistingResult(
    {
      partnerId: device.partnerId,
      geneXpertTestId,
      gxAlertUniqueId,
      cartridgeSerial,
      instrumentSerial,
    },
    knex
  )
  if (!existingResult) {
    // Only assign assay to GxUnknown if result is new
    await assignGxUnknownAssayIfNotExists(knex, payload)
  } else {
    // Are we setting this result to NO RESULT?
    if (
      !_.isEmpty(_.get(payload, 'category', [])) &&
      _.every(_.get(payload, 'category'), { id: 'NoResult' })
    ) {
      // Has the result already been determined?
      if (
        _.get(existingResult, 'resultCategory1') !== 'NoResult' ||
        _.get(existingResult, 'resultCategory2') !== 'NoResult'
      ) {
        // We should never merge an incomplete result over a complete result
        throw Boom.conflict('A later version of this result already exists')
      }
    }
    if (_.get(existingResult, 'externalId') !== generatedExternalId) {
      await knex('Result')
        .where('id', existingResult.id)
        .update({ externalId: generatedExternalId })
    }
  }
  payload.id = generatedExternalId
}

async function transformMergeResultPayload({ deviceId, payload, knex }) {
  const resultCoordinates = _.get(payload, 'location')
  if (
    deviceId &&
    (_.isEmpty(resultCoordinates) ||
      (!resultCoordinates.latitude && !resultCoordinates.longitude))
  ) {
    const siteCoordinates = await knex('Device as d')
      .join('Site as s', 'd.siteId', 's.id')
      .where('d.id', deviceId)
      .first('s.latitude', 's.longitude')

    if (
      !_.isEmpty(siteCoordinates) &&
      (siteCoordinates.longitude || siteCoordinates.latitude)
    ) {
      payload.location = siteCoordinates
    }
  }
  return Promise.resolve(payload)
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
    'd.geographyId',
    'd.name',
    'd.serial',
    'd.macAddress',
    'd.configurationData',
    'd.lastSeenOn',
    'd.putInService',
    'ds.token as status',
    'dt.externalId as deviceType',
    'dt.plugin as deviceTypePluginName',
    'p.plugin as partnerPluginName',
    'dtc.name as deviceTypeCategory'
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
    .leftJoin('Partner as p', 'd.partnerId', 'p.id')
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

async function assignGxUnknownAssayIfNotExists(knex, payload) {
  const payloadAssayId = _.get(payload, 'assay.id', false)
  const assay = await knex
    .from('Assay as a')
    .where({ 'a.externalId': payloadAssayId })
    .first('a.externalId')
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
      const resultTextValues = _.compact(payloadResultText.split('|'))
      const assayId = _.get(payload, 'assay.id')
      if (resultTextValues.length > 0) {
        const result1Text = resultTextValues[0]
          .toLowerCase()
          .replace(/mtb/, '')
          .replace(/ebola gp/, '')
          .trim()
        const result1CategoryMapping = {
          'not detected': 'NotDetected',
          'não detectado': 'NotDetected',
          'не обнаружен': 'NotDetected',
          'non détecté': 'NotDetected',
          'no detectado': 'NotDetected',
          detected: 'Detected',
          'detected very low': 'Detected',
          'detected low': 'Detected',
          'detected medium': 'Detected',
          'detected high': 'Detected',
          detectado: 'Detected',
          'detectado alto': 'Detected',
          'detectado médio': 'Detected',
          'detectado baixo': 'Detected',
          'detectado muito baixo': 'Detected',
          обнаружен: 'Detected',
          'обнаружен очень низкий': 'Detected',
          'обнаружен низкий': 'Detected',
          'обнаружен средний': 'Detected',
          'обнаружен высокий': 'Detected',
          détecté: 'Detected',
          'détecté très bas': 'Detected',
          'détecté bas': 'Detected',
          'détecté moyen': 'Detected',
          'détecté élevé': 'Detected',
          'detectado muy bajo': 'Detected',
          'detectado bajo': 'Detected',
          'detectado medio': 'Detected',
          invalid: 'Invalid',
          inválido: 'Invalid',
          недействительный: 'Invalid',
          'non valide': 'Invalid',
          'no result': 'NoResult',
          'sem resultado': 'NoResult',
          безрезультатно: 'NoResult',
          'sans résultat': 'NoResult',
          'sin resultado': 'NoResult',
          error: 'Error',
          erro: 'Error',
          ошибка: 'Error',
          erreur: 'Error',
          'null null': 'Success',
        }
        if (assayId === 'GxMtbRifUltra') {
          result1CategoryMapping['trace detected'] = 'Trace Detected'
        }
        if (result1CategoryMapping[result1Text]) {
          payloadCategory = [{ id: result1CategoryMapping[result1Text] }]
        }
      }
      const result1 = _.isEmpty(payloadCategory) ? null : payloadCategory[0].id
      const canHaveSecondResult =
        [
          'Detected',
          'Trace Detected',
          'Error',
          'Invalid',
          'NoResult',
          'Success',
        ].includes(result1) ||
        !_.includes(['GxMtbRif', 'GxMtbRifUltra'], assayId)

      if (resultTextValues.length > 1) {
        const result2Text = resultTextValues[1]
          .toLowerCase()
          .replace(/rif resistance/, '')
          .replace(/ebola np/, '')
          .trim()
        if (canHaveSecondResult) {
          const result2CategoryMapping = {
            'not detected': 'NotDetected',
            'não detectado': 'NotDetected',
            'не обнаружен': 'NotDetected',
            'non détecté': 'NotDetected',
            'no detectado': 'NotDetected',
            detected: 'Detected',
            detectado: 'Detected',
            обнаружен: 'Detected',
            détecté: 'Detected',
            indeterminate: 'Indeterminate',
            indeterminado: 'Indeterminate',
            неопределенный: 'Indeterminate',
            indéterminé: 'Indeterminate',
            error: 'Error',
            invalid: 'Invalid',
            'no result': 'NoResult',
          }
          if (result2CategoryMapping[result2Text]) {
            payloadCategory = [
              ...payloadCategory,
              { id: result2CategoryMapping[result2Text] },
            ]
          }
        }
      } else if (
        canHaveSecondResult &&
        ['Error', 'Invalid', 'NoResult'].includes(result1)
      ) {
        payloadCategory = [...payloadCategory, { id: result1 }]
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

module.exports = {
  findDevices,
  getOrCreateSite,
  preProcessAddDeviceData,
  preProcessMergeResult,
  transformMergeResultPayload,
  postProcessAddDeviceOperation,
  postProcessUpdateDeviceConfiguration,
}
