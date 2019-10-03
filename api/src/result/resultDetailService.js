const Boom = require('boom')
const _ = require('lodash')
const dateFormat = require('date-fns/format')
const { subDays, subMonths, startOfMonth, endOfMonth } = require('date-fns')
const Promise = require('bluebird')
const {
  knex,
  filterParams,
  filterDateRangeParams,
  sortPageParams,
} = require('../db')
const { resultUpdated } = require('./actions')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { getUser } = require('../auth/service')
const {
  resultWorkflowStatusToId,
  resultTreatmentStatusToId,
} = require('../shared/dictionary')
const { oneDirectionalMd5Hash } = require('../shared/encryption')
const { returnIso8601StringWithoutTimeZoneOffset } = require('../shared/date')
const { getPathFromFileReferenceId } = require('../file/service')

const SELECT_LIST_FIELDS = [
  'r.id',
  'r.externalId',
  knex.raw(
    "case when ifnull(GREATEST(rtas.requiresTreatment, rtas2.requiresTreatment), 0) = 0 then null else case when rts.externalId= 'OnTreatment' then 'ok' when rts.externalId = 'NotPossible' then 'na' when r.endedOn<DATE_SUB(NOW(),INTERVAL 32 DAY) then 'alert' when r.endedOn<=DATE_SUB(NOW(),INTERVAL 16 DAY) and r.endedOn>=DATE_SUB(NOW(),INTERVAL 32 DAY) then 'warning' else 'na' end end as treatmentStatusInfo"
  ),
  knex.raw('IFNULL(r.endedOn, r.startedOn) as endedOn'),
  'd.name as deviceName',
  'c.name as countryName',
  'st.name as stateName',
  'lg.name as lgaName',
  'rc1.name as resultCategory1Name',
  'rc2.name as resultCategory2Name',
  'rs.name as resultWorkflowStatus',
  'rts.externalId as resultTreatmentStatus',
  'rtsl.changedOn as resultTreatmentStatusChangedOn',
  knex.raw('ifnull(rts.name, "N/A") as resultTreatmentStatusName'),
  knex.raw(
    'ifnull(GREATEST(rtas.requiresTreatment, rtas2.requiresTreatment), 0) as requiresTreatment'
  ),
  'so.name as sampleOriginSiteName',
  'sp.externalId as sampleId',
  'r.sampleGroup',
  'sp.collectedOn as sampleCollectedOn',
  'a.name as assayName',
  'a.id as assayId',
  'r.deviceId',
  'stp.name as sampleTypeName',
  knex.raw(
    `IFNULL(JSON_UNQUOTE(JSON_EXTRACT(r.resultData, "$.resultText")), CONCAT(IFNULL(rc1.name, ''), '|', IFNULL(rc2.name, ''))) as resultText`
  ),
  knex.raw('JSON_UNQUOTE(JSON_EXTRACT(r.patientData, "$.id")) as patientId'),
]
async function getResultDetails(request, fields = SELECT_SHOW_FIELDS) {
  const { auth, params } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const { userName } = await getUser(auth.credentials.name)

  const results = await knex('Result as r')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .leftJoin('Geography as g', 'r.geographyId', 'g.id')
    .leftJoin('Site as si', 'r.siteId', 'si.id')
    .leftJoin('Country as c', 'g.countryId', 'c.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as lg', 'g.lgaId', 'lg.id')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .leftJoin('Sample as sp', 'r.sampleId', 'sp.id')
    .leftJoin('SampleType as stp', 'sp.sampleTypeId', 'stp.id')
    .leftJoin('Site as so', 'sp.originSiteId', 'so.id')
    .leftJoin('ResultCategoryAssay as rtas', function() {
      this.on('r.assayId', 'rtas.assayId').andOn(
        'r.resultCategory1',
        'rtas.resultCategoryId'
      )
    })
    .leftJoin('ResultCategoryAssay as rtas2', function() {
      this.on('r.assayId', 'rtas2.assayId').andOn(
        'r.resultCategory1',
        'rtas2.resultCategoryId'
      )
    })
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
    .leftJoin('ResultForm as rf', function() {
      this.on('r.assayId', 'rf.assayId').andOn('r.partnerId', 'rf.partnerId')
    })
    .where('r.id', +params.resultId)
    .modify(addConstraints, dataConstraints, { device: 'd', sample: 'sp' })
    .select(fields)

  let data = null

  // translate result data back to an object and get assay details
  // if selecting the result was successful
  if (results.length === 1) {
    ;[data] = results
    if (data.resultData) {
      data.resultData = JSON.parse(data.resultData)
    }
    if (data.formSchema) {
      data.formSchema = JSON.parse(data.formSchema)
    }
    if (data.formData) {
      data.formData = JSON.parse(data.formData)
    }
    if (data.patientData) {
      data.patientData = JSON.parse(data.patientData)
    }
    if (data.assayId) {
      data.assay = await knex('Assay as a')
        .where('a.id', data.assayId)
        .first()
      if (data.assay.resultDataSchema) {
        data.assay.resultDataSchema = JSON.parse(data.assay.resultDataSchema)
      }
      if (data.assay.patientDataSchema) {
        data.assay.patientDataSchema = JSON.parse(data.assay.patientDataSchema)
      }
    }
    // select files attached to this result
    const { data: files } = await showFileReferences(request)
    data.files = files

    const { data: followUps } = await showResultFollowUps(request)
    data.followUps = followUps
  }

  if (data) {
    getResultTreatmentStatus(data)
    data.resultNotes = await getResultNotesByResultId(+params.resultId)
    data.resultTreatmentStatusCreatedBy = userName
  }

  return { ok: results.length === 1, data }
}
