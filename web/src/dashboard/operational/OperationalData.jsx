/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react'
import classnames from 'classnames/bind'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'
import find from 'lodash/find'
import { defineMessages } from 'react-intl'

import OperationalDashBoard from './OperationalDashBoard'
import OperationalDailyStatus from './OperationalDailyStatus'

import styles from './OperationalData.css'
import useI18n from '../../Hooks/i18n/useI18n'

const cssClasses = classnames.bind(styles)

const currentTabStyle = (currentTab, index) => (currentTab === index ? 'tabs__tab--active' : 'tabs__tab--inactive')

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
  const { formatMessage } = useI18n()
  const { pathname } = useLocation()
  const navigate = useNavigate()

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

  const { path: currentTab } = find(tabsConfig, { path: pathname }) || tabsConfig.dashboard

  return (
    <div className={cssClasses('Container')}>
      <Helmet title="Operational Data" />
      <div className={cssClasses('tabs__container')}>
        <Tabs
          indicatorColor="primary"
          textColor="inherit"
          value={currentTab}
          onChange={(e, v) => navigate(v)}
          TabIndicatorProps={{ style: { height: '0px' } }}
        >
          <Tab
            label={tabsConfig.dashboard.label}
            className={cssClasses('tabs__tab', currentTabStyle(currentTab, tabsConfig.dashboard.path))}
            value={tabsConfig.dashboard.path}
          />
          <Tab
            label={tabsConfig.dailyStatus.label}
            className={cssClasses('tabs__tab', currentTabStyle(currentTab, tabsConfig.dailyStatus.path))}
            value={tabsConfig.dailyStatus.path}
          />
        </Tabs>
      </div>
      <Routes>
        <Route path="">
          <OperationalDashBoard />
        </Route>
        <Route path="daily-status">
          <OperationalDailyStatus />
        </Route>
      </Routes>
    </div>
  )
}

export default OperationalData
