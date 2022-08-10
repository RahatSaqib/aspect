import { defineMessages } from 'react-intl'
import { commonDefinitions } from '../../utils/utils/customMessages'

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
    state: {
      id: 'pages.LocationSelector.state',
      defaultMessage: 'State',
    },
    lga: {
      id: 'pages.LocationSelector.lga',
      defaultMessage: 'Area',
    },
  }),
}

export default messages
