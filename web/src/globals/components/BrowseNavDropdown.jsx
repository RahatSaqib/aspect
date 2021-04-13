import { compose, mapProps, defaultProps } from 'recompose'
import { defineMessages } from 'react-intl'

import StyledDropdown from '../../components/shared/StyledDropdown'

const messages = defineMessages({
  devices: {
    id: 'browsePage.browseDropdown.devices',
    defaultMessage: 'Devices',
  },
  results: {
    id: 'browsePage.browseDropdown.results',
    defaultMessage: 'Results',
  },
  contacts: {
    id: 'browsePage.browseDropdown.contacts',
    defaultMessage: 'Contacts',
  },
  sites: {
    id: 'browsePage.browseDropdown.sites',
    defaultMessage: 'Sites',
  },
  supplies: {
    id: 'browsePage.browseDropdown.supplies',
    defaultMessage: 'Supplies',
  },
  routers: {
    id: 'browsePage.browseDropdown.routers',
    defaultMessage: 'Routers',
  },
  reporters: {
    id: 'browsePage.browseDropdown.reporters',
    defaultMessage: 'Reporters',
  },
  notifications: {
    id: 'browsePage.browseDropdown.notifications',
    defaultMessage: 'Notifications',
  },
  reports: {
    id: 'browsePage.browseDropdown.reports',
    defaultMessage: 'Reports',
  },
  deviceApiKey: {
    id: 'browsePage.browseDropdown.deviceApiKey',
    defaultMessage: 'Device Api Keys',
  },
  cases: {
    id: 'browsePage.browseDropdown.cases',
    defaultMessage: 'Cases',
  },
})

const navigations = [
  { value: '/browse/device', label: 'Devices', i18nKey: 'devices' },
  { value: '/browse/result', label: 'Results', i18nKey: 'results' },
  { value: '/browse/person', label: 'Contacts', i18nKey: 'contacts' },
  { value: '/browse/site', label: 'Sites', i18nKey: 'sites' },
  { value: '/browse/inventory', label: 'Supplies', i18nKey: 'supplies' },
  { value: '/browse/router', label: 'Routers', i18nKey: 'routers' },
  { value: '/browse/reporter', label: 'Reporters', i18nKey: 'reporters' },
  {
    value: '/browse/notification',
    label: 'Notifications',
    i18nkey: 'notifications',
  },
  { value: '/browse/report', label: 'Reports', i18nKey: 'reports' },
  {
    value: '/browse/deviceApiKey',
    label: 'Device API Keys',
    i18nkey: 'deviceApiKey',
  },
  { value: '/browse/case', label: 'Cases', i18nKey: 'cases' },
]

const enhance = compose(
  mapProps(({ history, location, ...restProps }) => ({
    ...restProps,
    onChange: ({ target: { value } }) => {
      const searchParams = new URLSearchParams()
      searchParams.set(
        'filters',
        new URLSearchParams(location.search).get('filters') || ''
      )

      history.push({
        pathname: value,
        search: searchParams.toString(),
      })
    },
    value: location.pathname,
  })),
  defaultProps({
    source: navigations,
    messages,
  })
)

export default enhance(StyledDropdown)
