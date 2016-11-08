import React from 'react'
import { assert } from 'chai'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import proxyquire from 'proxyquire'
import TimezoneSelect from '../../components/shared/TimezoneSelect'
import { Field } from 'redux-form/immutable'
import RaisedButton from 'material-ui/RaisedButton'

describe('UserPreferencesForm Component', () => {
  const fakeReactIntl = {
    injectIntl: component => component
  }

  describe('UserPreferencesForm', () => {
    const fakeReduxForm = {
      reduxForm: () => component => component
    }, UserPreferencesForm = proxyquire('./UserPreferencesForm', {
      'redux-form/immutable': fakeReduxForm,
      'react-intl': fakeReactIntl
    }).default

    let props, UserPreferencesFormWrapper

    const shallowRenderForm = props => {
      UserPreferencesFormWrapper = shallow(<UserPreferencesForm {...props}/>)
    }

    beforeEach(() => {
      props = {
        pristine: true,
        invalid: true,
        loading: false,
        saving: false,
        initialValues: { },
        onSubmit: () => {},
        intl: {
          formatMessage: message => message.defaultMessage
        }
      }
      shallowRenderForm(props)
    })

    it('Should be a form', () => {
      assert.equal(UserPreferencesFormWrapper.node.type, 'form')
      assert.equal(UserPreferencesFormWrapper.find('form').props().onSubmit, props.handleSubmit)
    })

    it('Should contain fields for time zone and language', () => {
      assert.deepEqual(UserPreferencesFormWrapper.find(TimezoneSelect).props(), {
        name: 'timezone',
        label: 'Time Zone',
        disabled: props.loading || props.saving,
        autoWidth: true
      })
      const languageSelector = UserPreferencesFormWrapper.find(Field)
      assert.equal(languageSelector.props().name, 'culture')
      assert.deepEqual(languageSelector.props().selectFieldProps, {
        floatingLabelText: 'Language',
        disabled: props.loading || props.saving,
        autoWidth: true
      })
      assert.equal(languageSelector.props().disabled, props.loading || props.saving)
    })

    it('Should disable all fields when form is loading', () => {
      assert.isFalse(UserPreferencesFormWrapper.find(TimezoneSelect).props().disabled)
      assert.isFalse(UserPreferencesFormWrapper.find(Field).props().selectFieldProps.disabled)
      props.loading = true
      shallowRenderForm(props)
      assert.isTrue(UserPreferencesFormWrapper.find(TimezoneSelect).props().disabled)
      assert.isTrue(UserPreferencesFormWrapper.find(Field).props().selectFieldProps.disabled)
    })

    it('Should contain a submit button', () => {
      const submitButton = UserPreferencesFormWrapper.find(RaisedButton)
      assert.equal(submitButton.length, 1)
      assert.deepEqual(submitButton.props(), {
        ...submitButton.props(),
        label: 'Save',
        secondary: true,
        type: 'submit',
        disabled: props.loading || props.invalid || props.pristine
      })
    })

    it('Should enable the submit button when the form is dirty, valid and not submitting', () => {
      let submitButton = UserPreferencesFormWrapper.find(RaisedButton)
      assert.isTrue(submitButton.props().disabled)

      props.pristine = false
      shallowRenderForm(props)
      submitButton = UserPreferencesFormWrapper.find(RaisedButton)
      assert.isTrue(submitButton.props().disabled)

      props.invalid = false
      shallowRenderForm(props)
      submitButton = UserPreferencesFormWrapper.find(RaisedButton)
      assert.isFalse(submitButton.props().disabled)

      props.pristine = true
      shallowRenderForm(props)
      submitButton = UserPreferencesFormWrapper.find(RaisedButton)
      assert.isTrue(submitButton.props().disabled)
    })
  })

  describe('reduxForm', () => {
    let reduxFormStub, reduxFormConfig

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
      assert.equal(reduxFormConfig.form, 'userPreferences')
    })
  })
})
