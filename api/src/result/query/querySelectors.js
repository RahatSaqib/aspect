const { knex } = require('../../db')
const { getDateTimeProjectionInTimeZoneIANA } = require('../../shared/date')

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
  referringSiteId: 'r.referringSiteId',
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
const getReportCommonFieldsTZ = timezoneIANA => ({
  patientId: knex.raw('JSON_UNQUOTE(JSON_EXTRACT(r.patientData, "$.id"))'),
  sampleId: 'sp.externalId',
  patientAge: knex.raw(
    `COALESCE(
    r.patientData ->> '$.PatientAge',
    r.patientData ->> '$.age')`
  ),
  deviceName: 'd.name',
  instrumentSerial: 'r.instrumentSerial',
  assayName: knex.raw(`r.resultData ->> '$.assay'`),
  notes: 'r.notes',
  resultCategory1Name: 'rc1.name',
  resultCategory2Name: 'rc2.name',
  resultText: knex.raw(
    `IFNULL(JSON_UNQUOTE(JSON_EXTRACT(r.resultData, "$.resultText")), CONCAT(IFNULL(rc1.name, ''), '|', IFNULL(rc2.name, '')))`
  ),
  errorCode: 'r.errorCode',
  copies: knex.raw('JSON_UNQUOTE(JSON_EXTRACT(r.resultData, "$.copies"))'),
  caseExternalId: 'ca.externalId',
  endedOn: getDateTimeProjectionInTimeZoneIANA(knex, 'r.endedOn', timezoneIANA),
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
  patientId: knex.raw(`
    COALESCE(
      JSON_UNQUOTE(JSON_EXTRACT(r.patientData, "$.id")),
      JSON_UNQUOTE(JSON_EXTRACT(sp.sampleData, "$.patientExternalId"))
    )
  `),
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
  mtbDetectedTraceDetected: knex.raw(
    "IFNULL(SUM(CASE WHEN rc1.externalId IN ('Detected', 'Trace Detected') THEN 1 ELSE 0 END), 0)"
  ),
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
    "IFNULL(SUM(CASE WHEN rc1.externalId NOT IN ('NoResult', 'Error', 'Invalid') THEN 1 ELSE 0 END), 0) - IFNULL(SUM(CASE WHEN rc2.externalId = 'Indeterminate' THEN 1 ELSE 0 END), 0)"
  ),
  mtbValidWithIndeterminate: knex.raw(
    "IFNULL(SUM(CASE WHEN rc1.externalId NOT IN ('NoResult', 'Error', 'Invalid') THEN 1 ELSE 0 END), 0)"
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

const getResultCategoryGroupSumSelector = (assayId, rc1, rc2) => {
  let query = `IFNULL(SUM(CASE WHEN r.assayId IN (${assayId}) AND r.resultCategory1 = ${rc1} `

  if (rc2) {
    query += `AND r.resultCategory2 = ${rc2} `
  } else {
    query += `AND r.resultCategory2 IS NULL `
  }

  query += 'THEN 1 ELSE 0 END), 0)'

  return knex.raw(query)
}

const getResultXdrResistanceSumSelector = resistance => {
  return knex.raw(`SUM(
      CASE WHEN
        JSON_SEARCH(
          r.resultData ->> '$.detectedResistance[*]',
          'one',
          '${resistance}'
        ) IS NOT NULL
      THEN 1 ELSE 0 END)`)
}

const SELECT_FIELDS_FOR_DATA_EXTRACT_REPORT = {
  id: 'r.id',
  TestDate: knex.raw('COALESCE(r.endedOn, r.startedOn)'),
  SampleId: 'r.sampleId',
  StartedOn: 'r.startedOn',
  EndedOn: 'r.endedOn',
  Assay: 'a.name',
  AssayVersion: 'r.assayVersion',
  Result1: 'rc1.name',
  Result2: 'rc2.name',
  resultText: knex.raw(
    `IFNULL(JSON_UNQUOTE(JSON_EXTRACT(r.resultData, "$.resultText")), CONCAT(IFNULL(rc1.name, ''), '|', IFNULL(rc2.name, '')))`
  ),
  PatientAgeYears: knex.raw(
    `COALESCE(
      JSON_VALUE(r.patientData, "$.age" RETURNING CHAR),
      JSON_VALUE(r.patientData, "$.PatientAge" RETURNING CHAR)
    )`
  ),
  PatientAgeMonths: knex.raw(
    `TIMESTAMPDIFF(
      MONTH,
      JSON_VALUE(r.patientData, "$.Dob" RETURNING DATE),
      sysdate()
    )`
  ),
  PatientPhone: knex.raw(
    `COALESCE(
      JSON_VALUE(r.patientData, "$.phone" RETURNING CHAR),
      JSON_VALUE(r.patientData, "$.patientPhone"  RETURNING CHAR)
    )`
  ),
  PatientName: knex.raw(
    `COALESCE(
      JSON_VALUE(r.patientData, "$.name"  RETURNING CHAR),
      JSON_VALUE(r.patientData, "$.patientName"  RETURNING CHAR)
    )`
  ),
  PatientStreet: knex.raw(
    `COALESCE(
      JSON_VALUE(r.patientData, "$.street" RETURNING CHAR),
      JSON_VALUE(r.patientData, "$.patientStreet"  RETURNING CHAR)
    )`
  ),
  PatientCity: knex.raw(
    `COALESCE(
      JSON_VALUE(r.patientData, "$.city" RETURNING CHAR),
      JSON_VALUE(r.patientData, "$.patientCity" RETURNING CHAR)
    )`
  ),
  PatientState: 'stateo.name',
  PatientLga: 'lgao.name',
  HivStatus: knex.raw(
    `case
      when dis.externalId <> 'hiv' then
        JSON_VALUE(r.patientData, '$.hivStatus' RETURNING CHAR)
      else 'N/A'
    end`
  ),
  /**
   * Note: PreviouslyTreated has less data than GxAlert,
   * for example 'OnTreatment' or 'N/A'
   */
  PreviouslyTreated: knex.raw(
    `CASE
      WHEN IFNULL( JSON_VALUE(r.patientData, '$.previouslyTreated' RETURNING CHAR), '') IN ('Yes', 'true') THEN 'Yes'
      ELSE 'No'
    END`
  ),
  Gender: knex.raw(
    `COALESCE(
      JSON_VALUE(r.patientData, '$.gender' RETURNING CHAR),
      JSON_VALUE(r.patientData, '$.patientGender' RETURNING CHAR)
    )`
  ),
  // microscopyResult only seems to exists in dev seeding
  MicroscopyResult: knex.raw(`JSON_VALUE(r.patientData, '$.microscopyResult' RETURNING CHAR)`),
  RepeatTest: knex.raw(
    `CASE JSON_VALUE(r.patientData, '$.repeatTest' RETURNING CHAR)
      WHEN '0' THEN 'First or second'
      WHEN '1' THEN 'Follow-up'
      WHEN '2' THEN 'Repeat Baseline'
      ELSE NULL
    END`
  ),
  // testReasonShortName seems to be always null in resultData
  TestReason: knex.raw('JSON_VALUE(r.resultData, "$.testReasonShortName" RETURNING CHAR)'),
  // HealthFacility custom field seems to be in declared for zw, but no present: JSON_VALUE(r.patientData, '$.healthFacility' RETURNING CHAR) as HealthFacility,
  HealthFacility: 'so.name',
  // RequestorName only seems to exists in dev seeding lesotho, ethiopia and mozambique (in customFieldsFromGxAlert)
  RequestorName: knex.raw(`JSON_VALUE(r.patientData, '$.requestorName' RETURNING CHAR)`),
  RequestorPhone: knex.raw(`JSON_VALUE(r.patientData, '$.requestorPhone' RETURNING CHAR)`),
  errorCode: knex.raw('REGEXP_REPLACE(r.errorCode,"(\\r\\n|\\n|\\r)"," ")'),
  ErrorDescription: knex.raw('REGEXP_REPLACE(r.errorNotes,"(\\r\\n|\\n|\\r)"," ")'),
  AssayName: 'a.name',
  AssayHostTestCode: 'r.assayVersion',
  InsertedOn: 'r.createdOn',
  updatedOn: 'r.updatedOn',
  consumableLot: 'r.consumableLot',
  instrumentSerial: 'r.instrumentSerial',
  moduleSerial: 'r.moduleSerial',
  cartridgeSerial: 'r.consumableSerial',
  cartridgeExpirationDate: 'r.consumableExpirationDate',
  senderVersion: 'r.senderVersion',
  SenderIp: 'd.lastPingFromIp',
  MetacomIp: knex.raw(
    `CASE
      WHEN d.lastPingFromIp LIKE '169.255%' THEN 'Yes'
      ELSE 'No'
    END`
  ),
  ProbeA: knex.raw(`JSON_VALUE(r.resultData, '$.probes.probeA' RETURNING CHAR)`),
  ProbeB: knex.raw(`JSON_VALUE(r.resultData, '$.probes.probeB' RETURNING CHAR)`),
  ProbeC: knex.raw(`JSON_VALUE(r.resultData, '$.probes.probeC' RETURNING CHAR)`),
  ProbeD: knex.raw(`JSON_VALUE(r.resultData, '$.probes.probeD' RETURNING CHAR)`),
  ProbeE: knex.raw(`JSON_VALUE(r.resultData, '$.probes.probeE' RETURNING CHAR)`),
  ProbeSpc: knex.raw(`JSON_VALUE(r.resultData, '$.probes.probeSpc' RETURNING CHAR)`),
  Qc1: knex.raw(`JSON_VALUE(r.resultData, '$.probes.qc1' RETURNING CHAR)`),
  Qc2: knex.raw(`JSON_VALUE(r.resultData, '$.probes.qc2' RETURNING CHAR)`),
  ProbeACt: knex.raw(`JSON_VALUE(r.resultData, '$.probes.probeACt' RETURNING CHAR)`),
  ProbeBCt: knex.raw(`JSON_VALUE(r.resultData, '$.probes.probeBCt' RETURNING CHAR)`),
  ProbeCCt: knex.raw(`JSON_VALUE(r.resultData, '$.probes.probeCCt' RETURNING CHAR)`),
  ProbeDCt: knex.raw(`JSON_VALUE(r.resultData, '$.probes.probeDCt' RETURNING CHAR)`),
  ProbeECt: knex.raw(`JSON_VALUE(r.resultData, '$.probes.probeECt' RETURNING CHAR)`),
  ProbeSpcCt: knex.raw(`JSON_VALUE(r.resultData, '$.probes.probeSpcCt' RETURNING CHAR)`),
  Qc1Ct: knex.raw(`JSON_VALUE(r.resultData, '$.probes.qc1Ct' RETURNING CHAR)`),
  Qc2Ct: knex.raw(`JSON_VALUE(r.resultData, '$.probes.qc2Ct' RETURNING CHAR)`),
  ProbeAEndpt: knex.raw(`JSON_VALUE(r.resultData, '$.probes.probeAEndpt' RETURNING CHAR)`),
  ProbeBEndpt: knex.raw(`JSON_VALUE(r.resultData, '$.probes.probeBEndpt' RETURNING CHAR)`),
  ProbeCEndpt: knex.raw(`JSON_VALUE(r.resultData, '$.probes.probeCEndpt' RETURNING CHAR)`),
  ProbeDEndpt: knex.raw(`JSON_VALUE(r.resultData, '$.probes.probeDEndpt' RETURNING CHAR)`),
  ProbeEEndpt: knex.raw(`JSON_VALUE(r.resultData, '$.probes.probeEEndpt' RETURNING CHAR)`),
  ProbeSpcEndpt: knex.raw(`JSON_VALUE(r.resultData, '$.probes.probeSpcEndpt' RETURNING CHAR)`),
  Qc1Endpt: knex.raw(`JSON_VALUE(r.resultData, '$.probes.qc1Endpt' RETURNING CHAR)`),
  Qc2Endpt: knex.raw(`JSON_VALUE(r.resultData, '$.probes.qc2Endpt' RETURNING CHAR)`),
  Notes: knex.raw('REGEXP_REPLACE(r.notes,"(\\r\\n|\\n|\\r)"," ")'),
  Country: 'c.name',
  State: 'st.name',
  Lga: 'lg.name',
  DateFirstTest: 'firstResult.minDate',
  DeviceName: 'd.name',
  User: 'r.senderOperator',
  latitude: 'si.latitude',
  longitude: 'si.longitude',
}

const getFieldsForQuarterlyReport = timezoneIANA => {
  return {
    id: 'r.id',
    patientId: knex.raw(`r.patientData ->> '$.id'`),
    sampleId: 'sp.externalId',
    sampleType: knex.raw(`COALESCE(r.patientData ->> '$.SampleType', stp.name)`),
    testDate: getDateTimeProjectionInTimeZoneIANA(knex, 'COALESCE(r.endedOn, r.startedOn)', timezoneIANA),
    startedOn: getDateTimeProjectionInTimeZoneIANA(knex, 'r.startedOn', timezoneIANA),
    endedOn: getDateTimeProjectionInTimeZoneIANA(knex, 'r.endedOn', timezoneIANA),
    deviceName: 'd.name',
    assay: 'a.name',
    assayVersion: 'r.assayVersion',
    result1: 'rc1.name',
    result2: 'rc2.name',
    resultText: knex.raw(
      `IFNULL(
        r.resultData ->> '$.resultText',
        CONCAT(  IFNULL(rc1.name, ''), '|', IFNULL(rc2.name, '')  )
      )`
    ),
    /**
     * see `api/src/forms/formsDefinition/CustomFields_Myanmar.json`
     */
    patientAgeYears: knex.raw(
      `CAST(
        COALESCE(
          r.patientData ->> '$.PatientAge',
          r.patientData ->> '$.age'
        ) AS UNSIGNED
      )`
    ),
    patientName: knex.raw(
      `COALESCE(
        r.patientData ->> '$.name',
        r.patientData ->> '$.patientName'
      )`
    ),
    patientStreet: knex.raw(
      `COALESCE(
        r.patientData ->> '$.street',
        r.patientData ->> '$.patientStreet'
      )`
    ),
    /**
     * see `api/src/forms/formsDefinition/CustomFields_Myanmar.json`
     */
    patientCity: knex.raw(
      `COALESCE(
        r.patientData ->> '$.PatientTownship',
        r.patientData ->> '$.city',
        r.patientData ->> '$.patientCity'
      )`
    ),
    /**
     * see `api/src/forms/formsDefinition/CustomFields_Myanmar.json`
     */
    hivStatus: knex.raw(
      `case
      when dis.externalId <> 'hiv' then
        COALESCE(
          r.patientData ->> '$.HIVStatus',
          r.patientData ->> '$.hivStatus',
          r.patientData ->> '$.HivStatus'
        )
      else 'N/A'
    end`
    ),
    /**
     * see `api/src/forms/formsDefinition/CustomFields_Myanmar.json`
     * Note: PreviousTreatmentHistory has more options than in GxAlert,
     * so - map values in Aspect to values in GxAlert to use same formulas as in GxAlert
     */
    previouslyTreated: knex.raw(
      `CASE r.patientData ->> '$.PreviousTreatmentHistory'
        WHEN 'Previously Treated' THEN 'Yes'
        WHEN 'No Previous Treatment' THEN 'No'
        WHEN 'On Treatment' THEN 'No'
        WHEN 'Unknown' THEN 'Unknown'
        ELSE 'N/A'
      END`
    ),
    /**
     * see `api/src/forms/formsDefinition/CustomFields_Myanmar.json`
     */
    gender: knex.raw(`
       COALESCE(
        r.patientData ->> '$.PatientGender',
        r.patientData ->> '$.gender',
        r.patientData ->> '$.patientGender'
      )`),
    /**
     * see `api/src/forms/formsDefinition/CustomFields_Myanmar.json`
     */
    microscopyResult: knex.raw(
      `COALESCE(
        r.patientData ->> '$.MicroscopyResult',
        r.patientData ->> '$.microscopyResult'
      )`
    ),
    /**
     * hmm, we do not have such custom field in Myanmar.
     * But still leave this here.
     * TODO: discuss with PO about this custom field
     */
    repeatTest: knex.raw(
      `CASE JSON_VALUE(r.patientData, '$.repeatTest')
        WHEN '0' THEN 'First or second'
        WHEN '1' THEN 'Follow-up'
        WHEN '2' THEN 'Repeat Baseline'
        ELSE NULL
      END`
    ),
    /**
     * see `api/src/forms/formsDefinition/CustomFields_Myanmar.json`
     */
    testReason: knex.raw(`r.patientData ->> '$.MMTestReason'`),

    /**
     * see `api/src/forms/formsDefinition/CustomFields_Myanmar.json`
     */
    notes: knex.raw(
      `COALESCE(
        REGEXP_REPLACE(r.notes,"(\\r\\n|\\n|\\r)"," "),
        REGEXP_REPLACE(r.patientData ->> "$.OtherNotes", "(\\r\\n|\\n|\\r)"," ")
      )`
    ),

    errorCode: knex.raw('REGEXP_REPLACE(r.errorCode,"(\\r\\n|\\n|\\r)"," ")'),
    errorNotes: knex.raw('REGEXP_REPLACE(r.errorNotes,"(\\r\\n|\\n|\\r)"," ")'),

    tag: 'tags.tagsCsv',

    healthFacility: 'so.name',

    assayName: 'a.name',
    assayHostTestCode: 'r.assayVersion',
    insertedOn: getDateTimeProjectionInTimeZoneIANA(knex, 'r.createdOn', timezoneIANA),
    updatedOn: getDateTimeProjectionInTimeZoneIANA(knex, 'r.updatedOn', timezoneIANA),
    consumableLot: 'r.consumableLot',
    instrumentSerial: 'r.instrumentSerial',
    moduleSerial: 'r.moduleSerial',
    cartridgeSerial: 'r.consumableSerial',
    cartridgeExpirationDate: 'r.consumableExpirationDate',
    senderVersion: 'r.senderVersion',
    senderIp: 'd.lastPingFromIp',

    country: 'c.name',
    state: 'st.name',
    lga: 'lg.name',
  }
}

module.exports = {
  getReportCommonFieldsTZ,
  COMMON_LIST_FIELDS_UTC,
  SELECT_FIELDS_UTC,
  LIST_FIELDS_UTC,
  SORT_FIELDS,
  RESULT_STRING_TEMPLATE_FIELDS,
  SELECT_GX_MTB_CNT_BY_RESULT_CATEGORY,
  SELECT_FIELDS_FOR_DATA_EXTRACT_REPORT,

  getResultCategoryGroupSumSelector,
  getResultXdrResistanceSumSelector,
  getFieldsForQuarterlyReport,
}
