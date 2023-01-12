import React, { useState, useEffect } from 'react'
import { Tab, Tabs } from '@mui/material'
import classnames from 'classnames/bind'
import { defineMessages } from 'react-intl'
import { useLocation, useNavigate } from 'react-router-dom'
import useI18n from '../../hooks/useI18n'
import styles from './InventoryContainer.css'
import InventoryItemsList from './list/InventoryItemsList'
import InventoryLog from './log/InventoryLog'

const cssClasses = classnames.bind(styles)

const messages = defineMessages({
  suppliesTabTitle: {
    id: 'pages.InventoryDashboard.SuppliesTabTitle',
    defaultMessage: 'Supplies',
  },
  inventoryLogTitle: {
    id: 'pages.InventoryDashboard.inventoryLogTitle',
    defaultMessage: 'Inventory Log',
  },
})

export const InventoryContainer = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('supplies')
  const { formatMessage } = useI18n()
  const tabsConfig = {
    supplies: {
      path: 'supplies',
      label: formatMessage(messages.suppliesTabTitle),
    },
    inventoryLog: {
      path: 'log',
      label: formatMessage(messages.inventoryLogTitle),
    },
  }

  const handleChange = (e, v) => {
    setActiveTab(v)
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

  return (
    <div className={cssClasses('Container')}>
      <Tabs value={activeTab} onChange={handleChange}>
        <Tab label={tabsConfig.supplies.label} value={tabsConfig.supplies.path} />
        <Tab label={tabsConfig.inventoryLog.label} value={tabsConfig.inventoryLog.path} />
      </Tabs>
      {activeTab === 'supplies' ? (
        <InventoryItemsList navigate={navigate} location={location} />
      ) : (
        <InventoryLog navigate={navigate} location={location} />
      )}
    </div>
  )
}

export default InventoryContainer
