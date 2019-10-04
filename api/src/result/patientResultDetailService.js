const { knex } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')
// const { getUser } = require('../auth/service')
// const _ = require('lodash')
const { showResultFollowUps } = require('./service')

async function getPatientResultsDetails(request) {
  const { auth, query } = request
  //console.log(query)
  const dataConstraints = await getConstraints(auth.credentials)
  // const { userName } = await getUser(auth.credentials.name)
 // console.log('entre')
  const resultDetails = knex('Result as r')
    .join('Sample as s', 'r.sampleId', 's.id')
    .join('Site as originsite', 's.originSiteId', 'originsite.id')
    .join('Site as resultSite', 's.originSiteId', 'resultSite.id')
    .join('Assay as a', 'r.assayId', 'a.id')
    .join('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin(
      'ResultWorkflowLog as rsl',
      'r.resultWorkflowStatusLogId',
      'rsl.id'
    )
    .leftJoin(
      'ResultWorkflowStatus as rs',
      'rsl.resultWorkflowStatusId',
      'rs.id'
    )
    .leftJoin(
      'ResultTreatmentStatusLog as rtsl',
      'r.treatmentStatusLogId',
      'rtsl.id'
    )
    .leftJoin(
      'ResultTreatmentStatus as rts',
      'rtsl.resultTreatmentStatusId',
      'rts.id'
    )
    .where(knex.raw('JSON_EXTRACT(r.patientData,"$.id")'), query.patientId)
    .modify(addConstraints, dataConstraints, { sample: 's' })
    .select(
      's.collectedOn as sampleCollectedOn',
      'originsite.name as OriginalSiteName',
      's.externalId as sampleId',
      'r.endedon as resultEndedOn',
      'a.abbreviation as assayAbbreviation',
      'a.externalId as assayId',
      'r.resultData as resultData',
      'resultSite.name as resultSiteName',
      'r.notes as resultNotes',
      'rs.externalid as resultStatus',
      'rsl.createdon as resultStatusLog',
      'rtsl.createdon as resultTestStatusLog',
      'rts.externalid as resultTreatmentId'
    )

  let data = []
 // console.log(resultDetails.toString())
  const results = await resultDetails
console.log(results)
  // translate result data back to an object and get assay details
  // if selecting the result was successful
  if (results.length === 1) {
    ;[data] = results
    if (data.resultData) {
      data.resultData = JSON.parse(data.resultData)
    }
    if (data.patientData) {
      data.patientData = JSON.parse(data.patientData)
    }

    const { data: followUps } = await showResultFollowUps(request)
    data.followUps = followUps
  }

  return { ok: results.length >= 1, data }
}

module.exports = {
  getPatientResultsDetails,
}
