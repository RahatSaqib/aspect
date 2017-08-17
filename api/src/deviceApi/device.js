const _ = require('lodash')
const Boom = require('boom')
const { mergeResult, getResult } = require('./result')

const {
  DEVICE_LOG_TYPE_OPTIONAL,
  DEVICE_LOG_TYPE_OPERATION,
  DEVICE_LOG_TYPE_RESULT,
} = require('./common')

function* mergeResultHandler(initialContext) {
  const context = yield* initialContext.preProcessMergeResult()
  const { knex, now, payload, device: { id: deviceId } } = context
  const { processedResult, existingResult } = yield* mergeResult(
    knex,
    deviceId,
    payload,
    now,
    knex
  )
  return yield* context.postProcessMergeResult(processedResult, existingResult)
}

function* getResultHandler(initialContext) {
  const context = yield* initialContext.preProcessGetResult()
  const { knex, deviceLog } = context
  const result = yield* getResult(knex, deviceLog.id)
  return yield* context.postProcessGetResult(result)
}

function* addDeviceData(context) {
  const response = {}
  const { knex, now, payload, device } = context
  const { name, site, result, configuration, operation } = payload

  if (name) {
    yield knex('Device')
      .where({ id: device.id })
      .update({ name, updatedOn: now })
  }

  if (site) {
    const siteResponse = yield* updateSite(context.withPayload(site))
    if (siteResponse instanceof Error) {
      return siteResponse
    }
  }

  if (configuration) {
    yield* updateDeviceConfiguration(context.withPayload(configuration))
  }

  if (operation) {
    yield* addDeviceOperation(context.withPayload(operation))
  }

  if (result) {
    const resultResponse = yield* mergeResultHandler(
      context.withPayload(result)
    )
    if (resultResponse instanceof Error) {
      return resultResponse
    }
  }

  return response
}

function* getDeviceData(context) {
  const { now, device, deviceLog, deviceLogType } = context

  // include fields based on device log type configured in endpoints
  const includeAll = deviceLogType === DEVICE_LOG_TYPE_OPTIONAL
  const includeDevice = includeAll
  const includeSite = includeAll

  // only include device data if approved
  const deviceApproved = device.status === 'approved'
  const includeConfig = deviceApproved && includeAll
  const includeOp =
    deviceApproved &&
    (includeAll || deviceLogType === DEVICE_LOG_TYPE_OPERATION)
  const includeResult =
    deviceApproved && (includeAll || deviceLogType === DEVICE_LOG_TYPE_RESULT)

  const response = { requestedOn: now.toISOString() }
  if (includeDevice) {
    response.name = device.name
    response.status = { id: device.status }
  }

  if (includeSite) {
    const site = yield* getSite(context)
    if (site != null) {
      response.site = site
    }
  }

  if (deviceLog != null) {
    response.log = { createdOn: deviceLog.createdOn }
    if (deviceLog.source != null) {
      response.log.source = deviceLog.source
    }

    if (deviceLog.checkpoint != null) {
      response.checkpoint = deviceLog.checkpoint
    }

    if (includeConfig) {
      const config = yield* getDeviceConfiguration(context, true)
      if (config != null) {
        response.configuration = config
      }
    }

    if (includeOp) {
      const op = yield* getDeviceOperation(context)
      if (op != null) {
        response.operation = op
      }
    }

    if (includeResult) {
      const result = yield* getResultHandler(context)
      if (result != null) {
        response.result = result
      }
    }
  }

  return response
}

function* updateDeviceConfiguration(context) {
  const { knex, payload, device: { id: deviceId } } = context

  const previousConfig = yield* getDeviceConfiguration(context)
  const configurationData =
    previousConfig == null
      ? payload.data
      : _.merge(previousConfig.data, payload.data)

  yield knex('Device')
    .where({ id: deviceId })
    .update({ configurationData: JSON.stringify(configurationData) })
  context.markDeviceConfigurationUpdated()

  return {}
}

function* getDeviceConfiguration(context, requireUpdated = false) {
  const { knex, device: { id: deviceId } } = context
  const deviceQuery = knex('Device as d').first('d.configurationData')
  if (requireUpdated) {
    deviceQuery.innerJoin('DeviceLog as dl', 'dl.deviceId', 'd.id').where({
      'dl.id': context.deviceLog.id,
      'dl.deviceConfigurationUpdated': true,
    })
  } else {
    deviceQuery.where({ id: deviceId })
  }

  const device = yield deviceQuery
  if (device == null || device.configurationData == null) {
    return null
  }
  return { data: JSON.parse(device.configurationData) }
}

function* addDeviceOperation(context) {
  const { knex, payload, device: { id: deviceId }, now } = context

  const [deviceOperationId] = yield knex('DeviceOperation').insert({
    deviceId,
    externalId: payload.id,
    data: JSON.stringify(payload.data),
    startedOn: payload.startedOn,
    endedOn: payload.endedOn,
    createdOn: now,
  })
  context.addDeviceOperationId(deviceOperationId)

  return {}
}

function* getDeviceOperation(context) {
  const { knex, deviceLog: { id: deviceLogId } } = context
  const op = yield knex('DeviceOperation as do')
    .innerJoin('DeviceLog as dl', 'dl.deviceOperationId', 'do.id')
    .where({
      'dl.id': deviceLogId,
    })
    .first('externalId as id', 'data', 'startedOn', 'endedOn')
  if (op == null) {
    return null
  }

  const result = {}
  if (op.id != null) {
    result.id = op.id
  }
  if (op.data != null) {
    result.data = JSON.parse(op.data)
  }
  if (op.startedOn != null) {
    result.startedOn = op.startedOn.toISOString()
  }
  if (op.endedOn != null) {
    result.endedOn = op.endedOn.toISOString()
  }
  return result
}

function* updateSite(context) {
  const { knex, payload, device, now } = context
  const result = {}
  const siteExternalId = payload.id || null
  if (siteExternalId == null) {
    return Boom.badRequest('Must specify site id to update Site')
  }

  // Find unique site with specified external ID for same partner as device
  const sites = yield knex('Site as s')
    .where({
      partnerId: device.partnerId,
      externalId: siteExternalId,
    })
    .select('id')
    .limit(2)
  if (sites.length !== 1) {
    return Boom.badRequest(`Cannot find unique site with id ${siteExternalId}`)
  }
  const site = sites[0]

  if (device.siteId === site.id) {
    // Device is already assigned to requested site, nothing to do
    return result
  }

  const status = device.siteId == null ? 'approved' : 'assigned'

  yield knex('Device').where({ id: device.id }).update({
    siteId: site.id,
    deviceStatusId: knex('DeviceStatus').where({ token: status }).select('id'),
  })

  // Update DeviceApiKey site with the new siteId
  yield knex('DeviceApiKey').where({ deviceId: device.id }).update({
    siteId: site.id,
  })

  yield knex('DeviceSiteHistory').insert({
    deviceId: device.id,
    siteId: site.id,
    createdOn: now,
  })

  return result
}

function* getSite(context) {
  const { knex, device } = context
  const site = yield knex('Site as s')
    .innerJoin('Device as d', 'd.siteId', 's.id')
    .where('d.id', device.id)
    .first('s.externalId')
  return site == null ? null : { id: site.externalId }
}

module.exports = {
  addDeviceData,
  getDeviceData,
  updateDeviceConfiguration,
  addDeviceOperation,
  mergeResultHandler,
}
