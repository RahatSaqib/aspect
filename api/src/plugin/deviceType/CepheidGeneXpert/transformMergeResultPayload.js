const Promise = require('bluebird')
const _ = require('lodash')

async function transformMergeResultPayload(context) {
  const { deviceId, knex } = context
  const payload = context.payload.result
  const resultCoordinates = _.get(payload, 'location')
  if (deviceId && (_.isEmpty(resultCoordinates) || (!resultCoordinates.latitude && !resultCoordinates.longitude))) {
    const siteCoordinates = await knex('Device as d')
      .join('Site as s', 'd.siteId', 's.id')
      .where('d.id', deviceId)
      .first('s.latitude', 's.longitude')

    if (!_.isEmpty(siteCoordinates) && (siteCoordinates.longitude || siteCoordinates.latitude)) {
      payload.location = siteCoordinates
    }
  }
  return Promise.resolve(payload)
}

module.exports = transformMergeResultPayload
