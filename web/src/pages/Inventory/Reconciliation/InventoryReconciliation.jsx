import React, { useCallback, useMemo } from 'react'
import { Box, Card, LinearProgress, Stack, Switch, Table, TableBody, TableRow, Typography } from '@mui/material'
import format from 'date-fns/format'
import isNil from 'lodash/isNil'
import omitBy from 'lodash/omitBy'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { useLocation, useNavigate } from 'react-router'
import DetailHeader from '../../../cleanComponents/DetailHeader'
import { InventoryReconciliationFilter } from '../../../cleanComponents/Filter'
import {
  HierarchicalSiteView,
  hierarchicalToggleSettingsLocalStorageKey,
  useHierarchicalSwitch,
} from '../../../cleanComponents/HierarchicalSiteView'
import AspectExportListButton from '../../../components/AspectExportListButton'
import useInventoryReconciliation from '../../../hooks/inventory/useInventoryReconciliation'
import useAuthState from '../../../hooks/useAuthState'
import { usePathFilter } from '../../../hooks/usePathFilter'
import BrowseEmptyList from '../../../oldComponents/BrowseEmptyList'
import BrowseTablePaginator from '../../../oldComponents/BrowseTablePaginator'
import { DataTableCell } from '../../../oldComponents/shared/tableBody'
import DataTableHead from '../../../oldComponents/shared/tableHead'
import { makeSortPageSelector } from '../../../utils/selectors/searchParams'
import messages from './messages'
import { getColumns, getExportableFile } from './tools'

export function InventoryReconciliation() {
  const { formatMessage } = useIntl()
  const user = useAuthState()
  const location = useLocation()
  const navigate = useNavigate()
  const [filters, setFilters] = usePathFilter()
  const [isHierarchicalView, setIsHierarchicalView] = useHierarchicalSwitch({
    localStorageKey: hierarchicalToggleSettingsLocalStorageKey.INVENTORY_RECONCILIATION,
  })
  const { sortCol, sortDir, pageAt, pageSize } = useMemo(
    () => makeSortPageSelector({ sortCol: 'siteName' })({ location }),
    [location]
  )
  const columns = useMemo(
    () => getColumns(formatMessage, [true, 'true'].includes(filters.breakOutByLot), user),
    [formatMessage, filters.breakOutByLot, user]
  )
  const { data, isLoading } = useInventoryReconciliation(
    omitBy({ sortCol, sortDir, page: pageAt, size: pageSize, ...filters }, isNil)
  )
  const handleExport = useCallback(
    formatType =>
      getExportableFile(omitBy(filters, isNil), formatType, sortCol, sortDir, data?.data?.length, 'reconciliation'),
    [data?.data?.length, filters, sortCol, sortDir]
  )

  return (
    <>
      <DetailHeader name={formatMessage(messages.inventoryReconciliation)} disableBack />
      <Helmet title={formatMessage(messages.inventoryReconciliation)} />
      <Box sx={{ width: '100%', p: '10px' }}>
        <InventoryReconciliationFilter />
        <Stack sx={{ flexDirection: 'row', gap: 1, width: '100%' }}>
          {isHierarchicalView ? (
            <HierarchicalSiteView countryId={user.countryId} filters={filters} pathname={location.pathname} />
          ) : null}
          <Card sx={{ p: '20px', flex: 1 }}>
            <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2" color="textSecondary">
                <Switch
                  checked={isHierarchicalView}
                  onChange={event => setIsHierarchicalView(event.currentTarget.checked)}
                />
                {formatMessage(messages.hierarchicalView)}
              </Typography>

              <Stack sx={{ flexDirection: 'row', gap: 1 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  <Switch
                    checked={[true, 'true'].includes(filters.breakOutByLot)}
                    onChange={e => {
                      const value = e.target.checked || null
                      setFilters(prev => ({
                        ...prev,
                        ...(!value ? { minDate: null, maxDate: null, lotNumber: null } : {}),
                        breakOutByLot: value,
                      }))
                    }}
                  />
                  {formatMessage(messages.breakdownByLots)}
                </Typography>
                <AspectExportListButton
                  onExport={handleExport}
                  reportName="Reconciliation"
                  visible={data?.data?.length !== 0}
                />
              </Stack>
            </Stack>
            {isLoading ? (
              <LinearProgress />
            ) : !data || !data?.data || data?.data?.length === 0 ? (
              <BrowseEmptyList />
            ) : (
              <>
                <Table>
                  <DataTableHead
                    location={location}
                    sortColumnKey={sortCol}
                    sortColumnDir={sortDir}
                    columns={columns}
                  />
                  <TableBody>
                    {data.data.map((item, index) => (
                      <TableRow
                        sx={{ bgcolor: index % 2 ? '#fff' : '#eef1f8' }}
                        key={`${item.siteName}-${item.consumableName}${item.lotNumber ? `-${item.lotNumber}` : ''}`}
                      >
                        <DataTableCell>{item.stateName}</DataTableCell>
                        <DataTableCell>{item.lgaName}</DataTableCell>
                        <DataTableCell>{item.siteName}</DataTableCell>
                        <DataTableCell>{item.consumableName}</DataTableCell>
                        {filters.breakOutByLot ? (
                          <>
                            <DataTableCell>
                              {item.expiresOn ? format(new Date(item.expiresOn), 'yyyy-MM-dd') : null}
                            </DataTableCell>
                            <DataTableCell>{item.lotNumber}</DataTableCell>
                          </>
                        ) : null}
                        <DataTableCell>{item.quantity}</DataTableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <BrowseTablePaginator
                  location={location}
                  paginatorStatus={messages.paginatorStatus}
                  total={data.total}
                  pageAt={pageAt}
                  pageSize={pageSize}
                  navigate={navigate}
                />
              </>
            )}
          </Card>
        </Stack>
      </Box>
    </>
  )
}
