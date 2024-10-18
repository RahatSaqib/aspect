import React, { useCallback, useMemo } from 'react'
import { Box, Card, LinearProgress, Stack, Switch, Typography } from '@mui/material'
import isNil from 'lodash/isNil'
import omitBy from 'lodash/omitBy'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { useLocation, useNavigate } from 'react-router'
import { useSearchParams } from 'react-router-dom'
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
import { makeSortPageSelector } from '../../../utils/selectors/searchParams'
import { InventoryReconciliationList } from './InventoryReconciliationList'
import messages from './messages'
import { getExportableFile } from './tools'

export function InventoryReconciliation() {
  const { formatMessage } = useIntl()
  const user = useAuthState()
  const location = useLocation()
  const navigate = useNavigate()
  const [, setSearchParams] = useSearchParams()
  const [filters, setFilters] = usePathFilter()
  const { isHierarchicalView, setIsHierarchicalView } = useHierarchicalSwitch({
    localStorageKey: hierarchicalToggleSettingsLocalStorageKey.INVENTORY_RECONCILIATION,
  })
  const { sortCol, sortDir, pageAt, pageSize } = useMemo(
    () => makeSortPageSelector({ sortCol: 'siteName' })({ location }),
    [location]
  )
  const { data, isLoading } = useInventoryReconciliation(
    omitBy({ sortCol, sortDir, page: pageAt, size: pageSize, ...filters }, isNil)
  )
  const handleExport = useCallback(
    formatType =>
      getExportableFile(omitBy(filters, isNil), formatType, sortCol, sortDir, data?.data?.length, 'reconciliation'),
    [data?.data?.length, filters, sortCol, sortDir]
  )

  const handleBreakOutByLot = useCallback(
    e => {
      const value = e.target.checked || null
      setSearchParams([])
      setFilters(prev => ({
        ...prev,
        ...(!value ? { minDate: null, maxDate: null, lotNumber: null } : {}),
        breakOutByLot: value,
      }))
    },
    [setFilters, setSearchParams]
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
                  <Switch checked={[true, 'true'].includes(filters.breakOutByLot)} onChange={handleBreakOutByLot} />
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
                <InventoryReconciliationList
                  items={data?.data ?? []}
                  sortDir={sortDir}
                  sortCol={sortCol}
                  breakOutByLot={filters.breakOutByLot}
                />
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
