import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { Button } from 'react-toolbox/lib/button'
import Dropdown from 'react-toolbox/lib/dropdown'

import LoggedInLayout from './LoggedInLayout'

const cssClasses = classnames.bind(require('./BrowseLayout.css'))

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

const makeNavigationTab = props => navigation =>
  <Button
    key={navigation.value}
    label={navigation.label}
    raised
    primary={props.location.pathname === navigation.value}
    onClick={() => {
      props.history.push(navigation.value)
    }}
    theme={{
      neutral: cssClasses('Button--neutral'),
      primary: cssClasses('Button--primary'),
      raised: cssClasses('Button--raised'),
    }}
  />

const BrowseLayout = ({ component: Component, ...restProps }) =>
  <LoggedInLayout
    {...restProps}
    render={props =>
      <div>
        <Dropdown
          className={cssClasses('NavigationGroup--xs')}
          onChange={value => props.history.push(value)}
          source={navigations}
          value={props.location.pathname}
        />
        <div className={cssClasses('NavigationGroup--sm')}>
          {navigations.map(makeNavigationTab(props))}
        </div>
        <Component {...props} />
      </div>}
  />

export default enhance(BrowseLayout)
