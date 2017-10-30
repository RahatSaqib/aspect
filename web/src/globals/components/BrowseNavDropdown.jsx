import { compose, mapProps } from 'recompose'

import StyledDropdown from '../../components/themedReactToolbox/StyledDropdown'

const navigations = [
  { value: '/browse/device', label: 'Devices' },
  { value: '/browse/result', label: 'Results' },
  { value: '/browse/person', label: 'Contacts' },
  { value: '/browse/site', label: 'Sites' },
  { value: '/browse/inventory', label: 'Supplies' },
  { value: '/browse/router', label: 'Routers' },
  { value: '/browse/reporter', label: 'Reporters' },
  { value: '/browse/notification', label: 'Notifications' },
  { value: '/browse/report', label: 'Reports' },
  { value: '/browse/deviceApiKey', label: 'Device API Keys' },
]

const enhance = compose(
  mapProps(({ history, location, ...restProps }) => ({
    ...restProps,
    onChange: value => {
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
    source: navigations,
    value: location.pathname,
  }))
)

export default enhance(StyledDropdown)
