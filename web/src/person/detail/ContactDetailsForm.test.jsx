import _ from 'lodash'
import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'

describe('ContactDetailsForm module', () => {
  const { validate, ContactDetailsForm } = require('./ContactDetailsForm')
  const props = {
    intl: {
      formatMessage: message => message.defaultMessage,
    },
    loading: false,
    userIsAdmin: false,
    showNotesField: false,
    // --- injected by recompose ---
    values: {},
    meta: {
      name: {},
      title: {},
      email: {},
      email2: {},
      phone: {},
      cell: {},
      lastPartnerId: {},
      countryId: {},
      stateId: {},
      lgaId: {},
      zip: {},
      notes: {},
    },
    onNameChange: _.noop,
    onTitleChange: _.noop,
    onEmailChange: _.noop,
    onEmail2Change: _.noop,
    onPhoneChange: _.noop,
    onCellChange: _.noop,
    onLastPartnerIdChange: _.noop,
    onCountryIdChange: _.noop,
    onStateIdChange: _.noop,
    onLgaIdChange: _.noop,
    onZipChange: _.noop,
    onNotesChange: _.noop,
    handleSubmit: _.noop,
  }

  describe('ContactDetailsForm component', () => {
    const renderer = ReactShallowRenderer.createRenderer()

    it('should render correctly', () => {
      const element = renderer.render(
        <ContactDetailsForm {...props} form={{}} />
      )
      expect(element).toMatchSnapshot()
    })

    it('should disable all fields when form is loading', () => {
      const element = renderer.render(
        <ContactDetailsForm {...props} form={{}} loading />
      )
      expect(element).toMatchSnapshot()
    })

    it('should disable the submit button when the form is pristine, invalid or submitting', () => {
      let element = renderer.render(
        <ContactDetailsForm
          {...props}
          form={{ pristine: true, valid: false, submitting: false }}
        />
      )
      expect(element).toMatchSnapshot()

      element = renderer.render(
        <ContactDetailsForm
          {...props}
          form={{ pristine: false, valid: false, submitting: false }}
        />
      )
      expect(element).toMatchSnapshot()

      element = renderer.render(
        <ContactDetailsForm
          {...props}
          form={{ pristine: false, valid: true, submitting: true }}
        />
      )
      expect(element).toMatchSnapshot()
    })

    it('should enable the submit button when the form is dirty, valid and not submitting', () => {
      const element = renderer.render(
        <ContactDetailsForm
          {...props}
          form={{ pristine: false, valid: true, submitting: false }}
        />
      )
      expect(element).toMatchSnapshot()
    })
  })

  describe('validate function', () => {
    it('should validate that name has been entered', () => {
      expect(
        validate(
          {
            name: '',
            email: null,
            email2: null,
          },
          props
        )
      ).toMatchSnapshot()
    })

    it('should validate email addresses if they have been entered', () => {
      expect(
        validate(
          {
            name: 'John Smith',
            email: 'invalid email',
            email2: null,
          },
          props
        )
      ).toMatchSnapshot()

      expect(
        validate(
          {
            name: 'John Smith',
            email: null,
            email2: 'invalid email',
          },
          props
        )
      ).toMatchSnapshot()
    })

    it('should validate name and both email addresses', () => {
      expect(
        validate(
          {
            name: '',
            email: 'Invalid Email',
            email2: 'Another Invalid Email',
          },
          props
        )
      ).toMatchSnapshot()

      expect(
        validate(
          {
            name: 'Abu Jenkins',
            email: 'Invalid Email',
            email2: 'Another Invalid Email',
          },
          props
        )
      ).toMatchSnapshot()

      expect(
        validate(
          {
            name: 'Abu Jenkins',
            email: 'valid@email.address',
            email2: 'Another Invalid Email',
          },
          props
        )
      ).toMatchSnapshot()

      expect(
        validate(
          {
            name: 'Abu Jenkins',
            email: 'valid@email.address',
            email2: 'valid@email.address',
          },
          props
        )
      ).toMatchSnapshot()
    })
  })
})
