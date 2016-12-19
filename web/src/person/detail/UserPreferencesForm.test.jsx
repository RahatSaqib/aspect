import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import proxyquire from 'proxyquire'
import { Field } from 'redux-form/immutable'
import RaisedButton from 'material-ui/RaisedButton'
import TimezoneSelect from '../../components/shared/TimezoneSelect'

describe('UserPreferencesForm Component', () => {
  const fakeReactIntl = {
    injectIntl: component => component
  }

  describe('UserPreferencesForm', () => {
    const fakeReduxForm = {
      reduxForm: () => component => component
    }
    const UserPreferencesForm = proxyquire('./UserPreferencesForm', {
      'redux-form/immutable': fakeReduxForm,
      'react-intl': fakeReactIntl
    }).default

    let props
    let UserPreferencesFormWrapper

    const shallowRenderForm = (props) => {
      UserPreferencesFormWrapper = shallow(<UserPreferencesForm {...props} />)
    }

    beforeEach(() => {
      props = {
        pristine: true,
        invalid: true,
        loading: false,
        saving: false,
        initialValues: { },
        handleSubmit: () => {},
        intl: {
          formatMessage: message => message.defaultMessage
        }
      }
      shallowRenderForm(props)
    })

    it('Should be a form', () => {
      expect(UserPreferencesFormWrapper.node.type).toEqual('form')
      expect(UserPreferencesFormWrapper.find('form').props().onSubmit).toEqual(props.handleSubmit)
    })

    it('Should contain fields for time zone and language', () => {
      expect(UserPreferencesFormWrapper.find(TimezoneSelect).props()).toEqual({
        name: 'timezone',
        label: 'Time Zone',
        disabled: props.loading || props.saving,
        autoWidth: true
      })
      const languageSelector = UserPreferencesFormWrapper.find(Field)
      expect(languageSelector.props().name).toEqual('culture')
      expect(languageSelector.props().selectFieldProps).toEqual({
        floatingLabelText: 'Language',
        disabled: props.loading || props.saving,
        autoWidth: true
      })
      expect(languageSelector.props().disabled).toEqual(props.loading || props.saving)
    })

    it('Should disable all fields when form is loading', () => {
      expect(UserPreferencesFormWrapper.find(TimezoneSelect).props().disabled).toBe(false)
      expect(UserPreferencesFormWrapper.find(Field).props().selectFieldProps.disabled).toBe(false)
      props.loading = true
      shallowRenderForm(props)
      expect(UserPreferencesFormWrapper.find(TimezoneSelect).props().disabled).toBe(true)
      expect(UserPreferencesFormWrapper.find(Field).props().selectFieldProps.disabled).toBe(true)
    })

    it('Should contain a submit button', () => {
      const submitButton = UserPreferencesFormWrapper.find(RaisedButton)
      expect(submitButton.length).toEqual(1)
      expect(submitButton.props()).toEqual({
        ...submitButton.props(),
        label: 'Save',
        secondary: true,
        type: 'submit',
        disabled: props.loading || props.invalid || props.pristine
      })
    })

    it('Should enable the submit button when the form is dirty, valid and not submitting', () => {
      let submitButton = UserPreferencesFormWrapper.find(RaisedButton)
      expect(submitButton.props().disabled).toBe(true)

      props.pristine = false
      shallowRenderForm(props)
      submitButton = UserPreferencesFormWrapper.find(RaisedButton)
      expect(submitButton.props().disabled).toBe(true)

      props.invalid = false
      shallowRenderForm(props)
      submitButton = UserPreferencesFormWrapper.find(RaisedButton)
      expect(submitButton.props().disabled).toBe(false)

      props.pristine = true
      shallowRenderForm(props)
      submitButton = UserPreferencesFormWrapper.find(RaisedButton)
      expect(submitButton.props().disabled).toBe(true)
    })
  })

  describe('reduxForm', () => {
    let reduxFormStub
    let reduxFormConfig

    beforeEach(() => {
      reduxFormStub = {
        reduxForm: sinon.stub().returns(() => {})
      }
      proxyquire('./UserPreferencesForm', {
        'redux-form/immutable': reduxFormStub,
        'react-intl': fakeReactIntl
      })
      reduxFormConfig = reduxFormStub.reduxForm.firstCall.args[0]
    })

    it('Should create a form called \'userPreferences\'', () => {
      expect(reduxFormConfig.form).toEqual('userPreferences')
    })
  })
})
