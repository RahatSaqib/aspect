import { defineMessages } from 'react-intl'

export const commonDefinitions = defineMessages({
  period: {
    id: 'pages.common.period',
    defaultMessage: 'Period',
  },
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
    defaultMessage: 'Zone',
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
  state_BD: {
    id: 'pages.common.state_BD',
    defaultMessage: 'Division',
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
  lga_BD: {
    id: 'pages.common.lga_BD',
    defaultMessage: 'District',
  },
  lga_MW: {
    id: 'pages.common.lga_MW',
    defaultMessage: 'District',
  },
  enabled: {
    id: 'pages.common.enabled',
    defaultMessage: 'Enabled',
  },
  disabled: {
    id: 'pages.common.disabled',
    defaultMessage: 'Disabled',
  },
  notAvailable: {
    id: 'pages.common.notAvailable',
    defaultMessage: 'N/A',
  },
  button_Edit: {
    id: 'button_Edit',
    defaultMessage: 'Edit',
  },
  button_Cancel: {
    id: 'button_Cancel',
    defaultMessage: 'Cancel',
  },
  button_Submit: {
    id: 'button_Submit',
    defaultMessage: 'Submit',
  },
  button_Back: {
    id: 'button_Back',
    defaultMessage: 'Back',
  },
})

export function getCustomMessage(formatMessage, messages, key, user, params) {
  const { countryAbbreviation } = user || {}

  let message = messages[`${key}_${countryAbbreviation}`] // default Key can be 'state' or 'lga', in this case

  if (!message) {
    message = messages[key] // if there's not a specific country for the provided key, we will try to get the default message
  }

  if (!message) {
    console.error(`No message was found for the specificed key: ${key}`)
    return ''
  }

  if (params) {
    const [...keys] = Object.keys(params)
    keys.forEach(key => {
      params[key] = getCustomMessage(formatMessage, messages, params[key], user)
    })
  }

  return formatMessage(message, params)
}
