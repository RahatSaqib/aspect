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
const { clinicalResponse } = require('../../../../result/clinicalResponse')

function transFormResultResponse(data, followUps, comments, acknowledgedId) {
  const output = []
  if (_.isEmpty(data)) return
  _.map(data, result => {
    const resultFollowUps = extractFromDataById(followUps, 'resultId', result.id)
    const patientData = JSON.parse(result?.patientData)
    output.push({
      id: result.id,
      assayAvatar: transformAssayAvatar(result),
      clinicalResponse: transformClinicalResponse(result, resultFollowUps, acknowledgedId),
      comments: extractFromDataById(comments, 'resultId', result.id),
      followUps: resultFollowUps,
      history: buildHistoryTimeline(result, resultFollowUps, comments),
      patientData: transformPatientDataBySchema(patientData, JSON.parse(result.patientDataSchema)),
      patientId: patientData?.id,
      sample: transformSampleData(result),
      searchSchema: generateSearchKeys(result, patientData?.id),
      testInformation: transformTestInformation(result),
      testType: transformEntryType(result),
      transferStatus: generateTransferStatus(result),
      treatmentStatus: transformTreatmentStatus(result, resultFollowUps),
      updatedOn: getResultUpdatedOnDate(result, resultFollowUps, comments),
    })
  })
  return output
}

module.exports = { transFormResultResponse }
