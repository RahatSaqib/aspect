const { knex } = require('../../db')
const { getDateTimeProjectionInUserTimeZone } = require('../../shared/date')

function getReportCommonFields(userTimeOffset) {
  const fields = REPORT_COMMON_FIELDS

  fields.push(
    getDateTimeProjectionInUserTimeZone(
      knex,
      'r.endedOn',
      userTimeOffset,
      'endedOn'
    )
  )
  return fields
}

function getSelectCommonListFields(userTimeOffset) {
  const fields = SELECT_COMMON_FIELDS
  fields.push(
    getDateTimeProjectionInUserTimeZone(
      knex,
      'r.startedOn',
      userTimeOffset,
      'startedOn'
    )
  )
  fields.push(
    getDateTimeProjectionInUserTimeZone(
      knex,
      'r.endedOn',
      userTimeOffset,
      'endedOn'
    )
  )
  fields.push(
    getDateTimeProjectionInUserTimeZone(
      knex,
      'rsl.changedOn',
      userTimeOffset,
      'resultWorkflowChangedOn'
    )
  )
  fields.push(
    getDateTimeProjectionInUserTimeZone(
      knex,
      'r.consumableExpirationDate',
      userTimeOffset,
      'consumableExpirationDate'
    )
  )
  fields.push(
    getDateTimeProjectionInUserTimeZone(
      knex,
      'r.createdOn',
      userTimeOffset,
      'createdOn'
    )
  )
  fields.push(
    getDateTimeProjectionInUserTimeZone(
      knex,
      'r.updatedOn',
      userTimeOffset,
      'updatedOn'
    )
  )
  fields.push(
    getDateTimeProjectionInUserTimeZone(
      knex,
      'sp.collectedOn',
      userTimeOffset,
      'sampleCollectedOn'
    )
  )
  fields.push(
    getDateTimeProjectionInUserTimeZone(
      knex,
      'rsl.createdOn',
      userTimeOffset,
      'resultWorkflowLogCreatedOn'
    )
  )
  fields.push(
    getDateTimeProjectionInUserTimeZone(
      knex,
      'rsl.changedOn',
      userTimeOffset,
      'resultWorkflowLogChangedOn'
    )
  )
  fields.push(
    getDateTimeProjectionInUserTimeZone(
      knex,
      'rtsl.changedOn',
      userTimeOffset,
      'resultTreatmentStatusChangedOn'
    )
  )
  fields.push(
    getDateTimeProjectionInUserTimeZone(
      knex,
      'rslog.createdOn',
      userTimeOffset,
      'transferredOn'
    )
  )
  fields.push(
    getDateTimeProjectionInUserTimeZone(
      knex,
      'r.firstViewedOn',
      userTimeOffset,
      'firstViewedOn'
    )
  )

  return fields
}

function getListFields(userTimeOffset) {
  const fields = LIST_FIELDS_TIMEZONE_SAFE

  fields.push(
    getDateTimeProjectionInUserTimeZone(
      knex,
      knex.raw('IFNULL(r.endedOn, r.startedOn)'),
      userTimeOffset,
      'endedOn'
    )
  )
  return fields
}

