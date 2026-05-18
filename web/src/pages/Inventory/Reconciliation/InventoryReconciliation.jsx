import React, { useEffect, useCallback, useMemo } from 'react'
import { Box, Button, Card, LinearProgress, Stack, Switch, Typography } from '@mui/material'
import isNil from 'lodash/isNil'
import omitBy from 'lodash/omitBy'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { useLocation, useNavigate } from 'react-router'
import { useSearchParams } from 'react-router-dom'
import DetailHeader from '../../../components/DetailHeader'
import { InventoryReconciliationFilter } from '../../../components/Filter'
import {
  HierarchicalView,
  hierarchicalToggleSettingsLocalStorageKey,
  useHierarchicalSwitch,
} from '../../../components/HierarchicalSiteView'
import AspectExportListButton from '../../../components/AspectExportListButton'
import useAutoReconciliation from '../../../hooks/inventory/useAutoReconciliation'
import useInventoryReconciliation from '../../../hooks/inventory/useInventoryReconciliation'
import usePartner from '../../../hooks/partner/usePartner'
import useAuthState from '../../../hooks/useAuthState'
import { usePathFilter } from '../../../hooks/usePathFilter'
import BrowseEmptyList from '../../../components/BrowseEmptyList'
import BrowseTablePaginator from '../../../components/BrowseTablePaginator'
import { isPermittedUser } from '../../../components/shared/requirePermissions'
import { strategyRequireExpirationDate, strategyRequireLot } from '../../../oldPages/inventory/strategyHelper'
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
  const { mutate: autoReconcile, isLoading: isAutoReconciling } = useAutoReconciliation()
  const {
    isHierarchicalView,
    setIsHierarchicalView,
    isWarehouseView,
    setIsWarehouseView,
    selectedSiteIds,
    setSelectedSiteIds,
  } = useHierarchicalSwitch({
    localStorageKey: hierarchicalToggleSettingsLocalStorageKey.INVENTORY_RECONCILIATION,
  })

  // Clear filters when warehouse view is selected
  useEffect(() => {
    if (isHierarchicalView && isWarehouseView) {
      setFilters({
        breakOutByLot: filters.breakOutByLot,
      })
    }
  }, [isHierarchicalView, isWarehouseView, setFilters, filters.breakOutByLot])

  const { sortCol, sortDir, pageAt, pageSize } = useMemo(
    () => makeSortPageSelector({ sortCol: 'siteName' })({ location }),
    [location]
  )
  const { data, isLoading } = useInventoryReconciliation(
    omitBy(
      {
        sortCol,
        sortDir,
        page: pageAt,
        size: pageSize,
        ...filters,
        ...(selectedSiteIds?.length > 0 ? { siteIds: selectedSiteIds.join(',') } : {}),
      },
      isNil
    )
  )
  const allowed = required => isPermittedUser(user.userPermissions, { required })

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
  const { isLoadingPartner, data: partner } = usePartner()
  const requireExpirationDate = strategyRequireExpirationDate(partner?.inventoryStrategy)
  const requireLotNumber = strategyRequireLot(partner?.inventoryStrategy)
  return (
    <>
      <DetailHeader name={formatMessage(messages.inventoryReconciliation)} disableBack />
      <Helmet title={formatMessage(messages.inventoryReconciliation)} />
      <Box sx={{ width: '100%', p: '10px' }}>
        <InventoryReconciliationFilter
          disabled={isHierarchicalView && isWarehouseView}
          breakOutByLot={filters.breakOutByLot}
          requireLotNumber={requireLotNumber}
          requireExpirationDate={requireExpirationDate}
        />
        <Stack sx={{ flexDirection: 'row', gap: 1, width: '100%' }}>
          {isHierarchicalView ? (
            <HierarchicalView
              countryId={user.countryId}
              filters={filters}
              pathname={location.pathname}
              isWarehouseView={isWarehouseView}
              setIsWarehouseView={setIsWarehouseView}
              setSelectedSiteIds={setSelectedSiteIds}
            />
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
                  {formatMessage(messages.breakOutByLot)}
                </Typography>
                <AspectExportListButton
                  onExport={handleExport}
                  reportName="Reconciliation"
                  visible={data?.data?.length !== 0}
                />
              </Stack>
            </Stack>
            {isLoading || isLoadingPartner || isAutoReconciling ? (
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
                  requireLotNumber={requireLotNumber}
                  requireExpirationDate={requireExpirationDate}
                />
                <BrowseTablePaginator
                  location={location}
                  paginatorStatus={messages.paginatorStatus}
                  total={data.total}
                  pageAt={pageAt}
                  pageSize={pageSize}
                  navigate={navigate}
                />
                {allowed(['admin:edit']) ? (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button variant="contained" color="primary" onClick={() => autoReconcile(filters)}>
                      {formatMessage(messages.autoReconcileNow)}
                    </Button>
                  </Box>
                ) : null}
              </>
            )}
          </Card>
        </Stack>
      </Box>
    </>
  )
}
