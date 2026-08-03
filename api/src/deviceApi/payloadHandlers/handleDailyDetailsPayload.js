const _ = require('lodash')
const logger = require('../../shared/logger')
const { getCustomFields } = require('../../forms/service')
const gxConnectSchema = require('../../../jsonSchemas/gxConnectCustomFieldsSchema.json')
const validate = require('../../../jsonSchemas/validate')
const {
  mapGxConnectCustomFields,
} = require('../../plugin/deviceType/GxConnect/customFields/customFieldsMappingTemplates')
const { knex, transact } = require('../../db')
const { deviceTypeToId } = require('../../shared/dictionary')
const { createDeviceFromDeviceApi } = require('../../device/common/createDeviceFromDeviceApi')
const { loadPlugin } = require('../../plugin/loadPlugin')
const { parseDateOrDefault } = require('../../shared/date')
const { updateDeviceConfiguration } = require('./shared/logic')

const DEVICE_TYPE_EXTERNAL_ID = 'CepheidGeneXpert'
const INSTRUMENT_DETAIL_COLUMNS = ['macAddress', 'letterOffset', 'version']
const MODULE_NAME_MAX_LENGTH = 15
const MODULE_SERIAL_MAX_LENGTH = 15
const LOG_DETAIL_MAX_LENGTH = 255

const handleDailyDetailsPayload = async (request, deviceLogId, remoteAddress) => {
  const { auth, payload } = request
  const { partnerId, deviceApiKeyId, deviceIds } = auth.credentials

  // This endpoint is currently used only by GxConnect devices and supports only the Cepheid GeneXpert device type.
  const deviceTypeId = await deviceTypeToId(DEVICE_TYPE_EXTERNAL_ID)

  const response = {}

  if (_.has(payload, 'configuration.data.instruments')) {
    logger.debug('executing syncInstruments')
    response.instruments = await syncInstruments({ payload, auth, partnerId, deviceTypeId, now: new Date() })
  }

  if (payload.configuration) {
    logger.debug('executing updateDeviceConfiguration')
    await updateDeviceConfiguration({
      knex,
      payload,
      deviceIds,
      messageContext: request.plugins.messageContext,
      remoteAddress,
    })
  }

  if (payload.includeDeviceConfiguration) {
    logger.debug('executing processPendingDeviceConfiguration')
    const { deviceConfiguration } = await processPendingDeviceConfiguration(
      knex,
      partnerId,
      deviceApiKeyId,
      deviceTypeId
    )

    response.deviceConfiguration = deviceConfiguration
  }

  if (payload.getFormsDefinition) {
    logger.debug('executing getCustomFieldsDefinitionForGxconnect')
    const { CustomFields } = await getCustomFieldsDefinitionForGxconnect(partnerId, deviceTypeId)

    // TODO: Reduce bandwidth by only sending custom fields when the definition was updated after this device last received them.
    await knex('Device').update({ customFieldsSentOn: new Date() }).where('deviceApiKeyId', deviceApiKeyId)
    response.CustomFields = CustomFields
  }

  await knex('DeviceLog').where('id', deviceLogId).update({
    deviceConfigurationUpdated: true,
    processed: true,
  })

  return response
}

/**
 * Registers the instruments GxConnect reports in its daily details and projects the latest
 * system log of each module, so Aspect knows the full hardware layout of an installation
 * before any result arrives.
 *
 * Every instrument maps to one Aspect device: instruments Aspect has never seen get a device
 * created (same auto-registration used when a result arrives from an unknown instrument).
 *
 * @returns {Promise<Array<{serialNumber: string, deviceName: string}>>} the device name
 *          GxConnect should use for each reported instrument
 */
async function syncInstruments({ payload, auth, partnerId, deviceTypeId, now }) {
  const configurationData = _.get(payload, 'configuration.data') || {}
  const reportedInstruments = normalizeInstruments(configurationData.instruments)

  if (reportedInstruments.length === 0) {
    return []
  }

  const candidatesBySerial = await getCandidatesBySerial(reportedInstruments.map(({ serial }) => serial))
  const instrumentsBySerial = new Map()

  for (const instrument of reportedInstruments) {
    let resolved = matchInstrument(candidatesBySerial.get(instrument.serial), instrument.macAddress)
    if (!resolved) {
      // eslint-disable-next-line no-await-in-loop
      resolved = await registerInstrument({ payload, auth, partnerId, deviceTypeId, now, instrument })
    }
    instrumentsBySerial.set(instrument.serial, resolved)
  }

  await updateInstrumentDetails(reportedInstruments, instrumentsBySerial, now)
  await syncInstrumentModules(configurationData.instrumentsLogs, instrumentsBySerial)

  return reportedInstruments.map(({ serial }) => ({
    serialNumber: serial,
    deviceName: instrumentsBySerial.get(serial).deviceName,
  }))
}

/**
 * GxConnect sends its own instrument table verbatim (snake_case columns).
 */
