import React, { useMemo } from 'react'
import { Table, TableBody, TableRow } from '@mui/material'
import isNil from 'lodash/isNil'
import omitBy from 'lodash/omitBy'
import { useIntl } from 'react-intl'
import { useLocation } from 'react-router'
import { useNavigate } from 'react-router-dom'
import useAuthState from '../../../hooks/useAuthState'
import useFilterUpdate from '../../../hooks/useFilterUpdate'
import { DataTableCell } from '../../../oldComponents/shared/tableBody'
import DataTableHead from '../../../oldComponents/shared/tableHead'
import { formatDate } from '../../../utils/utils/dateFormat'
import messages from './messages'
import { getColumns } from './tools'

export function InventoryReconciliationList(props) {
  const { items, sortDir, sortCol, breakOutByLot, requireLotNumber, requireExpirationDate } = props
  const [addFilter] = useFilterUpdate()
  const navigate = useNavigate()
  const user = useAuthState()
  const { formatMessage } = useIntl()
  const columns = useMemo(
    () => getColumns(formatMessage, { breakOutByLot, requireLotNumber, requireExpirationDate, user }),
    [formatMessage, breakOutByLot, requireLotNumber, requireExpirationDate, user]
  )
  const location = useLocation()

  return (
    <Table>
      <DataTableHead location={location} sortColumnKey={sortCol} sortColumnDir={sortDir} columns={columns} />
      <TableBody>
        {items.map((item, index) => (
          <TableRow key={index} sx={{ bgcolor: index % 2 ? '#fff' : '#eef1f8' }}>
            <DataTableCell>{item.stateName}</DataTableCell>
            <DataTableCell>{item.lgaName}</DataTableCell>
            <DataTableCell>{item.siteName}</DataTableCell>
            <DataTableCell>{item.consumableName}</DataTableCell>
            {breakOutByLot ? (
              <>
                {requireExpirationDate ? (
                  <DataTableCell>
                    {item.expiresOn ? formatDate(item.expiresOn) : formatMessage(messages.notAvailable)}
                  </DataTableCell>
                ) : null}
                {requireLotNumber ? (
                  <DataTableCell>
                    {item.lotNumber ? item.lotNumber : formatMessage(messages.notAvailable)}
                  </DataTableCell>
                ) : null}
              </>
            ) : null}
            <DataTableCell
              onClick={() => {
                if (item.quantity) {
                  addFilter(
                    omitBy(
                      {
                        onlyUnreconciled: true,
                        countryId: user.countryId,
                        assayId: item.assayId,
                        stateId: item.stateId,
                        lgaId: item.lgaId,
                        siteName: item.siteName,
                        expiresOn: item.expiresOn,
                        lotNumber: item.lotNumber,
                      },
                      isNil
                    ),
                    '/browse/result'
                  )
                  navigate('/browse/result')
                }
              }}
              sx={item.quantity ? { cursor: 'pointer', color: 'blue', textDecoration: 'underline' } : {}}
            >
              {item.quantity}
            </DataTableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
