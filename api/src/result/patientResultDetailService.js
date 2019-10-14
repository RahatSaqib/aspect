const { knex } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

const Promise = require('bluebird')
const _ = require('lodash')

async function getPatientResultsDetails(request) {
  const { auth, query } = request
  // console.log(query)
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
      's.collectedOn as sampleCollectedOn',
      'originsite.name as originalSiteName',
      's.externalId as sampleId',
      'r.endedon as resultEndedOn',
      'a.abbreviation as assayAbbreviation',
      'a.externalId as assayId',
      'r.resultData as resultData',
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
      'rts.externalid as resultTreatmentId'
    )
    .orderBy('sampleCollectedOn', 'resultEndedOn', 'resultTestStatusLog')

  let data = []
  const results = await resultDetails
  // translate result data back to an object and get assay details
  // if selecting the result was successful
  if (results.length >= 1) {
    data = await Promise.map(results, async result => {
      const resultsData = Object.assign({}, result, {
        resultData: result.resultData ? JSON.parse(result.resultData) : '',
        patientData: result.resultData ? JSON.parse(result.resultData) : '',
      })

      return resultsData
    })
  }

  const finalResult = []
  const samples = _.uniqBy(data, 'sampleId')
  const uniqResults = _.uniqBy(data, 'resultId')
  const ResultTreatmentStatusLog = _.uniqBy(data, 'ResultTreatmentStatusLogId')

  _.each(uniqResults, result =>
    finalResult.push(
      Object.assign({}, result, {
        date: result.resultEndedOn,
        type: 'Result',
        notes: result.notes,
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

  _.each(ResultTreatmentStatusLog, treatment =>
    finalResult.push(
      Object.assign({}, treatment, {
        date: treatment.resultTreatmentStatusLogDate,
        type: 'Treatment',
        notes: treatment.resultTreatmentName
          ? `Treatment status:${treatment.resultTreatmentName}`
          : '',
      })
    )
  )

  return {
    ok: finalResult.length >= 1,
    data: _.orderBy(finalResult, 'date', 'desc'),
  }
}

module.exports = {
  getPatientResultsDetails,
}
