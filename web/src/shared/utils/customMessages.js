import Immutable from 'immutable'
import { defineMessages } from 'react-intl'
import { i18nWrapper } from '../../Providers/I18nProvider'

export const commonDefinitions = defineMessages({
  selectPlaceholder: {
    id: 'pages.common.selectPlaceholder',
    defaultMessage: 'Select {entity}...',
  },
  state: {
    id: 'pages.common.state',
    defaultMessage: 'State',
  },
  state_MW: {
    id: 'pages.common.state_MW',
    defaultMessage: 'District',
  },
  state_ZANHLS: {
    id: 'pages.common.state_ZANHLS',
    defaultMessage: 'Province',
  },
  state_MM: {
    id: 'pages.common.state_MM',
    defaultMessage: 'State/Region',
  },
  state_ZW: {
    id: 'pages.common.state_ZW',
    defaultMessage: 'Province',
  },
  state_CM: {
    id: 'pages.common.state_CM',
    defaultMessage: 'Region',
  },
  state_PK: {
    id: 'pages.common.state_PK',
    defaultMessage: 'Province/Region',
  },
  lga: {
    id: 'pages.common.lga',
    defaultMessage: 'LGA',
  },
  lga_ZANHLS: {
    id: 'pages.common.lga_ZANHLS',
    defaultMessage: 'District',
  },
  lga_US: {
    id: 'pages.common.lga_US',
    defaultMessage: 'County',
  },
  lga_MM: {
    id: 'pages.common.lga_MM',
    defaultMessage: 'District',
  },
  lga_ZW: {
    id: 'pages.common.lga_ZW',
    defaultMessage: 'District',
  },
  lga_CM: {
    id: 'pages.common.lga_CM',
    defaultMessage: 'Division',
  },
  lga_PK: {
    id: 'pages.common.lga_PK',
    defaultMessage: 'District',
  },
})

export function getCustomMessage(messages, key, user, params) {
  const { countryAbbreviation } = user || {}
  const { formatMessage } = i18nWrapper()

  let message = messages[`${key}_${countryAbbreviation}`] // default Key can be 'state' or 'lga', in this case

  if (!message) {
    message = messages[`${key}`] // if there's not a specific country for the provided key, we will try to get the default message
  }

  if (!message) {
    // eslint-disable-next-line no-console
    console.error(`No message was found for the specificed key: ${key}`)
    return ''
  }

  if (params) {
    const [...keys] = Immutable.fromJS(params).keys()
    keys.forEach(key => {
      params[key] = getCustomMessage(messages, params[key], user)
    })
  }

  return formatMessage(message, params)
}
