import React, { PureComponent } from 'react'
import classnames from 'classnames/bind'
import { defineMessages } from 'react-intl'
import isValid from 'date-fns/isValid'
import { Button } from 'react-toolbox/lib/button'
import { Input } from 'react-toolbox/lib/input'
import FormGroup from '../../components/themedReactToolbox/FormGroup'
import ButtonGroup from '../../components/themedReactToolbox/ButtonGroup'
import StyledDropdown from '../../components/themedReactToolbox/StyledDropdown'
import DateTimePicker from '../../components/themedReactToolbox/DateTimePicker'

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
  default: {
    id: 'pages.ResultDetail.formOptions.default',
    defaultMessage: '',
  },
  patientTownship: {
    id: 'pages.ResultDetail.formFields.patientTownship',
    defaultMessage: 'Patient Township',
  },
  physicianCell: {
    id: 'pages.ResultDetail.formFields.physicianCell',
    defaultMessage: 'Physician Cell',
  },
  microscopyResult: {
    id: 'pages.ResultDetail.formFields.microscopyResult',
    defaultMessage: 'Microscopy Result',
  },
  smearPositive: {
    id: 'pages.ResultDetail.formOptions.smearPositive',
    defaultMessage: 'Smear Positive',
  },
  smearNegative: {
    id: 'pages.ResultDetail.formOptions.smearNegative',
    defaultMessage: 'Smear Negative',
  },
  notDone: {
    id: 'pages.ResultDetail.formOptions.notDone',
    defaultMessage: 'Not Done',
  },
  offSite: {
    id: 'pages.ResultDetail.formOptions.offSite',
    defaultMessage: 'Off Site',
  },
  unknown: {
    id: 'pages.ResultDetail.formOptions.unknown',
    defaultMessage: 'Unknown',
  },
  sampleType: {
    id: 'pages.ResultDetail.formFields.sampleType',
    defaultMessage: 'Sample Type',
  },
  sputum: {
    id: 'pages.ResultDetail.formOptions.sputum',
    defaultMessage: 'Sputum',
  },
  saliva: {
    id: 'pages.ResultDetail.formOptions.saliva',
    defaultMessage: 'Saliva',
  },
  blood: {
    id: 'pages.ResultDetail.formOptions.blood',
    defaultMessage: 'Blood',
  },
  effusion: {
    id: 'pages.ResultDetail.formOptions.effusion',
    defaultMessage: 'Effusion',
  },
  sampleCollectedOn: {
    id: 'pages.ResultDetail.formFields.sampleCollectedOn',
    defaultMessage: 'Sample Collected On',
  },
})

export default class CustomField extends PureComponent {
  onButtonGroupClick = ({ target: { dataset: { value } } }) => {
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
          <Input
            type="text"
            multiline={fieldSchema.getIn(['control', 'multipleLine'], false)}
            name={formFieldKey}
            value={fieldValue}
            onChange={this.onUpdateData}
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
      const fieldDateTime = isValid(fieldValue)
        ? new Date(fieldValue)
        : undefined
      return (
        <FormGroup
          className={cssClasses('Container')}
          label={fieldLabel}
          key={formFieldKey}
        >
          <DateTimePicker value={fieldDateTime} onChange={this.onUpdateData} />
        </FormGroup>
      )
    }
    return false
  }
}
