import React from 'react'
import { Box, Card, CardContent, Tab, Tabs } from '@mui/material'
import { useIntl } from 'react-intl'
import messages from '../messages'
import { InventoryDetailsForm } from './InventoryDetailsForm'
import { InventoryReconciliationForm } from './InventoryReconciliationForm'

function TabPanel(props) {
  const { children, value, index, ...other } = props

  return (
    <div role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`} aria-labelledby={`tab-${index}`} {...other}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  )
}

export const InventoryForm = ({ data, cartridgeId, setTabValue, tabValue, hasPermission }) => {
  const { formatMessage } = useIntl()

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  return (
    <Card>
      <CardContent>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="Inventory tabs">
          <Tab
            sx={{ textTransform: 'none' }}
            label={formatMessage(messages.inventoryDetails)}
            id="tab-0"
            aria-controls="tabpanel-0"
          />
          {hasPermission ? (
            <Tab
              sx={{ textTransform: 'none' }}
              label={formatMessage(messages.reconciliationConfiguration)}
              id="tab-1"
              aria-controls="tabpanel-1"
            />
          ) : null}
        </Tabs>
        <TabPanel value={tabValue} index={0}>
          <InventoryDetailsForm data={data} cartridgeId={cartridgeId} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <InventoryReconciliationForm cartridge={data} />
        </TabPanel>
      </CardContent>
    </Card>
  )
}
