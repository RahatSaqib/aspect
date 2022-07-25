import React, { useState } from 'react'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'
import { defineMessages, useIntl } from 'react-intl'
import classnames from 'classnames/bind'
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
const currentTabStyle = (currentTab, activeTab) =>
  currentTab === activeTab ? 'tabs__tab--active' : 'tabs__tab--inactive'

export const InventoryContainer = ({ navigate, location }) => {
  const [activeTab, setActiveTab] = useState('supplies')
  const { formatMessage } = useIntl()
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
            label={tabsConfig.supplies.label}
            className={cssClasses('tabs__tab', currentTabStyle('supplies', activeTab))}
            value={tabsConfig.supplies.path}
          />
          <Tab
            label={tabsConfig.inventoryLog.label}
            className={cssClasses('tabs__tab', currentTabStyle('log', activeTab))}
            value={tabsConfig.inventoryLog.path}
          />
        </Tabs>
      </div>
      {activeTab === 'supplies' ? (
        <InventoryItemsList navigate={navigate} location={location} />
      ) : (
        <InventoryLog navigate={navigate} location={location} />
      )}
    </div>
  )
}

export default InventoryContainer
