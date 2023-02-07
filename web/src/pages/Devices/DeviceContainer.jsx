import React, { useState } from 'react'
import LaunchIcon from '@mui/icons-material/Launch'
import { defineMessages } from 'react-intl'
import { useLocation, useNavigate } from 'react-router-dom'
import useI18n from '../../hooks/useI18n'
import AspectButton from '../../oldComponents/shared/AspectButton'
import DeviceList from './Status/DeviceList'
import Workload from './Workload'

const messages = defineMessages({
  statusesNav: {
    id: 'pages.DeviceDashboard.statusesNav',
    defaultMessage: 'Go To Statuses',
  },
  workloadNav: {
    id: 'pages.DeviceDashboard.workloadNav',
    defaultMessage: 'Go To Workload',
  },
})

export const DeviceContainer = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { formatMessage } = useI18n()
  const [activeTab, setActiveTab] = useState('statuses')

  const handleChange = () => {
    setActiveTab(activeTab === 'statuses' ? 'workload' : 'statuses')
    if (activeTab === 'statuses') {
      const searchParams = new URLSearchParams()
      searchParams.set('filters', new URLSearchParams(location.search).get('filters') || '')

      navigate({ ...location, search: `?${searchParams.toString()}` }, { replace: true })
    }
  }

  return activeTab === 'statuses' ? (
    <DeviceList
      navButton={
        <AspectButton color="primary" variant="outlined" inverse endIcon={<LaunchIcon />} onClick={handleChange}>
          {formatMessage(messages.workloadNav)}
        </AspectButton>
      }
    />
  ) : (
    <Workload
      navButton={
        <AspectButton color="primary" variant="outlined" inverse endIcon={<LaunchIcon />} onClick={handleChange}>
          {formatMessage(messages.statusesNav)}
        </AspectButton>
      }
    />
  )
}

export default DeviceContainer
