const _ = require('lodash')
const Promise = require('bluebird')
const { knex } = require('../../db')
const { deviceMaintenanceTypeToId } = require('../../shared/dictionary')
const { setDeviceCalibrationStatus } = require('../../plugin/utils')
const { updateDeviceConfiguration } = require('./shared/logic')
const { calibrationDateUpdated, deviceHardwareError, hardwareErrorActions } = require('../../device/actions')

const handleLogPayload = async (request, deviceLogId, remoteAddress) => {
  const { payload, auth } = request
  const { messageContext } = request.plugins
  const { deviceApiKeyId, deviceIds } = auth.credentials

  if (payload.configuration) {
    await updateDeviceConfiguration({
      knex,
      payload,
      deviceIds,
      messageContext,
      remoteAddress,
    })
  }

  if (payload.log.source !== 'GeneXpert') return

  const { data } = payload.log
  const now = new Date()

  /**
   * Process all log items one by one
   * - and return array `response.logIds` with only those id's which where processed
   * - and store in table DeviceOperation array of successfully processed items
   */
  const processedFileLogIds = []
  const processedSystemLogIds = []
  await Promise.each(data, async logItem => {
    const data = {
      type: 'gx-log',
      logFileName: logItem.logFileName,
      logLevel: logItem.logLevel,
      details: _.isString(logItem.details) ? JSON.parse(logItem.details) : logItem.details,
    }

    const [deviceOperationId] = await knex('DeviceOperation').insert({
      deviceApiKeyId,
      externalId: logItem.externalId,
      data: JSON.stringify(data),
      occurredOn: logItem.occurredOn,
      createdOn: now,
    })

    // check if stored in table 'DeviceOperation' entry is
    // hardware error and dispatch MQ action if needed
    await shouldTriggerHardwareErrorAnalysis({
      messageContext,
      deviceIds,
      data,
      occurredOn: logItem.occurredOn,
      deviceOperationId,
    })

    // process 'calibration' log item
    await shouldLogDeviceCalibration({
      knex,
      deviceIds,
      occurredOn: logItem.occurredOn,
      data,
      messageContext,
    })

    if (logItem.logFileName === 'GeneXpert DB') {
      processedSystemLogIds.push(logItem.externalId)
    } else {
      processedFileLogIds.push(logItem.externalId)
    }
  })

  await knex('DeviceLog').where('id', deviceLogId).update({
    processed: true,
  })

  return {
    logIds: processedFileLogIds,
    systemLogIds: processedSystemLogIds,
  }
}

async function shouldLogDeviceCalibration({ knex, deviceIds, occurredOn, data, messageContext }) {
  /**
   * if log entry contains non-empty array `Calibrations`
   * then insert/update entry into DeviceMaintenance table
   */
  if (
    data.details.Calibrations &&
    _.isArray(data.details.Calibrations) &&
    data.details.Calibrations.length > 0 &&
    deviceIds.length > 0 &&
    occurredOn
  ) {
    const calibrationDeviceMaintenanceTypeId = await deviceMaintenanceTypeToId('calibration')

    if (!messageContext.calibrationDateUpdated) {
      messageContext.bindActionCreators({
        calibrationDateUpdated,
      })
    }

    for (const deviceId of deviceIds) {
      // eslint-disable-next-line no-await-in-loop
      await setDeviceCalibrationStatus(knex, deviceId, occurredOn, {
        deviceMaintenanceTypeId: calibrationDeviceMaintenanceTypeId,
        notes: 'Create calibration from GeneXpert logs',
      })

      messageContext.calibrationDateUpdated(deviceId)
    }
  }
}

async function shouldTriggerHardwareErrorAnalysis({ messageContext, deviceIds, data, occurredOn, deviceOperationId }) {
  if (data.details.Errors && _.isArray(data.details.Errors) && data.details.Errors.length) {
    const errorForTriggering = _.find(data.details.Errors, error =>
      _.includes(Object.keys(hardwareErrorActions), error.ErrorCode)
    )
    if (errorForTriggering) {
      const options = {
        startedOn: occurredOn,
        details: data.details,
        deviceOperationId,
      }
      if (!messageContext.deviceHardwareError) {
        messageContext = messageContext.bindActionCreators({
          deviceHardwareError,
        })
      }

      const devices = await knex('Device as d')
        .whereIn('d.id', deviceIds)
        .join('Site as s', 'd.siteId', 's.id')
        .select('d.id', 'd.siteId', 's.geographyId', 'd.partnerId')

      for (const device of devices) {
        messageContext.deviceHardwareError(device, errorForTriggering.ErrorCode, options)
      }
    }
  }
}

module.exports = {
  handleLogPayload,
}
