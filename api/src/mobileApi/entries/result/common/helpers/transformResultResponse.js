/* eslint-disable no-console */
const _ = require('lodash')
const { buildHistoryTimeline } = require('./buildHistoryTimeline')
const { extractFromDataById } = require('./extractFromDataById')
const { getResultUpdatedOnDate } = require('./getTrueUpdatedOnDates')
const { generateSearchKeys } = require('./generateSearchKeys')
const { generateTransferStatus } = require('./generateTransferStatus')
const { transformAssayAvatar } = require('./transformAssayAvatar')
const { transformClinicalResponse } = require('./transformClinicalResponse')
const { transformEntryType } = require('./transformEntryType')
const { transformPatientDataBySchema } = require('./transformPatientDataBySchema')
const { transformSampleData } = require('./transformSample')
const { transformTestInformation } = require('./transformTestInformation')
const { transformTreatmentStatus } = require('./transformTreatmentStatus')

function transformResultResponse(data, followUps, acknowledgements, flags, userSiteIds) {
  if (_.isEmpty(data)) return
  return _.map(data, result => {
    const resultFollowUps = extractFromDataById(followUps, 'resultId', result.id)
    const patientData = JSON.parse(result?.patientData)
    const patientSampleData = result.sampleData ? JSON.parse(result.sampleData) : null
    const acknowledgement = acknowledgements?.find(ack => ack.resultId === result.id)
    const resultFlags = flags?.filter(flag => flag.resultId === result.id)
    const resultRequiresTreatment = !!(
      result?.resultCategoryAssay1RequiresTreatment || result?.resultCategoryAssay2RequiresTreatment
    )
    const clinicalResponse = transformClinicalResponse(result, resultFollowUps, acknowledgement)
    const noFollowUpPossible = result?.resultTreatmentStatusExternalId === 'NotPossible'
    const noFollowUpPossibleComment = noFollowUpPossible ? result?.resultWorkflowStatusReason : undefined
    const hasFollowUp = !!clinicalResponse?.treatment && resultRequiresTreatment && !noFollowUpPossible

    const requiresFollowUp = resultRequiresTreatment && !hasFollowUp && !noFollowUpPossible
    const hasFollowUpEntry = resultRequiresTreatment && hasFollowUp && !noFollowUpPossible

    const clinicalFollowUpFlags = {
      requiresFollowUp,
      hasFollowUp: hasFollowUpEntry,
      noFollowUpPossible,
    }

    const clinicalFollowUpFilter = {
      ...clinicalFollowUpFlags,
      followUpStatus: requiresFollowUp
        ? 'requiresFollowUp'
        : hasFollowUpEntry
        ? 'hasFollowUp'
        : noFollowUpPossible
        ? 'noFollowUpPossible'
        : 'followUpNotRequired',
    }

    return {
      id: result.id,
      assayExternalId: result.assayExternalId,
      assayAvatar: transformAssayAvatar(result),
      clinicalResponse,
      errorCode: result.errorCode,
      laboratorySiteName: result.laboratorySiteName,
      testEndDate: result.testEndDate,
      resultNotes: result.resultNotes,
      comments: [],
      followUps: resultFollowUps,
      history: buildHistoryTimeline(result, resultFollowUps, resultFlags, userSiteIds),
      patientData: transformPatientDataBySchema(patientData, JSON.parse(result.patientDataSchema)),
      patientId: patientData?.id || patientSampleData?.patientExternalId || null,
      sample: transformSampleData(result),
      resultRequiresTreatment,
      ...clinicalFollowUpFlags,
      noFollowUpPossibleComment,
      searchSchema: generateSearchKeys(result, patientData?.id, clinicalFollowUpFilter, userSiteIds),
      testInformation: transformTestInformation(result),
      testType: transformEntryType(result),
      transferStatus: generateTransferStatus(result, userSiteIds),
      treatmentStatus: transformTreatmentStatus(result, resultFollowUps, userSiteIds),
      updatedOn: getResultUpdatedOnDate(result, resultFollowUps),
      reportableSite: {
        id: result.reportableSiteId,
        name: result.reportableSiteName,
        externalId: result.reportableSiteExternalId,
      },
      laboratorySite: {
        id: result.laboratorySiteId,
        name: result.laboratorySiteName,
        externalId: result.laboratorySiteExternalId,
      },
    }
  })
}

module.exports = { transformResultResponse }
