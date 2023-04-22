const _ = require('lodash')
const { resultWorkflowStatusToId } = require('../../../../shared/dictionary')
const {
  countAllAwaitingTreatment,
  fetchEntriesByUpdatedOnQuery,
  getCommentsOfResultById,
  getFollowUpsOfResultById,
} = require('./db')
const { buildHistoryTimeline } = require('./helpers/buildHistoryTimeline')
const { extractFromDataById } = require('./helpers/extractFromDataById')
const { filterTrueUpdatedOnDate } = require('./helpers/filterTrueUpdatedOnDate')
const { generateSearchKeys } = require('./helpers/generateSearchKeys')
const { generateTransferStatus } = require('./helpers/generateTransferStatus')
const { transformAssayAvatar } = require('./helpers/transformAssayAvatar')
const { transformClinicalResponse } = require('./helpers/transformClinicalResponse')
const { transformEntryType } = require('./helpers/transformEntryType')
const { transformPatientDataBySchema } = require('./helpers/transformPatientDataBySchema')
const { transformResultText } = require('./helpers/transformResultText')
const { transformSampleData } = require('./helpers/transformSample')
const { transformTestInformation } = require('./helpers/transformTestInformation')
const { transformTreatmentStatus } = require('./helpers/transformTreatmentStatus')

function transFormEntryResponse(data, followUps, comments, acknowledgedId) {
  return {
    id: data.id,
    assayAvatar: transformAssayAvatar(data),
    clinicalResponse: transformClinicalResponse(data, followUps, acknowledgedId),
    comments: extractFromDataById(comments, 'resultId', data.id),
    followUps: extractFromDataById(followUps, 'resultId', data.id),
    history: buildHistoryTimeline(data, followUps, comments),
    patientData: transformPatientDataBySchema(JSON.parse(data.patientData), JSON.parse(data.patientDataSchema)),
    patientId: JSON.parse(data.patientData)?.id,
    resultData: transformResultText(data),
    sample: transformSampleData(data),
    searchSchema: generateSearchKeys(data, followUps),
    testInformation: transformTestInformation(data),
    testType: transformEntryType(data),
    transferStatus: generateTransferStatus(data),
    treatmentStatus: transformTreatmentStatus(data, followUps),
    trueLatestUpdatedOn: filterTrueUpdatedOnDate(data, followUps, comments),
    latestUpdatedOn: data.latestUpdatedOn,
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
  }
}

module.exports = { fetchEntriesServiceHandler }
