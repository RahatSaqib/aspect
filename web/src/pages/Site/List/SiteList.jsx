import React, { useState, useEffect, useCallback } from 'react'
import { Box, LinearProgress, Switch, TableBody, Typography } from '@mui/material'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { DetailHeader, SiteFilter, TableContainer } from '../../../components'
import AspectExportListButton from '../../../components/AspectExportListButton/index'
import BrowseEmptyList from '../../../components/BrowseEmptyList'
import BrowseTablePaginator from '../../../components/BrowseTablePaginator'
import {
  useHierarchicalSwitch,
  hierarchicalToggleSettingsLocalStorageKey,
  HierarchicalView,
} from '../../../components/HierarchicalSiteView'
import PermissionChecker from '../../../components/PermissionChecker'
import AspectButton from '../../../components/shared/AspectButton'
import DataTableCard from '../../../components/shared/DataTableCard'
import useSites from '../../../hooks/site/useSites'
import useSitesDownload from '../../../hooks/site/useSitesDownload'
import useAuthState from '../../../hooks/useAuthState'
import useFilterValues from '../../../hooks/useFilterValues'
import { getCustomMessage } from '../../../messages/customMessages'
import { makeSortPageSelector } from '../../../utils/selectors/searchParams'
import { gotoWithReturnUrl } from '../../../utils/utils/browser'
import messages from './messages'
import { SiteDataTable, SiteDataTableHead, SiteDataTableRow } from './SiteDataTable'
import styles from './SiteList.module.css'
import getExportableFile from './SiteQueries'

const SiteList = ({ navigate, location }) => {
  const user = useAuthState()
  const intl = useIntl()
  const { formatMessage } = intl
  const filters = useFilterValues(location.pathname)
  const { sortCol, sortDir, pageAt, pageSize } = makeSortPageSelector({ sortCol: 'name' })({ location })
  const [download, setDownload] = useState({ fileFormat: '', enabled: false })
  const {
    isHierarchicalView,
    setIsHierarchicalView,
    isWarehouseView,
    setIsWarehouseView,
    selectedSiteIds,
    setSelectedSiteIds,
  } = useHierarchicalSwitch({
    localStorageKey: hierarchicalToggleSettingsLocalStorageKey.SITE_LIST,
  })

  // Disabling the filters since we don't have the filters on warehouse level
  const disableFilters = isHierarchicalView && isWarehouseView

  const { data, isLoading: tableLoading } = useSites(
    { sortCol, sortDir, pageAt, pageSize, filters: disableFilters ? { siteIds: selectedSiteIds.join(',') } : filters },
    { enabled: !!sortCol }
  )
  useSitesDownload({
    filtersParams: filters,
    sortCol,
    sortDir,
    page: pageAt,
    pageSize,
    ...download,
  })

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(tableLoading)
  }, [tableLoading])

  useEffect(() => {
    if (download.enabled) setDownload({ enabled: false })
  }, [download])

  const tableColumns = [
    { key: 'name', label: intl.formatMessage(messages.siteName), sortable: true },
    { key: 'state', label: getCustomMessage(intl.formatMessage, messages, 'state', user), sortable: true },
    { key: 'lga', label: getCustomMessage(intl.formatMessage, messages, 'lga', user), sortable: true },
    { key: 'externalId', label: intl.formatMessage(messages.externalId), sortable: true },
    { key: 'totalDevices', label: intl.formatMessage(messages.totalDevices), sortable: true },
    { key: 'siteConsumableCount', label: intl.formatMessage(messages.consumables), sortable: true },
    { key: 'siteType', label: intl.formatMessage(messages.siteType), sortable: true },
    { key: 'parentWarehouseName', label: intl.formatMessage(messages.stockProvider), sortable: true },
    { key: 'inventoryUpdatedOn', label: intl.formatMessage(messages.latestInventoryUpdate), sortable: true },
  ]

  const onAlertClick = useCallback(
    event => {
      const {
        currentTarget: {
          dataset: { siteId },
        },
      } = event
      gotoWithReturnUrl(`/browse/site/${siteId}/alerts`, navigate, location)
    },
    [location, navigate]
  )

  const onExportClick = formatType => {
    setIsLoading(true)
    return getExportableFile(filters, formatType, sortCol, sortDir, data.total, 'sites')
      .then(response => {
        setIsLoading(false)
        return response
      })
      .catch(error => {
        setIsLoading(false)
        throw error
      })
  }

  const onRowClick = useCallback(
    ({
      currentTarget: {
        dataset: { siteId },
      },
    }) => gotoWithReturnUrl(`/browse/site/${siteId}`, navigate, location),
    [location, navigate]
  )

  return (
    <>
      <DetailHeader name={intl.formatMessage(messages.sitesTitle)} disableBack>
        <PermissionChecker permissions={['site:admin']}>
          <AspectButton
            type="button"
            color="primary"
            variant="contained"
            browseButton
            onClick={() => gotoWithReturnUrl('/browse/site/create', navigate, location)}
          >
            {intl.formatMessage(messages.createSite)}
          </AspectButton>
        </PermissionChecker>
      </DetailHeader>
      <div className={styles.Container}>
        <Helmet title={intl.formatMessage(messages.sitesTitle)} />
        <SiteFilter disabled={disableFilters} />
        <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', gap: 1 }}>
          {isHierarchicalView && (
            <HierarchicalView
              countryId={user.countryId}
              filters={filters}
              pathname="/browse/site"
              isWarehouseView={isWarehouseView}
              setIsWarehouseView={setIsWarehouseView}
              setSelectedSiteIds={setSelectedSiteIds}
            />
          )}
          <DataTableCard key={`DataTableCard__table-${location.key}`} sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2" color="textSecondary">
                <Switch
                  checked={isHierarchicalView}
                  onChange={event => setIsHierarchicalView(event.currentTarget.checked)}
                />
                {formatMessage(messages.hierarchicalView)}
              </Typography>
              <AspectExportListButton onExport={onExportClick} reportName="Sites" visible />
            </Box>
            {isLoading ? (
              <LinearProgress />
            ) : !data || !data.siteList || data.siteList.length === 0 ? (
              <BrowseEmptyList />
            ) : (
              <>
                <TableContainer>
                  <SiteDataTable className={styles.SiteDataTable}>
                    <SiteDataTableHead
                      navigate={navigate}
                      location={location}
                      sortColumnKey={sortCol}
                      sortColumnDir={sortDir}
                      columns={tableColumns}
                    />
                    <TableBody>
                      {data?.siteList?.map(site => (
                        <SiteDataTableRow
                          key={site.id}
                          site={site}
                          onClick={onRowClick}
                          onAlertClick={onAlertClick}
                          data-site-id={site.id}
                        />
                      ))}
                    </TableBody>
                  </SiteDataTable>
                </TableContainer>
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
          </DataTableCard>
        </Box>
      </div>
    </>
  )
}

export default SiteList
