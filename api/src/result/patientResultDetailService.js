const Boom = require('@hapi/boom')
const _ = require('lodash')
const { knex } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

async function getPatientResultsDetails(request) {
  const { auth, query } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const resultDetails = knex('Result as r')
    .join('Sample as s', 'r.sampleId', 's.id')
    .leftJoin('SampleType as st', 's.sampleTypeId', 'st.id')
    .join('Site as originsite', 's.originSiteId', 'originsite.id')
    .join('Site as resultSite', 's.originSiteId', 'resultSite.id')
    .join('Assay as a', 'r.assayId', 'a.id')
    .leftJoin('AssayType as at', 'a.assayTypeId', 'at.id')
    .leftJoin('Disease as dis', 'at.diseaseId', 'dis.id')
    .join('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .leftJoin('ResultFollowUp as rfu', 'r.id', 'rfu.resultId')
    .leftJoin('FollowUp as fu', 'rfu.followUpId', 'fu.id')
    .leftJoin('FollowUpType as fut', 'fu.followUpTypeId', 'fut.id')
    .leftJoin('ResultTreatmentStatusLog as rtsl', 'r.treatmentStatusLogId', 'rtsl.id')
    .leftJoin('User as u', 'rtsl.createdBy', 'u.id')
    .leftJoin('Person as p', 'u.id', 'p.UserId')
    .leftJoin('ResultTreatmentStatus as rts', 'rtsl.resultTreatmentStatusId', 'rts.id')
    .where(queryBuilder => {
      queryBuilder.whereRaw('LOWER(JSON_EXTRACT(r.patientData,"$.id")) = LOWER(JSON_QUOTE(?))', [query.patientId])
      if (query.diseaseId) queryBuilder.where('dis.id', query.diseaseId)
    })
    .modify(addConstraints, dataConstraints, {
      assay: 'a',
      result: 'r',
      sample: 's',
      disease: 'dis',
    })
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
      'rtsl.createdon as resultTreatmentStatusLogDate',
      'rts.name as resultTreatmentName',
      'rts.externalid as resultTreatmentId',
      'a.patientDataSchema as patientDataSchema',
      'rfu.date as followUpDate',
      'rfu.id as resultFollowUpId',
      'rfu.createdOn as followUpCreatedOn',
      'fu.name as followUpName',
      'fut.name as followUpTypeName',
      'fut.externalId as followUpTypeExternalId'
    )
    .orderBy('sampleCollectedOn', 'resultEndedOn', 'resultTestStatusLog')
  const results = await resultDetails
  // if no result we are going to return not found for the specific patient id
  if (results.length === 0) {
    return Boom.notFound("There isn't any patient with this id")
  }

  /* for doing only one query i normalize the data with lodash in memory */
  /* the idea is to create one record per milestone and normalize the data to place it into the timeline */
  /* it categorize the milestone, add notes and dates to everyone. */
  /* when we will add the outcomes, should be normalized as the next couple of lines */
  const finalResult = []
  const samples = _.uniqBy(results, 'sampleId')
  const uniqResults = _.uniqBy(results, 'resultId')
  const followUps = _.uniqBy(results, 'resultFollowUpId')

  _.each(uniqResults, async result =>
    finalResult.push({
      ...result,
      resultData: result.resultData ? JSON.parse(result.resultData) : null,
      patientData: result.patientData ? JSON.parse(result.patientData) : null,
      patientDataSchema: result.patientDataSchema ? JSON.parse(result.patientDataSchema) : null,
      date: result.resultEndedOn,
      type: 'Result',
      description: result.resultData.resultText || `${result.resultCategory1} ${result.resultCategory2 || ''}`,
    })
  )

  _.each(samples, sample =>
    finalResult.push({
      ...sample,
      resultData: sample.resultData ? JSON.parse(sample.resultData) : null,
      patientData: sample.patientData ? JSON.parse(sample.patientData) : null,
      patientDataSchema: sample.patientDataSchema ? JSON.parse(sample.patientDataSchema) : null,
      date: sample.sampleCollectedOn,
      sampleType: sample.sampleType || '-',
      type: 'Sample',
      description: 'Sample collected',
    })
  )
  _.each(followUps, fu => {
    if (fu.followUpTypeExternalId)
      finalResult.push({
        ...fu,
        resultData: fu.resultData ? JSON.parse(fu.resultData) : null,
        patientData: fu.patientData ? JSON.parse(fu.patientData) : null,
        patientDataSchema: fu.patientDataSchema ? JSON.parse(fu.patientDataSchema) : null,
        date: fu.followUpDate || fu.followUpCreatedOn,
        type: _.capitalize(fu.followUpTypeExternalId),
      })
  })

  return {
    ok: finalResult.length >= 1,
    data: _.sortBy(finalResult, elem => new Date(elem.date)).reverse(),
  }
}

module.exports = {
  getPatientResultsDetails,
}
