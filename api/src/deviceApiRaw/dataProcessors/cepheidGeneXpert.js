const Promise = require('bluebird')
const _ = require('lodash')
const Boom = require('boom')
const { dateFormat, setMilliseconds } = require('date-fns')
const { transact } = require('../../db')
const { getDevice } = require('../../device/service')
const {
  createNewDevice,
  updateDeviceConfiguration,
  updateDeviceDetails,
  addDeviceOperation,
} = require('../../deviceApi/device')
const {
  mergeResult,
  addResultWorkflowLogIfChanged,
  consumeInventoryForResult,
} = require('../../deviceApi/result')
const {
  findConsumables,
  findConsumableReason,
} = require('../../consumable/consumableService')
const {
  increaseInventory,
  decreaseInventory,
  getInventoryItems,
} = require('../../inventory/service')
const { createUniqueIdForResult } = require('../../result/service')
const { parseDateOrDefault, getDateOrDefault } = require('../../shared/date')
const { deviceStatusToId } = require('../../shared/dictionary')
const { getRemoteAddress } = require('../../shared/request')
const {
  deviceMaintenance,
  deviceMaintenanceResolved,
  deviceSeen,
} = require('../../device/actions')
const { SynchronousDataProcessor } = require('./_base')

class DefaultCepheidGeneXpert extends SynchronousDataProcessor {
  constructor(request, messageContext) {
    super(request, messageContext)
    this.processRequest = this.processRequest.bind(this)
    this.getResponse = this.getResponse.bind(this)
    this.response = {}
  }

  static async canProcessRequest(request) {
    return Promise.resolve(
      _.get(request, 'payload.type.id') === 'CepheidGeneXpert'
    )
  }

