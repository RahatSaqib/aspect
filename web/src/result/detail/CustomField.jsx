import React, { PureComponent } from 'react'
import classnames from 'classnames/bind'
import { defineMessages } from 'react-intl'
import isValid from 'date-fns/isValid'
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
  caseId: {
    id: 'pages.ResultDetail.formFields.caseId',
    defaultMessage: 'Unique Case Identifier',
  },
  age: {
    id: 'pages.ResultDetail.formFields.age',
    defaultMessage: 'Age',
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
    if (fieldType === 'DateTime') {
      const fieldDateTime = isValid(fieldValue) ? new Date(fieldValue) : null
      return (
        <FormGroup
          className={cssClasses('Container')}
          label={fieldLabel}
          key={formFieldKey}
        >
          <DateTimeInput
            showNowButton
            className={cssClasses('DateTime')}
            dateFormat={dateFormat}
            timeFormat={timeFormat}
            intl={{ formatMessage }}
            value={fieldDateTime}
            onChange={this.onUpdateData}
          />
        </FormGroup>
      )
    }
    return false
  }
}
