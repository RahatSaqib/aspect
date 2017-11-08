const _ = require('lodash')
const Boom = require('boom')
/*
The purpose of this plugin is to ensure that results are captured
even when the assay name in the result is unknown to Aspect
If the device is unknown, ignore this request
If an unknown assay is detected, create it
*/
function* preProcessMergeResult({ knex, deviceId, payload }) {
  if (!deviceId) {
    throw Boom.notFound('Cannot find device')
  }
  const device = yield knex
    .from('Device as d')
    .where({ 'd.id': deviceId })
    .select('d.id', 'd.siteId', 'd.deviceTypeId')
    .first()
  if (_.isEmpty(device)) {
    throw Boom.notFound(`Cannot find device ${deviceId}`)
  }
  yield* createAssayIfNotExists(knex, device, payload)
}

function* createAssayIfNotExists(knex, device, payload) {
  const payloadAssayId = _.get(payload, 'result.assay.id', false)
  const assay = yield knex
    .from('Assay as a')
    .where({ 'a.externalId': payloadAssayId })
    .select('a.id')
    .first()
  if (_.isEmpty(assay)) {
    const unknownAssayType = yield knex
      .from('AssayType as at')
      .where({ 'at.name': 'Unknown' })
      .select('at.id')
      .first()
    if (!_.isEmpty(unknownAssayType)) {
      if (!device.deviceTypeId) {
        const deviceTypeExternalId = _.get(payload, 'type.id')
        const deviceType = yield knex
          .from('DeviceType as dt')
          .where({ 'dt.externalid': deviceTypeExternalId })
          .select('dt.id')
          .first()
        device.deviceTypeId = deviceType.id
      }
      const resultSourceExternalId =
        _.get(payload, 'result.source.id') || 'DiagnosticDevice'
      const resultSource = knex
        .from('ResultSource as rs')
        .where({ 'rs.externalid': resultSourceExternalId })
        .select('rs.id')
        .first()
      if (!_.isEmpty(resultSource)) {
        if (device.deviceTypeId) {
          yield knex
            .insert({
              name: payloadAssayId,
              externalId: payloadAssayId,
              assayTypeId: unknownAssayType.id,
              deviceTypeId: device.deviceTypeId,
              resultSourceId: resultSource.id,
            })
            .into('Assay')
        } else {
          throw Boom.notFound(
            'Cannot find device type for this result, please ensure that the Device API key is linked to an actual device or type has been specified in this request'
          )
        }
      } else {
        throw Boom.notFound(
          'Cannot determine the type of result source for a new assay no diagnostic device result source exists.'
        )
      }
    } else {
      throw Boom.notFound(
        'Cannot determine the type of assay for this result and no unknown assay type exists.'
      )
    }
  }
}

module.exports = preProcessMergeResult
