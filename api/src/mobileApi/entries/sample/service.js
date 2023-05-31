const _ = require('lodash')
const { getUser } = require('../../../auth/service')
const { insertNewSample } = require('./common/db')
const { transformSampleData } = require('../result/common/helpers/transformSample')

async function registerNewSample(request) {
  const sampleData = {}
  const { payload } = request
  const payloadForDb = _.clone(payload)
  const collectedOn = new Date(payload?.collectedOn)
  const currentlyLoggedInUser = await getUser(request.auth.credentials.name)
  _.set(payloadForDb, 'externalId', payload.externalId)
  _.set(payloadForDb, 'collectedOn', _.isNaN(collectedOn.getTime()) ? null : collectedOn)

  // sampleTypeId is SampleType.sampleTypeSputum hard coded for Nigeria
  _.set(payloadForDb, 'sampleTypeId', 4)
  _.set(payloadForDb, 'originSiteId', payload.originSiteId)
  _.set(payloadForDb, 'sampleStatus', 'SAMPLE_REGISTERED')
  _.set(payloadForDb, 'updatedBy', currentlyLoggedInUser.id)
  _.set(payloadForDb, 'updatedOn', new Date())
  _.set(payloadForDb, 'collectedBy', currentlyLoggedInUser.id)

  _.set(sampleData, 'clinicianName', _.trim(payload?.clinicianName).toString() ?? null)
  _.set(sampleData, 'userId', currentlyLoggedInUser.id)
  _.set(sampleData, 'partnerId', currentlyLoggedInUser.partnerId)
  _.set(sampleData, 'countryId', currentlyLoggedInUser.countryId)
  _.set(sampleData, 'clientType', payload?.clientType || 'reporter_app')
  _.set(sampleData, 'patientExternalId', _.trim(payload?.patientExternalId).toString() ?? null)
  _.mapKeys(sampleData, (value, key) => (_.isNil(value) ? _.set(payload, `${key}`, null) : value))
  _.set(payloadForDb, 'sampleData', JSON.stringify(sampleData))
  const newSample = await insertNewSample(_.omit(payloadForDb, ['clinicianName', 'patientExternalId']), request.auth)
  return { ok: !_.isEmpty(newSample), data: transformSampleData(newSample[0]) }
}

module.exports = { registerNewSample }