function normalizeInstruments(instruments) {
  if (!Array.isArray(instruments)) {
    return []
  }

  return _.uniqBy(
    instruments
      .map(instrument => ({
        serial: toTrimmedString(instrument?.serial_number),
        macAddress: toTrimmedString(instrument?.mac_address, 17),
        letterOffset: toIntegerOrNull(instrument?.letter_offset),
        version: toIntegerOrNull(instrument?.version),
      }))
      .filter(({ serial }) => serial),
    'serial'
  )
}

/**
 * The same instrument can be reported through any deviceApiKey, so candidates are looked up by
 * serial alone and disambiguated afterwards by MAC address.
 */
function getCandidatesBySerial(serials) {
  return knex('Instrument as i')
    .join('Device as d', 'd.id', 'i.deviceId')
    .whereIn('i.serial', serials)
    .orderBy([
      { column: 'i.active', order: 'desc' },
      { column: 'i.id', order: 'desc' },
    ])
    .select(
      'i.id',
      'i.serial',
      ...INSTRUMENT_DETAIL_COLUMNS.map(column => `i.${column}`),
      'i.deviceId',
      'd.name as deviceName'
    )
    .then(rows => new Map(Object.entries(_.groupBy(rows, 'serial'))))
}

/**
 * A serial identifies an instrument only together with its MAC address: the same serial reported
 * with a different MAC is different hardware and gets its own instrument (returns null here).
 * Payloads predating the MAC address report none, so those keep matching by serial alone, and an
 * instrument registered without a MAC adopts the first one reported for its serial.
 *
 * @param {Array<Object>} candidates instruments sharing the reported serial, best match first
 * @param {?string} macAddress MAC address reported for the instrument, null on legacy payloads
 */
function matchInstrument(candidates = [], macAddress) {
  if (!macAddress) {
    return candidates[0] || null
  }
  return (
    candidates.find(candidate => candidate.macAddress === macAddress) ||
    candidates.find(candidate => !candidate.macAddress) ||
    null
  )
}

/**
 * Creates the device that represents an instrument together with its Instrument row, so a
 * failure never leaves a device without hardware behind it.
 */
async function registerInstrument({ payload, auth, partnerId, deviceTypeId, now, instrument }) {
  const { partnerPluginName, deviceTypePluginName, defaultTimeZone } = await getCreationContext(
    auth.credentials.deviceApiKeyId,
    payload
  )

  return transact(async trknex => {
    const context = {
      knex: trknex,
      payload,
      auth,
      now,
      partnerId,
      deviceTypeId,
      deviceTypeExternalId: DEVICE_TYPE_EXTERNAL_ID,
      defaultTimeZone,
      partnerPluginName,
      deviceTypePluginName,
      instrumentSerial: instrument.serial,
    }

    context.device = await createDeviceFromDeviceApi(context)

    const postProcessCreateDevice = await loadPlugin(partnerPluginName, deviceTypePluginName, 'postProcessCreateDevice')
    await postProcessCreateDevice(context)

    const created = await trknex('Instrument')
      .where({ deviceId: context.device.id, serial: instrument.serial })
      .first('id', 'serial', ...INSTRUMENT_DETAIL_COLUMNS, 'deviceId')

    return { ...created, deviceName: context.device.name }
  })
}

async function getCreationContext(deviceApiKeyId, payload) {
  const { partnerPluginName, deviceTypePluginName, defaultTimeZone } =
    (await knex('DeviceApiKey as dak')
      .leftJoin('Partner as p', 'p.id', 'dak.partnerId')
      .where('dak.id', deviceApiKeyId)
      .first({
        partnerPluginName: 'p.plugin',
        deviceTypePluginName: knex('DeviceType as dt')
          .select('dt.plugin')
          .where('dt.externalId', DEVICE_TYPE_EXTERNAL_ID),
        defaultTimeZone: knex('Country as c')
          .select('c.timezone')
          .where('c.name', _.get(payload, 'configuration.data.country', null)),
      })) || {}

  return { partnerPluginName, deviceTypePluginName, defaultTimeZone }
}

async function updateInstrumentDetails(reportedInstruments, instrumentsBySerial, now) {
  const updates = reportedInstruments
    .map(reported => {
      const known = instrumentsBySerial.get(reported.serial)
      const changes = known
        ? _.pickBy(
            _.pick(reported, INSTRUMENT_DETAIL_COLUMNS),
            (value, column) => value != null && known[column] !== value
          )
        : {}
      return { known, changes }
    })
    .filter(({ known, changes }) => known && !_.isEmpty(changes))

  for (const { known, changes } of updates) {
    // eslint-disable-next-line no-await-in-loop
    await knex('Instrument')
      .where('id', known.id)
      .update({ ...changes, updatedOn: now, updatedBy: null })
  }
}

/**
 * Projects `instrumentsLogs` (latest system log per instrument module) onto InstrumentModule.
 * The log columns are kept separate from the result-driven ones: a module can be logged by
 * GxConnect without ever having produced a result.
 *
 * Best effort, like the RESULT_LOGGED projection: a failure here must not stop GxConnect from
 * receiving its configuration.
 */
