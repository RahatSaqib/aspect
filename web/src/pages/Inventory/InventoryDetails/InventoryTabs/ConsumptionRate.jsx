import React from 'react'
import { Box, Table, TableBody, TableCell, CircularProgress, TableRow } from '@mui/material'
import { useIntl } from 'react-intl'
import { useLocation, useNavigate } from 'react-router'
import DataTableHead from '../../../../components/shared/tableHead'
import { useConsumableAssay } from '../../../../hooks/inventory/useConsumable'
import styles from './InventoryTabs.module.css'
import messages from './messages'

export const ConsumptionRate = ({ consumableId }) => {
  const { formatMessage } = useIntl()
  const { data: { data } = {}, isLoading } = useConsumableAssay(consumableId)
  const location = useLocation()
  const navigate = useNavigate()
  const tableColumns = [
    { key: 'name', label: formatMessage(messages.assay), sortable: false },
    { key: 'trackByDate', label: formatMessage(messages.quantity), sortable: false },
  ]

  return isLoading ? (
    <CircularProgress />
  ) : (
    <Box sx={{ width: '100%' }}>
      <h4>{formatMessage(messages.headerText)}</h4>
      <div>{formatMessage(messages.definitionText)}</div>
      <Table className={styles.SiteDataTable}>
        <DataTableHead navigate={navigate} location={location} columns={tableColumns} />
        <TableBody>
          {data?.map(row => (
            <TableRow key={row}>
              <TableCell>{row.assayName}</TableCell>
              <TableCell>{row.quantity}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}
