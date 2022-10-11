/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react'
import { Tab, Tabs } from '@mui/material'
import classnames from 'classnames/bind'
import find from 'lodash/find'
import { Helmet } from 'react-helmet'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import useI18n from '../../../hooks/useI18n'
import messages from './messages'
import OperationalDailyStatus from './OperationalDailyStatus'
import OperationalDashBoard from './OperationalDashBoard'
import styles from './OperationalData.css'

const cssClasses = classnames.bind(styles)

const currentTabStyle = (currentTab, index) => (currentTab === index ? 'tabs__tab--active' : 'tabs__tab--inactive')

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
      <Helmet title={formatMessage(messages.title)} />
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
        <Route path="" element={<OperationalDashBoard />} />
        <Route path="daily-status" element={<OperationalDailyStatus />} />
      </Routes>
    </div>
  )
}

export default OperationalData
