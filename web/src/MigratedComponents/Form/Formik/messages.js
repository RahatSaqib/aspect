import { defineMessages } from 'react-intl'

export const messages = defineMessages({
  required: {
    id: 'forms.isRequired',
    defaultMessage: 'This field is required',
  },
  min: {
    id: 'forms.minAllowed',
    defaultMessage: 'Field cannot contain less than {total} characters',
  },
  max: {
    id: 'forms.maxAllowed',
    defaultMessage: 'Field cannot contain more than {total} characters',
  },
  email: {
    id: 'forms.validEmail',
    defaultMessage: 'This email is not valid',
  },
  matches: {
    id: 'forms.mustMatch',
    defaultMessage: 'Value is not valid. Try {options}.',
  },
})

export default messages
