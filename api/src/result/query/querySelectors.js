const { knex } = require('../../db')
const { getDateTimeProjectionInUserTimeZone } = require('../../shared/date')

const COMMON_LIST_FIELDS_UTC = {
  id: 'r.id',
  externalId: 'r.externalId',
  deviceId: 'r.deviceId',
  deviceName: 'd.name',
  deviceSerial: 'd.serial',
  deviceType: knex.raw("CONCAT(dt.manufacturer, ' ', dt.name)"),
  assayType: 'at.name',
  countryName: 'c.name',
  stateName: 'st.name',
  lgaName: 'lg.name',
  resultCategory1Name: 'rc1.name',
  resultCategory2Name: 'rc2.name',
  resultWorkflowStatusId: 'rs.id',
  resultWorkflowStatus: 'rs.name',
  resultWorkflowStatusExternalId: 'rs.externalId',
  resultTreatmentStatus: 'rts.externalId',
  resultData: 'r.resultData',
  formData: 'r.formData',
  siteId: 'r.siteId',
  siteName: 'si.name',
  assayVersion: 'r.assayVersion',
  consumableSerial: 'r.consumableSerial',
  consumableLot: 'r.consumableLot',
  instrumentSerial: 'r.instrumentSerial',
  moduleName: 'r.moduleName',
  moduleSerial: 'r.moduleSerial',
  researchId: 'r.researchId',
  senderVersion: 'r.senderVersion',
  senderOperator: 'r.senderOperator',
  notes: 'r.notes',
  errorCode: 'r.errorCode',
  errorNotes: 'r.errorNotes',
  assayName: 'a.name',
  assayId: 'r.assayId',
  sampleId: 'sp.externalId',
  sampleGroup: 'r.sampleGroup',
  sampleOriginSiteId: 'sp.originSiteId',
  sampleOriginSiteName: 'so.name',
  sampleTypeName: 'stp.name',
  patientId: knex.raw('JSON_UNQUOTE(JSON_EXTRACT(r.patientData, "$.id"))'),
  requiresTreatment: knex.raw('GREATEST(IFNULL(rca.requiresTreatment,0), IFNULL(rca2.requiresTreatment,0))'),
  treatmentStatusInfo: knex.raw(
    "case when GREATEST(IFNULL(rca.requiresTreatment,0), IFNULL(rca2.requiresTreatment,0)) = 0 then null else case when rts.externalId= 'OnTreatment' then 'ok' when rts.externalId = 'NotPossible' then 'na' when r.endedOn<DATE_SUB(NOW(),INTERVAL 32 DAY) then 'alert' when r.endedOn<=DATE_SUB(NOW(),INTERVAL 16 DAY) and r.endedOn>=DATE_SUB(NOW(),INTERVAL 32 DAY) then 'warning' else 'na' end end"
  ),
  patientData: 'r.patientData',
  resultWorkflowLogReason: 'rsl.reason',
  resultWorkflowLogOperator: 'rsl.operator',
  resultTreatmentMethod: 'rtsl.method',
  resultTreatmentData: 'rtsl.data',
  resultTreatmentStatusId: 'rtsl.resultTreatmentStatusId',
  reportableSiteId: 'r.reportableSiteId',
  reportableSiteName: 'sirep.name',
  transferredBy: 'ptr.name',
  resultStatusLogId: 'r.resultStatusLogId',
  patientCaseId: 'r.patientCaseId',
  caseExternalId: 'ca.externalId',
  diseaseId: 'dis.id',
  diseaseName: 'dis.name',
  diseaseExternalId: 'dis.externalId',
  // datetime fields UTC:
  startedOn: 'r.startedOn',
  endedOn: 'r.endedOn',
  resultWorkflowChangedOn: 'rsl.changedOn',
  consumableExpirationDate: 'r.consumableExpirationDate',
  createdOn: 'r.createdOn',
  updatedOn: 'r.updatedOn',
  sampleCollectedOn: 'sp.collectedOn',
  resultWorkflowLogCreatedOn: 'rsl.createdOn',
  resultWorkflowLogChangedOn: 'rsl.changedOn',
  resultTreatmentStatusChangedOn: 'rtsl.changedOn',
  transferredOn: 'rslog.createdOn',
  firstViewedOn: 'r.firstViewedOn',
}

/**
 * Knex projection for reports mtb-detected-rr-detected and results_hiv_not_suppressed
 * @param {string} userTimeOffset
 * @returns Knex projection
 */
