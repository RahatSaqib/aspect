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

function transformResultResponse(data, followUps, comments, acknowledgements) {
  if (_.isEmpty(data)) return
  return _.map(data, result => {
    const resultFollowUps = extractFromDataById(followUps, 'resultId', result.id)
    const patientData = JSON.parse(result?.patientData)
    const acknowledgement = acknowledgements?.find(ack => ack.resultId === result.id)
    const requiresFollowUp = !!(
      result?.resultCategoryAssay1RequiresTreatment || result?.resultCategoryAssay2RequiresTreatment
    )
    const clinicalResponse = transformClinicalResponse(result, resultFollowUps, acknowledgement)
    const noFollowUpPossible = result?.resultTreatmentStatusExternalId === 'NotPossible'
    const hasFollowUp = !!clinicalResponse?.treatment && requiresFollowUp && !noFollowUpPossible
    const clinicalFollowUpFlags = {
      requiresFollowUp: requiresFollowUp && !hasFollowUp && !noFollowUpPossible,
      hasFollowUp,
      noFollowUpPossible,
    }
    return {
      id: result.id,
      assayExternalId: result.assayExternalId,
      assayAvatar: transformAssayAvatar(result),
      clinicalResponse,
      comments: extractFromDataById(comments, 'resultId', result.id),
      followUps: resultFollowUps,
      history: buildHistoryTimeline(result, resultFollowUps, comments),
      patientData: transformPatientDataBySchema(patientData, JSON.parse(result.patientDataSchema)),
      patientId: patientData?.id || null,
      sample: transformSampleData(result),
      ...clinicalFollowUpFlags,
      searchSchema: generateSearchKeys(result, patientData?.id, clinicalFollowUpFlags),
      testInformation: transformTestInformation(result),
      testType: transformEntryType(result),
      transferStatus: generateTransferStatus(result),
      treatmentStatus: transformTreatmentStatus(result, resultFollowUps),
      updatedOn: getResultUpdatedOnDate(result, resultFollowUps, comments),
    }
  })
}

module.exports = { transformResultResponse }