const LIST_FIELDS_TIMEZONE_SAFE = [
  'r.id',
  'r.externalId',
  'd.name as deviceName',
  'so.name as sampleOriginSiteName',
  'sp.externalId as sampleId',
  knex.raw(
    `IFNULL(JSON_UNQUOTE(JSON_EXTRACT(r.resultData, "$.resultText")), CONCAT(IFNULL(rc1.name, ''), '|', IFNULL(rc2.name, ''))) as resultText`
  ),
  'r.errorCode',
  'rs.name as resultWorkflowStatus',
  'rs.i18nkey as resultWorkflowStatusI18nkey',
  'rts.externalId as resultTreatmentStatus',
  knex.raw(
    "CASE WHEN GREATEST(IFNULL(rca.requiresTreatment,0), IFNULL(rca2.requiresTreatment,0)) = 0 THEN NULL ELSE CASE WHEN rts.i18nKey IS NOT NULL THEN rts.i18nKey ELSE 'ResultTreatmentStatusNotAvailable' END END AS resultTreatmentStatusI18nKey"
  ),
  knex.raw(
    "case when GREATEST(IFNULL(rca.requiresTreatment,0), IFNULL(rca2.requiresTreatment,0)) = 0 then null else case when rts.externalId= 'OnTreatment' then 'ok' when rts.externalId = 'NotPossible' then 'na' when r.endedOn<DATE_SUB(NOW(),INTERVAL 32 DAY) then 'alert' when r.endedOn<=DATE_SUB(NOW(),INTERVAL 16 DAY) and r.endedOn>=DATE_SUB(NOW(),INTERVAL 32 DAY) then 'warning' else 'na' end end as treatmentStatusInfo"
  ),
  knex.raw('JSON_UNQUOTE(JSON_EXTRACT(r.patientData, "$.id")) as patientId'),
  'r.assayId',
  'rc1.name as resultCategory1Name',
  'rc1.i18nKey as resultCategory1I18nKey',
  'st.name as stateName',
  'si.name as siteName',
  'a.name as assayName',
  'a.i18nkey as assayI18nKey',
  'ca.externalId as caseExternalId',
  'dis.id as diseaseId',
  'dis.name as diseaseName',
  'dis.externalId as diseaseExternalId',
  'rca.requiresTreatment',
]

// Fields used for reports mtb-detected-rr-detected and results_hiv_not_suppressed
const REPORT_COMMON_FIELDS = [
  knex.raw('JSON_UNQUOTE(JSON_EXTRACT(r.patientData, "$.id")) as patientId'),
  'sp.externalId as sampleId',
  knex.raw('JSON_UNQUOTE(JSON_EXTRACT(r.patientData, "$.age")) as patientAge'),
  'd.name as deviceName',
  'r.notes',
  'rc1.name as resultCategory1Name',
  'rc2.name as resultCategory2Name',
  knex.raw(
    `IFNULL(JSON_UNQUOTE(JSON_EXTRACT(r.resultData, "$.resultText")), CONCAT(IFNULL(rc1.name, ''), '|', IFNULL(rc2.name, ''))) as resultText`
  ),
  'r.errorCode',
  knex.raw('JSON_UNQUOTE(JSON_EXTRACT(r.resultData, "$.copies")) as copies'),
  'ca.externalId as caseExternalId',
]

const SELECT_COMMON_FIELDS = [
  'r.id',
  'r.externalId',
  'r.deviceId',
  'd.name as deviceName',
  'd.serial as deviceSerial',
  knex.raw("CONCAT(dt.manufacturer, ' ', dt.name) as deviceType"),
  'at.name as assayType',
  'c.name as countryName',
  'st.name as stateName',
  'lg.name as lgaName',
  'rc1.name as resultCategory1Name',
  'rc2.name as resultCategory2Name',
  'rs.id as resultWorkflowStatusId',
  'rs.name as resultWorkflowStatus',
  'rs.externalId as resultWorkflowStatusExternalId',
  'rts.id as resultTreatmentStatusId',
  'rts.externalId as resultTreatmentStatus',
  'r.resultData',
  'r.formData',
  'r.siteId',
  'si.name as siteName',
  'r.assayVersion',
  'r.consumableSerial',
  'r.consumableLot',
  'r.instrumentSerial',
  'r.moduleName',
  'r.moduleSerial',
  'r.researchId',
  'r.senderVersion',
  'r.senderOperator',
  'r.notes',
  'r.errorCode',
  'r.errorNotes',
  'a.name as assayName',
  'r.assayId',
  'sp.externalId as sampleId',
  'r.sampleGroup',
  'sp.originSiteId as sampleOriginSiteId',
  'so.name as sampleOriginSiteName',
  'stp.name as sampleTypeName',
  knex.raw('JSON_UNQUOTE(JSON_EXTRACT(r.patientData, "$.id")) as patientId'),
  knex.raw(
    'GREATEST(IFNULL(rca.requiresTreatment,0), IFNULL(rca2.requiresTreatment,0)) as requiresTreatment'
  ),
  knex.raw(
    "case when GREATEST(IFNULL(rca.requiresTreatment,0), IFNULL(rca2.requiresTreatment,0)) = 0 then null else case when rts.externalId= 'OnTreatment' then 'ok' when rts.externalId = 'NotPossible' then 'na' when r.endedOn<DATE_SUB(NOW(),INTERVAL 32 DAY) then 'alert' when r.endedOn<=DATE_SUB(NOW(),INTERVAL 16 DAY) and r.endedOn>=DATE_SUB(NOW(),INTERVAL 32 DAY) then 'warning' else 'na' end end as treatmentStatusInfo"
  ),
  'r.patientData',
  'rsl.reason as resultWorkflowLogReason',
  'rsl.operator as resultWorkflowLogOperator',
  'rtsl.method as resultTreatmentMethod',
  'rtsl.data as resultTreatmentData',
  'rtsl.resultTreatmentStatusId',
  'r.reportableSiteId',
  'sirep.name as reportableSiteName',
  'ptr.name as transferredBy',
  'r.resultStatusLogId',
  'r.patientCaseId',
  'ca.externalId as caseExternalId',
  'dis.id as diseaseId',
  'dis.name as diseaseName',
  'dis.externalId as diseaseExternalId',
]

