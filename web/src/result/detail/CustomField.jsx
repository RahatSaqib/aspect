import React, { PureComponent } from 'react'
import classnames from 'classnames/bind'
import { defineMessages } from 'react-intl'
import isValid from 'date-fns/isValid'
import { Button } from 'react-toolbox/lib/button'
import { Input } from 'react-toolbox/lib/input'
import FocusBlurTextField from '../../components/shared/FocusBlurTextField'
import FormGroup from '../../components/themedReactToolbox/FormGroup'
import ButtonGroup from '../../components/themedReactToolbox/ButtonGroup'
import StyledDropdown from '../../components/themedReactToolbox/StyledDropdown'
import DateTimePicker from '../../components/themedReactToolbox/DateTimePicker'

const cssClasses = classnames.bind(require('./CustomField.css'))

const THEME = {
  Input: {
    input: cssClasses('TextBox__Input'),
  },
}

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
  default: {
    id: 'pages.ResultDetail.formFields.default',
    defaultMessage: '',
  },
  hospitalNumber: {
    id: 'pages.ResultDetail.formFields.hospitalNumber',
    defaultMessage: 'Hospital Number',
  },
  studyID: {
    id: 'pages.ResultDetail.formFields.studyID',
    defaultMessage: 'Study ID',
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
    id: 'pages.ResultDetail.formFields.hospitalNumber',
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
    id: 'pages.ResultDetail.formFields.hospitalNumber',
    defaultMessage: 'Time Instrument Resulted',
  },
})

export default class CustomField extends PureComponent {
  onButtonGroupClick = ({ target: { dataset: { value } } }) => {
    this.onUpdateData(value || null)
  }

  onTextBoxCommitValue = ({ target: { value } }) => {
    this.onUpdateData(value || null)
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
      formatMessage,
      isMultiField = false,
    } = this.props

    const fieldType = fieldSchema.getIn(['control', 'type'])
    const fieldLabel = isMultiField
      ? formatMessage(
          messages[fieldSchema.get('i18nLabel')] || messages.default
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
            {fieldSchema
              .getIn(['control', 'options'])
              .map(option => (
                <Button
                  key={option.get('value') || 'null'}
                  primary
                  raised
                  inverse={option.get('value') !== fieldValue}
                  label={formatMessage(messages[option.get('i18nText')])}
                  data-value={option.get('value')}
                  onClick={this.onButtonGroupClick}
                />
              ))}
          </ButtonGroup>
        </FormGroup>
      )
    } else if (fieldType === 'TextBox') {
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
            floatingLabelFixe
            theme={THEME.Input}
          />
        </FormGroup>
      )
    } else if (fieldType === 'DropDown') {
      return (
        <FormGroup
          className={cssClasses('Container')}
          label={fieldLabel}
          key={formFieldKey}
        >
          <StyledDropdown
            className={cssClasses('DropDown')}
            source={fieldSchema
              .getIn(['control', 'options'])
              .map(option => ({
                value: option.get('value'),
                label: formatMessage(messages[option.get('i18nText')]),
              }))
              .toJS()}
            value={fieldValue}
            onChange={this.onUpdateData}
          />
        </FormGroup>
      )
    } else if (fieldType === 'DateTime') {
      const fieldDateTime = isValid(fieldValue) ? new Date(fieldValue) : null
      return (
        <FormGroup
          className={cssClasses('Container')}
          label={fieldLabel}
          key={formFieldKey}
        >
          <DateTimePicker
            value={fieldDateTime}
            theme={THEME}
            onChange={this.onUpdateData}
          />
        </FormGroup>
      )
    }
    return false
  }
}
