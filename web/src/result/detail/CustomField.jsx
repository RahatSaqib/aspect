import React, { PureComponent } from 'react'
import classnames from 'classnames/bind'
import { defineMessages } from 'react-intl'
import { isValid, parseISO, set as setDateComponents } from 'date-fns'
import Input from '@material-ui/core/Input'
import DateTimeInput from '../../components/shared/DateTimeInput'
import FocusBlurTextField from '../../components/shared/FocusBlurTextField'
import FormGroup from '../../components/themedReactToolbox/FormGroup'
import ButtonGroup from '../../components/themedReactToolbox/ButtonGroup'
import AspectButton from '../../components/shared/AspectButton'
import StyledDropdown from '../../components/shared/StyledDropdown'

const cssClasses = classnames.bind(require('./CustomField.css'))

const messages = defineMessages({
  confirmedInterpretationOfResult: {
    id: 'pages.ResultDetail.formFields.confirmedInterpretationOfResult',
    defaultMessage: 'Confirmed Interpretation of Result',
  },
  none: {
    id: 'pages.ResultDetail.formOptions.none',
    defaultMessage: 'None',
  },
  negative: {
    id: 'pages.ResultDetail.formOptions.negative',
    defaultMessage: 'Negative',
  },
  positive: {
    id: 'pages.ResultDetail.formOptions.positive',
    defaultMessage: 'Positive',
  },
  uninterpretable: {
    id: 'pages.ResultDetail.formOptions.uninterpretable',
    defaultMessage: 'Uninterpretable',
  },
  defaultString: {
    id: 'pages.ResultDetail.formFields.defaultString',
    defaultMessage: 'Default String',
  },
  patientId: {
    id: 'pages.ResultDetail.formFields.patientId',
    defaultMessage: 'Patient ID',
  },
  hospitalNumber: {
    id: 'pages.ResultDetail.formFields.hospitalNumber',
    defaultMessage: 'Hospital Number',
  },
  nameOfPatient: {
    id: 'pages.ResultDetail.formFields.nameOfPatient',
    defaultMessage: 'Name',
  },
  surnameOfPatient: {
    id: 'pages.ResultDetail.formFields.surnameOfPatient',
    defaultMessage: 'Surname',
  },
  ward: {
    id: 'pages.ResultDetail.formFields.ward',
    defaultMessage: 'Ward',
  },
  timeSampleTaken: {
    id: 'pages.ResultDetail.formFields.timeSampleTaken',
    defaultMessage: 'Time Sample Taken',
  },
  sampleType: {
    id: 'pages.ResultDetail.formFields.sampleType',
    defaultMessage: 'Sample Type',
  },
  studyOfSampleType: {
    id: 'pages.ResultDetail.formOptions.studyOfSampleType',
    defaultMessage: 'Study',
  },
  EQAOfSampleType: {
    id: 'pages.ResultDetail.formOptions.EQAOfSampleType',
    defaultMessage: 'EQA',
  },
  miscOfSampleType: {
    id: 'pages.ResultDetail.formOptions.miscOfSampleType',
    defaultMessage: 'Misc.',
  },
  timeInstrumentResulted: {
    id: 'pages.ResultDetail.formFields.timeInstrumentResulted',
    defaultMessage: 'Time Instrument Resulted',
  },
  testReasonCovid19: {
    id: 'pages.ResultDetail.formFields.testReasonCovid19',
    defaultMessage: 'Why tested for COVID-19',
  },
  contactOfACase: {
    id: 'pages.ResultDetail.formFields.contactOfACase',
    defaultMessage: 'Contact of a case',
  },
  illSeekingHealthcare: {
    id: 'pages.ResultDetail.formOptions.illSeekingHealthcare',
    defaultMessage: 'Ill Seeking Healthcare due to suspicion of COVID-19',
  },
  detectedAtPointOfEntry: {
    id: 'pages.ResultDetail.formOptions.detectedAtPointOfEntry',
    defaultMessage: 'Detected at point of entry',
  },
  repatriation: {
    id: 'pages.ResultDetail.formOptions.repatriation',
    defaultMessage: 'Repatriation',
  },
  routineRespiratorySurveillance: {
    id: 'pages.ResultDetail.formOptions.routineRespiratorySurveillance',
    defaultMessage:
      'Routine respiratory disease surveillance systems (e.g influenza)',
  },
  unknown: {
    id: 'pages.ResultDetail.formFields.unknown',
    defaultMessage: 'Unknown',
  },
  ifNoneOfTheAbovePleaseExplain: {
    id: 'pages.ResultDetail.formFields.ifNoneOfTheAbovePleaseExplain',
    defaultMessage: 'If none of the above, please explain',
  },
  caseId: {
    id: 'pages.ResultDetail.formFields.caseId',
    defaultMessage: 'Unique Case Identifier',
  },
  age: {
    id: 'pages.ResultDetail.formFields.age',
    defaultMessage: 'Age',
  },
  ageYears: {
    id: 'pages.ResultDetail.formFields.ageYears',
    defaultMessage: 'Age (years)',
  },
  ageMonths: {
    id: 'pages.ResultDetail.formFields.ageMonths',
    defaultMessage: 'Age, in months if < 1 year old',
  },
  ageDays: {
    id: 'pages.ResultDetail.formFields.ageDays',
    defaultMessage: 'Age, in days if < 1 month old',
  },
  gender: {
    id: 'pages.ResultDetail.formFields.gender',
    defaultMessage: 'Sex at birth',
  },
  male: {
    id: 'pages.ResultDetail.formFields.male',
    defaultMessage: 'Male',
  },
  female: {
    id: 'pages.ResultDetail.formFields.female',
    defaultMessage: 'Female',
  },
  usualCountryOfResidency: {
    id: 'pages.ResultDetail.formFields.usualCountryOfResidency',
    defaultMessage: 'Usual country of residency',
  },
  dateOfFirstLaboratoryConfirmationTest: {
    id: 'pages.ResultDetail.formFields.dateOfFirstLaboratoryConfirmationTest',
    defaultMessage: 'Date of first laboratory confirmation test',
  },
  anySymptomsOrSignsAtTimeOfSpecimenCollection: {
    id:
      'pages.ResultDetail.formFields.anySymptomsOrSignsAtTimeOfSpecimenCollection',
    defaultMessage:
      'Any symptoms* or signs at time of specimen collection that resulted in first laboratory confirmation?',
  },
  yes: {
    id: 'pages.ResultDetail.formFields.yes',
    defaultMessage: 'Yes',
  },
  no: {
    id: 'pages.ResultDetail.formFields.no',
    defaultMessage: 'No',
  },
  ifYesDateOfOnsetOfSymptoms: {
    id: 'pages.ResultDetail.formFields.ifYesDateOfOnsetOfSymptoms',
    defaultMessage: 'If yes, date of onset of symptoms',
  },
  underlyingConditionsAndComorbidity: {
    id: 'pages.ResultDetail.formFields.underlyingConditionsAndComorbidity',
    defaultMessage: 'Underlying conditions and comorbidity',
  },
  ifYesPleaseCheckAllThatApply: {
    id: 'pages.ResultDetail.formFields.ifYesPleaseCheckAllThatApply',
    defaultMessage: 'If yes, please check all that apply',
  },
  pregnancy: {
    id: 'pages.ResultDetail.formFields.pregnancy',
    defaultMessage: 'Pregnancy',
  },
  trimester: {
    id: 'pages.ResultDetail.formFields.trimester',
    defaultMessage: 'Trimester',
  },
  postPartum: {
    id: 'pages.ResultDetail.formFields.postPartum',
    defaultMessage: 'Post-partum (< 6 weeks)',
  },
  cardiovascularDiseaseIncludingHypertension: {
    id:
      'pages.ResultDetail.formFields.cardiovascularDiseaseIncludingHypertension',
    defaultMessage: 'Cardiovascular disease, including hypertension',
  },
  immunodeficiencyIncludingHIV: {
    id: 'pages.ResultDetail.formFields.immunodeficiencyIncludingHIV',
    defaultMessage: 'Immunodeficiency, including HIV',
  },
  diabetes: {
    id: 'pages.ResultDetail.formFields.diabetes',
    defaultMessage: 'Diabetes',
  },
  renalDisease: {
    id: 'pages.ResultDetail.formFields.renalDisease',
    defaultMessage: 'Renal disease',
  },
  liverDisease: {
    id: 'pages.ResultDetail.formFields.liverDisease',
    defaultMessage: 'Liver disease',
  },
  chronicLungDisease: {
    id: 'pages.ResultDetail.formFields.chronicLungDisease',
    defaultMessage: 'Chronic lung disease',
  },
  chronicNeurologicalOrNeuromuscularDisease: {
    id:
      'pages.ResultDetail.formFields.chronicNeurologicalOrNeuromuscularDisease',
    defaultMessage: 'Chronic neurological or neuromuscular disease',
  },
  malignancy: {
    id: 'pages.ResultDetail.formFields.malignancy',
    defaultMessage: 'Malignancy',
  },
  others: {
    id: 'pages.ResultDetail.formFields.others',
    defaultMessage: 'Other(s)',
  },
  pleaseSpecify: {
    id: 'pages.ResultDetail.formFields.pleaseSpecify',
    defaultMessage: 'Please Specify',
  },
  admissionToHospital: {
    id: 'pages.ResultDetail.formFields.admissionToHospital',
    defaultMessage: 'Admission to hospital',
  },
  firstDateOfAdmissionToHospital: {
    id: 'pages.ResultDetail.formFields.firstDateOfAdmissionToHospital',
    defaultMessage: 'First date of admission to hospital',
  },
  didTheCaseReceiveCareInAnICU: {
    id: 'pages.ResultDetail.formFields.didTheCaseReceiveCareInAnICU',
    defaultMessage:
      'Did the case receive care in an intensive care unit (ICU)?',
  },
  didTheCaseReceiveVentilation: {
    id: 'pages.ResultDetail.formFields.didTheCaseReceiveVentilation',
    defaultMessage: 'Did the case receive ventilation?',
  },
  didTheCaseReceiveExtracorporealMembraneOxygenation: {
    id:
      'pages.ResultDetail.formFields.didTheCaseReceiveExtracorporealMembraneOxygenation',
    defaultMessage: 'Did the case receive extracorporeal membrane oxygenation?',
  },
  isCaseInIsolationWithInfectionControlPracticeInPlace: {
    id:
      'pages.ResultDetail.formFields.isCaseInIsolationWithInfectionControlPracticeInPlace',
    defaultMessage:
      'Is case in isolation with Infection Control Practice in place',
  },
  dateOfIsolation: {
    id: 'pages.ResultDetail.formFields.dateOfIsolation',
    defaultMessage: 'Date of isolation',
  },
  isCaseAHealthCareWorker: {
    id: 'pages.ResultDetail.formFields.isCaseAHealthCareWorker',
    defaultMessage:
      'Is case a Health Care Worker (any job in a health care setting)',
  },
  ifYesCountry: {
    id: 'pages.ResultDetail.formFields.ifYesCountry',
    defaultMessage: 'If yes, Country',
  },
  city: {
    id: 'pages.ResultDetail.formFields.city',
    defaultMessage: 'City',
  },
  nameOfFacility: {
    id: 'pages.ResultDetail.formFields.nameOfFacility',
    defaultMessage: 'Name of Facility',
  },
  hasTheCaseTravelledInThe14DaysPriorToSymptomOnset: {
    id:
      'pages.ResultDetail.formFields.hasTheCaseTravelledInThe14DaysPriorToSymptomOnset',
    defaultMessage:
      'Has the case travelled in the 14 days prior to symptom onset?',
  },
  oneCountry: {
    id: 'pages.ResultDetail.formFields.oneCountry',
    defaultMessage: '1. Country',
  },
  twoCountry: {
    id: 'pages.ResultDetail.formFields.twoCountry',
    defaultMessage: '2. Country',
  },
  threeCountry: {
    id: 'pages.ResultDetail.formFields.threeCountry',
    defaultMessage: '3. Country',
  },
  date: {
    id: 'pages.ResultDetail.formFields.date',
    defaultMessage: 'Date',
  },
  dateOfDeparture: {
    id: 'pages.ResultDetail.formFields.dateOfDeparture',
    defaultMessage: 'Date of departure',
  },
  hasCaseVisitedAnyHealthCareFacilityInThe14DaysPriorToSymptomOnset: {
    id:
      'pages.ResultDetail.formFields.hasCaseVisitedAnyHealthCareFacilityInThe14DaysPriorToSymptomOnset',
    defaultMessage:
      'Has case visited any health care facility in the 14 days prior to symptom onset?',
  },
  hasCaseHadContactWithAConfirmedCaseInThe14DaysPriorToSymptomOnset: {
    id:
      'pages.ResultDetail.formFields.hasCaseHadContactWithAConfirmedCaseInThe14DaysPriorToSymptomOnset',
    defaultMessage:
      'Has case had contact with a confirmed case in the 14 days prior to symptom onset?',
  },
  ifYesPleaseExplainContactSetting: {
    id: 'pages.ResultDetail.formFields.ifYesPleaseExplainContactSetting',
    defaultMessage: 'If yes, please explain contact setting',
  },
  oneContact: {
    id: 'pages.ResultDetail.formFields.oneContact',
    defaultMessage: '1. Contact ID',
  },
  twoContact: {
    id: 'pages.ResultDetail.formFields.twoContact',
    defaultMessage: '2. Contact ID',
  },
  threeContact: {
    id: 'pages.ResultDetail.formFields.threeContact',
    defaultMessage: '3. Contact ID',
  },
  fourContact: {
    id: 'pages.ResultDetail.formFields.fourContact',
    defaultMessage: '4. Contact ID',
  },
  fiveContact: {
    id: 'pages.ResultDetail.formFields.fiveContact',
    defaultMessage: '5. Contact ID',
  },
  firstDateOfContact: {
    id: 'pages.ResultDetail.formFields.firstDateOfContact',
    defaultMessage: 'First Date of Contact',
  },
  lastDateOfContact: {
    id: 'pages.ResultDetail.formFields.lastDateOfContact',
    defaultMessage: 'Last Date of Contact',
  },
  mostLikelyCountryOfExposure: {
    id: 'pages.ResultDetail.formFields.mostLikelyCountryOfExposure',
    defaultMessage: 'Most likely country of exposure',
  },
  dateOfReSubmissionOfThisReport: {
    id: 'pages.ResultDetail.formFields.dateOfReSubmissionOfThisReport',
    defaultMessage: 'Date of re-submission of this report',
  },
  didTheCaseDevelopAnySymptoms: {
    id: 'pages.ResultDetail.formFields.didTheCaseDevelopAnySymptoms',
    defaultMessage:
      'If case was asymptomatic at time of specimen collection resulting in first laboratory confirmation, did the case develop any symptoms or signs at any time prior to discharge or death',
  },
  noCaseRemainsAsymptomatic: {
    id: 'pages.ResultDetail.formFields.noCaseRemainsAsymptomatic',
    defaultMessage: 'No (i.e., case remains asymptomatic)',
  },
  yesDevelopedSignsOfIllness: {
    id: 'pages.ResultDetail.formFields.yesDevelopedSignsOfIllness',
    defaultMessage:
      'Yes, asymptomatic case (as previously reported ) developed symptoms and/or signs of illness',
  },
  ifYesDateOfOnsetOfSignsOfIllness: {
    id: 'pages.ResultDetail.formFields.ifYesDateOfOnsetOfSignsOfIllness',
    defaultMessage: 'If yes, date of onset of symptoms/signs of illness',
  },
  admissionToHospitalMayHaveBeenPreviouslyReported: {
    id:
      'pages.ResultDetail.formFields.admissionToHospitalMayHaveBeenPreviouslyReported',
    defaultMessage: 'Admission to hospital (may have been previously reported)',
  },
  ifReleasedFromHospitalIsolationDateOfLastLaboratoryTest: {
    id:
      'pages.ResultDetail.formFields.ifReleasedFromHospitalIsolationDateOfLastLaboratoryTest',
    defaultMessage:
      'If released from hospital /isolation, date & time of last laboratory test',
  },
  resultsOfLastTest: {
    id: 'pages.ResultDetail.formFields.resultsOfLastTest',
    defaultMessage: 'Result of last test',
  },
  totalNumberOfContactsFollowedForThisCase: {
    id:
      'pages.ResultDetail.formFields.totalNumberOfContactsFollowedForThisCase',
    defaultMessage: 'Total number of contacts followed for this case',
  },
  testType: {
    id: 'pages.ResultDetail.formFields.testType',
    defaultMessage: 'Type of test',
  },
  pcr: {
    id: 'pages.ResultDetail.formFields.pcr',
    defaultMessage: 'PCR/molecular',
  },
  immunoassay: {
    id: 'pages.ResultDetail.formFields.immunoassay',
    defaultMessage: 'Immunoassay',
  },
  rapidDiagnosticTest: {
    id: 'pages.ResultDetail.formFields.rapidDiagnosticTest',
    defaultMessage: 'Rapid diagnostic test',
  },
  digitalXRay: {
    id: 'pages.ResultDetail.formFields.digitalXRay',
    defaultMessage: 'Digital X-Ray',
  },
  dateAndTimeOfTest: {
    id: 'pages.ResultDetail.formFields.dateAndTimeOfTest',
    defaultMessage: 'Date and time of test',
  },
  testResult: {
    id: 'pages.ResultDetail.formFields.testResult',
    defaultMessage: 'Test result',
  },
})

