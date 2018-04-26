const { subDays } = require('date-fns')
const {
  factGenerate,
  factTypes: { DEVICE_CONNECTIVITY, RESULT_COUNTS },
} = require('./actions')
const {
  deviceOffline,
  deviceOnline,
  deviceNoResults,
} = require('../device/actions')

// We are dispatching internally because we want to share a queue for
// all fact generation since they are lower priority background tasks.
// Normally, you would want to dispatch by adding actions and dispatch
// separately on the queue. This is an exception to that rule.
const factTypes = [DEVICE_CONNECTIVITY, RESULT_COUNTS]
const factGenerateDispatch = {
  [DEVICE_CONNECTIVITY]: onFactGenerateDeviceConnectivity,
  [RESULT_COUNTS]: onFactGenerateResultCounts,
}
const factGenerateDispatchForDevice = {
  [DEVICE_CONNECTIVITY]: onFactGenerateDeviceConnectivity,
  [RESULT_COUNTS]: onFactGenerateResultCountsForDevice,
}

async function onFactGenerate(action, context) {
  const { factType, deviceId } = action
  if (factType == null) {
    // If no fact type specified, dispatch new action for all
    // known fact types
    const { messageContext } = context
    messageContext.bindActionCreators({ factGenerate })
    factTypes.forEach(factType => messageContext.factGenerate(factType))
  } else if (deviceId == null) {
    // If dispatch specified for fact type, delegate to dispatcher
    const dispatch = factGenerateDispatch[factType]
    if (dispatch != null) {
      await dispatch(action, context)
    }
  } else {
    // If dispatch specified for fact type and deviceId, delegate
    const dispatch = factGenerateDispatchForDevice[factType]
    if (dispatch != null) {
      await dispatch(action, context)
    }
  }
}

function onFactGenerateDeviceConnectivity({ deviceId }, { messageContext }) {
  const context = messageContext.bindActionCreators({
    deviceOffline,
    deviceNoResults,
  })
  return context.run(async knex => {
    const devicesQ = knex('Device as d')
      .join('FactDeviceFlag as f', 'f.deviceId', 'd.id')
      .join('Partner as p', 'd.partnerId', 'p.id')
      .where({ 'f.offline': 0, 'f.noResults': 0 })
      .select(
        'd.id',
        'p.maxDaysDeviceOffline',
        'p.maxDaysDeviceNoResults',
        'd.lastPingOn',
        'd.createdOn as lastResultOn'
      )
    if (deviceId != null) {
      devicesQ.where({ 'd.id': deviceId })
    }
    await devicesQ.map(
      ({
        id,
        maxDaysDeviceOffline,
        maxDaysDeviceNoResults,
        lastPingOn,
        lastResultOn,
      }) => {
        const now = new Date()
        const maxLastDateOffline = subDays(now, maxDaysDeviceOffline)
        const maxLastDateNoResult = subDays(now, maxDaysDeviceNoResults)
        if (lastPingOn <= maxLastDateOffline || lastPingOn === null) {
          context.deviceOffline(id)
        } else if (
          lastResultOn <= maxLastDateNoResult ||
          lastResultOn === null
        ) {
          context.deviceNoResults(id)
        }
        return id // for lint
      }
    )
  })
}

function onFactGenerateResultCounts(action, { messageContext }) {
  const context = messageContext.bindActionCreators({ factGenerate })
  return context.run(async knex => {
    // TODO do we really need to generate result counts for every device every hour?
    await knex('Device as d')
      .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
      .join('DeviceTypeCategory as dtc', 'dt.deviceTypeCategoryId', 'dtc.id')
      .where('dtc.hasResults', 1)
      .select('d.id as deviceId')
      .map(({ deviceId }) => context.factGenerate(RESULT_COUNTS, deviceId))
  })
}

function onDeviceSeen({ deviceId, dateSeen }, { messageContext }) {
  const context = messageContext.bindActionCreators({ deviceOnline })
  return context.run(async knex => {
    const getDeviceAndFactDeviceFlag = async deviceId =>
      knex('Device as d')
        .leftJoin('FactDeviceFlag as fdf', 'd.id', 'fdf.deviceId')
        .where('d.id', deviceId)
        .first('d.id', 'fdf.deviceId', 'd.lastSeenOn', 'fdf.offline')
    let deviceAndFactDeviceFlag = await getDeviceAndFactDeviceFlag(deviceId)
    if (deviceAndFactDeviceFlag) {
      if (!deviceAndFactDeviceFlag.deviceId) {
        await knex('FactDeviceFlag').insert({ deviceId, updatedOn: new Date() })
        deviceAndFactDeviceFlag = await getDeviceAndFactDeviceFlag(deviceId)
      }
      if (
        deviceAndFactDeviceFlag.offline &&
        (!dateSeen || deviceAndFactDeviceFlag.lastSeenOn < dateSeen)
      ) {
        context.deviceOnline(deviceId)
      }
    }
  })
}

