import React, { useState } from 'react'
import { Box, Tabs, Tab, Typography } from '@mui/material'
import { useIntl } from 'react-intl'
import { ConsumptionRate } from './ConsumptionRate.jsx'
import messages from './messages'
import { TrackByLocation } from './TrackByLocation'

function TabPanel(props) {
  const { children, value, index, ...other } = props

  return (
    <div role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`} aria-labelledby={`tab-${index}`} {...other}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  )
}

export const InventoryTabs = ({ consumableId, siteIds }) => {
  const [tabValue, setTabValue] = useState(0)
  const { formatMessage } = useIntl()

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Tabs Navigation */}
      <Tabs value={tabValue} onChange={handleTabChange} aria-label="Tabs example">
        <Tab
          sx={{ textTransform: 'none' }}
          label={formatMessage(messages.trackByLocation)}
          id="tab-0"
          aria-controls="tabpanel-0"
        />
        <Tab
          sx={{ textTransform: 'none' }}
          label={formatMessage(messages.consumpationRate)}
          id="tab-1"
          aria-controls="tabpanel-1"
        />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <h4>Location with this Item</h4>
        <Typography>Select all Locations to track inventory for this item</Typography>
        <TrackByLocation consumableId={consumableId} siteIds={siteIds} />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <ConsumptionRate consumableId={consumableId} />
      </TabPanel>
    </Box>
  )
}
