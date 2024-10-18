import React, { useMemo } from 'react'
import { Table, TableBody, TableRow } from '@mui/material'
import format from 'date-fns/format'
import { useIntl } from 'react-intl'
import { useLocation } from 'react-router'
import useAuthState from '../../../hooks/useAuthState'
import { DataTableCell } from '../../../oldComponents/shared/tableBody'
import DataTableHead from '../../../oldComponents/shared/tableHead'
import { getColumns } from './tools'

export function InventoryReconciliationList(props) {
  const { items, sortDir, sortCol, breakOutByLot } = props
  const user = useAuthState()
  const { formatMessage } = useIntl()
  const columns = useMemo(
    () => getColumns(formatMessage, [true, 'true'].includes(breakOutByLot), user),
    [formatMessage, breakOutByLot, user]
  )
  const location = useLocation()
  return (
    <Table>
      <DataTableHead location={location} sortColumnKey={sortCol} sortColumnDir={sortDir} columns={columns} />
      <TableBody>
        {items.map((item, index) => (
          <TableRow
            sx={{ bgcolor: index % 2 ? '#fff' : '#eef1f8' }}
            key={`${item.siteName}-${item.consumableName}${item.lotNumber ? `-${item.lotNumber}` : ''}`}
          >
            <DataTableCell>{item.stateName}</DataTableCell>
            <DataTableCell>{item.lgaName}</DataTableCell>
            <DataTableCell>{item.siteName}</DataTableCell>
            <DataTableCell>{item.consumableName}</DataTableCell>
            {breakOutByLot ? (
              <>
                <DataTableCell>{item.expiresOn ? format(new Date(item.expiresOn), 'yyyy-MM-dd') : null}</DataTableCell>
                <DataTableCell>{item.lotNumber}</DataTableCell>
              </>
            ) : null}
            <DataTableCell>{item.quantity}</DataTableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
