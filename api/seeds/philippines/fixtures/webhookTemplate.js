const genderValueMap = { Male: 'M', Female: 'F' }
const postTreatmentReasonForExaminationCodes = {
  1: '938563',
  2: '938564',
  3: '938565',
  4: '938566',
}
const monthOfTreatmentReasonForExaminationCodes = {
  1: '938496',
  2: '938497',
  3: '938498',
  4: '938499',
  5: '938500',
  6: '938501',
  7: '938502',
  8: '938503',
  9: '938504',
  10: '938505',
  11: '938506',
  12: '938507',
  13: '938508',
  14: '938509',
  15: '938510',
  16: '938511',
  17: '938512',
  18: '938513',
  19: '938514',
  20: '938515',
  21: '938516',
  22: '938517',
  23: '938518',
  24: '938519',
  25: '938520',
  26: '938521',
  27: '938522',
  28: '938523',
  29: '938524',
  30: '938525',
  31: '938526',
  32: '938558',
  33: '938559',
  34: '938560',
  35: '938561',
  36: '938562',
  37: '938677',
  38: '938730',
  39: '938731',
  40: '938732',
}
const registrationGroupCodes = {
  New: '938610',
  NEW: '938610',
  RELAPSE: '938611',
  TALF: '938613',
  'TX AFTER LOST TO FF-UP': '938613',
  'TX AFTER FAILURE': '938614',
  TAF: '938614',
  PTOU: '938615',
  'PREVIOUS TX OUTCOME UNKNOWN': '938615',
  OTHER: '938616',
}
const specimenTypeCodes = { Sputum: '0', Isolates: '1', Others: '1' }
const repeatCollectionCodes = { Yes: '1', No: '0' }
const presumptiveTbDsDrCodes = {
  'Presumptive DS-TB': '0',
  'Presumptive DR-TB': '1',
}
const visualAppearanceCodes = {
  'Muco-purulent': '938638',
  'Blood-stained': '938639',
  Salivary: '938640',
  Mucosalivary: '938672',
  Purulent: '938891',
}
const examTypes = {
  assaySmear: 'DSSM',
  GxMtbRif: 'XPERT_MTBRIF',
  GxMtbRifUltra: 'XPERT_MTBRIF',
  assayTbLamp: 'TB_LAMP',
  assayGenericCulture: 'CULTURE',
  assayBdMgitGnd: 'CULTURE',
  assayBdMgitAst: 'DST',
  assayGenericDst: 'DST',
  assayLPA: 'LPA',
}
const smearResultCodeMappings = {
  NotDetected: '0',
  Positive1: '2',
  Positive2: '3',
  Positive3: '4',
  Missing: '6',
}
const xpertResultCodeMappings = {
  NotDetected: '0',
  Detected: '1',
  'Trace Detected': '1',
  Indeterminate: '2',
  Invalid: '2',
  NoResult: '2',
  Error: '2',
}
const xpertRifResultCodeMappings = {
  Detected: '1',
  Error: '4',
  Indeterminate: '7',
}
const tbLampResultCodeMappings = { Negative: '0', Positive: '1' }
const cultureResultCodeMappings = {
  NotDetected: '0',
  Detected: '1',
  PositiveMTB: '1',
  PositiveMOTT: '2',
  Contaminated: '3',
  Missing: '4',
  Unknown: '4',
}
const mgitSireStatusToEncodedMappings = { R: 'RESISTANT', S: 'SUSCEPTIBLE' }
const dstResultCodeMappings = {
  'NOT DONE': 'ND',
  'NON VIABLE': 'ND',
  RESISTANT: '1',
  SUSCEPTIBLE: '2',
  CONTAMINATED: '4',
}
const lpaMtbResultCodeMappings = {
  NotDetected: '0',
  PositiveMTB: '1',
  Invalid: '2',
}
const lpaHighLowResistanceCodeMappings = {
  'Resistance not detected': '0',
  'Low-level resistance detected': '1',
  'High-level resistance detected': '2',
}
const lpaResistanceCodeMappings = {
  'Resistance Not Detected': '0',
  'Resistance Detected': '1',
}
const itisDateFormat = 'yyyy-MM-dd'
const okResponseSuccessRegex = '(Add|Update)\\sTB\\sExam\\ssuccessfully'
const itisWebhookTemplate = {
  externalId: 'itisPushTbExam',
  method: 'GET',
  url:
    `http://itis.doh.gov.ph:3005/pushtbexam/gX%40leR%2B%21Ti%24` +
    `/TB_CASE_NUMBER/{{urlEncode (defaultTo (coalesce result.patient.tbCaseNumber result.patient.id) 'NULL')}}` +
    `/SPECIMEN_CODE/{{urlEncode (defaultTo result.sample.id 'NULL')}}` +
    `/REQUESTING_FACILITY/{{urlEncode (defaultTo (coalesce result.sample.originSite.id result.patient.referringHealthFacility) 'NULL')}}` +
    `/DATE_OF_REQUEST/{{urlEncode (defaultTo (formatDate result.patient.mrfDateRequested formatString='${itisDateFormat}') 'NULL')}}` +
    `/FACILITY_CONTACT/{{urlEncode (defaultTo result.patient.facilityContactNumber 'NULL')}}` +
    `/REQUESTING_PHYSICIAN/{{urlEncode (defaultTo result.patient.requestingPhysician 'NULL')}}` +
    `/PATIENT_LAST_NAME/{{urlEncode (defaultTo result.patient.lastName 'NULL')}}` +
    `/PATIENT_FIRST_NAME/{{urlEncode (defaultTo result.patient.firstName 'NULL')}}` +
    `/PATIENT_MIDDLE_NAME/{{urlEncode (defaultTo result.patient.middleInitialOrName 'NULL')}}` +
    `/PATIENT_AGE/{{defaultTo (extractValueFromRegexCaptureGroup result.patient.age expression='^(\\d*)(.*)$' groupNumber=1) 'NULL'}}` +
    `/PATIENT_ADDRESS/{{urlEncode (defaultTo result.patient.address 'NULL')}}` +
    `/SEX/{{defaultTo (mapValue result.patient.sex '${JSON.stringify(genderValueMap)}') 'NULL'}}` +
    `/PATIENT_MOBILE_NUMBER/{{urlEncode (defaultTo (coalesce result.patient.phone (customFieldValueFromLabel result.data.customFieldData 'Patient Phone')) 'NULL')}}` +
    `/PATIENT_LANDLINE_NUMBER/{{urlEncode (defaultTo (customFieldValueFromLabel result.data.customFieldData 'Patient\\'s Landline No.') 'NULL')}}` +
    `/PATIENT_EMAIL/{{urlEncode (defaultTo (customFieldValueFromLabel result.data.customFieldData 'Patient\\'s Email Address') 'NULL')}}` +
    `/REASON_FOR_EXAMINATION/` +
    `{{#if (eq (toLowerCase (defaultTo (extractValueFromRegexCaptureGroup result.patient.monthOfTreatment expression='^(PT)\\d*' groupNumber=1) '')) 'pt')}}` +
    `{{defaultTo (mapValue (extractValueFromRegexCaptureGroup result.patient.monthOfTreatment expression='^PT(\\d*)' groupNumber=1) '${JSON.stringify(
      postTreatmentReasonForExaminationCodes
    )}') 'NULL'}}` +
    `{{else if (isRegexMatch (toLowerCase (defaultTo patient.treatmentSchedule '')) 'diagnosis')}}` +
    `938492` +
    `{{else if (or (isRegexMatch (toLowerCase (defaultTo result.patient.treatmentSchedule '')) 'bas') (isRegexMatch (toLowerCase (defaultTo result.patient.treatmentSchedule '')) 'baseline'))}}` +
    `938493` +
    `{{else}}` +
    `{{defaultTo (mapValue (extractValueFromRegexCaptureGroup result.patient.monthOfTreatment expression='(\\d*)' groupNumber=1) '${JSON.stringify(
      monthOfTreatmentReasonForExaminationCodes
    )}') 'NULL'}}` +
    `{{/if}}` +
    `/REGISTRATION_GROUP/{{urlEncode (defaultTo (mapValue result.patient.registrationGroup '${JSON.stringify(
      registrationGroupCodes
    )}') '938616')}}` +
    `/SPECIMEN_TYPE/{{defaultTo (mapValue result.sample.data.type '${JSON.stringify(specimenTypeCodes)}') 'NULL'}}` +
    `/REPEAT_COLLECTION/{{defaultTo (mapValue result.sample.data.repeatCollection '${JSON.stringify(
      repeatCollectionCodes
    )}') 'NULL'}}` +
    `/PRESUMPTIVE_TB_DSDR/{{defaultTo (mapValue result.patient.presumptiveDsOrDr '${JSON.stringify(
      presumptiveTbDsDrCodes
    )}') 'NULL'}}` +
    `/DATE_SPECIMEN_COLLECTED/{{defaultTo (formatDate result.sample.collectedOn formatString='${itisDateFormat}') 'NULL'}}` +
    `/VISUAL_APPEARANCE/{{defaultTo (mapValue result.sample.data.appearance '${JSON.stringify(
      visualAppearanceCodes
    )}') 'NULL'}}` +
    `/EXAM_TYPE/{{defaultTo (mapValue result.assay.id '${JSON.stringify(examTypes)}') 'NULL'}}` +
    `/EXAM_RESULT/` +
    `{{#if (eq result.assay.id 'assaySmear')}}` +
    `%7B%22RESULT%22%3A%22{{defaultTo (mapValue result.category1.id '${JSON.stringify(
      smearResultCodeMappings
    )}') '6'}}%22%2C%22NUM_AFB%22%3A%22N%2FA%22%7D` +
    `{{else if (or (eq result.assay.id 'GxMtbRif') (eq result.assay.id 'GxMtbRifUltra'))}}` +
    `%7B%22MTB%22%3A%22{{defaultTo (mapValue result.category1.id '${JSON.stringify(
      xpertResultCodeMappings
    )}') '3'}}%22%2C%22RIF%22%3A%22{{defaultTo (mapValue result.category2.id '${JSON.stringify(
      xpertRifResultCodeMappings
    )}') '6'}}%22%7D` +
    `{{else if (and (eq result.assay.id 'assayTbLamp') (or (eq result.category1.id 'Negative') (eq result.category1.id 'Positive')))}}` +
    `%7B%22RESULT%22%3A%22{{defaultTo (mapValue result.category1.id '${JSON.stringify(
      tbLampResultCodeMappings
    )}') '3'}}%22%7D` +
    `{{else if (and (or (eq result.assay.id 'assayBdMgitGnd') (eq result.assay.id 'assayGenericCulture')) (or (eq result.category1.id 'Detected') (eq result.category1.id 'NotDetected') (eq result.category1.id 'Missing') (eq result.category1.id 'Unknown') (eq result.category1.id 'Contaminated') (eq result.category1.id 'PositiveMOTT') (eq result.category1.id 'PositiveMTB')))}}` +
    `%7B%22RESULT%22%3A%22{{defaultTo (mapValue result.category1.id '${JSON.stringify(
      cultureResultCodeMappings
    )}') '4'}}%22%7D` +
    `{{else if (and (or (eq result.assay.id 'assayBdMgitAst') (eq result.assay.id 'assayGenericDst')) (or (eq result.category1.id 'Detected') (eq result.category1.id 'PositiveMTB')) (or (eq result.category2.id 'Resistant') (eq result.category2.id 'Susceptible') (eq result.category2.id 'Contaminated')))}}` +
    `%7B%22H%22%3A%22{{defaultTo (mapValue (coalesce result.data.encodedResult.isoniazid (defaultTo (mapValue result.data.INH.sirStatus '${JSON.stringify(
      mgitSireStatusToEncodedMappings
    )}') 'NOT DONE')) '${JSON.stringify(
      dstResultCodeMappings
    )}') 'ND'}}%22%2C%22R%22%3A%22{{defaultTo (mapValue (coalesce result.data.encodedResult.rifampicin (defaultTo (mapValue result.data.RIF.sirStatus '${JSON.stringify(
      mgitSireStatusToEncodedMappings
    )}') 'NOT DONE')) '${JSON.stringify(
      dstResultCodeMappings
    )}') 'ND'}}%22%2C%22Z%22%3A%22{{defaultTo (mapValue result.data.encodedResult.pyrazinamide '${JSON.stringify(
      dstResultCodeMappings
    )}') 'ND'}}%22%2C%22E%22%3A%22{{defaultTo (mapValue (coalesce result.data.encodedResult.ethambutol (defaultTo (mapValue result.data.EMB.sirStatus '${JSON.stringify(
      mgitSireStatusToEncodedMappings
    )}') 'NOT DONE')) '${JSON.stringify(
      dstResultCodeMappings
    )}') 'ND'}}%22%2C%22S%22%3A%22{{defaultTo (mapValue (coalesce result.data.encodedResult.streptomycin (defaultTo (mapValue result.data.S.sirStatus '${JSON.stringify(
      mgitSireStatusToEncodedMappings
    )}') 'NOT DONE')) '${JSON.stringify(
      dstResultCodeMappings
    )}') 'ND'}}%22%2C%22Km%22%3A%22{{defaultTo (mapValue result.data.encodedResult.kanamycin '${JSON.stringify(
      dstResultCodeMappings
    )}') 'ND'}}%22%2C%22Cm%22%3A%22{{defaultTo (mapValue result.data.encodedResult.capreomycin '${JSON.stringify(
      dstResultCodeMappings
    )}') 'ND'}}%22%2C%22Ofx%22%3A%22{{defaultTo (mapValue result.data.encodedResult.ofloxacin '${JSON.stringify(
      dstResultCodeMappings
    )}') 'ND'}}%22%2C%22Lfx%22%3A%22{{defaultTo (mapValue result.data.encodedResult.levofloxacin '${JSON.stringify(
      dstResultCodeMappings
    )}') 'ND'}}%22%2C%22Cs%22%3A%22ND%22%2C%22Am%22%3A%22{{defaultTo (mapValue result.data.encodedResult.amikacin '${JSON.stringify(
      dstResultCodeMappings
    )}') 'ND'}}%22%7D` +
    `{{else if (and (eq result.assay.id 'assayLPA') (or (eq result.category1.id 'NotDetected') (eq result.category1.id 'Invalid') (eq result.category1.id 'PositiveMTB')))}}` +
    `%7B%22MTB%22%3A%22{{mapValue result.category1.id '${JSON.stringify(
      lpaMtbResultCodeMappings
    )}'}}%22%2C%22H%22%3A%22{{defaultTo (mapValue result.data.encodedResult.isoniazid '${JSON.stringify(
      lpaHighLowResistanceCodeMappings
    )}') '3'}}%22%2C%22R%22%3A%22{{defaultTo (mapValue result.data.encodedResult.rifampicin '${JSON.stringify(
      lpaResistanceCodeMappings
    )}') '3'}}%22%2C%22FQ%22%3A%22{{defaultTo (mapValue result.data.encodedResult.fluoroquinolones '${JSON.stringify(
      lpaResistanceCodeMappings
    )}') '3'}}%22%2C%22SLI%22%3A%22{{defaultTo (mapValue result.data.encodedResult.aminoglycoside '${JSON.stringify(
      lpaResistanceCodeMappings
    )}') '3'}}%22%7D` +
    `{{else}}` +
    `NULL` +
    `{{/if}}` +
    `/DATE_OF_RELEASE/{{defaultTo (formatDate result.data.encodedResult.dateReleased formatString='${itisDateFormat}') 'NULL'}}` +
    `/PERFORMED_BY/{{urlEncode (defaultTo (coalesce result.data.encodedResult.examiner result.data.encodedResult.labTech result.senderOperator) 'NULL')}}`,
  fileContentTypeId: 'formUrlEncoded',
  okResponseSuccessRegex: '(Add|Update)\\sTB\\sExam\\ssuccessfully',
}

module.exports = {
  okResponseSuccessRegex,
  itisWebhookTemplate,
}