function getSelectShowFields(userTimeZone) {
  return [
    ...getSelectCommonListFields(userTimeZone),
    ...SELECT_SHOW_FIELDS_TIMEZONE_SAFE,
  ]
}

const SELECT_GX_MTB_CNT_BY_RESULT_CATEGORY = {
  errorRate: knex.raw(
    "ROUND(IFNULL(COUNT(r.id) / SUM(CASE WHEN rc1.externalId = 'Error' THEN 1 ELSE 0 END), 0), 2)"
  ),
  // Flat mtb cnt
  mtbNotDetected: knex.raw(
    "IFNULL(SUM(CASE WHEN rc1.externalId = 'NotDetected' THEN 1 ELSE 0 END), 0)"
  ),
  mtbDetected: knex.raw(
    "IFNULL(SUM(CASE WHEN rc1.externalId = 'Detected' THEN 1 ELSE 0 END), 0)"
  ),
  mtbNoResult: knex.raw(
    "IFNULL(SUM(CASE WHEN rc1.externalId = 'NoResult' THEN 1 ELSE 0 END), 0)"
  ),
  mtbInvalid: knex.raw(
    "IFNULL(SUM(CASE WHEN rc1.externalId = 'Invalid' THEN 1 ELSE 0 END), 0)"
  ),
  mtbError: knex.raw(
    "IFNULL(SUM(CASE WHEN rc1.externalId = 'Error' THEN 1 ELSE 0 END), 0)"
  ),
  mtbTraceDetected: knex.raw(
    "IFNULL(SUM(CASE WHEN rc1.externalId = 'Trace Detected' THEN 1 ELSE 0 END), 0)"
  ),
  // Flat rif cnt
  rifDetected: knex.raw(
    "IFNULL(SUM(CASE WHEN rc2.externalId = 'Detected' THEN 1 ELSE 0 END), 0)"
  ),
  rifNotDetected: knex.raw(
    "IFNULL(SUM(CASE WHEN rc2.externalId = 'NotDetected' THEN 1 ELSE 0 END), 0)"
  ),
  rifIndeterminate: knex.raw(
    "IFNULL(SUM(CASE WHEN rc2.externalId = 'Indeterminate' THEN 1 ELSE 0 END), 0)"
  ),

  // Flat groups cnt
  mtbDetectedRifNotDetected: knex.raw(
    "IFNULL(SUM(CASE WHEN rc1.externalId = 'Detected' AND rc2.externalId = 'NotDetected' THEN 1 ELSE 0 END), 0)"
  ),
  mtbDetectedRifDetected: knex.raw(
    "IFNULL(SUM(CASE WHEN rc1.externalId = 'Detected' AND rc2.externalId = 'Detected' THEN 1 ELSE 0 END), 0)"
  ),
  mtbDetectedRifIndeterminate: knex.raw(
    "IFNULL(SUM(CASE WHEN rc1.externalId = 'Detected' AND rc2.externalId = 'Indeterminate' THEN 1 ELSE 0 END), 0)"
  ),
  mtbTraceNoRif: knex.raw(
    "IFNULL(SUM(CASE WHEN rc1.externalId = 'Trace Detected' AND rc2.externalId = 'Indeterminate' THEN 1 ELSE 0 END), 0)"
  ),
  // Grouped mtb cnt
  mtbValid: knex.raw(
    "IFNULL(SUM(CASE WHEN rc1.externalId NOT IN ('NoResult', 'Indeterminate', 'Error', 'Invalid') THEN 1 ELSE 0 END), 0)"
  ),
  mtbInconclusive: knex.raw(
    "IFNULL(SUM(CASE WHEN rc1.externalId IN ('NoResult', 'Indeterminate', 'Error', 'Invalid') THEN 1 ELSE 0 END), 0)"
  ),
}

