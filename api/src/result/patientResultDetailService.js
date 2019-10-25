const { knex } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { showResultFollowUps } = require('./service')
const Boom = require('boom')
const Promise = require('bluebird')
const _ = require('lodash')

async function getPatientResultsDetails(request) {
  const { auth, query } = request
  const dataConstraints = await getConstraints(auth.credentials)
  // const { userName } = await getUser(auth.credentials.name)
  // console.log('entre')
  const resultDetails = knex('Result as r')
    .join('Sample as s', 'r.sampleId', 's.id')
    .join('SampleType as st', 's.sampleTypeId', 'st.id')
    .join('Site as originsite', 's.originSiteId', 'originsite.id')
    .join('Site as resultSite', 's.originSiteId', 'resultSite.id')
    .join('Assay as a', 'r.assayId', 'a.id')
    .join('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
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
    .leftJoin('User as u', 'rtsl.createdBy', 'u.id')
    .leftJoin('Person as p', 'u.id', 'p.UserId')
    .leftJoin(
      'ResultTreatmentStatus as rts',
      'rtsl.resultTreatmentStatusId',
      'rts.id'
    )
    .where(knex.raw('JSON_EXTRACT(r.patientData,"$.id")'), query.patientId)
    .modify(addConstraints, dataConstraints, { sample: 's' })
    .select(
      'r.id as resultId',
      'rc1.name as resultCategory1',
      'rc2.name as resultCategory2',
      'st.name as sampleType',
      's.collectedOn as sampleCollectedOn',
      'originsite.name as originalSiteName',
      's.externalId as sampleId',
      'r.endedon as resultEndedOn',
      'a.abbreviation as assayAbbreviation',
      'a.externalId as assayId',
      'r.resultData as resultData',
      'r.patientData as patientData',
      'resultSite.name as resultSiteName',
      'r.notes as resultNotes',
      'rs.externalid as resultStatus',
      'rsl.createdon as resultStatusLog',
      'rtsl.createdon as resultTreatmentStatusLogDate',
      'rtsl.id as resultTreatmentStatusLogId',
      'rtsl.data as resultTreatmentStatusLogData',
      'rtsl.method as resultTreatmentStatusLogMethod',
      'p.name as resultTreatmentStatusLogCreatedBy',
      knex.raw(
        "CONCAT(rtsl.data,' ',rtsl.method) as resultTreatmentStatusLogNotes"
      ),
      'rts.name as resultTreatmentName',
      'rts.externalid as resultTreatmentId',
      'a.patientDataSchema as patientDataSchema'
    )
    .orderBy('sampleCollectedOn', 'resultEndedOn', 'resultTestStatusLog')

  let data = []

  const results = await resultDetails
  // if no result we are going to return not found for the specific patient id
  if (results.length === 0) {
    return Boom.notFound("There isn't any patient with this id")
  }
  // translate result data back to an object and get assay details
  // if selecting the result was successful
  if (results.length >= 1) {
    data = await Promise.map(results, async result => {
      const resultsData = Object.assign({}, result, {
        resultData: result.resultData ? JSON.parse(result.resultData) : null,
        patientData: result.patientData ? JSON.parse(result.patientData) : null,
        patientDataSchema: result.patientDataSchema
          ? JSON.parse(result.patientDataSchema)
          : null,
      })

      return resultsData
    })
  }
  /* for doing only one query i normalize the data with lodash in memory */
  /* the idea is to create one record per milestone and normalize the data to place it into the timeline */
  /* it categorize the milestone, add notes and dates to everyone. */
  /* when we will add the outcomes, should be normalized as the next couple of lines */
  const finalResult = []
  const samples = _.uniqBy(data, 'sampleId')
  const uniqResults = _.uniqBy(data, 'resultId')

  _.each(uniqResults, async result =>
    finalResult.push(
      Object.assign({}, result, {
        date: result.resultEndedOn,
        type: 'Result',
        notes:
          result.resultData.resultText ||
          `${result.resultCategory1} | ${result.resultCategory2}`,
      })
    )
  )

  _.each(samples, sample =>
    finalResult.push(
      Object.assign({}, sample, {
        date: sample.sampleCollectedOn,
        type: 'Sample',
        notes: 'Sample collected',
      })
    )
  )
  await Promise.each(uniqResults, async result => {
    const followUps = await showResultFollowUps(
      result.resultId,
      dataConstraints
    )
    if (followUps) {
      _.each(followUps.data, fu => {
        finalResult.push(
          Object.assign({}, result, {
            date: fu.date || fu.createdOn,
            followUpTypeName: fu.followUpTypeName,
            type: fu.followUpTypeName,
            followUpName: fu.name,
            followUpCreatedOn: fu.createdOn,
          })
        )
      })
    }
  })

  if (finalResult.length === 0) {
    return Boom.notFound("There isn't any patient with this id")
  }
  return {
    ok: finalResult.length >= 1,
    data: _.orderBy(finalResult, 'date', 'desc'),
  }
}

module.exports = {
  getPatientResultsDetails,
}
