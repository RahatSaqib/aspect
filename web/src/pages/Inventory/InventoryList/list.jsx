import React from 'react'
import { Card, CardContent, LinearProgress, Table, TableBody } from '@mui/material'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { useLocation, useNavigate } from 'react-router'
import BrowseEmptyList from '../../../components/BrowseEmptyList'
import BrowseTablePaginator from '../../../components/BrowseTablePaginator'
import { DataTableCell as TableCell, DataTableRow as TableRow } from '../../../components/shared/tableBody'
import DataTableHead from '../../../components/shared/tableHead'
import { useConsumable } from '../../../hooks/inventory/useConsumable'
import useFilterValues from '../../../hooks/useFilterValues'
import { makeSortPageSelector } from '../../../utils/selectors/searchParams'
import { gotoWithReturnUrl } from '../../../utils/utils/browser'
import messages from './messages'
import styles from './styles.module.css'

const InventoryList = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { formatMessage } = useIntl()

  const filters = useFilterValues(location.pathname)

  const { sortCol, sortDir, pageAt, pageSize } = makeSortPageSelector({ sortCol: 'name' })({ location })

  const { data: { data: consumables, total } = {}, isLoading } = useConsumable(
    { sortCol, sortDir, pageAt, pageSize, filters },
    { enabled: !!sortCol }
  )

  const tableColumns = [
    { key: 'name', label: formatMessage(messages.inventoryItemName), sortable: true },
    { key: 'trackByBatch', label: formatMessage(messages.trackByBatch), sortable: false },
    { key: 'locationTracking', label: formatMessage(messages.locationTracking), sortable: false },
    { key: 'quantityOnHand', label: formatMessage(messages.totalOnHand), sortable: true },
    { key: 'unit', label: formatMessage(messages.unit), sortable: true },
  ]

  return (
    <>
      <div className={styles.Container}>
        <Helmet title={formatMessage(messages.inventoryItems)} />
        <Card>
          <CardContent>
            {isLoading ? (
              <LinearProgress />
            ) : consumables?.length === 0 ? (
              <BrowseEmptyList />
            ) : (
              <>
                <Table className={styles.SiteDataTable}>
                  <DataTableHead
                    navigate={navigate}
                    location={location}
                    sortColumnKey={sortCol}
                    sortColumnDir={sortDir}
                    columns={tableColumns}
                  />
                  <TableBody>
                    {consumables?.map(row => (
                      <TableRow
                        key={row.id}
                        onClick={e => {
                          gotoWithReturnUrl(
                            `/browse/admin/inventory-list/${e.currentTarget.dataset.cartridgeId}`,
                            navigate,
                            location
                          )
                        }}
                        data-cartridge-id={row.id}
                      >
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.canExpire ? 'Yes' : 'No'}</TableCell>
                        <TableCell>{row.totalConsumablesTracked}</TableCell>
                        <TableCell>{row.quantityOnHand}</TableCell>
                        <TableCell>{row.unit}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <BrowseTablePaginator
                  navigate={navigate}
                  location={location}
                  paginatorStatus={messages.paginatorStatus}
                  total={total}
                  pageAt={pageAt}
                  pageSize={pageSize}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default InventoryList
