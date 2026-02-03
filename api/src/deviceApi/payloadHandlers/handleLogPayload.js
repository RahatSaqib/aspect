const _ = require('lodash')
const Promise = require('bluebird')
const crypto = require('crypto')
const uuid = require('node-uuid')
const { knex, transact } = require('../../db')
const { deviceMaintenanceTypeToId } = require('../../shared/dictionary')
const { cepheidc360InstrumentLogsReceived } = require('../../device/actions')
const { shouldTriggerHardwareErrorAnalysis, shouldLogDeviceCalibration } = require('../../plugin/utils')
const logger = require('../../shared/logger')

const handleLogPayload = async (request, deviceLogId, remoteAddress) => {
  const { payload, auth } = request
  const { deviceApiKeyId } = auth.credentials

  if (payload.log.source !== 'GeneXpert') return

  const devices = await knex('Device').where({ deviceApiKeyId }).select('id')
  const { data } = payload.log
  const now = new Date()

  /**
   * Process all log items one by one
   * - and return array `response.logIds` with only those id's which where processed
   * - and store in table DeviceOperation array of successfully processed items
   */
  const calibrationDeviceMaintenanceTypeId = await deviceMaintenanceTypeToId('calibration')
  const options = {
    calibrationDeviceMaintenanceTypeId,
    now,
  }

  const processedFileLogIds = []
  const processedSystemLogIds = []
  await Promise.each(data, async logItem => {
    try {
      const logItemId = await processLogItem(context, logItem, options)

      if (logItem.logFileName === 'GeneXpert DB') {
        processedSystemLogIds.push(logItemId)
      } else {
        processedFileLogIds.push(logItemId)
      }
    } catch (err) {
      /**
       * if error happened then we do not return this logId as processed,
       * meaning that it will be sent again next scheduler run
       */
      logger.error(
        `execution of processLogItem for log entry with externalId=${logItem.externalId} and deviceId=${context.device.id} has failed`,
        {
          reLabel: 'deviceApi:processLogItem',
        }
      )
    }
  })

  return {
    logIds: processedFileLogIds,
    systemLogIds: processedSystemLogIds,
  }
}

async function processLogItem(context, logItem, options) {
  const { calibrationDeviceMaintenanceTypeId, now } = options
  const { externalId, logFileName, logLevel, occurredOn } = logItem
  let { details } = logItem
  if (_.isString(details)) {
    details = JSON.parse(details)
  }
  const { device, knex } = context
  const value = `${device.id}|${externalId}|${logFileName}`
  const hash = crypto.createHash('md5').update(value).digest('hex')
  const payload = {
    id: externalId,
    startedOn: occurredOn,
    data: {
      type: 'gx-log',
      logFileName,
      logLevel,
      details,
    },
    hash,
  }

  logger.debug('executing processLogItem', {
    reLabel: 'deviceApi:processLogItem',
  })

  try {
    const { id: deviceOperationId } = await addDeviceOperation(knex, device.id, payload, now)

    // check if stored in table 'DeviceOperation' entry is
    // hardware error and dispatch MQ action if needed
    await shouldTriggerHardwareErrorAnalysis(context.messageContext, device, payload, deviceOperationId)
    // process 'calibration' log item
    await shouldLogDeviceCalibration(
      knex,
      device.id,
      payload,
      calibrationDeviceMaintenanceTypeId,
      context.messageContext
    )

    if (payload.data.logFileName === 'GeneXpert DB') {
      if (!context.messageContext.cepheidc360InstrumentLogsReceived) {
        context.messageContext = context.messageContext.bindActionCreators({
          cepheidc360InstrumentLogsReceived,
        })
      }
      context.messageContext.cepheidc360InstrumentLogsReceived(device.id, deviceOperationId)
    }
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      // ignore duplicate entry errors since the same log item may come from GxAlert and GxConnect
      logger.warning(
        `got duplicated logItem. deviceId=${device.id}, externalId=${externalId}, logFileName=${logFileName}`,
        {
          reLabel: 'deviceApi:processLogItem',
        }
      )
    } else {
      throw err
    }
  }

  return logItem.externalId
}

async function addDeviceOperation(knex, deviceId, payload, now = new Date()) {
  const [deviceOperationId] = await knex('DeviceOperation').insert({
    deviceId,
    externalId: payload.id,
    data: JSON.stringify(payload.data),
    startedOn: payload.startedOn,
    endedOn: payload.endedOn,
    createdOn: now,
    hash: payload.hash,
    guid: uuid.v4(),
  })
  return { id: deviceOperationId }
}

module.exports = {
  handleLogPayload,
}
