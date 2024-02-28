import React, { useState, useEffect, useCallback } from 'react'
import { LinearProgress, TableBody } from '@mui/material'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import { DetailHeader, SiteFilter } from '../../../cleanComponents'
import AspectExportListButton from '../../../components/AspectExportListButton/index'
import PermissionChecker from '../../../components/PermissionChecker'
import useSites from '../../../hooks/site/useSites'
import useSitesDownload from '../../../hooks/site/useSitesDownload'
import useAuthState from '../../../hooks/useAuthState'
import useFilterValues from '../../../hooks/useFilterValues'
import useSearchParams from '../../../hooks/useSearchParams'
import { getCustomMessage } from '../../../messages/customMessages'
import BrowseEmptyList from '../../../oldComponents/BrowseEmptyList'
import BrowseTablePaginator from '../../../oldComponents/BrowseTablePaginator'
import AspectButton from '../../../oldComponents/shared/AspectButton'
import DataTableCard from '../../../oldComponents/shared/DataTableCard'
import { makeSortPageSelector } from '../../../utils/selectors/searchParams'
import messages from './messages'
import { SiteDataTable, SiteDataTableHead, SiteDataTableRow } from './SiteDataTable'
import styles from './SiteList.module.css'
import getExportableFile from './SiteQueries'

const SiteList = ({ navigate, location }) => {
  const user = useAuthState()
  const intl = useIntl()
  const filters = useFilterValues(location.pathname)
  const { sortCol, sortDir, pageAt, pageSize } = makeSortPageSelector({ sortCol: 'name' })({ location })
  const [download, setDownload] = useState({ fileFormat: '', enabled: false })
  const { callerSearchParams } = useSearchParams(location.search)

  const { data, isLoading: tableLoading } = useSites(
    { sortCol, sortDir, pageAt, pageSize, filters },
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
    { key: 'inventoryUpdatedOn', label: intl.formatMessage(messages.latestInventoryUpdate), sortable: true },
  ]

  const onAlertClick = useCallback(
    event => {
      const {
        currentTarget: {
          dataset: { siteId },
        },
      } = event
      navigate(`/browse/site/${siteId}/alerts`)
    },
    [navigate]
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
    }) => navigate(`/browse/site/${siteId}${callerSearchParams}`),
    [callerSearchParams, navigate]
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
            onClick={() => navigate(`/browse/site/create${callerSearchParams}`)}
          >
            {intl.formatMessage(messages.createSite)}
          </AspectButton>
        </PermissionChecker>
      </DetailHeader>
      <div className={styles.Container}>
        <Helmet title={intl.formatMessage(messages.sitesTitle)} />
        <SiteFilter />
        <DataTableCard key={`DataTableCard__table-${location.key}`}>
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
            <AspectExportListButton onExport={onExportClick} reportName="Sites" visible />
          </div>
          {isLoading ? (
            <LinearProgress />
          ) : !data || !data.siteList || data.siteList.length === 0 ? (
            <BrowseEmptyList />
          ) : (
            <>
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
      </div>
    </>
  )
}

export default SiteList
