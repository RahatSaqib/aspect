const _ = require('lodash')
const { subYears, subMonths, subDays } = require('date-fns')
const { knex } = require('../db')
const { resultModuleReplaced, resultAnalyzeCategoriesAndErrors } = require('../result/actions')
const {
  deviceInstrumentReplaced,
  deviceModuleDisabled,
  deviceHardwareError,
  hardwareErrorActions,
  calibrationDateUpdated,
} = require('../device/actions')
const { deviceMaintenanceTypeToId, issueTypeToId } = require('../shared/dictionary')
const logger = require('../shared/logger')

const DAYS_TO_DISCARD_NOTIFICATIONS = 7
async function getPartnerPluginName({ partnerId, caseId }) {
  let partnerPluginName = ''
  if (caseId) {
    ;[partnerPluginName] = await knex('PatientCase as c')
      .innerJoin('Partner as p', 'c.partnerId', 'p.id')
      .where('c.id', caseId)
      .pluck('p.plugin')
  } else if (partnerId) {
    ;[partnerPluginName] = await knex('Partner').where('id', partnerId).pluck('plugin')
  }
  return partnerPluginName
}

async function getDeviceTypePluginName(deviceId) {
  const [deviceTypePluginName] = await knex('Device as d')
    .leftJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .where('d.id', deviceId || 0)
    .pluck('dt.plugin')
  return deviceTypePluginName
}

async function getReplacedModuleSerials(knex, deviceId) {
  return knex('Issue as i')
    .join('IssueType as it', 'it.id', 'i.issueTypeId')
    .where('it.externalId', 'ModuleReplaced')
    .where('i.deviceId', deviceId)
    .select(knex.raw('data->>"$.replacedModuleSerial" as replacedModuleSerial'))
    .then(rows => rows.map(({ replacedModuleSerial }) => replacedModuleSerial))
}

async function shouldTriggerResultErrorAnalysis(
  messageContext,
  deviceId,
  resultId,
  resultCategory1, // <-- this is result category externalid
  resultErrorCode,
  { resultOutcome, moduleSerial, assayId, consumableLot, instrumentSerial, resultEndedOn }
) {
  if (resultEndedOn >= subDays(new Date(), DAYS_TO_DISCARD_NOTIFICATIONS)) {
    if (!messageContext.resultAnalyzeCategoriesAndErrors) {
      messageContext = messageContext.bindActionCreators({
        resultAnalyzeCategoriesAndErrors,
      })
    }
    logger.debug([
      `shouldTriggerResultErrorAnalysis resultid:${resultId}`,
      resultCategory1, // <-- this is result category externalid
      resultErrorCode,
    ])

    await messageContext.resultAnalyzeCategoriesAndErrors(
      deviceId,
      resultId,
      resultCategory1, // <-- this is result category externalid
      resultErrorCode,
      {
        resultOutcome,
        assayId,
        consumableLot,
        instrumentSerial,
        moduleSerial,
      }
    )
    const timer = ms => new Promise(res => setTimeout(res, ms))

    // We need to postpone at least 1 sec the analysis of the Module base issue, because if the lot was generated for the same module, this one should be suppressed.
    timer(1000).then(async () => {
      await messageContext.resultAnalyzeCategoriesAndErrors(
        deviceId,
        resultId,
        resultCategory1, // <-- this is result category externalid
        resultErrorCode,
        { resultOutcome, moduleSerial, instrumentSerial }
      )
    })
  }
}

async function shouldTriggerModuleReplaced(
  knex,
  messageContext,
  resultId,
  deviceId,
  moduleSerial,
  instrumentSerial,
  moduleName,
  startedOn
) {
  if (!moduleSerial && !moduleName && !startedOn && !deviceId) {
    return
  }
  logger.debug(`shouldTriggerModuleReplaced resultid: ${resultId}`, {
    reLabel: 'onResultLogged:shouldTriggerModuleReplaced',
  })

  if (!messageContext.resultModuleReplaced) {
    messageContext = messageContext.bindActionCreators({
      resultModuleReplaced,
    })
  }
  // We decided to avoid taking into account for this analysis the results older than 60 days
  if (startedOn > subMonths(new Date(), 2)) {
    // check if a module was just now replaced and trigger replacement-issue if it was
    // get the most recent result from the same moduleName as the current resul within the last 2 years
    const previousResultOnModule = await knex('Result')
      .where('deviceId', deviceId)
      .where('moduleName', moduleName)
      .whereNotNull('moduleSerial')
      .where('moduleSerial', '<>', moduleSerial)
      .andWhere('instrumentSerial', instrumentSerial)
      .andWhere('startedOn', '<', startedOn)
      .andWhere('startedOn', '>', subYears(startedOn, 2))
      .orderBy('startedOn', 'desc')
      .first('moduleSerial', 'id')

    if (previousResultOnModule) {
      messageContext.resultModuleReplaced(resultId, deviceId, {
        moduleName,
        replacedModuleSerial: previousResultOnModule.moduleSerial,
        newModuleSerial: moduleSerial,
        instrumentSerial,
        oldResultId: previousResultOnModule.id,
      })
    }
  }
}

