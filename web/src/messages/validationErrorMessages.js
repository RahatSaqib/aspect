import { defineMessages } from 'react-intl'

const validationErrorMessages = {
  ...defineMessages({
    required: {
      id: 'form.error.required',
      defaultMessage: 'Required',
    },
    invalidEmail: {
      id: 'form.error.invalidEmail',
      defaultMessage: 'Invalid email',
    },
    mustBeAtLeast: {
      id: 'form.error.mustBeAtLeast',
      defaultMessage: 'Must be at least {min}',
    },
    mustBeLessThan: {
      id: 'form.error.mustBeLessThan',
      defaultMessage: 'Must be less than {max}',
    },
    mustBeANumber: {
      id: 'form.error.mustBeANumber',
      defaultMessage: 'Must be a number',
    },
    mustBeAString: {
      id: 'form.error.mustBeAString',
      defaultMessage: 'Must be a string',
    },
  }),
}

export default validationErrorMessages
