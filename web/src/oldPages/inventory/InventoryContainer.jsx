import React, { useState, useEffect } from 'react'
import LaunchIcon from '@mui/icons-material/Launch'
import { defineMessages } from 'react-intl'
import { useLocation, useNavigate } from 'react-router-dom'
import useI18n from '../../hooks/useI18n'
import AspectButton from '../../oldComponents/shared/AspectButton'
import InventoryItemsList from './list/InventoryItemsList'
import InventoryLog from './log/InventoryLog'

const messages = defineMessages({
  suppliesNav: {
    id: 'pages.InventoryDashboard.suppliesNav',
    defaultMessage: 'Go To Supplies',
  },
  inventoryLogNav: {
    id: 'pages.InventoryDashboard.inventoryLogNav',
    defaultMessage: 'Go To Inventory Log',
  },
})

export const InventoryContainer = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { formatMessage } = useI18n()
  const [activeTab, setActiveTab] = useState('supplies')

  const handleChange = () => {
    setActiveTab(activeTab === 'supplies' ? 'log' : 'supplies')
    if (activeTab === 'supplies') {
      const searchParams = new URLSearchParams()
      searchParams.set('filters', new URLSearchParams(location.search).get('filters') || '')

      navigate({ ...location, search: `?${searchParams.toString()}` }, { replace: true })
    }
  }

  useEffect(() => {
    const searchParams = new URLSearchParams()
    searchParams.set('filters', new URLSearchParams(location.search).get('filters') || '')
    const filtersParams = new URLSearchParams(searchParams.get('filters'))
    if (!filtersParams.has('hasStock')) {
      filtersParams.set('hasStock', true)
      searchParams.set('filters', filtersParams)
      navigate({ ...location, search: `?${searchParams.toString()}` })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return activeTab === 'supplies' ? (
    <InventoryItemsList
      navigate={navigate}
      location={location}
      navButton={
        <AspectButton color="primary" variant="outlined" inverse endIcon={<LaunchIcon />} onClick={handleChange}>
          {formatMessage(messages.inventoryLogNav)}
        </AspectButton>
      }
    />
  ) : (
    <InventoryLog
      navigate={navigate}
      location={location}
      navButton={
        <AspectButton color="primary" variant="outlined" inverse endIcon={<LaunchIcon />} onClick={handleChange}>
          {formatMessage(messages.suppliesNav)}
        </AspectButton>
      }
    />
  )
}

export default InventoryContainer