const getReportCommonFieldsTZ = userTimeOffset => ({
  patientId: knex.raw('JSON_UNQUOTE(JSON_EXTRACT(r.patientData, "$.id"))'),
  sampleId: 'sp.externalId',
  patientAge: knex.raw('JSON_UNQUOTE(JSON_EXTRACT(r.patientData, "$.age"))'),
  deviceName: 'd.name',
  notes: 'r.notes',
  resultCategory1Name: 'rc1.name',
  resultCategory2Name: 'rc2.name',
  resultText: knex.raw(
    `IFNULL(JSON_UNQUOTE(JSON_EXTRACT(r.resultData, "$.resultText")), CONCAT(IFNULL(rc1.name, ''), '|', IFNULL(rc2.name, '')))`
  ),
  errorCode: 'r.errorCode',
  copies: knex.raw('JSON_UNQUOTE(JSON_EXTRACT(r.resultData, "$.copies"))'),
  caseExternalId: 'ca.externalId',
  endedOn: getDateTimeProjectionInUserTimeZone(knex, 'r.endedOn', userTimeOffset),
})

/**
 * Knex projection for use in @see {service.getResultsForExport}, which is used to export results to a CSV file
 * @param {string} userTimeOffset
 * @returns Projection to be used in query with datetime fields on specified time zone
 */
const getSelectCommonListFieldsTZ = userTimeOffset => ({
  ...COMMON_LIST_FIELDS_UTC,
  // override datetime fields with user time offset:
  startedOn: getDateTimeProjectionInUserTimeZone(knex, 'r.startedOn', userTimeOffset),
  endedOn: getDateTimeProjectionInUserTimeZone(knex, 'r.endedOn', userTimeOffset),
  resultWorkflowChangedOn: getDateTimeProjectionInUserTimeZone(knex, 'rsl.changedOn', userTimeOffset),
  consumableExpirationDate: getDateTimeProjectionInUserTimeZone(knex, 'r.consumableExpirationDate', userTimeOffset),
  createdOn: getDateTimeProjectionInUserTimeZone(knex, 'r.createdOn', userTimeOffset),
  updatedOn: getDateTimeProjectionInUserTimeZone(knex, 'r.updatedOn', userTimeOffset),
  sampleCollectedOn: getDateTimeProjectionInUserTimeZone(knex, 'sp.collectedOn', userTimeOffset),
  resultWorkflowLogCreatedOn: getDateTimeProjectionInUserTimeZone(knex, 'rsl.createdOn', userTimeOffset),
  resultWorkflowLogChangedOn: getDateTimeProjectionInUserTimeZone(knex, 'rsl.changedOn', userTimeOffset),
  resultTreatmentStatusChangedOn: getDateTimeProjectionInUserTimeZone(knex, 'rtsl.changedOn', userTimeOffset),
  transferredOn: getDateTimeProjectionInUserTimeZone(knex, 'rslog.createdOn', userTimeOffset),
  firstViewedOn: getDateTimeProjectionInUserTimeZone(knex, 'r.firstViewedOn', userTimeOffset),
})

/**
 * Knex projection to be shown in the UI result list
 */
const LIST_FIELDS_UTC = {
  id: 'r.id',
  endedOn: knex.raw('IFNULL(r.endedOn, r.startedOn)'),
  externalId: 'r.externalId',
  deviceName: 'd.name',
  sampleOriginSiteName: 'so.name',
  sampleId: 'sp.externalId',
  resultText: knex.raw(
    `IFNULL(JSON_UNQUOTE(JSON_EXTRACT(r.resultData, "$.resultText")), CONCAT(IFNULL(rc1.name, ''), '|', IFNULL(rc2.name, '')))`
  ),
  errorCode: 'r.errorCode',
  resultWorkflowStatus: 'rs.name',
  resultWorkflowStatusI18nkey: 'rs.i18nkey',
  resultTreatmentStatus: 'rts.externalId',
  resultTreatmentStatusI18nKey: knex.raw(
    "CASE WHEN GREATEST(IFNULL(rca.requiresTreatment,0), IFNULL(rca2.requiresTreatment,0)) = 0 THEN NULL ELSE CASE WHEN rts.i18nKey IS NOT NULL THEN rts.i18nKey ELSE 'ResultTreatmentStatusNotAvailable' END END"
  ),
  treatmentStatusInfo: knex.raw(
    "case when GREATEST(IFNULL(rca.requiresTreatment,0), IFNULL(rca2.requiresTreatment,0)) = 0 then null else case when rts.externalId= 'OnTreatment' then 'ok' when rts.externalId = 'NotPossible' then 'na' when r.endedOn<DATE_SUB(NOW(),INTERVAL 32 DAY) then 'alert' when r.endedOn<=DATE_SUB(NOW(),INTERVAL 16 DAY) and r.endedOn>=DATE_SUB(NOW(),INTERVAL 32 DAY) then 'warning' else 'na' end end"
  ),
  patientId: knex.raw('JSON_UNQUOTE(JSON_EXTRACT(r.patientData, "$.id"))'),
  assayId: 'r.assayId',
  resultCategory1Name: 'rc1.name',
  resultCategory1I18nKey: 'rc1.i18nKey',
  stateName: 'st.name',
  siteName: 'si.name',
  assayName: 'a.name',
  assayI18nKey: 'a.i18nkey',
  caseExternalId: 'ca.externalId',
  diseaseId: 'dis.id',
  diseaseName: 'dis.name',
  diseaseExternalId: 'dis.externalId',
  requiresTreatment: 'rca.requiresTreatment',
}

