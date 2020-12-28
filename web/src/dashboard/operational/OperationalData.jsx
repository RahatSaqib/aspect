/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react'
import classnames from 'classnames/bind'
import { useHistory } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'
import find from 'lodash/find'
import { defineMessages, useIntl } from 'react-intl'

import OperationalDashBoard from './OperationalDashBoard'
import OperationalDailyStatus from './OperationalDailyStatus'

const cssClasses = classnames.bind(require('./OperationalData.css'))

const currentTabStyle = (currentTab, index) =>
  currentTab === index ? 'tabs__tab--active' : 'tabs__tab--inactive'

const messages = defineMessages({
  operationalDashboardTitle: {
    id: 'pages.OperationalDashboard.operationalDashboardTitle',
    defaultMessage: 'Dashboard',
  },
  dailyStatusTitle: {
    id: 'pages.OperationalDashboard.dailyStatusTitle',
    defaultMessage: 'Daily Status',
  },
})

export const OperationalData = () => {
  const { formatMessage } = useIntl()
  const {
    location: { pathname },
    push,
  } = useHistory()

  const tabsConfig = {
    dashboard: {
      path: '/operational-data',
      label: formatMessage(messages.operationalDashboardTitle),
    },
    dailyStatus: {
      path: '/operational-data/daily-status',
      label: formatMessage(messages.dailyStatusTitle),
    },
  }

  const { path } = find(tabsConfig, { path: pathname }) || false
  const [currentTab, setCurrentTab] = useState(
    path || tabsConfig.dashboard.path
  )

  useEffect(() => {
    if (currentTab) {
      push(currentTab)
    }
  }, [currentTab])

  return (
    <div className={cssClasses('Container')}>
      <Helmet title="Operational Data" />
      <div className={cssClasses('tabs__container')}>
        <Tabs
          indicatorColor="primary"
          textColor="inherit"
          value={currentTab}
          onChange={(e, v) => setCurrentTab(v)}
          TabIndicatorProps={{ style: { height: '0px' } }}
        >
          <Tab
            label={tabsConfig.dashboard.label}
            className={cssClasses(
              'tabs__tab',
              currentTabStyle(currentTab, tabsConfig.dashboard.path)
            )}
            value={tabsConfig.dashboard.path}
          />
          <Tab
            label={tabsConfig.dailyStatus.label}
            className={cssClasses(
              'tabs__tab',
              currentTabStyle(currentTab, tabsConfig.dailyStatus.path)
            )}
            value={tabsConfig.dailyStatus.path}
          />
        </Tabs>
      </div>
      {currentTab === tabsConfig.dashboard.path ? (
        <OperationalDashBoard />
      ) : null}
      {currentTab === tabsConfig.dailyStatus.path ? (
        <OperationalDailyStatus />
      ) : null}
    </div>
  )
}

export default OperationalData
