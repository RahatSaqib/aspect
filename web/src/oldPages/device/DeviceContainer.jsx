import React, { useState } from 'react'
import { Tab, Tabs } from '@mui/material'
import classnames from 'classnames/bind'
import { defineMessages } from 'react-intl'
import { useLocation, useNavigate } from 'react-router-dom'
import useI18n from '../../hooks/useI18n'
import styles from './DeviceContainer.css'
import DeviceList from './list/DeviceList'

const cssClasses = classnames.bind(styles)

const messages = defineMessages({
  statusesTabTitle: {
    id: 'pages.DeviceDashboard.statusesTabTitle',
    defaultMessage: 'Statuses',
  },
  workloadTabTitle: {
    id: 'pages.DeviceDashboard.workloadTabTitle',
    defaultMessage: 'Workload',
  },
})

export const DeviceContainer = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { formatMessage } = useI18n()
  const [activeTab, setActiveTab] = useState('statuses')

  const handleChange = (e, v) => {
    setActiveTab(v)
    if (activeTab === 'statuses') {
      const searchParams = new URLSearchParams()
      searchParams.set('filters', new URLSearchParams(location.search).get('filters') || '')

      navigate({ ...location, search: `?${searchParams.toString()}` }, { replace: true })
    }
  }

  return (
    <div className={cssClasses('Container')}>
      <div className={cssClasses('tabs__container')}>
        <Tabs
          indicatorColor="primary"
          textColor="inherit"
          value={activeTab}
          onChange={handleChange}
          TabIndicatorProps={{ style: { height: '0px' } }}
        >
          <Tab
            label={formatMessage(messages.statusesTabTitle)}
            className={cssClasses('tabs__tab', {
              'tabs__tab--active': activeTab === 'statuses',
              'tabs__tab--inactive': activeTab !== 'statuses',
            })}
            value="statuses"
          />
          <Tab
            label={formatMessage(messages.workloadTabTitle)}
            className={cssClasses('tabs__tab', {
              'tabs__tab--active': activeTab !== 'statuses',
              'tabs__tab--inactive': activeTab === 'statuses',
            })}
            value="workload"
          />
        </Tabs>
      </div>
      {activeTab === 'statuses' ? <DeviceList /> : null}
    </div>
  )
}

export default DeviceContainer
