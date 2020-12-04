/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState } from 'react'
import classnames from 'classnames/bind'
import { Helmet } from 'react-helmet'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'

import OperationalDashBoard from './OperationalDashBoard'
import OperationalDailyStatus from './OperationalDailyStatus'

const cssClasses = classnames.bind(require('./OperationalData.css'))

const currentTabStyle = (currentTab, index) =>
  currentTab === index ? 'tabs__tab--active' : 'tabs__tab--inactive'

export const OperationalData = () => {
  const [currentTab, setCurrentTab] = useState(1)
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
            className={cssClasses('tabs__tab', currentTabStyle(currentTab, 0))}
          />
          <Tab
            label="Daily Status"
            className={cssClasses('tabs__tab', currentTabStyle(currentTab, 1))}
          />
        </Tabs>
      </div>
      {currentTab === 0 ? <OperationalDashBoard /> : null}
      {currentTab === 1 ? <OperationalDailyStatus /> : null}
    </div>
  )
}

export default OperationalData