async function shouldTriggerInstrumentReplaced(knex, messageContext, resultId) {
  const result = await knex('Result as r')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('Site as s', 'd.siteId', 's.id')
    .where('r.id', resultId)
    .first(
      'r.id as resultId',
      'r.moduleName',
      'r.moduleSerial',
      'r.instrumentSerial',
      'r.createdOn',
      'r.endedOn',
      'r.updatedOn',
      // props to populate fields in table 'Issue'
      'r.deviceId',
      'd.partnerId',
      's.geographyId',
      'd.siteId'
    )
  if (!result) {
    return
  }

  if (!messageContext.deviceInstrumentReplaced) {
    logger.debug([`shouldTriggerInstrumentReplaced resultid:${resultId}`])

    messageContext = messageContext.bindActionCreators({
      deviceInstrumentReplaced,
    })
  }

  // get all instruments that have been already marked as 'replaced'
  // for this device, so we can ignore them in the queries below
  const replacedInstrumentSerials = await knex('Issue as i')
    .innerJoin('IssueType as it', 'it.id', 'i.issueTypeId')
    .where('it.externalId', 'InstrumentReplaced')
    .where('i.deviceId', result.deviceId)
    .select(knex.raw('i.data->>"$.replacedInstrumentSerial" as replacedInstrumentSerial'))
    .then(items => items.map(x => x.replacedInstrumentSerial))

  // check if instrument was just now replaced and trigger replacement issue.
  if (result.instrumentSerial && result.createdOn.getTime() === result.updatedOn.getTime()) {
    // Get the most recent result from the same device and module name as the current result.
    // We have to filter by module name here to account for devices with multiple instruments.
    // We don't want to trigger an instrument replaced issue if the instrument serial comes from
    // another module because it could mean that it's just another instrument that belongs to the same device.
    // Note that this means that we may not trigger an instrument replaced issue immediately
    // when a new result comes in, if the result comes from a different module name than the
    // latest result on that serial, but it will trigger as soon as theres a new result with
    // a different instrument serial on the same module name.
    const previousResultOnInstrument = await knex('Result as r')
      .where('r.deviceId', result.deviceId)
      .where('r.moduleName', result.moduleName)
      .where('r.endedOn', '<', result.endedOn)
      .whereNot('r.id', result.resultId)
      .orderBy('endedOn', 'desc')
      .first('r.instrumentSerial')

    if (
      previousResultOnInstrument &&
      previousResultOnInstrument.instrumentSerial !== result.instrumentSerial &&
      !replacedInstrumentSerials.includes(previousResultOnInstrument.instrumentSerial)
    ) {
      messageContext.deviceInstrumentReplaced(result, {
        moduleName: result.moduleName,
        replacedInstrumentSerial: previousResultOnInstrument.instrumentSerial,
        newInstrumentSerial: result.instrumentSerial,
      })
    }
  }
}

async function shouldTriggerHardwareErrorAnalysis(messageContext, device, payload, deviceOperationId) {
  const {
    startedOn,
    data: { details = {} },
  } = payload

  if (details.Errors && _.isArray(details.Errors) && details.Errors.length) {
    const errorForTriggering = _.find(details.Errors, error =>
      _.includes(Object.keys(hardwareErrorActions), error.ErrorCode)
    )
    if (errorForTriggering) {
      logger.debug(`shouldTriggerHardwareErrorAnalysis error:${JSON.stringify(errorForTriggering)}`)
      const options = {
        startedOn,
        details,
        deviceOperationId,
      }
      if (!messageContext.deviceHardwareError) {
        messageContext = messageContext.bindActionCreators({
          deviceHardwareError,
        })
      }
      messageContext.deviceHardwareError(device, errorForTriggering.ErrorCode, options)
    }
  }
}

