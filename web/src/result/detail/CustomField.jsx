import React, { PureComponent } from 'react'
import { defineMessages } from 'react-intl'
import { Button } from 'react-toolbox/lib/button'
import { Input } from 'react-toolbox/lib/input'
import FormGroup from '../../components/themedReactToolbox/FormGroup'
import ButtonGroup from '../../components/themedReactToolbox/ButtonGroup'
import StyledDropdown from '../../components/themedReactToolbox/StyledDropdown'

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
})

export default class CustomField extends PureComponent {
  onButtonGroupClick = ({ target: { dataset: { value } } }) => {
    this.onUpdateDate(value || null)
  }

  onUpdateDate = value => {
    const { resultId, formFieldKey, updateFormData } = this.props
    updateFormData(resultId, formFieldKey, value)
  }

  render() {
    const {
      fieldType,
      formFieldKey,
      fieldSchema,
      formData,
      formatMessage,
      isMultiField,
    } = this.props

    const fieldLabel = isMultiField
      ? formatMessage(messages[fieldSchema.get('i18nLabel')])
      : ''
    const fieldValue = formData.get(formFieldKey) || null

    if (fieldType === 'ButtonGroup') {
      if (fieldSchema.getIn(['control', 'allowMultipleSelection'])) {
        // TODO: Implement multi-select button group
        return false
      }
      return (
        <FormGroup label={fieldLabel} key={formFieldKey}>
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
        <FormGroup label={fieldLabel} key={formFieldKey}>
          <Input
            type="text"
            name={formFieldKey}
            value={fieldValue}
            onChange={this.onUpdateDate}
          />
        </FormGroup>
      )
    } else if (fieldType === 'Dropdown') {
      return (
        <FormGroup label={fieldLabel} key={formFieldKey}>
          <StyledDropdown
            source={fieldSchema
              .getIn(['control', 'options'])
              .map(option => ({
                value: option.get('value'),
                label: formatMessage(messages[option.get('i18nText')]),
              }))
              .toJS()}
            value={fieldValue}
            onChange={this.onUpdateDate}
          />
        </FormGroup>
      )
    }
    return false
  }
}