const SELECT_SHOW_FIELDS_TIMEZONE_SAFE = [
  'rf.formSchema',
  knex.raw('IFNULL(pa.canEdit, 0) AS canEdit'),
  knex.raw('IFNULL(pa.canDelete, 0) AS canDelete'),
  knex.raw(
    `IFNULL(JSON_UNQUOTE(JSON_EXTRACT(r.resultData, "$.resultText")), CONCAT(IFNULL(rc1.name, ''), '|', IFNULL(rc2.name, ''))) as resultText`
  ),
  'r.notes as resultNotes',
  'a.resultCategory1Label',
  'a.resultCategory2Label',
]
const SORT_FIELDS = [
  'endedOn',
  'deviceName',
  'sampleOriginSiteName',
  'stateName',
  'lgaName',
  'sampleId',
  'errorCode',
  'resultText',
  'resultWorkflowStatus',
  'treatmentStatusInfo',
  'resultTreatmentStatusChangedOn',
  'requiresTreatment',
  'resultCategory1Name',
  'resultCategory2Name',
  'patientId',
  'assayName',
]

const RESULT_STRING_TEMPLATE_FIELDS = [
  'p.plugin as partnerPlugin',
  's.externalId as siteExternalId',
  's.name as siteName',
  's.shortname as siteShortName',
  's.externalId as siteExternalId',
  'd.name as deviceName',
  'dt.externalId as deviceTypeExternalId',
  'd.lastSeenOn as deviceLastSeenOn',
  'd.lastPingOn as deviceLastPingOn',
  'r.resultData',
  'r.rawData as resultRawData',
  'r.formData as resultFormData',
  'r.patientData as resultPatientData',
  'r.startedOn as resultStartedOn',
  'r.endedOn as resultEndedOn',
  'r.notes as resultNotes',
  'r.consumableSerial',
  'r.consumableLot',
  'r.createdOn',
  'r.senderOperator',
  'r.moduleName as resultModuleName',
  'r.moduleSerial as resultModuleSerial',
  'r.errorCode as resultErrorCode',
  'r.errorNotes as resultErrorNotes',
  'r.id as resultId',
  'a.externalId as assayExternalId',
  'sample.id as sampleId',
  'sample.externalId as sampleExternalId',
  'sos.externalId as sampleOriginSiteExternalId',
  'sample.collectedOn as sampleCollectedOn',
  'rc1.externalId as resultCategory1ExternalId',
  'rc2.externalId as resultCategory2ExternalId',
  'a.resultSourceId',
  'at.diseaseId',
  'pa.reliableCaseExternalIdTemplate',
  'pa.unreliableCaseExternalIdTemplate',
  'pa.reliablePatientExternalIdTemplate',
  'pa.unreliablePatientExternalIdTemplate',
]

module.exports = {
  getListFields,
  getSelectCommonListFields,
  getReportCommonFields,
  getSelectShowFields,
  SORT_FIELDS,
  RESULT_STRING_TEMPLATE_FIELDS,
  SELECT_GX_MTB_CNT_BY_RESULT_CATEGORY,
}
