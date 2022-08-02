import { defineMessages } from 'react-intl'
import { commonDefinitions } from '../../shared/utils/customMessages'

const messages = {
  ...commonDefinitions,
  ...defineMessages({
    country: {
      id: 'pages.LocationSelector.country',
      defaultMessage: 'Country',
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