function onDeviceUpdateFlag(updates) {
  return ({ deviceId }, { messageContext }) =>
    messageContext.run(async knex =>
      knex('FactDeviceFlag')
        .where({ deviceId })
        .update(updates)
    )
}

function onResultLogged({ resultId }, { messageContext }) {
  const context = messageContext.bindActionCreators({ factGenerate })
  return context.run(async knex => {
    const { deviceId, assayId, resultCategory1 } = await knex('Result')
      .where({ id: resultId })
      .first('deviceId', 'assayId', 'resultCategory1')
    context.factGenerate(RESULT_COUNTS, deviceId, {
      assayId,
      resultCategory1,
    })
  })
}

function onFactGenerateResultCountsForDevice(
  { deviceId, options = {} },
  { messageContext }
) {
  const { assayId, resultCategory1 } = options
  const daysToCalculate = [1, 7, 30, 60, 90, 365, null]

  const devId = deviceId
  return messageContext.transact(async knex => {
    for (const days of daysToCalculate) {
      /* eslint-disable no-await-in-loop */
      // empty facts table for that day so we don't have dupes:
      // if assay or result category was passed in, delete only the matching records
      await knex('FactResultCountDevice')
        .where('deviceId', devId)
        .andWhere({ days })
        .andWhereRaw(
          '(assayId is null or assayId = :assayId or :assayId = -1)',
          {
            assayId: assayId || -1,
          }
        )
        .andWhereRaw(
          '(resultCategory1 is null or resultCategory1 = :rc or :rc = -1)',
          {
            rc: resultCategory1 || -1,
          }
        )
        .delete()

      const now = new Date()

      // query for selecting data for the device
      const resultCountQuery = knex('Result as r').whereRaw(
        'r.deviceId = :deviceId and r.endedOn > :endedOn',
        {
          deviceId: devId,
          endedOn: subDays(now, days || 9999),
        }
      )

      // calculate by device
      const resultCountsByDevice = await resultCountQuery
        .clone()
        .groupBy('r.deviceId')
        .select(
          knex.raw(
            `r.deviceId, null as assayId, null as resultCategory1, :days as days, count(r.id) as resultCount, :now as calculatedOn`,
            { days, now }
          )
        )
      await knex.from('FactResultCountDevice').insert(resultCountsByDevice)

      // ...grouped by assay
      const resultCountsByAssay = await resultCountQuery
        .clone()
        .andWhereRaw('(assayId = :assayId or :assayId = -1)', {
          assayId: assayId || -1,
        })
        .groupBy('r.assayid')
        .select(
          knex.raw(
            `r.deviceId, r.assayId as assayId, null as resultCategory1, :days as days, count(r.id) as resultCount, :now as calculatedOn`,
            { days, now }
          )
        )
      await knex.from('FactResultCountDevice').insert(resultCountsByAssay)

      // ...grouped by assay, resultCategory
      const resultCountsByAssayAndResultCategory = await resultCountQuery
        .clone()
        .andWhereRaw('(assayId = :assayId or :assayId = -1)', {
          assayId: assayId || -1,
        })
        .andWhereRaw('(resultCategory1 = :rc or :rc = -1)', {
          rc: resultCategory1 || -1,
        })
        .groupBy('r.assayid', 'r.resultCategory1')
        .select(
          knex.raw(
            `r.deviceId, r.assayId as assayId, r.resultCategory1 as resultCategory1, :days as days, count(r.id) as resultCount, :now as calculatedOn`,
            { days, now }
          )
        )
      await knex
        .from('FactResultCountDevice')
        .insert(resultCountsByAssayAndResultCategory)
      /* eslint-enable no-await-in-loop */
    }
  })
}

module.exports = {
  onFactGenerate,
  onDeviceSeen,
  onDeviceUpdateFlag,
  onResultLogged,
}