async function shouldLogDeviceCalibration(knex, deviceId, payload, deviceMaintenanceTypeId, messageContext) {
  const {
    startedOn: calibratedOn,
    data: { details = {} },
  } = payload
  /**
   * if log entry contains non-empty array `Calibrations`
   * then insert/update entry into DeviceMaintenance table
   */
  if (
    details.Calibrations &&
    _.isArray(details.Calibrations) &&
    details.Calibrations.length &&
    deviceId &&
    calibratedOn
  ) {
    await setDeviceCalibrationStatus(knex, deviceId, calibratedOn, {
      deviceMaintenanceTypeId,
      notes: 'Create calibration from GeneXpert logs',
    })
    if (!messageContext.calibrationDateUpdated) {
      messageContext.bindActionCreators({
        calibrationDateUpdated,
      })
    }
    messageContext.calibrationDateUpdated(deviceId)
  }
}

async function setDeviceCalibrationStatus(knex, deviceId, calibratedOn, { deviceMaintenanceTypeId, notes }) {
  logger.debug(
    `shouldLogDeviceCalibration: analyzing value ${JSON.stringify({
      deviceId,
      calibratedOn,
    })}`,
    { reLabel: 'deviceApi:shouldLogDeviceCalibration' }
  )

  if (!deviceMaintenanceTypeId) {
    deviceMaintenanceTypeId = await deviceMaintenanceTypeToId('calibration')
  }

  // get currently active maintenance item
  const itemCurrent = await knex('DeviceMaintenance')
    .where({
      deviceId,
      deviceMaintenanceTypeId,
      current: 1,
    })
    /**
     * below ordering is actually not needed cuz we should have only single entry with
     * above WHERE condition, but let's keep this 'orderBy' here to have such
     * extra validation to get item with latest 'contextDate'
     */
    .orderBy('contextDate', 'desc')
    .first()

  // set `current` to 1 if ...
  const current =
    // ... missing current entry ...
    !itemCurrent ||
    // ... or when current calibration date is less than new date
    itemCurrent.contextDate < calibratedOn
      ? 1
      : 0

  // reset 'current' if current calibration date is less than new date
  const shouldResetCurrent = itemCurrent && itemCurrent.contextDate < calibratedOn
  if (shouldResetCurrent) {
    await knex('DeviceMaintenance').update({ current: 0 }).where({
      id: itemCurrent.id,
    })
  }

  // get today's maintenance item
  const itemToday = await knex('DeviceMaintenance')
    .where({
      deviceId,
      deviceMaintenanceTypeId,
    })
    // only one entry per day
    .whereRaw('DATE(contextDate) = DATE(?)', [calibratedOn])
    .first()

  /**
   * Check different conditions for itemToday and itemCurrent.
   * Notice to do nothing (no below conditions match) if
   * - itemToday with calibratedOn exists (i.e. no dupes for same day for this deviceId),
   * - and no need to change itemCurrent (i.e. shouldResetCurrent = false)
   */
  if (itemToday && itemToday.current === 0 && shouldResetCurrent) {
    /**
     * condition means itemCurrent had been reset (because
     * calibratedOn > itemCurrent.contextDate) but itemToday (with calibratedOn)
     * exists and by some reason is NOT set as 'current'
     */
    logger.debug('shouldLogDeviceCalibration: update today item - it is not current and shouldResetCurrent=true', {
      reLabel: 'deviceApi:shouldLogDeviceCalibration',
    })
    await knex('DeviceMaintenance').update({ current: 1 }).where({
      id: itemToday.id,
    })
  } else if (!itemToday) {
    logger.debug('shouldLogDeviceCalibration: insert item for today, because it is missing', {
      reLabel: 'deviceApi:shouldLogDeviceCalibration',
    })
    await knex('DeviceMaintenance').insert({
      deviceId,
      deviceMaintenanceTypeId,
      current,
      contextDate: calibratedOn,
      notes,
      createdOn: new Date(),
      updatedOn: new Date(),
      /**
       * notice that columns 'createdBy' and 'updatedBy' remain NULL-ed
       */
    })
  }
}

module.exports = {
  getPartnerPluginName,
  getDeviceTypePluginName,
  getReplacedModuleSerials,
  shouldTriggerModuleReplaced,
  shouldTriggerInstrumentReplaced,
  shouldTriggerResultErrorAnalysis,
  shouldTriggerHardwareErrorAnalysis,
  shouldLogDeviceCalibration,
  setDeviceCalibrationStatus,
}
