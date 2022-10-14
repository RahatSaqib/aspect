import React, { useState } from 'react'
import { Tab, Tabs } from '@mui/material'
import { defineMessages } from 'react-intl'
import useI18n from '../../hooks/useI18n'
import DeviceList from '../../oldPages/device/list/DeviceList'
import Workload from './Workload'

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
  const { formatMessage } = useI18n()
  const [activeTab, setActiveTab] = useState('statuses')

  return (
    <div>
      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
        <Tab label={formatMessage(messages.statusesTabTitle)} value="statuses" />
        <Tab label={formatMessage(messages.workloadTabTitle)} value="workload" />
      </Tabs>
      {activeTab === 'statuses' ? <DeviceList /> : <Workload />}
    </div>
  )
}

export default DeviceContainer
