import React, { useEffect, useState } from 'react'
import { Card, CardContent, LinearProgress, Table, TableBody, TableCell, TableRow } from '@mui/material'
import classnames from 'classnames/bind'
import { Helmet } from 'react-helmet'
import { useLocation, useNavigate } from 'react-router'
import DetailHeader from '../../../cleanComponents/DetailHeader'
import AspectExportListButton from '../../../components/AspectExportListButton'
import useInventoryTransferDownload from '../../../hooks/inventory/useInventoryTransferDownload'
import useInventoryTransferList from '../../../hooks/inventory/useInventoryTransferList'
import useI18n from '../../../hooks/useI18n'
import consumables from '../../../messages/consumableMessages'
import BrowseEmptyList from '../../../oldComponents/BrowseEmptyList'
import BrowseTablePaginator from '../../../oldComponents/BrowseTablePaginator'
import DataTableHead from '../../../oldComponents/shared/tableHead'
import { makeSortPageSelector } from '../../../utils/selectors/searchParams'
import { formatDateTime } from '../../../utils/utils/dateFormat'
import messages from './messages'
import styles from './styles.css'

const cssClasses = classnames.bind(styles)

// const FILTERS_CONFIG = [
//   { state: true, requiredPermissions: [] },
//   { lga: true, requiredPermissions: [] },
//   { date: true, requiredPermissions: [] },
//   { siteName: true, requiredPermissions: [] },
//   { reportableSiteName: true, requiredPermissions: [] },
//   { consumable: true, requiredPermissions: [] },
// ]

export const InventoryTransfers = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { formatMessage } = useI18n()
  const [download, setDownload] = useState({ fileFormat: '', enabled: false })

  const { sortCol, sortDir, pageAt, pageSize } = makeSortPageSelector({ sortCol: 'originSiteName' })({ location })

  const { data, isLoading } = useInventoryTransferList(
    {
      sortCol,
      sortDir,
      // ...(filters.consumableId ? { consumableName: filters.consumableId } : {}),
      // ...(filters.siteName ? { originSiteName: filters.siteName } : {}),
      // ...(filters.reportableSiteName ? { destinationSiteName: filters.reportableSiteName } : {}),
    },
    { enabled: !!sortCol }
  )

  useInventoryTransferDownload({
    // ...(filters.consumableId ? { consumableName: filters.consumableId } : {}),
    // ...(filters.siteName ? { originSiteName: filters.siteName } : {}),
    // ...(filters.reportableSiteName ? { destinationSiteName: filters.reportableSiteName } : {}),
    ...download,
  })

  useEffect(() => {
    if (download.enabled) setDownload({ fileFormat: '', enabled: false })
  }, [download])

  const tableColumns = [
    { key: 'sentOn', label: formatMessage(messages.sentOn), sortable: true },
    { key: 'receivedOn', label: formatMessage(messages.receivedOn), sortable: true },
    { key: 'consumableName', label: formatMessage(messages.consumableName), sortable: true },
    { key: 'receivedQuantity', label: formatMessage(messages.receivedQuantity), sortable: true },
    { key: 'sentQuantity', label: formatMessage(messages.sentQuantity), sortable: true },
    { key: 'originSiteName', label: formatMessage(messages.originSiteName), sortable: true },
    { key: 'destinationSiteName', label: formatMessage(messages.destinationSiteName), sortable: true },
    { key: 'lotNumber', label: formatMessage(messages.lotNumber), sortable: true },
    { key: 'expirationDate', label: formatMessage(messages.expirationDate), sortable: true },
  ]

  const onExcelClick = formatType => {
    setDownload({ fileFormat: formatType, enabled: true })
  }

  return (
    <>
      <DetailHeader name={formatMessage(messages.InventoryTransferTitle)} disableBack />
      <div className={cssClasses('Container')}>
        <Helmet title={formatMessage(messages.InventoryTransferTitle)} />
        <Card>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
              <AspectExportListButton onExport={onExcelClick} visible />
            </div>
            {isLoading ? (
              <LinearProgress />
            ) : data.data.length === 0 ? (
              <BrowseEmptyList />
            ) : (
              <>
                <Table className={cssClasses('SiteDataTable')}>
                  <DataTableHead
                    navigate={navigate}
                    location={location}
                    sortColumnKey={sortCol}
                    sortColumnDir={sortDir}
                    columns={tableColumns}
                  />
                  <TableBody>
                    {data.data.map(row => (
                      <TableRow key={row.sentOn}>
                        <TableCell>{formatDateTime(row.sentOn, 'N/A')}</TableCell>
                        <TableCell>{formatDateTime(row.receivedOn, 'N/A')}</TableCell>
                        <TableCell>{formatMessage(consumables[row.consumableNameI18nKey])}</TableCell>
                        <TableCell>{row.sentQuantity}</TableCell>
                        <TableCell>{row.receivedQuantity}</TableCell>
                        <TableCell>{row.originSiteName}</TableCell>
                        <TableCell>{row.destinationSiteName}</TableCell>
                        <TableCell>{row.lotNumber}</TableCell>
                        <TableCell>{formatDateTime(row.expirationDate, 'N/A')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <BrowseTablePaginator
                  navigate={navigate}
                  location={location}
                  paginatorStatus={messages.paginatorStatus}
                  total={data.total}
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

export default InventoryTransfers