async function syncInstrumentModules(instrumentsLogs, instrumentsBySerial) {
  const rows = normalizeInstrumentLogs(instrumentsLogs, instrumentsBySerial)

  if (rows.length === 0) {
    return
  }

  try {
    await knex('InstrumentModule')
      .insert(rows)
      .onConflict(['instrumentId', 'moduleName'])
      .merge({
        // Only fills the gap for modules never seen in a result; the result-driven serial wins.
        moduleSerial: knex.raw('IFNULL(InstrumentModule.moduleSerial, VALUES(moduleSerial))'),
        lastLogDetail: knex.raw(
          'IF(VALUES(lastLogDate) >= IFNULL(InstrumentModule.lastLogDate, VALUES(lastLogDate)), VALUES(lastLogDetail), InstrumentModule.lastLogDetail)'
        ),
        lastLogDate: knex.raw(
          'GREATEST(IFNULL(InstrumentModule.lastLogDate, VALUES(lastLogDate)), VALUES(lastLogDate))'
        ),
      })
  } catch (err) {
    logger.error('instrumentModule projection from daily details failed', {
      err,
      reLabel: 'deviceApi:syncInstruments',
    })
  }
}

/**
 * GxConnect reports one entry per (module, site serial) pair, so the same module name can
 * appear more than once when its module was replaced — only the most recent log is kept.
 */
function normalizeInstrumentLogs(instrumentsLogs, instrumentsBySerial) {
  if (!Array.isArray(instrumentsLogs)) {
    return []
  }

  const rows = instrumentsLogs
    .map(log => {
      const instrument = instrumentsBySerial.get(toTrimmedString(log?.instrument_serial_number))
      return {
        instrumentId: instrument?.id,
        moduleName: toTrimmedString(log?.site_name, MODULE_NAME_MAX_LENGTH),
        moduleSerial: toTrimmedString(log?.site_serial_number, MODULE_SERIAL_MAX_LENGTH),
        lastResultDate: null,
        lastLogDate: parseDateOrDefault(log?.max_log_time),
        lastLogDetail: toTrimmedString(log?.last_detail, LOG_DETAIL_MAX_LENGTH),
      }
    })
    .filter(row => row.instrumentId && row.moduleName && row.lastLogDate)

  return _(rows)
    .groupBy(row => `${row.instrumentId}-${row.moduleName}`)
    .map(group => _.maxBy(group, 'lastLogDate'))
    .value()
}

function toIntegerOrNull(value) {
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? null : parsed
}

function toTrimmedString(value, maxLength) {
  if (value == null || value === '') {
    return null
  }
  const trimmed = String(value).trim()
  if (!trimmed) {
    return null
  }
  return maxLength ? trimmed.substr(0, maxLength) : trimmed
}

async function processPendingDeviceConfiguration(knex, partnerId, deviceApiKeyId, deviceTypeId) {
  const { connectSettings, deviceIdsToUpdate } =
    (await knex('DeviceConfiguration as dc')
      .where({
        'dc.partnerId': partnerId,
        'dc.deviceTypeId': deviceTypeId,
      })
      .first({
        connectSettings: 'dc.data',
        deviceIdsToUpdate: knex('Device as d')
          .where({ deviceApiKeyId })
          .andWhere(qb => {
            qb.whereNull('d.connectSettingsSentOn').orWhere('d.connectSettingsSentOn', '<', knex.raw('dc.updatedOn'))
          })
          .groupBy('d.deviceApiKeyId')
          .first(knex.raw('GROUP_CONCAT(d.id)')),
      })) || {}

  if (!connectSettings || !deviceIdsToUpdate) {
    return { deviceConfiguration: null }
  }

  await knex('Device').update({ connectSettingsSentOn: new Date() }).whereIn('id', deviceIdsToUpdate.split(','))

  return { deviceConfiguration: JSON.parse(connectSettings) }
}

const getCustomFieldsDefinitionForGxconnect = async (partnerId, deviceTypeId) => {
  const customFields = await getCustomFields(partnerId, deviceTypeId)
  if (!customFields.fields || customFields.fields.length === 0) {
    return { CustomFields: null }
  }

  /*
   * The Aspect custom-fields schema differs from the GxConnect format
   * so we convert it and validate against the schema.
   */
  const customFieldsForGxConnect = await mapGxConnectCustomFields(customFields)
  if (!validate(gxConnectSchema, customFieldsForGxConnect)) {
    logger.error(
      `Schema validation failed for partnerId ${partnerId} and deviceTypeId ${deviceTypeId}. ` +
        "Custom fields won't be returned to GxConnect and the test details form won't be updated. " +
        'Please, ensure the collection of forms are not repeating ids.'
    )
    return { CustomFields: null }
  }

  return customFieldsForGxConnect
}

module.exports = {
  handleDailyDetailsPayload,
}
