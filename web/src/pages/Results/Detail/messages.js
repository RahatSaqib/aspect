import { defineMessages } from 'react-intl'
import { commonDefinitions, resultCategory, resultCategoryType, sampleType } from '../../../messages'
import resultCategoryAssayMessages from '../../../oldPages/result/list/messages'

const messagesResult = defineMessages({
  site: {
    id: 'pages.resultEdit.site',
    defaultMessage: 'Site',
  },
  button_Save: {
    id: 'pages.resultEdit.button_Save',
    defaultMessage: 'Save',
  },
  resultTitle: {
    id: 'pages.resultEdit.resultTitle',
    defaultMessage: 'Result Details',
  },
  transferResult: {
    id: 'pages.resultEdit.transferResult',
    defaultMessage: 'Transfer Result',
  },
  header: {
    id: 'pages.transferResult.header',
    defaultMessage: 'Transfer Result',
  },
  titleSites: {
    id: 'pages.transferResult.titleSites',
    defaultMessage: 'Transfer to Clinic',
  },
  hint: {
    id: 'pages.transferResult.hint',
    defaultMessage: 'Enter clinic name',
  },
  enterComment: {
    id: 'pages.transferResult.enterComment',
    defaultMessage: 'Enter a comment',
  },
  buttonCancel: {
    id: 'pages.transferResult.buttonCancel',
    defaultMessage: 'Cancel',
  },
  buttonTransfer: {
    id: 'pages.transferResult.buttonTransfer',
    defaultMessage: 'Transfer',
  },
  includeAllResults: {
    id: 'pages.transferResult.includeAllResults',
    defaultMessage: 'Include ALL results related to Patient ID',
  },
  processing: {
    id: 'pages.result.transferResult.processing',
    defaultMessage: 'Processing...',
  },
  note: {
    id: 'pages.transferResult.note',
    defaultMessage: `
      Please notice that above field 'Transfer to Clinic' lists all clinics, even those
      which you may not have access to.
      In a such case - by transferring this result you won't
      be able to edit this result record any more, and your
      action cannot be undone.
    `,
  },
  successOk: {
    id: 'pages.transferResult.successOk',
    defaultMessage: `OK`,
  },
  successHeader: {
    id: 'pages.transferResult.successHeader',
    defaultMessage: `
      Result Transfer Completed
    `,
  },
  successMessagePatient: {
    id: 'pages.transferResult.successMessagePatient',
    defaultMessage: 'Result for patient "{patientId}" has been transferred from "{oldSiteName}" to "{newSiteName}"',
  },
  successMessageButton: {
    id: 'pages.transferResult.successMessageButton',
    defaultMessage: 'After clicking the OK button below, you will be redirected to the list of results.',
  },

  customFields: {
    id: 'pages.resultEdit.customFields',
    defaultMessage: 'Custom Fields',
  },
  noCustomFieldsDefined: {
    id: 'pages.resultEdit.noCustomFieldsDefined',
    defaultMessage: 'No Custom Fields Defined',
  },
  Genderi18nCaptionKey: {
    id: 'pages.resultEdit.Genderi18nCaptionKey',
    defaultMessage: 'Gender',
  },
  AgeFieldi18nKey: {
    id: 'pages.resultEdit.AgeFieldi18nKey',
    defaultMessage: 'Age',
  },
  RetreatCaseFieldi18nKey: {
    id: 'pages.resultEdit.RetreatCaseFieldi18nKey',
    defaultMessage: 'Retreatment Case',
  },
  OtherReferringFacilityi18nKeyCaption: {
    id: 'pages.resultEdit.OtherReferringFacilityi18nKeyCaption',
    defaultMessage: 'Other Referring Facility',
  },
  ReferringFacilityI18nkey: {
    id: 'pages.resultEdit.ReferringFacilityI18nkey',
    defaultMessage: 'Referring Facility',
  },
  RepeatTesti18nKey: {
    id: 'pages.resultEdit.RepeatTesti18nKey',
    defaultMessage: 'Repeat Test',
  },
  PatientNameI18nCaptionKey: {
    id: 'pages.resultEdit.PatientNameI18nCaptionKey',
    defaultMessage: 'Patient Name',
  },
  AddressI18nCaptionKey: {
    id: 'pages.resultEdit.AddressI18nCaptionKey',
    defaultMessage: 'Address',
  },
  MobileNumberI18nkey: {
    id: 'pages.resultEdit.MobileNumberI18nkey',
    defaultMessage: 'Mobile Number',
  },
  TypeOfPatientI18nKey: {
    id: 'pages.resultEdit.TypeOfPatientI18nKey',
    defaultMessage: 'Type of Patient',
  },
  PatientHistoryI18nKey: {
    id: 'pages.resultEdit.PatientHistoryI18nKey',
    defaultMessage: 'Type History',
  },
  PatientRetreatmentI18nKey: {
    id: 'pages.resultEdit.PatientRetreatmentI18nKey',
    defaultMessage: 'Patient Retreatment',
  },
  HIVStatusI18nKey: {
    id: 'pages.resultEdit.HIVStatusI18nKey',
    defaultMessage: 'HIV Status',
  },
  SampleTypeI18nKey: {
    id: 'pages.resultEdit.SampleTypeI18nKey',
    defaultMessage: 'Sample Type',
  },
  TBRegistrationNumberPreviousI18nKey: {
    id: 'pages.resultEdit.TBRegistrationNumberPreviousI18nKey',
    defaultMessage: 'TB Registration Number - Previous (if any)',
  },
  TBRegistrationNumberCurrentI18nKey: {
    id: 'pages.resultEdit.TBRegistrationNumberCurrentI18nKey',
    defaultMessage: 'TB Registration Number - Current',
  },
  originTestLocationi18nKey: {
    id: 'pages.resultEdit.originTestLocationi18nKey',
    defaultMessage: 'Original test location',
  },
  rifResistancePreviouslyDetectedI18nKey: {
    id: 'pages.resultEdit.rifResistancePreviouslyDetectedI18nKey',
    defaultMessage: 'RR previously detected',
  },
  originTestLocationi18nCaptionKey: {
    id: 'pages.resultEdit.originTestLocationi18nCaptionKey',
    defaultMessage: 'Indicates whether the original test was performed at this site or a different one',
  },
  male: {
    id: 'pages.resultEdit.male',
    defaultMessage: 'Male',
  },
  female: {
    id: 'pages.resultEdit.female',
    defaultMessage: 'Female',
  },
  yes: {
    id: 'pages.resultEdit.yes',
    defaultMessage: 'Yes',
  },
  no: {
    id: 'pages.resultEdit.no',
    defaultMessage: 'No',
  },
  firstOrSecond: {
    id: 'pages.resultEdit.firstOrSecond',
    defaultMessage: 'First or second',
  },
  followUp: {
    id: 'pages.resultEdit.followUp',
    defaultMessage: 'Follow-up',
  },
  repeatBaseline: {
    id: 'pages.resultEdit.repeatBaseline',
    defaultMessage: 'Repeat Baseline',
  },
  Failures_of_Category_I: {
    id: 'pages.resultEdit.Failures_of_Category_I',
    defaultMessage: 'Failures of Category I',
  },
  Non_converters_of_Category_I: {
    id: 'pages.resultEdit.Non_converters_of_Category_I',
    defaultMessage: 'Non converters of Category I',
  },
  Failures_of_Retreatment: {
    id: 'pages.resultEdit.Failures_of_Retreatment',
    defaultMessage: 'Failures of Retreatment',
  },
  Non_converters_of_Retreatment: {
    id: 'pages.resultEdit.Non_converters_of_Retreatment',
    defaultMessage: 'Non converters of Retreatment',
  },
  Relapses: {
    id: 'pages.resultEdit.Relapses',
    defaultMessage: 'Relapses',
  },
  Treatment_after_loss_to_follow_up: {
    id: 'pages.resultEdit.Treatment_after_loss_to_follow_up',
    defaultMessage: 'Treatment after loss to follow up',
  },
  Close_contacts_of_DR_TB_patient_with_symptoms: {
    id: 'pages.resultEdit.Close_contacts_of_DR_TB_patient_with_symptoms',
    defaultMessage: 'Close contacts of DR TB patient with symptoms',
  },
  HIV_infected_person_with_TB_SS: {
    id: 'pages.resultEdit.HIV_infected_person_with_TB_SS',
    defaultMessage: 'HIV infected person, with TB S/S',
  },
  Others_Pulmonary_clinically_diagnosed: {
    id: 'pages.resultEdit.Others_Pulmonary_clinically_diagnosed',
    defaultMessage: 'Others - Pulmonary, clinically diagnosed',
  },
  Others_Extra_Pulmonary: {
    id: 'pages.resultEdit.Others_Extra_Pulmonary',
    defaultMessage: 'Others - Extra Pulmonary',
  },
  Others_Pulmonary_Bacteriologically_Confirmed: {
    id: 'pages.resultEdit.Others_Pulmonary_Bacteriologically_Confirmed',
    defaultMessage: 'Others - Pulmonary, Bacteriologically Confirmed',
  },
  Presumptive_Pulmonary_Smear_Negative_TB_Cases: {
    id: 'pages.resultEdit.Presumptive_Pulmonary_Smear_Negative_TB_Cases',
    defaultMessage: 'Presumptive Pulmonary Smear Negative TB Cases',
  },
  Presumptive_TB: {
    id: 'pages.resultEdit.Presumptive_TB',
    defaultMessage: 'Presumptive TB',
  },
  unknown: {
    id: 'pages.resultEdit.unknown',
    defaultMessage: 'Unknown',
  },
  new: {
    id: 'pages.resultEdit.new',
    defaultMessage: 'New',
  },
  treated: {
    id: 'pages.resultEdit.treated',
    defaultMessage: 'Previously treated',
  },
  'Category-I': {
    id: 'pages.resultEdit.Category-I',
    defaultMessage: 'Category I',
  },
  Retreatment: {
    id: 'pages.resultEdit.Retreatment',
    defaultMessage: 'Retreatment',
  },
  positive: {
    id: 'pages.resultEdit.positive',
    defaultMessage: 'Positive',
  },
  negative: {
    id: 'pages.resultEdit.negative',
    defaultMessage: 'Negative',
  },
  pulmonary: {
    id: 'pages.resultEdit.pulmonary',
    defaultMessage: 'Pulmonary',
  },
  extra: {
    id: 'pages.resultEdit.extra',
    defaultMessage: 'Extra-pulmonary',
  },
  EQA: {
    id: 'pages.resultEdit.EQA',
    defaultMessage: 'EQA',
  },
  Training: {
    id: 'pages.resultEdit.Training',
    defaultMessage: 'Training',
  },
  Calibration: {
    id: 'pages.resultEdit.Calibration',
    defaultMessage: 'Calibration',
  },
  Study: {
    id: 'pages.resultEdit.Study',
    defaultMessage: 'Study/Research',
  },
  gender: {
    id: 'pages.resultEdit.gender',
    defaultMessage: 'Gender',
  },
  age: {
    id: 'pages.resultEdit.age',
    defaultMessage: 'Age',
  },
  name: {
    id: 'pages.resultEdit.name',
    defaultMessage: 'Name',
  },
  cellphoneNumber: {
    id: 'pages.resultEdit.cellphoneNumber',
    defaultMessage: 'Cellphone number',
  },
  surename: {
    id: 'pages.resultEdit.surename',
    defaultMessage: 'Surename',
  },
  retreatmentCase: {
    id: 'pages.resultEdit.retreatmentCase',
    defaultMessage: 'Retreatment Case',
  },
  referringClinicianOrFacilityPhoneNumberIfKnown: {
    id: 'pages.resultEdit.referringClinicianOrFacilityPhoneNumberIfKnown',
    defaultMessage: 'Referring Clinician or Facility Phone Number (if known)',
  },
  referringFacility: {
    id: 'pages.resultEdit.referringFacility',
    defaultMessage: 'Referring Facility',
  },
  repeatTest: {
    id: 'pages.resultEdit.repeatTest',
    defaultMessage: 'Repeat Test',
  },
  dateSpecimenCollected: {
    id: 'pages.resultEdit.dateSpecimenCollected',
    defaultMessage: 'Date Specimen Collected',
  },
  dateSpecimenReceived: {
    id: 'pages.resultEdit.dateSpecimenReceived',
    defaultMessage: 'Date Specimen Received',
  },
})

export default {
  ...commonDefinitions,
  ...resultCategory,
  ...resultCategoryType,
  ...messagesResult,
  ...resultCategoryAssayMessages,
  ...sampleType,
}
