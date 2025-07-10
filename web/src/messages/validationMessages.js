import { defineMessages } from 'react-intl'

const errorMessagesBase = {
  ...defineMessages({
    requiredField: {
      id: 'forms.formItem.error.requiredField',
      defaultMessage: 'This field is required',
    },
    mustBeAtLeast: {
      id: 'forms.formItem.error.mustBeAtLeast',
      defaultMessage: 'Must be at least {min}',
    },
    mustBeLessThan: {
      id: 'forms.formItem.error.mustBeLessThan',
      defaultMessage: 'Must be less than {max}',
    },
    mustBeANumber: {
      id: 'forms.formItem.error.mustBeANumber',
      defaultMessage: 'Must be a number',
    },
    mustBeAString: {
      id: 'forms.formItem.error.mustBeAString',
      defaultMessage: 'Must be a string',
    },
  }),
}

export default errorMessagesBase