export default class CustomField extends PureComponent {
  onButtonGroupClick = ({
    currentTarget: {
      dataset: { value },
    },
  }) => {
    this.onUpdateData(value || null)
  }

  onTextBoxCommitValue = ({ target: { value } }) => {
    this.onUpdateData(value || '')
  }

  onDropdownChangeValue = ({ target: { value } }) => {
    this.onUpdateData(value || '')
  }

  onUpdateData = value => {
    const { resultId, formFieldKey, updateFormData } = this.props
    updateFormData(resultId, formFieldKey, value)
  }

  render() {
    const {
      formFieldKey,
      fieldSchema,
      formData,
      intl,
      dateFormat,
      timeFormat,
      isMultiField = false,
    } = this.props

    const { formatMessage } = intl

    const fieldType = fieldSchema.getIn(['control', 'type'])
    const fieldLabel = isMultiField
      ? formatMessage(
          messages[fieldSchema.get('i18nLabel')] || messages.defaultString
        )
      : ''
    const fieldValue = formData ? formData.get(formFieldKey, null) : null

    if (fieldType === 'ButtonGroup') {
      if (fieldSchema.getIn(['control', 'allowMultipleSelection'])) {
        // TODO: Implement multi-select button group
        return false
      }
      return (
        <FormGroup
          className={cssClasses('Container')}
          label={fieldLabel}
          key={formFieldKey}
        >
          <ButtonGroup isolated>
            {fieldSchema.getIn(['control', 'options']).map(option => (
              <AspectButton
                key={option.get('value') || 'null'}
                color="primary"
                variant="contained"
                inverse={option.get('value') !== fieldValue}
                data-value={option.get('value')}
                onClick={this.onButtonGroupClick}
              >
                {formatMessage(messages[option.get('i18nText')])}
              </AspectButton>
            ))}
          </ButtonGroup>
        </FormGroup>
      )
    }
    if (fieldType === 'TextBox') {
      return (
        <FormGroup
          className={cssClasses('Container')}
          label={fieldLabel}
          key={formFieldKey}
        >
          <FocusBlurTextField
            component={Input}
            name="formFieldKey"
            value={fieldValue}
            onCommitValue={this.onTextBoxCommitValue}
            floatingLabelFixed
            fullWidth
            className={cssClasses('TextBox__Input')}
            inputProps={{
              className: cssClasses('TextBox__InputElement'),
            }}
          />
        </FormGroup>
      )
    }
    if (fieldType === 'DropDown') {
      return (
        <FormGroup
          className={cssClasses('Container', 'Container___DropDown')}
          label={fieldLabel}
          key={formFieldKey}
        >
          <StyledDropdown
            fullWidth
            className={cssClasses('DropDown')}
            source={fieldSchema
              .getIn(['control', 'options'])
              .map(option => ({
                value: option.get('value'),
                label: formatMessage(messages[option.get('i18nText')]),
              }))
              .toJS()}
            value={fieldValue}
            onChange={this.onDropdownChangeValue}
          />
        </FormGroup>
      )
    }
    if (fieldType === 'DateTime' || fieldType === 'Date') {
      const parsedFieldValue =
        typeof fieldValue === 'string' ? parseISO(fieldValue) : fieldValue
      let fieldDateTime = isValid(parsedFieldValue)
        ? new Date(fieldValue)
        : null
      if (fieldDateTime && isValid(fieldDateTime) && fieldType === 'Date') {
        fieldDateTime = setDateComponents(fieldDateTime, {
          hours: 0,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
        })
      }
      const dateTimeInputProps = {
        showNowButton: fieldType === 'DateTime',
        className: cssClasses('DateTime'),
        dateFormat,
        intl: { formatMessage },
        value: fieldDateTime,
        onChange: this.onUpdateData,
      }
      if (fieldType === 'DateTime') {
        dateTimeInputProps.timeFormat = timeFormat
      }
      return (
        <FormGroup
          className={cssClasses('Container')}
          label={fieldLabel}
          key={formFieldKey}
        >
          <DateTimeInput {...dateTimeInputProps} />
        </FormGroup>
      )
    }
    return false
  }
}