  async processRequest() {
    const { request } = this
    const { auth, payload } = request
    const { name, type, site, result, configuration, operation } = payload
    const now = new Date()
    this.response = await transact(async knex => {
      const existingDeviceLinkedToApiKey = await knex('DeviceApiKey as dak')
        .where('dak.token', auth.credentials.token)
        .first(
          'dak.id as deviceApiKeyId',
          'dak.deviceId',
          'dak.partnerId',
          'dak.siteId',
          'dak.geographyId'
        )
      const {
        deviceApiKeyId,
        partnerId,
        geographyId,
      } = existingDeviceLinkedToApiKey
      let { deviceId, siteId } = existingDeviceLinkedToApiKey
      const deviceIdFromGxAlertSource = _.get(
        configuration,
        'data.gxAlertDeviceId',
        null
      )
      if (!deviceId) {
        const countryCode = _.get(configuration, 'data.country', null)
        if (!countryCode) {
          throw Boom.badRequest(
            'Cannot determine which device this came from without a country code in configuration.data.country'
          )
        } else {
          const hostId = _.get(configuration, 'data.hostId', null)
          const countryCode = _.get(configuration, 'data.country', null)
          const deviceSerialNumber = _.get(
            configuration,
            'data.deviceSerialNumber',
            null
          )
          const deviceQuery = knex
            .from('Device as d')
            .leftJoin('Site as s', 's.id', 'd.siteId')
            .innerJoin('Geography as g', function() {
              this.on('d.geographyId', 'g.id').orOn('s.geographyId', 'g.id')
            })
            .innerJoin('Country as c', 'g.countryId', 'c.id')
            .leftJoin('DeviceStatus as ds', 'd.deviceStatusId', 'ds.id')
            .leftJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
            .leftJoin(
              'DeviceTypeCategory as dtc',
              'dtc.id',
              'dt.deviceTypeCategoryId'
            )
          let matchingDevices = []
          if (deviceIdFromGxAlertSource) {
            matchingDevices = await deviceQuery
              .clone()
              .whereRaw(
                `JSON_EXTRACT(d.configurationData, "$.gxAlertDeviceId") = ${deviceIdFromGxAlertSource}`
              )
              .andWhere('d.partnerId', partnerId)
              .select('d.id as deviceId', 'd.partnerId')
          }
          if (_.isEmpty(matchingDevices) && countryCode) {
            if (hostId && deviceSerialNumber) {
              matchingDevices = await deviceQuery
                .clone()
                .where('d.partnerId', partnerId)
                .andWhere('d.hostId', hostId)
                .andWhere('d.serial', deviceSerialNumber)
                .andWhere('c.abbreviation', countryCode)
                .select('d.id as deviceId', 'd.partnerId')
            }
          }
          matchingDevices = _.uniqBy(matchingDevices, 'id')
          if (!_.isEmpty(matchingDevices)) {
            let matchingDevice = null
            if (matchingDevices.length > 1) {
              throw Boom.conflict(
                `Cannot uniquely determine which device this request came from using ${JSON.stringify(
                  {
                    hostId,
                    countryCode,
                    deviceSerialNumber,
                    deviceIdFromGxAlertSource,
                    partnerId,
                  }
                )}`
              )
            } else if (matchingDevices.length === 1) {
              ;[matchingDevice] = matchingDevices
            }
            await knex
              .from('DeviceApiKey')
              .where({ deviceId: matchingDevice.deviceId })
              .update({ deviceId: null, revoked: 1 })

            await knex
              .from('DeviceApiKey')
              .where({
                token: auth.credentials.token,
              })
              .update({ deviceId: matchingDevice.deviceId })
            ;({ deviceId } = matchingDevice.deviceId)
          } else {
            const deviceTypeExternalId = _.get(type, 'id', null)
            if (!deviceTypeExternalId) {
              throw Boom.badRequest(
                'Must specify device type on first request with new key'
              )
            }
            const { device, error } = await createNewDevice(knex, now, {
              deviceTypeExternalId,
              name: payload.name,
              serial: payload.serial,
              partnerId,
              siteId,
              geographyId,
              status: siteId ? 'approved' : 'provisioned',
            })
            if (error) {
              throw error
            }
            deviceId = device.id
            const configurationData = _.get(configuration, 'data') || {}
            let matchingSites = []
            if (name && countryCode) {
              if (device.siteId && !deviceIdFromGxAlertSource) {
                matchingSites = await knex
                  .from('Site as s')
                  .where('s.id', device.siteId)
                  .select()
              }
              const payloadSiteId = _.get(site, 'id')
              if (_.isEmpty(matchingSites) && payloadSiteId) {
                matchingSites = await knex
                  .from('Site as s')
                  .where({
                    's.externalId': payloadSiteId,
                    's.partnerId': partnerId,
                  })
                  .select()
              }
              if (
                _.isEmpty(matchingSites) &&
                device.id &&
                !deviceIdFromGxAlertSource
              ) {
                matchingSites = await knex
                  .from('Device as d')
                  .join('Site as s', 'd.siteId', 's.id')
                  .where({ 'd.id': device.id })
                  .select('s.*')
              }
              if (_.isEmpty(matchingSites)) {
                matchingSites = await knex
                  .from('Site as s')
                  .join('Geography as g', 's.geographyId', 'g.id')
                  .join('Country as c', 'g.countryId', 'c.id')
                  .where({
                    's.partnerId': device.partnerId,
                    'c.abbreviation': countryCode,
                  })
                  .andWhere(function() {
                    this.where({ 's.name': name })
                      .orWhere({ 's.shortName': name })
                      .orWhere({ 's.externalId': name })
                  })
                  .select('s.*')
                if (matchingSites.length === 1) {
                  matchingSites = matchingSites.splice(0, 1)
                } else if (matchingSites.length > 1) {
                  throw Boom.conflict(
                    `Cannot uniquely determine which site this request came from using ${name} in ${countryCode})`
                  )
                }
                if (_.isEmpty(matchingSites)) {
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
                    const [geographyId] = await knex('Geography').insert({
                      countryId,
                    })
                    geography.id = geographyId
                  }

                  const newSite = {
                    name,
                    shortName: name,
                    externalId: name,
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
                  matchingSites = await knex
                    .from('Site as s')
                    .where('s.id', newSiteId)
                    .select()
                }
              }
            } else {
              throw Boom.notFound(
                'Cannot determine which site this request came from'
              )
            }
            const matchingSite = _.head(matchingSites)
            siteId = matchingSite.id
            const deviceDetails = {
              lastSeenOn: parseDateOrDefault(configurationData.lastPingOn, now),
              updatedOn: now,
              updatedBy: null,
            }
            if (device.siteId !== siteId) {
              deviceDetails.siteId = siteId
            }
            if (device.geographyId !== matchingSite.geographyId) {
              deviceDetails.geographyId = matchingSite.geographyId
            }
            // A ping from GxConnect is just a configuration POST with a MAC address,
            // host ID, device Serial and country abbreviation
            // A ping from GxConnect forwarded by GxAlert is the same as a ping coming
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
              .where({ id: deviceId })
              .update(deviceDetails)
            await knex('DeviceApiKey')
              .where('id', deviceApiKeyId)
              .update({ deviceId, updatedOn: now })
          }
        }
      }
      const remoteAddress = getRemoteAddress(request)
      const checkpoint = payload && payload.checkpoint
      const [deviceLogId] = await knex('DeviceLog').insert({
        deviceId,
        checkpoint,
        source: _.get(payload, 'log.source', ''),
        createdOn: now,
        senderIp: remoteAddress,
        // TODO: DeviceLog handle non-JSON payloads
        rawMessage: JSON.stringify(request.plugins.rawPayload),
      })
      const inactive = _.get(payload, 'configuration.data.inactive', null)
      let lastPingOn
      if (inactive !== true) {
        // If ping contained in configuration payload, use it as last seen
        // for GeneXpert device otherwise use default "now"
        lastPingOn = getDateOrDefault(
          payload,
          'configuration.data.lastPingOn',
          now
        )
      }
      const deviceUpdates = lastPingOn
        ? {
            lastSeenOn: lastPingOn,
            lastPingOn,
            lastPingFromIp: remoteAddress,
          }
        : {}
      if (!_.isEmpty(deviceUpdates)) {
        await knex('Device')
          .where({ id: deviceId })
          .update(deviceUpdates)
        this.messageContext.dispatch(deviceSeen(deviceId))
      }
      let response = {}
      const deviceLogUpdate = {}
      if (name) {
        await knex('Device')
          .where({ id: deviceId })
          .update({ name, updatedOn: now })
      }
      if (!_.isEmpty(site)) {
        const siteExternalId = _.get(site, 'id', null)
        if (siteExternalId == null) {
          throw Boom.badRequest('Must specify site id to update Site')
        }
        // Find unique site with specified external ID for same partner as device
        const matchingSites = await knex('Site as s')
          .where({
            partnerId,
            externalId: siteExternalId,
          })
          .select('id')
          .limit(2)
        if (matchingSites.length !== 1) {
          throw Boom.badRequest(
            `Cannot find unique site with id ${siteExternalId}`
          )
        }
        const matchingSite = matchingSites[0]
        if (siteId !== site.id) {
          siteId = matchingSite.id
          const status = siteId == null ? 'approved' : 'assigned'
          const deviceStatusId = await deviceStatusToId(status)

          await knex('Device')
            .where({ id: deviceId })
            .update({
              siteId,
              deviceStatusId,
            })

          await knex('DeviceStatusLog').insert({
            deviceId,
            deviceStatusId,
            changedOn: now,
            createdOn: now,
            createdBy: null,
          })
          // Update DeviceApiKey site with the new siteId
          await knex('DeviceApiKey')
            .where({ deviceId })
            .update({ siteId })
          await knex('DeviceSiteHistory').insert({
            deviceId,
            siteId,
            createdOn: now,
          })
        }
      }
      if (configuration) {
        const configurationData = _.get(configuration, 'data') || {}
        const inactive = _.get(configurationData, 'inactive', null)
        if (!_.isNull(inactive)) {
          const blankMaintenanceData = {
            reason: null,
            note: null,
            expectedBackOnline: null,
          }
          const expectedBackOnlineInData = _.get(
            configurationData,
            'inactiveMaintenanceExpectedBackOnline',
            null
          )
          const newMaintenanceData = _.assign({}, blankMaintenanceData, {
            reason: inactive
              ? _.get(configurationData, 'inactiveMaintenanceReason', null)
              : null,
            note: inactive
              ? _.get(configurationData, 'inactiveMaintenanceNote', null)
              : null,
            expectedBackOnline:
              !inactive || _.isEmpty(expectedBackOnlineInData)
                ? null
                : dateFormat(expectedBackOnlineInData, 'YYYY-MM-DD'),
          })
          const dueOn = parseDateOrDefault(
            newMaintenanceData.expectedBackOnline
          )
          if (inactive) {
            this.messageContext.dispatch(
              deviceMaintenance(deviceId, {
                dueOn,
                data: newMaintenanceData,
              })
            )
          } else {
            this.messageContext.dispatch(deviceMaintenanceResolved(deviceId))
          }
        }
        await updateDeviceConfiguration(knex, deviceId, configuration, now)
        let configurationResponse = {}
        if (!_.isEmpty(configurationData)) {
          const {
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
          } = configurationData
          const deviceDetails = {
            hostId,
            culture,
            timezone,
            lastSeenOn: parseDateOrDefault(lastPingOn, now),
          }
          if (
            !_.isEmpty(macAddress) &&
            macAddress.indexOf('MAC') === 0 &&
            macAddress.trim().length > 3 &&
            macAddress !== 'MAC005345000000'
          ) {
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
          configurationResponse = await updateDeviceDetails(
            knex,
            deviceId,
            _.omitBy(deviceDetails, _.isNil),
            now
          )
        }
        response = Object.assign({}, response, configurationResponse)
      }
      if (operation) {
        const op = await addDeviceOperation(knex, deviceId, operation, now)
        deviceLogUpdate.deviceOperationId = op.id

        let inventoryItemIds = []
        const inventoryChanges = _.get(operation, 'data.inventoryChanges')
        if (!_.isEmpty(inventoryChanges)) {
          const sortedInventoryChanges = _.sortBy(
            inventoryChanges,
            inventoryChange => parseDateOrDefault(inventoryChange.dateChanged)
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
                  if (!siteId && deviceId) {
                    ;({ siteId } = await getDevice(deviceId))
                  }
                  if (!siteId) {
                    throw Boom.notFound(
                      'Cannot determine which site this request came from'
                    )
                  }
                  const changeParameters = {
                    siteId,
                    consumableId: matchingConsumable.id,
                    expiresOn: parseDateOrDefault(
                      inventoryChange.expirationDate
                    ),
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
        let operationResponse = {
          inventoryItemIds: _.filter(inventoryItemIds, id => id > 0),
        }
        if (deviceIdFromGxAlertSource) {
          operationResponse = {
            inventoryItems: await getInventoryItems(inventoryItemIds),
          }
        }
        response = Object.assign({}, response, operationResponse)
      }
      if (result) {
        // TODO: Create Processor for Myanmar with logic in transformMergeResultPayload
        if (!deviceId) {
          throw Boom.notFound('Cannot find device')
        }
        const startedOn = _.get(result, 'startedOn') || _.get(result, 'endedOn')
        const endedOn = _.get(result, 'endedOn') || startedOn
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
        if (!_.isEmpty(result.data)) {
          let payloadCategory = _.get(result, 'category')
          if (_.isEmpty(payloadCategory)) {
            payloadCategory = []
            const payloadResultText = _.get(result, 'data.resultText')
            if (payloadResultText) {
              const resultTextValues = _.compact(payloadResultText.split('|'))
              const assayId = _.get(result, 'assay.id')
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
                  payloadCategory = [
                    { id: result1CategoryMapping[result1Text] },
                  ]
                }
              }
              const result1 = _.isEmpty(payloadCategory)
                ? null
                : payloadCategory[0].id
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
          result.category = payloadCategory
        } else {
          result.data = {}
        }
        const instrumentSerial = _.get(result, 'instrument.serial', null)
        const cartridgeSerial = _.get(result, 'consumable[0].serial', null)
        const sampleId = _.get(result, 'sample.id')
        if (result.id) {
          result.data.geneXpertTestId = result.id
        }
        const generatedExternalId = createUniqueIdForResult(
          instrumentSerial,
          startedOn,
          endedOn,
          sampleId
        )
        const gxAlertUniqueId = _.get(
          result,
          'data.gxAlertTestUniqueId',
          generatedExternalId
        )
        const geneXpertTestId = _.get(result, 'id') || _.get(result, 'data.id')
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
        const existingResult = matchingResult
        if (!existingResult) {
          // Only assign assay to GxUnknown if result is new
          const payloadAssayId = _.get(result, 'assay.id', false)
          const assay = await knex
            .from('Assay as a')
            .where({ 'a.externalId': payloadAssayId })
            .first('a.externalId')
          if (_.isEmpty(assay)) {
            _.set(result, 'assay.id', 'GxUnknown')
          }
        } else {
          // Are we setting this result to NO RESULT?
          if (
            !_.isEmpty(_.get(result, 'category', [])) &&
            _.every(_.get(result, 'category'), { id: 'NoResult' })
          ) {
            // Has the result already been determined?
            if (
              _.get(existingResult, 'resultCategory1') !== 'NoResult' ||
              _.get(existingResult, 'resultCategory2') !== 'NoResult'
            ) {
              // We should never merge an incomplete result over a complete result
              throw Boom.conflict(
                'A later version of this result already exists'
              )
            }
          }
          if (_.get(existingResult, 'externalId') !== generatedExternalId) {
            await knex('Result')
              .where('id', existingResult.id)
              .update({ externalId: generatedExternalId })
          }
        }
        result.id = generatedExternalId
        const resultCoordinates = _.get(result, 'location')
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
            result.location = siteCoordinates
          }
        }
        const {
          processedResult: savedResult,
          existingResult: previousResult,
        } = await mergeResult(knex, deviceId, result, { now })
        deviceLogUpdate.resultId = savedResult.id
        await addResultWorkflowLogIfChanged(
          knex,
          result,
          savedResult,
          previousResult,
          'Device API Update',
          now
        )
        const country = await knex('Device as d')
          .join('Geography as g', 'd.geographyId', 'g.id')
          .join('Country as c', 'g.countryId', 'c.id')
          .where('d.id', deviceId)
          .first()
        let taggingResults = []
        let res = []
        if (country) {
          const getTags = (regExp, field) => {
            const re = new RegExp(regExp, 'g')
            return field && field !== '' ? field.toString().match(re) : []
          }
          if (country.tagRegexSampleId && country.tagRegexSampleId !== '') {
            res = getTags(country.tagRegexSampleId, result.sampleId)

            if (res) taggingResults = taggingResults.concat(res)
          }

          if (country.tagRegexNotes && country.tagRegexNotes !== '') {
            res = getTags(country.tagRegexNotes, result.notes)
            if (res) taggingResults = taggingResults.concat(res)
          }
          const patientdata = JSON.parse(result.patientData)
          if (
            patientdata &&
            country.tagRegexPatientId &&
            country.tagRegexPatientId !== ''
          ) {
            res = getTags(country.tagRegexPatientId, patientdata.id)
            if (res) taggingResults = taggingResults.concat(res)
          }
        }
        taggingResults = _.uniqBy(taggingResults)
        const existingTags = await knex('Tag as t')
          .join('ResultTag as rt', 't.id', 'rt.tagId')
          .select('t.id', 't.title')
          .distinct('t.id', 't.title')
          .where('t.partnerId', partnerId)
          .whereNot('rt.resultId', savedResult.id)
          .whereIn('t.title', taggingResults)
        const includesIgnoreCase = (collection, value) =>
          _.some(
            collection,
            item => item.title.toLowerCase() === value.toLowerCase()
          )
        const tagsToBeAdded = _.uniqBy(
          _.filter(
            taggingResults,
            tag => !includesIgnoreCase(existingTags, tag)
          )
        )
        const tagsToBeUpdated = _.uniqBy(
          _.filter(existingTags, tag => includesIgnoreCase(taggingResults, tag))
        )
        _.map(tagsToBeAdded, async tag => {
          const TagId = await knex('Tag')
            .returning('id')
            .insert({
              title: tag,
              partnerId: result.partnerId,
            })
          await knex('ResultTag').insert({
            tagId: TagId,
            resultId: result.id,
          })
        })
        _.map(tagsToBeUpdated, async elem => {
          await knex('ResultTag').insert({
            tagId: elem.id,
            resultId: result.id,
          })
        })
        // // TODO ASP-355 consume inventory using a message listener instead
        await consumeInventoryForResult(knex, payload, result)
        const resultResponse = {}
        if (deviceIdFromGxAlertSource) {
          const resultFromDatabase = await knex('Result as r')
            .where('r.id', result.id)
            .first()
          resultResponse.result = resultFromDatabase
        }
        response = Object.assign({}, response, resultResponse)
      }
      if (!_.isEmpty(deviceLogUpdate)) {
        await knex('DeviceLog')
          .where({ id: deviceLogId })
          .update(deviceLogUpdate)
      }
      return response
    })
  }

  async getResponse() {
    return Promise.resolve(this.response)
  }
}

module.exports = DefaultCepheidGeneXpert