/**
 * Knex result projection for use in @see {service.getResultByResultId}, excluding exports and reports. Datetime fields are in UTC.
 */
const SELECT_FIELDS_UTC = {
  ...COMMON_LIST_FIELDS_UTC,
  ...{
    formSchema: 'rf.formSchema',
    canEdit: knex.raw('IFNULL(pa.canEdit, 0)'),
    canDelete: knex.raw('IFNULL(pa.canDelete, 0)'),
    resultText: knex.raw(
      `IFNULL(JSON_UNQUOTE(JSON_EXTRACT(r.resultData, "$.resultText")), CONCAT(IFNULL(rc1.name, ''), '|', IFNULL(rc2.name, '')))`
    ),
    resultNotes: 'r.notes',
    resultCategory1Label: 'a.resultCategory1Label',
    resultCategory2Label: 'a.resultCategory2Label',
  },
}

const SELECT_GX_MTB_CNT_BY_RESULT_CATEGORY = {
  errorRate: knex.raw("ROUND(IFNULL(COUNT(r.id) / SUM(CASE WHEN rc1.externalId = 'Error' THEN 1 ELSE 0 END), 0), 2)"),
  // Flat mtb cnt
  mtbNotDetected: knex.raw("IFNULL(SUM(CASE WHEN rc1.externalId = 'NotDetected' THEN 1 ELSE 0 END), 0)"),
  mtbDetected: knex.raw("IFNULL(SUM(CASE WHEN rc1.externalId = 'Detected' THEN 1 ELSE 0 END), 0)"),
  mtbNoResult: knex.raw("IFNULL(SUM(CASE WHEN rc1.externalId = 'NoResult' THEN 1 ELSE 0 END), 0)"),
  mtbInvalid: knex.raw("IFNULL(SUM(CASE WHEN rc1.externalId = 'Invalid' THEN 1 ELSE 0 END), 0)"),
  mtbError: knex.raw("IFNULL(SUM(CASE WHEN rc1.externalId = 'Error' THEN 1 ELSE 0 END), 0)"),
  mtbTraceDetected: knex.raw("IFNULL(SUM(CASE WHEN rc1.externalId = 'Trace Detected' THEN 1 ELSE 0 END), 0)"),
  // Flat rif cnt
  rifDetected: knex.raw("IFNULL(SUM(CASE WHEN rc2.externalId = 'Detected' THEN 1 ELSE 0 END), 0)"),
  rifNotDetected: knex.raw("IFNULL(SUM(CASE WHEN rc2.externalId = 'NotDetected' THEN 1 ELSE 0 END), 0)"),
  rifIndeterminate: knex.raw("IFNULL(SUM(CASE WHEN rc2.externalId = 'Indeterminate' THEN 1 ELSE 0 END), 0)"),

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

  mtbNoResultInvalidIndeterminate: knex.raw(
    "IFNULL(SUM(CASE WHEN rc1.externalId IN ('NoResult', 'Invalid', 'Indeterminate') THEN 1 ELSE 0 END), 0)"
  ),
  mtbErrorByCode: errorCode =>
    knex.raw(`IFNULL(SUM(CASE WHEN rc1.externalId = 'Error' and r.errorCode = '${errorCode}' THEN 1 ELSE 0 END), 0)`),
  mtbOtherErrorsNotIn: errorCodesCsv =>
    knex.raw(`IFNULL(SUM(CASE 
    WHEN rc1.externalId = 'Error' AND
      (
        r.errorCode IS NULL OR r.errorCode NOT IN (${errorCodesCsv})
      ) 
    THEN 1 ELSE 0 END), 0)`),
}

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

// ----------------
const caseCondition = (id, condition) =>
  knex.raw(`
      DISTINCT
      CASE
        WHEN ${condition}
        THEN ${id}
        ELSE null
      END
    `)

// ----------------
const countXdr = xdrResistanceValue =>
  caseCondition(
    'r.id',
    `
      JSON_SEARCH(
        r.resultData ->> '$.detectedResistance[*]',
        'one',
        '${xdrResistanceValue}'
      ) IS NOT NULL
    `
  )

module.exports = {
  getSelectCommonListFieldsTZ,
  getReportCommonFieldsTZ,
  SELECT_FIELDS_UTC,
  LIST_FIELDS_UTC,
  SORT_FIELDS,
  RESULT_STRING_TEMPLATE_FIELDS,
  SELECT_GX_MTB_CNT_BY_RESULT_CATEGORY,

  caseCondition,
  countXdr,
}
