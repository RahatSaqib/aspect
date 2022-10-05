import React, { useState, useEffect } from 'react'
import LinearProgress from '@mui/material/LinearProgress'
import TableBody from '@mui/material/TableBody'
import classnames from 'classnames/bind'
import flowRight from 'lodash/flowRight'
import { Helmet } from 'react-helmet'
import useSites from '../../../hooks/site/useSites'
import useSitesDownload from '../../../hooks/site/useSitesDownload'
import useI18n from '../../../hooks/useI18n'
import { getCustomMessage } from '../../../messages/customMessages'
import BrowseEmptyList from '../../../oldComponents/BrowseEmptyList'
import BrowseFilters from '../../../oldComponents/BrowseFilters'
import BrowseTablePaginator from '../../../oldComponents/BrowseTablePaginator'
import ExportListButton from '../../../oldComponents/ExportListButton'
import { getFilters, sanitizeFiltersStringBy, reduceFiltersConfig } from '../../../oldComponents/filter/utils'
import NavTitle from '../../../oldComponents/NavTitle'
import AspectButton from '../../../oldComponents/shared/AspectButton'
import DataTableCard from '../../../oldComponents/shared/DataTableCard'
import { useAuthState } from '../../../providers/AuthProvider/index'
import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../../utils/selectors/searchParams'
import messages from './messages'
import { SiteDataTable, SiteDataTableHead, SiteDataTableRow } from './SiteDataTable'
import styles from './SiteList.css'

const cssClasses = classnames.bind(styles)

const FILTERS_CONFIG = [
  { geography: true, requiredPermissions: [] },
  { state: true, requiredPermissions: [] },
  { lga: true, requiredPermissions: [] },
  { siteName: true, requiredPermissions: ['site'] },
  { externalId: true, requiredPermissions: [] },
]

const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: ['name', 'state', 'lga', 'totalDevices', 'inventoryUpdatedOn'],
})
const filtersSanitizer = sanitizeFiltersStringBy(FILTERS_CONFIG)
const filtersFromLocation = composeSanitizer(
  flowRight(filtersSanitizer, searchParams => searchParams.get('filters') || ''),
  searchSanitizer
)

export const SiteList = ({ navigate, location }) => {
  const user = useAuthState()
  const intl = useI18n()
  const { sanitized, value: filtersParamsFromLocation } = filtersFromLocation(location)
  const filters = getFilters(filtersParamsFromLocation)
  const { sortCol, sortDir, pageAt, pageSize } = makeSortPageSelector({ sortCol: 'name' })({ location })
  const reducedFilters = reduceFiltersConfig(FILTERS_CONFIG, user.jwt.permissions)
  const [download, setDownload] = useState({ fileFormat: '', enabled: false })

  const { data, isLoading } = useSites({ sortCol, sortDir, pageAt, pageSize, filters }, { enabled: !!sortCol })
  useSitesDownload({
    filtersParams: filtersParamsFromLocation,
    sortCol,
    sortDir,
    page: pageAt,
    pageSize,
    ...download,
  })

  useEffect(() => {
    if (download.enabled) setDownload({ enabled: false })
  }, [download])

  useEffect(() => {
    const { sanitized, value: searchParams } = searchSanitizer(location)
    const { sanitized: filtersSanitized, value: filtersParams } = filtersSanitizer(searchParams.get('filters') || '')
    if (sanitized || filtersSanitized) {
      searchParams.set('filters', filtersParams)
      navigate({ ...location, search: `?${searchParams.toString()}` }, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const tableColumns = [
    { key: 'name', label: intl.formatMessage(messages.siteName), sortable: true },
    { key: 'state', label: getCustomMessage(messages, 'state', user), sortable: true },
    { key: 'lga', label: getCustomMessage(messages, 'lga', user), sortable: true },
    { key: 'siteId', label: intl.formatMessage(messages.externalId), sortable: true },
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

  const onExcelClick = formatType => {
    if (!sanitized) {
      setDownload({ fileFormat: formatType.id, enabled: true })
    }
  }

  const onRowClick = ({
    currentTarget: {
      dataset: { siteId },
    },
  }) => navigate(`/browse/site/${siteId}`)

  return isLoading || !reducedFilters ? (
    <LinearProgress />
  ) : (
    <div className={cssClasses('Container')}>
      <Helmet title={intl.formatMessage(messages.sitesTitle)} />
      <NavTitle title={intl.formatMessage(messages.sitesTitle)} />
      <BrowseFilters navigate={navigate} location={location} intl={intl} config={reducedFilters}>
        <AspectButton
          type="button"
          color="primary"
          variant="contained"
          browseButton
          onClick={() => navigate('/browse/site/create')}
        >
          {intl.formatMessage(messages.createSite)}
        </AspectButton>
      </BrowseFilters>
      <DataTableCard key={`DataTableCard--table-${location.key}`}>
        {data.siteList.length === 0 ? (
          <BrowseEmptyList navigate={navigate} location={location} />
        ) : (
          <>
            <ExportListButton onExcelClick={onExcelClick} onCsvClick={onExcelClick} reportName="Sites" visible />
            <SiteDataTable className={cssClasses('SiteDataTable')}>
              <SiteDataTableHead
                navigate={navigate}
                location={location}
                sortColumnKey={sortCol}
                sortColumnDir={sortDir}
                columns={tableColumns}
              />
              <TableBody>
                {data.siteList.map(site => (
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
  )
}

export default SiteList
