const _ = require('lodash')
const Boom = require('@hapi/boom')
const { formatISO } = require('date-fns')
const { getUser } = require('../../../auth/service')
const { getConstraints } = require('../../../auth/constraints')
const { insertNewSample, getAllSamplesRegistered } = require('./common/db')
const { transformSampleData } = require('../entry/common/helpers/transformSample')

function transFormSampleResponse(sample) {
  return {
    id: sample.id,
    externalId: sample.externalId,
    collectedOn: sample.collectedOn,
    updatedOn: formatISO(new Date()),
  }
}

async function registerNewSample(request) {
  const { payload } = request
  const currentlyLoggedInUser = await getUser(request.auth.credentials.name)
  const sampleData = {}
  _.set(sampleData, 'userId', currentlyLoggedInUser.id)
  _.set(sampleData, 'partnerId', currentlyLoggedInUser.partnerId)
  _.set(sampleData, 'countryId', currentlyLoggedInUser.countryId)
  _.set(sampleData, 'clientType', payload?.clientType || 'reporter_app')
  _.mapKeys(sampleData, (value, key) => (_.isNil(value) ? _.set(payload, `${key}`, null) : value))
  _.set(payload, 'sampleData', JSON.stringify(sampleData))
  _.set(payload, 'collectedBy', payload.clinicianName)
  _.set(payload, 'collectedOn', payload?.collectedOn || new Date())
  _.set(payload, 'patientId', payload?.patientId || null)
  _.set(payload, 'sampleStatus', 'SAMPLE_REGISTERED')
  _.set(payload, 'sampleTypeId', 4) // SampleType.sampleTypeSputum
  _.set(payload, 'updatedBy', currentlyLoggedInUser.id)
  _.set(payload, 'updatedOn', new Date())

  const newSample = await insertNewSample(payload)
  return { ok: !_.isEmpty(newSample), data: transformSampleData(newSample) }
}

async function registeredSamples(request) {
  const { auth } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const samplesRegistered = await getAllSamplesRegistered(dataConstraints.person.id, dataConstraints)
  if (_.isEmpty(samplesRegistered)) Boom.notFound()

  const output = _.map(samplesRegistered, sample => transFormSampleResponse(sample))

  const result = {
    ok: !!output,
    total: output.length,
    data: output,
  }

  return result
}

module.exports = { registerNewSample, registeredSamples }
