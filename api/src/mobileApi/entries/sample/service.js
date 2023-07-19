const _ = require('lodash')
const Boom = require('@hapi/boom')
const { getUser } = require('../../../auth/service')
const { getSamplesRegisteredAtSiteOnDayWithSampleId, updateExistingSample, insertNewSample } = require('./common/db')
const { transformSampleData } = require('../result/common/helpers/transformSample')
const { sampleTypeToId } = require('../../../shared/dictionary')
const { getConstraints } = require('../../../auth/constraints')
const { getSite } = require('../../../site/service')

async function registerNewSample(request) {
  const {
    payload,
    auth: { credentials },
  } = request
  const dataConstraints = await getConstraints(credentials)
  const site = await getSite(payload.originSiteId, dataConstraints)
  if (_.isEmpty(site)) {
    throw Boom.forbidden('Unauthorised Origin Site')
  }
  const collectedOnUnSanitised = new Date(payload?.collectedOn ?? '')
  const collectedOn = _.isNaN(collectedOnUnSanitised.getTime()) ? null : collectedOnUnSanitised
  const sampleTypeId =
    payload.sampleTypeExternalId === 'Other' ? null : await sampleTypeToId(payload.sampleTypeExternalId ?? 'Sputum')
  const existingSamples = await getSamplesRegisteredAtSiteOnDayWithSampleId(
    payload.externalId,
    sampleTypeId,
    collectedOn,
    payload.originSiteId,
    dataConstraints
  )
  const currentlyLoggedInUser = await getUser(credentials.name)
  const now = new Date()
  const payloadForDb = {
    externalId: payload.externalId,
    registeredInAspect: true,
    updatedBy: currentlyLoggedInUser.id,
    updatedOn: now,
  }
  if (existingSamples.length === 1) {
    const existingSample = existingSamples[0]
    const sampleTypeIdOrOther = sampleTypeId ?? existingSample.sampleTypeId ?? (await sampleTypeToId('Other'))
    _.set(payloadForDb, 'sampleTypeId', sampleTypeIdOrOther)
    _.set(payloadForDb, 'collectedOn', collectedOn ?? existingSample.sampleCollectedOn)
    _.set(payloadForDb, 'originSiteId', payload.originSiteId ?? existingSample.originSiteId)
    _.set(payloadForDb, 'sampleStatus', existingSample.sampleStatus ?? 'SAMPLE_REGISTERED')
    _.set(payloadForDb, 'collectedBy', existingSample.sampleCollectedBy ?? currentlyLoggedInUser.id)

    const sampleData = existingSample.sampleData ? JSON.parse(existingSample.sampleData) : {}
    _.set(sampleData, 'clinicianName', _.trim(payload?.clinicianName) ?? sampleData.clinicianName)
    _.set(sampleData, 'userId', currentlyLoggedInUser.id)
    _.set(sampleData, 'partnerId', currentlyLoggedInUser.partnerId)
    _.set(sampleData, 'countryId', currentlyLoggedInUser.countryId)
    _.set(sampleData, 'clientType', payload?.clientType ?? sampleData.clientType ?? 'reporter_app')
    _.set(sampleData, 'patientExternalId', _.trim(payload?.patientExternalId) ?? sampleData.patientExternalId ?? null)
    _.set(payloadForDb, 'sampleData', JSON.stringify(sampleData))

    const updatedSample = await updateExistingSample(existingSample.id, payloadForDb, request.auth)
    return { ok: !_.isEmpty(updatedSample), data: transformSampleData(updatedSample[0]) }
  }
  // sampleTypeId is SampleType.sampleTypeSputum defaults to Sputum for most MTB tests
  const sampleTypeIdOrOther = sampleTypeId ?? (await sampleTypeToId('Other'))
  _.set(payloadForDb, 'sampleTypeId', sampleTypeIdOrOther)
  _.set(payloadForDb, 'collectedOn', collectedOn)
  _.set(payloadForDb, 'originSiteId', payload.originSiteId)
  _.set(payloadForDb, 'sampleStatus', 'SAMPLE_REGISTERED')
  _.set(payloadForDb, 'collectedBy', currentlyLoggedInUser.id)

  const sampleData = {}
  _.set(sampleData, 'clinicianName', _.trim(payload?.clinicianName).toString() ?? null)
  _.set(sampleData, 'userId', currentlyLoggedInUser.id)
  _.set(sampleData, 'partnerId', currentlyLoggedInUser.partnerId)
  _.set(sampleData, 'countryId', currentlyLoggedInUser.countryId)
  _.set(sampleData, 'clientType', payload?.clientType || 'reporter_app')
  _.set(sampleData, 'patientExternalId', _.trim(payload?.patientExternalId).toString() ?? null)
  _.set(payloadForDb, 'sampleData', JSON.stringify(sampleData))

  const newSample = await insertNewSample(payloadForDb, request.auth)
  return { ok: !_.isEmpty(newSample), data: transformSampleData(newSample[0]) }
}

module.exports = { registerNewSample }
