import React, { useState } from 'react'
import { Tab, Tabs } from '@mui/material'
import { defineMessages } from 'react-intl'
import { useLocation, useNavigate } from 'react-router-dom'
import useI18n from '../../hooks/useI18n'
import DeviceList from './List/DeviceList'
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
  const location = useLocation()
  const navigate = useNavigate()
  const { formatMessage } = useI18n()
  const [activeTab, setActiveTab] = useState('statuses')

  const handleChange = (e, v) => {
    setActiveTab(v)
    if (v === 'statuses') {
      const searchParams = new URLSearchParams()
      searchParams.set('filters', new URLSearchParams(location.search).get('filters') || '')

      navigate({ ...location, search: `?${searchParams.toString()}` }, { replace: true })
    }
  }

  return (
    <div>
      <Tabs value={activeTab} onChange={handleChange}>
        <Tab label={formatMessage(messages.statusesTabTitle)} value="statuses" />
        <Tab label={formatMessage(messages.workloadTabTitle)} value="workload" />
      </Tabs>
      {activeTab === 'statuses' ? <DeviceList /> : <Workload />}
    </div>
  )
}

export default DeviceContainer
