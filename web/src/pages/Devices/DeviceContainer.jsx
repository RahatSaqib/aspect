import React, { useState } from 'react'
import { defineMessages } from 'react-intl'
import { useLocation, useNavigate } from 'react-router-dom'
import useI18n from '../../hooks/useI18n'
import ColoredButton from '../../oldComponents/themedReactToolbox/ColoredButton'
import DeviceList from './List/DeviceList'
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
      navButton={<ColoredButton mountain onClick={handleChange} label={formatMessage(messages.workloadNav)} />}
    />
  ) : (
    <Workload
      navButton={<ColoredButton mountain onClick={handleChange} label={formatMessage(messages.statusesNav)} />}
    />
  )
}

export default DeviceContainer
