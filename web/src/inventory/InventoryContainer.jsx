import React from 'react'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'
import find from 'lodash/find'
import { defineMessages, useIntl } from 'react-intl'
import { Routes, Route, useLocation } from 'react-router-dom'
import classnames from 'classnames/bind'
import styles from './InventoryContainer.css'
import InventoryItemsList from './list/InventoryItemsList'

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

const currentTabStyle = (currentTab, index) =>
  currentTab === index ? 'tabs__tab--active' : 'tabs__tab--inactive'

export const InventoryContainer = ({ navigate, location }) => {
  const { formatMessage } = useIntl()
  const { pathname } = useLocation()
  const tabsConfig = {
    supplies: {
      path: './list/inventoryItemList',
      label: formatMessage(messages.suppliesTabTitle),
    },
    inventoryLog: {
      path: '/list/inventory-log',
      label: formatMessage(messages.inventoryLogTitle),
    },
  }
  const { path: currentTab } =
    find(tabsConfig, { path: pathname }) || tabsConfig.supplies

  return (
    <div className={cssClasses('Container')}>
      <div className={cssClasses('tabs__container')}>
        <Tabs
          indicatorColor="primary"
          textColor="inherit"
          value={currentTab}
          onChange={(e, v) => navigate(v)}
          TabIndicatorProps={{ style: { height: '0px' } }}
        >
          <Tab
            label={tabsConfig.supplies.label}
            className={cssClasses(
              'tabs__tab',
              currentTabStyle(currentTab, tabsConfig.supplies.path)
            )}
            value={tabsConfig.supplies.path}
          />
          <Tab
            label={tabsConfig.inventoryLog.label}
            className={cssClasses(
              'tabs__tab',
              currentTabStyle(currentTab, tabsConfig.inventoryLog.path)
            )}
            value={tabsConfig.inventoryLog.path}
          />
        </Tabs>
      </div>
      <Routes>
        <Route path="">
          <InventoryItemsList navigate={navigate} location={location} />
          <h1>Put here screen component</h1>
        </Route>
        <Route path="inventory-log">
          <h1>Put here screen two component</h1>
        </Route>
      </Routes>
    </div>
  )
}

export default InventoryContainer
