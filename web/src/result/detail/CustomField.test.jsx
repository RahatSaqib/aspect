import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'
import { shallow, mount } from 'enzyme'
import sinon from 'sinon'
import Immutable from 'immutable'
import _ from 'lodash'

import FormGroup from '../../components/themedReactToolbox/FormGroup'
import CustomField from './CustomField'
import StyledDropdown from '../../components/shared/StyledDropdown'
import FocusBlurTextField from '../../components/shared/FocusBlurTextField'
import DateTimeInput from '../../components/shared/DateTimeInput'
import AspectButton from '../../components/shared/AspectButton'

describe('CustomField component', () => {
  const renderer = ReactShallowRenderer.createRenderer()

  function renderCustomerField(props) {
    return shallow(<CustomField {...props} />)
  }

  function mountCustomerField(props) {
    return mount(<CustomField {...props} />)
  }

  describe('When field type is ButtonGroup', () => {
    const props = {
      formFieldKey: 'expertInterpretation',
      fieldSchema: Immutable.Map({
        i18nLabel: 'confirmedInterpretationOfResult',
        control: Immutable.Map({
          type: 'ButtonGroup',
          allowMultipleSelection: false,
          options: Immutable.List([
            Immutable.Map({
              i18nText: 'none',
              value: null,
            }),
            Immutable.Map({
              i18nText: 'negative',
              value: 'negative',
            }),
            Immutable.Map({
              i18nText: 'positive',
              value: 'positive',
            }),
            Immutable.Map({
              i18nText: 'uninterpretable',
              value: 'uninterpretable',
            }),
          ]),
        }),
      }),
      updateFormData: sinon.spy(),
      formatMessage: message => message.defaultMessage,
    }

    it('should shallow render correctly', () => {
      const component = renderer.render(<CustomField {...props} />)
      expect(component).toMatchSnapshot()
    })

    it('should select the null option when form data has not been set', () => {
      const customField = renderCustomerField(props)
      const optionButtons = customField.find(AspectButton)
      const nullOptionButton = optionButtons
        .filter({ 'data-value': null })
        .first()
      expect(nullOptionButton.prop('inverse')).toBeFalsy()
      const notNullOptionButtons = optionButtons.filterWhere(button =>
        button.prop('data-value')
      )
      notNullOptionButtons.forEach(button => {
        expect(button.prop('inverse')).toBeTruthy()
      })
    })

    it('should set correct option when form data has been set', () => {
      const propsWithValue = _.merge({}, props, {
        formData: Immutable.Map({ expertInterpretation: 'positive' }),
      })
      const customField = renderCustomerField(propsWithValue)
      const optionButtons = customField.find(AspectButton)
      const positiveOptionButton = optionButtons
        .filter({ 'data-value': 'positive' })
        .first()
      expect(positiveOptionButton.prop('inverse')).toBeFalsy()
      const notPositiveOptionButtons = optionButtons.filterWhere(
        button => button.prop('data-value') !== 'positive'
      )
      notPositiveOptionButtons.forEach(button => {
        expect(button.prop('inverse')).toBeTruthy()
      })
    })

    it('should call onUpdateDate event when the user clicks one of the buttons', () => {
      const customField = renderCustomerField(props)
      const positiveOption = customField
        .find(AspectButton)
        .filter({ 'data-value': 'positive' })
        .first()

      const { updateFormData } = props
      expect(updateFormData.callCount).toBe(0)

      positiveOption.simulate('click', {
        currentTarget: { dataset: { value: 'positive' } },
      })

      expect(updateFormData.callCount).toBe(1)
      expect(updateFormData.lastCall.args[2]).toEqual('positive')
    })
  })

  describe('When field type is TextBox', () => {
    const props = {
      formFieldKey: 'expertInterpretation',
      fieldSchema: Immutable.Map({
        i18nLabel: 'confirmedInterpretationOfResult',
        control: Immutable.Map({
          type: 'TextBox',
        }),
      }),
      updateFormData: sinon.spy(),
      formatMessage: message => message.defaultMessage,
    }

    it('should shallow render correctly', () => {
      const component = renderer.render(<CustomField {...props} />)
      expect(component).toMatchSnapshot()
    })

    it('should show empty field when form data has not been set', () => {
      const customField = renderCustomerField(props)
      const input = customField.find(FocusBlurTextField).first()
      expect(input.prop('value')).toBeNull()
    })

    it('should pass value into field when form data has been set', () => {
      const propsWithValue = _.merge({}, props, {
        formData: Immutable.Map({ expertInterpretation: 'positive' }),
      })
      const customField = renderCustomerField(propsWithValue)
      const input = customField.find(FocusBlurTextField).first()
      expect(input.prop('value')).toEqual('positive')
    })

    it('should call onUpdateDate event when the user change input value', () => {
      const customField = renderCustomerField(props)
      const input = customField.find(FocusBlurTextField).first()

      const { updateFormData } = props
      expect(updateFormData.callCount).toBe(0)

      input.simulate('commitValue', { target: { value: 'positive' } })

      expect(updateFormData.callCount).toBe(1)
      expect(updateFormData.lastCall.args[2]).toEqual('positive')
    })
  })

  describe('When field type is DropDown', () => {
    const props = {
      formFieldKey: 'expertInterpretation',
      fieldSchema: Immutable.Map({
        i18nLabel: 'confirmedInterpretationOfResult',
        control: Immutable.Map({
          type: 'DropDown',
          allowMultipleSelection: false,
          options: Immutable.List([
            Immutable.Map({
              i18nText: 'none',
              value: null,
            }),
            Immutable.Map({
              i18nText: 'negative',
              value: 'negative',
            }),
            Immutable.Map({
              i18nText: 'positive',
              value: 'positive',
            }),
            Immutable.Map({
              i18nText: 'uninterpretable',
              value: 'uninterpretable',
            }),
          ]),
        }),
      }),
      updateFormData: sinon.spy(),
      formatMessage: message => message.defaultMessage,
    }

    it('should shallow render correctly', () => {
      const component = renderer.render(<CustomField {...props} />)
      expect(component).toMatchSnapshot()
    })

    it('should unselect any option when form data has not been set', () => {
      const customField = renderCustomerField(props)
      const dropdown = customField.find(StyledDropdown)
      expect(dropdown.prop('source').length).toEqual(4)
      expect(dropdown.prop('value')).toBeNull()
    })

    it('should select correct option when form data has been set', () => {
      const propsWithValue = _.merge({}, props, {
        formData: Immutable.Map({ expertInterpretation: 'positive' }),
      })
      const customField = renderCustomerField(propsWithValue)
      const dropdown = customField.find(StyledDropdown)
      expect(dropdown.prop('source').length).toEqual(4)
      expect(dropdown.prop('value')).toEqual('positive')
    })

    it('should call onUpdateDate event when the user select one of the options', () => {
      const customField = renderCustomerField(props)
      const dropdown = customField.find(StyledDropdown)
      const { updateFormData } = props
      expect(updateFormData.callCount).toBe(0)

      dropdown.simulate('change', {
        target: { value: 'positive' },
      })

      expect(updateFormData.callCount).toBe(1)
      expect(updateFormData.lastCall.args[2]).toEqual('positive')
    })
  })

  describe('When field type is DateTime', () => {
    const props = {
      formFieldKey: 'expertInterpretation',
      fieldSchema: Immutable.Map({
        i18nLabel: 'confirmedInterpretationOfResult',
        control: Immutable.Map({
          type: 'DateTime',
        }),
      }),
      updateFormData: sinon.spy(),
      formatMessage: message => message.defaultMessage,
    }

    it('should shallow render correctly', () => {
      const component = renderer.render(<CustomField {...props} />)
      expect(component).toMatchSnapshot()
    })

    it('should show empty field when form data has not been set', () => {
      const customField = mountCustomerField(props)
      const dateTimeInput = customField.find(DateTimeInput)
      expect(dateTimeInput.prop('value')).toBeNull()
    })

    it('should show date/time when form form data has been set', () => {
      const mockDate = new Date(2018, 10, 5, 15, 30)
      const propsWithValue = _.merge({}, props, {
        formData: Immutable.Map({
          expertInterpretation: mockDate,
        }),
      })
      const customField = mountCustomerField(propsWithValue)
      const dateTimeInput = customField.find(DateTimeInput)
      expect(dateTimeInput.prop('value')).toEqual(mockDate)
    })

    it('should call onUpdateDate event when the user select the date or time', () => {
      const mockDate = new Date(2018, 10, 5, 15, 30)
      const customField = mountCustomerField(props)

      const { updateFormData } = props
      expect(updateFormData.callCount).toBe(0)

      customField
        .find(DateTimeInput)
        .first()
        .props()
        .onChange(mockDate)

      expect(updateFormData.callCount).toBe(1)
      expect(updateFormData.lastCall.args[2]).toEqual(mockDate)
    })
  })

  describe('With unrecognized field types', () => {
    const props = {
      formFieldKey: 'expertInterpretation',
      fieldSchema: Immutable.Map({
        i18nLabel: 'confirmedInterpretationOfResult',
        control: Immutable.Map({
          type: 'UnrecognizedType',
        }),
      }),
      updateFormData: sinon.spy(),
      formatMessage: message => message.defaultMessage,
    }
    it('should not show Custom Field where the type is unrecognized', () => {
      const customField = renderCustomerField(props)
      const formGroup = customField.find(FormGroup)
      expect(formGroup.length).toEqual(0)
    })
  })
})
