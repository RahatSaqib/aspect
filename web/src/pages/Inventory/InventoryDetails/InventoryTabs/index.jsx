import React, { useState } from 'react'
import { Box, Tab, Tabs, Typography } from '@mui/material'
import { useIntl } from 'react-intl'
import AspectTooltip from '../../../../components/shared/AspectTooltip'
import { ConsumptionRate } from './ConsumptionRate.jsx'
import messages from './messages'
import { SitesByConsumable } from './SitesByConsumable'

function TabPanel(props) {
  const { children, value, index, ...other } = props

  return (
    <div role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`} aria-labelledby={`tab-${index}`} {...other}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  )
}

export const InventoryTabs = ({ consumableId, siteIds, disabledSites }) => {
  const [tabValue, setTabValue] = useState(0)
  const { formatMessage } = useIntl()

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Tabs Navigation */}
      <Tabs value={tabValue} onChange={handleTabChange} aria-label="Inventory tabs">
        <Tab
          sx={{ textTransform: 'none' }}
          label={formatMessage(messages.sitesByConsumable)}
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
        <Box display="flex" alignItems="center">
          <h4>{formatMessage(messages.locationsWithThisItem)}</h4>
          <AspectTooltip showHelpIcon title={formatMessage(messages.sitesByConsumableTooltip)} />
        </Box>
        <Typography>{formatMessage(messages.selectAllLocations)}</Typography>
        <SitesByConsumable consumableId={consumableId} disabledSites={disabledSites} siteIds={siteIds} />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <ConsumptionRate consumableId={consumableId} />
      </TabPanel>
    </Box>
  )
}
