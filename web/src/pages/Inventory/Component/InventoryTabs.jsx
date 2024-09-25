import React, { useState } from 'react'
import { Box, Tabs, Tab, Typography, Table, TableBody, TableCell, TableRow } from '@mui/material'
import { useIntl } from 'react-intl'
import { useLocation, useNavigate } from 'react-router'
import DataTableHead from '../../../oldComponents/shared/tableHead'
import styles from './InventoryTabs.module.css'
import messages from './messages'

function TabPanel(props) {
  const { children, value, index, ...other } = props

  return (
    <div role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`} aria-labelledby={`tab-${index}`} {...other}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  )
}

export default function TabsWithDynamicList() {
  const [tabValue, setTabValue] = useState(0)
  const { formatMessage } = useIntl()
  const location = useLocation()
  const navigate = useNavigate()

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  const tableColumns = [
    { key: 'name', label: formatMessage(messages.assay), sortable: false },
    { key: 'trackByDate', label: formatMessage(messages.quantity), sortable: false },
  ]

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
        <Typography>Form or other content can go here.</Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <h4>{formatMessage(messages.headerText)}</h4>
        <div>{formatMessage(messages.definitionText)}</div>
        <Table className={styles.SiteDataTable}>
          <DataTableHead navigate={navigate} location={location} columns={tableColumns} />
          <TableBody>
            {[{ name: 'GeneXpert Ebola Result', quantity: 4 }].map(row => (
              <TableRow key={row}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.quantity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabPanel>
    </Box>
  )
}
