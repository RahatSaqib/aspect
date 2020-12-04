/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react'
import classnames from 'classnames/bind'
import { useHistory } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'
import find from 'lodash/find'

import OperationalDashBoard from './OperationalDashBoard'
import OperationalDailyStatus from './OperationalDailyStatus'

const cssClasses = classnames.bind(require('./OperationalData.css'))

const currentTabStyle = (currentTab, index) =>
  currentTab === index ? 'tabs__tab--active' : 'tabs__tab--inactive'

export const OperationalData = () => {
  const {
    location: { pathname },
    push,
  } = useHistory()

  const CONSTS = {
    dashboard: {
      path: '/operational-data',
    },
    dailyStatus: {
      path: '/operational-data/daily-status',
    },
  }

  const { path } = find(CONSTS, { path: pathname }) || false
  const [currentTab, setCurrentTab] = useState(path || CONSTS.dashboard.path)

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
          {/* TODO: translations */}
          <Tab
            label="Dashboard"
            className={cssClasses(
              'tabs__tab',
              currentTabStyle(currentTab, CONSTS.dashboard.path)
            )}
            value={CONSTS.dashboard.path}
          />
          <Tab
            label="Daily Status"
            className={cssClasses(
              'tabs__tab',
              currentTabStyle(currentTab, CONSTS.dailyStatus.path)
            )}
            value={CONSTS.dailyStatus.path}
          />
        </Tabs>
      </div>
      {currentTab === CONSTS.dashboard.path ? <OperationalDashBoard /> : null}
      {currentTab === CONSTS.dailyStatus.path ? (
        <OperationalDailyStatus />
      ) : null}
    </div>
  )
}

export default OperationalData
