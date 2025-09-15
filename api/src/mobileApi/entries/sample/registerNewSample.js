const _ = require('lodash')
const Boom = require('@hapi/boom')
const { getUser } = require('../../../auth/service')
const { transformSampleData } = require('../result/common/helpers/transformSample')
const { sampleTypeToId } = require('../../../shared/dictionary')
const { getConstraints } = require('../../../auth/constraints')
const { getSite, getSitesQuery } = require('../../../site/service')
const { knex } = require('../../../db')
const {
  allResultWorkflowStatusToId,
  allAssayToId,
  allResultCategoryToId,
  allResultSourceToId,
  allResultTypeToId,
} = require('../../../shared/dictionary')
const config = require('../../../config')
const { getBaseAllSamplesRegistered } = require('./common/db')
const { getSampleByExternalId } = require('../../../sample/common/db')

async function registerNewSample(request) {
  const { payload, auth } = request
  const currentlyLoggedInUser = await getUser(auth.credentials.name)
  const dataConstraints = await getConstraints(auth.credentials)
  const site = await getSite(payload.originSiteId, dataConstraints)
  if (_.isEmpty(site)) {
    throw Boom.forbidden('Unauthorised Origin Site')
  }

  const collectedOnUnSanitised = new Date(payload?.collectedOn ?? '')
  const collectedOn = _.isNaN(collectedOnUnSanitised.getTime()) ? null : collectedOnUnSanitised

  // sampleTypeId is SampleType.sampleTypeSputum defaults to Sputum for most MTB tests
  const sampleTypeId = await sampleTypeToId(payload.sampleTypeExternalId ?? 'Sputum')

  const sampleData = {
    clinicianName: _.trim(payload?.clinicianName).toString() ?? null,
    userId: currentlyLoggedInUser.id,
    partnerId: currentlyLoggedInUser.partnerId,
    countryId: currentlyLoggedInUser.countryId,
    clientType: payload?.clientType || 'reporter_app',
    patientExternalId: _.trim(payload?.patientExternalId).toString() ?? null,
  }

  const now = new Date()
  const sampleToSave = {
    externalId: payload.externalId,
    registeredInAspect: true,
    sampleTypeId,
    collectedOn,
    collectedBy: currentlyLoggedInUser.id,
    originSiteId: payload.originSiteId,
    sampleData,
    sampleStatus: 'SAMPLE_REGISTERED',
    updatedBy: currentlyLoggedInUser.id,
    updatedOn: now,
  }

  await knex.transaction(async trx => {
    // Lock the sample row for update to prevent concurrency issues
    const existingSample = await getSampleByExternalId(trx, payload.externalId).forUpdate()
    if (existingSample) {
      // Update existing sample
      const existingSampleData = existingSample.sampleData ? JSON.parse(existingSample.sampleData) : {}

      sampleToSave.sampleTypeId = sampleTypeId ?? existingSample.sampleTypeId
      sampleToSave.collectedOn = collectedOn ?? existingSample.collectedOn
      sampleToSave.originSiteId = payload.originSiteId ?? existingSample.originSiteId
      sampleToSave.sampleStatus = existingSample.sampleStatus ?? 'SAMPLE_REGISTERED'
      sampleToSave.collectedBy = existingSample.collectedBy ?? currentlyLoggedInUser.id
      sampleToSave.sampleData = { ...existingSampleData, ...sampleData }

      await trx('Sample')
        .where('externalId', payload.externalId)
        .update({
          ...sampleToSave,
          sampleData: JSON.stringify(sampleToSave.sampleData),
        })
    } else {
      // Create new one
      sampleToSave.createdOn = now
      sampleToSave.createdBy = currentlyLoggedInUser.id
      await trx('Sample').insert({
        ...sampleToSave,
        sampleData: JSON.stringify(sampleToSave.sampleData),
      })

      if (config.acceptFakeResults) {
        await createFakeResult(trx, payload.originSiteId, payload.externalId)
      }
    }
  })

  // Response
  const clinicIds = await getSiteIdsForUser(auth)
  const [sampleRegistrated] = await getSamplesRegisteredByExternalId(payload.externalId, clinicIds)

  return {
    ok: true,
    data: transformSampleData(sampleRegistrated),
  }
}

const getSamplesRegisteredByExternalId = async (externalId, originSiteIds) => {
  const knexQuery = getBaseAllSamplesRegistered(originSiteIds).where({ 'sample.externalId': externalId })
  return knexQuery
}

const getSiteIdsForUser = async auth => {
  const dataConstraints = await getConstraints(auth.credentials)
  const clinics = await getSitesQuery(dataConstraints).select('s.id')
  return clinics.map(c => c.id)
}

const createFakeResult = async (trx, siteId, sampleExternalId) => {
  const resultCombinations = allResultCategories => [
    {
      resultCategory1: allResultCategories.Detected,
      resultCategory2: allResultCategories.Detected,
      resultData: JSON.stringify({
        assay: 'Xpert MTB-RIF Assay G4',
        resultText: 'MTB Detected|Rif Resistance Detected',
      }),
    },
    {
      resultCategory1: allResultCategories.NotDetected,
      resultCategory2: null,
      resultData: JSON.stringify({
        assay: 'Xpert MTB-RIF Assay G4',
        resultText: 'MTB Not Detected|Rif Resistance Not Detected',
      }),
    },
    {
      resultCategory1: allResultCategories.Detected,
      resultCategory2: allResultCategories.NotDetected,
      resultData: JSON.stringify({
        assay: 'Xpert MTB-RIF Assay G4',
        resultText: 'MTB Detected|Rif Resistance Not Detected',
      }),
    },
  ]

  const resultWorkflowStatuses = await allResultWorkflowStatusToId()
  const assayIds = await allAssayToId()
  const resultCategories = await allResultCategoryToId()
  const resultSources = await allResultSourceToId()
  const resultTypes = await allResultTypeToId()

  const device = await trx('Device as d')
    .join('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .andWhere({ siteId })
    .first('d.id', 'partnerId')

  const resultCombination = resultCombinations(resultCategories)[_.random(0, 2)]

  if (device) {
    const { id: deviceId, partnerId } = device
    const now = new Date()
    const [resultId] = await trx('Result').insert({
      externalId: `${sampleExternalId}_${_.random(0, 100)}`,
      assayId: assayIds.GxMtbRif,
      partnerId,
      siteId,
      deviceId,
      resultSourceId: resultSources.DiagnosticDevice,
      resultTypeId: resultTypes.Patient,
      sampleId: await getSampleByExternalId(trx, sampleExternalId).then(s => s.id),
      resultDataHash: null,
      assayVersion: '4',
      startedOn: now,
      endedOn: now,
      patientData: '{}',
      notes: 'This is a test... result',
      createdOn: now,
      createdBy: 1,
      updatedOn: now,
      updatedBy: 1,
      reportableSiteId: siteId,
      ...resultCombination,
    })

    const [resultWorkflowStatusLogId] = await trx('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId: resultWorkflowStatuses.Deliverable,
      changedOn: now,
      createdOn: now,
    })
    await trx('Result').where('id', resultId).update({ resultWorkflowStatusLogId })
  }
}

module.exports = { registerNewSample }
