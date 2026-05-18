import React, { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  LinearProgress,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { useLocation, useNavigate } from 'react-router'
import { DetailHeader, InventoryTransferFilter } from '../../../components'
import AspectExportListButton from '../../../components/AspectExportListButton'
import BrowseEmptyList from '../../../components/BrowseEmptyList'
import BrowseTablePaginator from '../../../components/BrowseTablePaginator'
import {
  HierarchicalView,
  hierarchicalToggleSettingsLocalStorageKey,
  useHierarchicalSwitch,
} from '../../../components/HierarchicalSiteView'
import DataTableHead from '../../../components/shared/tableHead'
import useInventoryTransferDownload from '../../../hooks/inventory/useInventoryTransferDownload'
import useInventoryTransferList from '../../../hooks/inventory/useInventoryTransferList'
import usePartner from '../../../hooks/partner/usePartner'
import useAuthState from '../../../hooks/useAuthState'
import useFilterValues from '../../../hooks/useFilterValues'
import consumables from '../../../messages/consumableMessages'
import { makeSortPageSelector } from '../../../utils/selectors/searchParams'
import { formatDateTime } from '../../../utils/utils/dateFormat'
import { strategyRequireExpirationDate, strategyRequireLot } from '../strategyHelper'
import messages from './messages'
import styles from './styles.module.css'

const InventoryTransfers = () => {
  const user = useAuthState()
  const location = useLocation()
  const navigate = useNavigate()
  const { formatMessage } = useIntl()
  const filter = useFilterValues(location.pathname)

  const { isLoadingPartner, data: partner } = usePartner()
  const requireExpirationDate = strategyRequireExpirationDate(partner?.inventoryStrategy)
  const requireLotNumber = strategyRequireLot(partner?.inventoryStrategy)

  const [download, setDownload] = useState({ fileFormat: '', enabled: false })
  const {
    isHierarchicalView,
    setIsHierarchicalView,
    isWarehouseView,
    setIsWarehouseView,
    selectedSiteIds,
    setSelectedSiteIds,
  } = useHierarchicalSwitch({
    localStorageKey: hierarchicalToggleSettingsLocalStorageKey.INVENTORY_TRANSFERS,
  })

  // Disabling the filters since we don't have the filters on warehouse level
  const disableFilters = isHierarchicalView && isWarehouseView

  const transferApiFilters = disableFilters ? { originSiteIds: selectedSiteIds.join(',') } : filter

  const { sortCol, sortDir, pageAt, pageSize } = makeSortPageSelector({ sortCol: 'originSiteName' })({ location })

  const { data, isLoading } = useInventoryTransferList(
    { sortCol, sortDir, ...transferApiFilters },
    { enabled: !!sortCol }
  )

  useInventoryTransferDownload({ ...download, ...filter })

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
    { key: 'lotNumber', label: formatMessage(messages.lotNumber), sortable: true, isHidden: !requireLotNumber },
    {
      key: 'expirationDate',
      label: formatMessage(messages.expirationDate),
      sortable: true,
      isHidden: !requireExpirationDate,
    },
  ]

  const onExcelClick = formatType => {
    setDownload({ fileFormat: formatType, enabled: true })
  }

  return (
    <>
      <DetailHeader name={formatMessage(messages.InventoryTransferTitle)} disableBack />
      <div className={styles.Container}>
        <Helmet title={formatMessage(messages.InventoryTransferTitle)} />
        <InventoryTransferFilter disabled={disableFilters} />
        <Stack sx={{ flexDirection: 'row', width: '100%', gap: 1 }}>
          {isHierarchicalView && (
            <HierarchicalView
              countryId={user.countryId}
              filters={filter}
              pathname="/browse/inventory/transfers"
              filterMaps={{ siteName: 'originSiteName' }}
              isWarehouseView={isWarehouseView}
              setIsWarehouseView={setIsWarehouseView}
              setSelectedSiteIds={setSelectedSiteIds}
            />
          )}
          <Card sx={{ width: '100%' }}>
            <CardContent>
              <Stack sx={{ flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2" color="textSecondary">
                  <Switch
                    checked={isHierarchicalView}
                    onChange={event => setIsHierarchicalView(event.currentTarget.checked)}
                  />
                  {formatMessage(messages.hierarchicalView)}
                </Typography>
                <AspectExportListButton onExport={onExcelClick} visible />
              </Stack>
              {isLoading || isLoadingPartner ? (
                <LinearProgress />
              ) : data.data.length === 0 ? (
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
                      {data.data.map(row => (
                        <TableRow key={row.sentOn}>
                          <TableCell>{formatDateTime(row.sentOn)}</TableCell>
                          <TableCell>
                            {row.receivedOn ? formatDateTime(row.receivedOn) : formatMessage(messages.notAvailable)}
                          </TableCell>
                          <TableCell>{formatMessage(consumables[row.consumableNameI18nKey])}</TableCell>
                          <TableCell>{row.receivedQuantity || formatMessage(messages.notAvailable)}</TableCell>
                          <TableCell>{row.sentQuantity}</TableCell>
                          <TableCell>{row.originSiteName}</TableCell>
                          <TableCell>{row.destinationSiteName || formatMessage(messages.notAvailable)}</TableCell>
                          {requireLotNumber ? (
                            <TableCell>{row.lotNumber || formatMessage(messages.notAvailable)}</TableCell>
                          ) : null}
                          {requireExpirationDate ? (
                            <TableCell style={{ color: new Date(row.expirationDate) < new Date() ? 'red' : undefined }}>
                              {row.expirationDate
                                ? row.expirationDate.split('T')[0]
                                : formatMessage(messages.notAvailable)}
                            </TableCell>
                          ) : null}
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
        </Stack>
      </div>
    </>
  )
}

export default InventoryTransfers
