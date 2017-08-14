import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import Dropdown from 'react-toolbox/lib/dropdown'

const cssClasses = classnames.bind(require('./BrowseNavDropdown.css'))

const enhance = _.identity

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

const BrowseNavDropdown = ({ history, location, ...restProps }) =>
  <Dropdown
    {...restProps}
    onChange={value => {
      const searchParams = new URLSearchParams()
      searchParams.set(
        'filters',
        new URLSearchParams(location.search).get('filters')
      )

      history.push({
        pathname: value,
        search: searchParams.toString(),
      })
    }}
    source={navigations}
    value={location.pathname}
    theme={{
      inputInput: cssClasses('input__input'),
      inputInputElement: cssClasses('input__inputElement'),
    }}
  />

export default enhance(BrowseNavDropdown)
