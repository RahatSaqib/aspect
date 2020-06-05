import Immutable from 'immutable'

export const getCommonDefinitions = (componentName) => ({
  selectPlaceholder: {
    id: `pages.${componentName}.selectPlaceholder`,
    defaultMessage: 'Select {entity}...',
  },
  state: {
    id: `pages.${componentName}.state`,
    defaultMessage: 'State',
  },
  state_MW: {
    id: `pages.${componentName}.state_MW`,
    defaultMessage: 'District',
  },
  state_ZANHLS: {
    id: `pages.${componentName}.state_ZANHLS`,
    defaultMessage: 'Province',
  },
  state_MM: {
    id: `pages.${componentName}.state_MM`,
    defaultMessage: 'State/Region',
  },
  state_ZW: {
    id: `pages.${componentName}.state_ZW`,
    defaultMessage: 'Province',
  },
  state_CM: {
    id: `pages.${componentName}.state_CM`,
    defaultMessage: 'Region',
  },
  lga: {
    id: `pages.${componentName}.lga`,
    defaultMessage: 'LGA',
  },
  lga_ZANHLS: {
    id: `pages.${componentName}.lga_ZANHLS`,
    defaultMessage: 'District',
  },
  lga_US: {
    id: `pages.${componentName}.lga_US`,
    defaultMessage: 'County',
  },
  lga_MM: {
    id: `pages.${componentName}.lga_MM`,
    defaultMessage: 'District',
  },
  lga_ZW: {
    id: `pages.${componentName}.lga_ZW`,
    defaultMessage: 'District',
  },
  lga_CM: {
    id: `pages.${componentName}.lga_CM`,
    defaultMessage: 'Division',
  }
})

export function getCustomMessage(intl, messages, key, user, params) {
  const { countryAbbreviation } = user

  let message = messages[`${key}_${countryAbbreviation}`] //default Key can be 'state' or 'lga', in this case

  if (!message) {
    message = messages[`${key}`] //if there's not a specific country for the provided key, we will try to get the default message
  }

  if (!message) {
    console.error(`No message was found for the specificed key: ${key}`)
    return ''
  }

  if (params) {
    const [...keys] = Immutable.fromJS(params).keys()
    keys.map(key => {
      params[key] = getCustomMessage(intl, messages, params[key], user)
    })
  }

  return intl.formatMessage(message, params)
}