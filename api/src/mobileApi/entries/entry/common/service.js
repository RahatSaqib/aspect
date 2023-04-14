const _ = require('lodash')
const { resultWorkflowStatusToId } = require('../../../../shared/dictionary')
const {
  countAllAwaitingTreatment,
  fetchEntriesByUpdatedOnQuery,
  getCommentsOfResultById,
  getFollowUpsOfResultById,
} = require('./db')
const { transformSampleData } = require('./helpers/transformSample')
const { transformPatientDataBySchema } = require('./helpers/transformPatientDataBySchema')
const { transformTestInformation } = require('./helpers/transformTestInformation')
const { transformEntryType } = require('./helpers/transformEntryType')
const { transformResultText } = require('./helpers/transformResultText')
const { transformAssayAvatar } = require('./helpers/transformAssayAvatar')
const { extractFromDataById } = require('./helpers/extractFromDataById')
const { generateTransferStatus } = require('./helpers/generateTransferStatus')
const { transformTreatmentStatus } = require('./helpers/transformTreatmentStatus')
const { transformClinicalResponse } = require('./helpers/transformClinicalResponse')

//   const getSampleStatus = val => {
//     let sampleStatus = [SAMPLE_STATUS_DAMAGED, SAMPLE_STATUS_LOST][_.random(0, 2)]
//     if (!_.isNil(val)) {
//       sampleStatus = val === 'danger' ? SAMPLE_STATUS_NOT_TESTED : SAMPLE_STATUS_REGISTER
//     }
//     return sampleStatus
//   }
//   originSite: data.sampleOriginSiteId
//     ? {
//         externalId: data.sampleOriginSiteExternalId,
//         name: data.sampleOriginSiteName,
//       }
//     : null,

function transFormEntryResponse(data, followUps, comments, acknowledgedId) {
  return {
    id: data.id,
    assayAvatar: transformAssayAvatar(data),
    clinicalResponse: transformClinicalResponse(data, followUps, acknowledgedId),
    comments: extractFromDataById(followUps, 'resultId', data.id),
    followUps: extractFromDataById(followUps, 'resultId', data.id),
    patientData: transformPatientDataBySchema(JSON.parse(data.patientData), JSON.parse(data.patientDataSchema)),
    resultData: transformResultText(data),
    sample: transformSampleData(data),
    testInformation: transformTestInformation(data),
    testType: transformEntryType(data),
    transferStatus: generateTransferStatus(data),
    treatmentStatus: transformTreatmentStatus(data, followUps),
    updatedOn: data.updatedOn,
  }
}

async function fetchEntriesServiceHandler(request) {
  const { query, auth } = request
  const results = await fetchEntriesByUpdatedOnQuery(query, auth)
  const followUps = await getFollowUpsOfResultById(results)
  const comments = await getCommentsOfResultById(results)
  const awaitingTreatment = await countAllAwaitingTreatment(auth)
  const acknowledgedId = await resultWorkflowStatusToId('Acknowledged')
  const entries = _.map(results, result => transFormEntryResponse(result, followUps, comments, acknowledgedId))
  return {
    ok: !!entries,
    total: _.size(entries),
    awaitingTreatment: awaitingTreatment.count,
    data: entries,
    raw: results,
  }
}

module.exports = { fetchEntriesServiceHandler }
