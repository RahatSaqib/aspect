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
  { value: '/browse/terminal', label: 'Terminals' },
  { value: '/browse/notification', label: 'Notifications' },
  { value: '/browse/report', label: 'Reports' },
  { value: '/browse/deviceApiKey', label: 'Device API Keys' },
]

const BrowseNavDropdown = ({ history, location, ...restProps }) =>
  <Dropdown
    {...restProps}
    onChange={value => history.push(value)}
    source={navigations}
    value={location.pathname}
    theme={{
      inputInput: cssClasses('input__input'),
      inputInputElement: cssClasses('input__inputElement'),
    }}
  />

export default enhance(BrowseNavDropdown)
