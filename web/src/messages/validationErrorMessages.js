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
    mustBeAWholeNumber: {
      id: 'form.error.mustBeAWholeNumber',
      defaultMessage: 'Must be a whole number (no decimals like .2, 1.5)',
    },
    mustBeAString: {
      id: 'form.error.mustBeAString',
      defaultMessage: 'Must be a string',
    },
    mustBeAtMostCharacters: {
      id: 'form.error.mustBeAtMostCharacters',
      defaultMessage: 'Must be at most {max} characters',
    },
  }),
}

export default validationErrorMessages
