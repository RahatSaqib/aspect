import { defineMessages } from 'react-intl'
import { commonDefinitions } from '../../messages/customMessages'

const messages = {
  ...commonDefinitions,
  ...defineMessages({
    country: {
      id: 'pages.LocationSelector.country',
      defaultMessage: 'Country',
    },
    countryRequired: {
      id: 'pages.LocationSelector.countryRequired',
      defaultMessage: 'Country is required',
    },
  }),
}

export default messages
