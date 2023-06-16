import React, { useState, useEffect } from 'react'
import { LinearProgress, TableBody } from '@mui/material'
import classnames from 'classnames/bind'
import { Helmet } from 'react-helmet'
import DetailHeader from '../../../cleanComponents/DetailHeader'
import SiteFilter from '../../../cleanComponents/Filter/SiteFilter'
import AspectExportListButton from '../../../components/AspectExportListButton/index'
import useSites from '../../../hooks/site/useSites'
import useSitesDownload from '../../../hooks/site/useSitesDownload'
import useI18n from '../../../hooks/useI18n'
import { getCustomMessage } from '../../../messages/customMessages'
import BrowseEmptyList from '../../../oldComponents/BrowseEmptyList'
import BrowseTablePaginator from '../../../oldComponents/BrowseTablePaginator'
import AspectButton from '../../../oldComponents/shared/AspectButton'
import DataTableCard from '../../../oldComponents/shared/DataTableCard'
import { useAuthState } from '../../../providers/AuthProvider/index'
import { useFilterValues } from '../../../providers/FilterProvider'
import { makeSortPageSelector } from '../../../utils/selectors/searchParams'
import messages from './messages'
import { SiteDataTable, SiteDataTableHead, SiteDataTableRow } from './SiteDataTable'
import styles from './SiteList.css'
import getExportableFile from './SiteQueries'

const cssClasses = classnames.bind(styles)

export const SiteList = ({ navigate, location }) => {
  const user = useAuthState()
  const intl = useI18n()
  const filters = useFilterValues(location.pathname)
  const { sortCol, sortDir, pageAt, pageSize } = makeSortPageSelector({ sortCol: 'name' })({ location })
  const [download, setDownload] = useState({ fileFormat: '', enabled: false })

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
    { key: 'state', label: getCustomMessage(messages, 'state', user), sortable: true },
    { key: 'lga', label: getCustomMessage(messages, 'lga', user), sortable: true },
    { key: 'externalId', label: intl.formatMessage(messages.externalId), sortable: true },
    { key: 'totalDevices', label: intl.formatMessage(messages.totalDevices), sortable: true },
    { key: 'inventoryUpdatedOn', label: intl.formatMessage(messages.latestInventoryUpdate), sortable: true },
    { key: 'siteIssues', label: intl.formatMessage(messages.siteIssues) },
  ]

  const onAlertClick = event => {
    const {
      currentTarget: {
        dataset: { siteId },
      },
    } = event
    navigate(`/browse/site/${siteId}/alerts`)
  }

  const onExportClick = formatType => {
    setIsLoading(true)
    return getExportableFile(filters, formatType, sortCol, sortDir, 'sites')
      .then(response => {
        setIsLoading(false)
        return response
      })
      .catch(error => {
        setIsLoading(false)
        throw error
      })
  }

  // const onExcelClick = formatType => {
  //   setDownload({ fileFormat: formatType, enabled: true })
  // }

  const onRowClick = ({
    currentTarget: {
      dataset: { siteId },
    },
  }) => navigate(`/browse/site/${siteId}`)

  return (
    <>
      <DetailHeader name={intl.formatMessage(messages.sitesTitle)} disableBack>
        <AspectButton
          type="button"
          color="primary"
          variant="contained"
          browseButton
          onClick={() => navigate('/browse/site/create')}
        >
          {intl.formatMessage(messages.createSite)}
        </AspectButton>
      </DetailHeader>
      <div className={cssClasses('Container')}>
        <Helmet title={intl.formatMessage(messages.sitesTitle)} />
        <SiteFilter />
        <DataTableCard key={`DataTableCard--table-${location.key}`}>
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
            <AspectExportListButton onExport={onExportClick} reportName="Sites" visible />
          </div>
          {isLoading ? <LinearProgress /> : null}
          {!data || !data.siteList || data.siteList.length === 0 ? (
            <BrowseEmptyList />
          ) : (
            <>
              <SiteDataTable className={cssClasses('SiteDataTable')}>
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
