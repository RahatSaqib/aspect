const { factGenerateResultCounts } = require('./actions')
const { calculateFactResultsDeviceByTimeFrame } = require('./calculateFactResultsDeviceByTimeFrame')
const { calculateFactResultsDevice } = require('./calculateFactResultsDevice')
const { calculateFactResultsDeviceByAssay } = require('./calculateFactResultsDeviceByAssay')
const { calculateFactResultsDeviceByCategory1 } = require('./calculateFactResultsDeviceByCategory1')

async function onFactGenerateResultCounts(action, context) {
  if (action.deviceId != null) {
    // specialization if device id specified, otherwise query for devices below.
    return onFactGenerateResultCountsForDevice(action, context)
  }
  const messageContext = context.messageContext.bindActionCreators({
    factGenerateResultCounts,
  })
  return messageContext.run(async knex => {
    const items = await knex('Device as d')
      .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
      .join('DeviceTypeCategory as dtc', 'dt.deviceTypeCategoryId', 'dtc.id')
      .where('dtc.hasResults', 1)
      .select('d.id as deviceId')
    for (const { deviceId } of items) {
      // eslint-disable-next-line no-await-in-loop
      await messageContext.factGenerateResultCounts(deviceId)
    }
  })
}

async function onFactGenerateResultCountsForDevice({ deviceId, options = {} }, { messageContext }) {
  const { assayId, resultCategory1, resultCategory2, endedOn } = options
  return messageContext.transact(async knex => {
    const timeZoneData = await knex('Device as d')
      .join('Site as s', 's.id', 'd.siteId')
      .join('Geography as g', 'g.id', 's.geographyId')
      .join('Country as c', 'c.id', 'g.countryId')
      .join('TimeZone as tz', 'c.timezone', 'tz.id')
      .first('tz.timeZone')
      .where('d.id', deviceId)

    // calculate by device - make sure it still exists
    if (!timeZoneData) {
      return
    }

    const { timeZone: timeZoneIANA } = timeZoneData

    await messageContext.initDictionaryTables()

    await calculateFactResultsDevice(knex, deviceId, timeZoneIANA)
    await calculateFactResultsDeviceByAssay(knex, deviceId, assayId, timeZoneIANA)
    await calculateFactResultsDeviceByCategory1(knex, deviceId, assayId, resultCategory1, timeZoneIANA)
    await calculateFactResultsDeviceByTimeFrame(knex, deviceId, assayId, resultCategory1, resultCategory2, endedOn)
  })
}

module.exports = {
  onFactGenerateResultCounts,
}
