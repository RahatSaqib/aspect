import noop from 'lodash/noop'
import React from 'react'
import Immutable from 'immutable'
import { shallow } from 'enzyme'

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
    user: {},
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
    onNameChange: noop,
    onTitleChange: noop,
    onEmailChange: noop,
    onEmail2Change: noop,
    onPhoneChange: noop,
    onCellChange: noop,
    onLastPartnerIdChange: noop,
    onCountryIdChange: noop,
    onStateIdChange: noop,
    onLgaIdChange: noop,
    onZipChange: noop,
    onNotesChange: noop,
    handleSubmit: noop,
    contactDetails: Immutable.Map(),
    personTags: Immutable.List(),
    onPersonTagsChange: noop,
  }

  describe('ContactDetailsForm component', () => {
    it('should render correctly', () => {
      const element = shallow(<ContactDetailsForm {...props} form={{}} />)
      expect(element).toMatchSnapshot()
    })

    it('should disable all fields when form is loading', () => {
      const element = shallow(
        <ContactDetailsForm {...props} form={{}} loading />
      )
      expect(element).toMatchSnapshot()
    })

    it('should disable the submit button when the form is pristine, invalid or submitting', () => {
      let element = shallow(
        <ContactDetailsForm
          {...props}
          form={{ pristine: true, valid: false, submitting: false }}
        />
      )
      expect(element).toMatchSnapshot()

      element = shallow(
        <ContactDetailsForm
          {...props}
          form={{ pristine: false, valid: false, submitting: false }}
        />
      )
      expect(element).toMatchSnapshot()

      element = shallow(
        <ContactDetailsForm
          {...props}
          form={{ pristine: false, valid: true, submitting: true }}
        />
      )
      expect(element).toMatchSnapshot()
    })

    it('should enable the submit button when the form is dirty, valid and not submitting', () => {
      const element = shallow(
        <ContactDetailsForm
          {...props}
          form={{ pristine: false, valid: true, submitting: false }}
        />
      )
      expect(element).toMatchSnapshot()
    })

    it('should show form for New Contact', () => {
      const element = shallow(<ContactDetailsForm {...props} form={{}} isNew />)
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
