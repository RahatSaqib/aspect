import flowRight from 'lodash/flowRight'
import classnames from 'classnames/bind'
import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import Immutable from 'immutable'
import { compose, withProps, withHandlers, lifecycle, setPropTypes } from 'recompose'
import { defineMessages, injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'
import TableBody from '@mui/material/TableBody'
import { useQuery } from 'react-query'

import { getCustomMessage, commonDefinitions } from '../../../utils/utils/customMessages'
import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../../utils/selectors/searchParams'
import { getFilters, sanitizeFiltersStringBy, reduceFiltersConfig } from '../../../oldComponents/filter/utils'
import NavTitle from '../../../oldComponents/NavTitle'
import BrowseFilters from '../../../oldComponents/BrowseFilters'
import BrowseEmptyList from '../../../oldComponents/BrowseEmptyList'
import BrowseTablePaginator from '../../../oldComponents/BrowseTablePaginator'
import DataTableCard from '../../../oldComponents/shared/DataTableCard'
import DataTableProgressBar from '../../../oldComponents/shared/DataTableProgressBar'
import { fetchSites, exportSites } from '../../../store/SiteRedux'
import { SiteDataTable, SiteDataTableHead, SiteDataTableRow } from './SiteDataTable'
import ExportListButton from '../../../oldComponents/ExportListButton'
import fetchWrapperForQueries from '../../../components/QueryFetch/index'
import { SITE_LIST } from '../../../components/QueryFetch/Site/index'
import useI18n from '../../../hooks/useI18n'

import styles from './SiteList.css'
import AspectButton from '../../../oldComponents/shared/AspectButton'

const cssClasses = classnames.bind(styles)

export const messages = {
  ...commonDefinitions,
  ...defineMessages({
    sitesTitle: {
      id: 'pages.SiteList.title',
      defaultMessage: 'Sites',
    },
    siteName: {
      id: 'pages.SiteList.siteName',
      defaultMessage: 'Name',
    },
    totalDevices: {
      id: 'pages.SiteList.totalDevices',
      defaultMessage: 'Number of Devices',
    },
    externalId: {
      id: 'pages.SiteList.externalId',
      defaultMessage: 'Site ID',
    },
    siteIssues: {
      id: 'pages.SiteList.siteIssues',
      defaultMessage: 'Issues',
    },
    issueCategoryDeviceHealth: {
      id: 'pages.SiteList.issueCategoryDeviceHealth',
      defaultMessage: 'Device',
    },
    issueCategoryReagentHealth: {
      id: 'pages.SiteList.issueCategoryReagentHealth',
      defaultMessage: 'Reagent',
    },
    issueCategoryDataHealth: {
      id: 'pages.SiteList.issueCategoryDataHealth',
      defaultMessage: 'Data',
    },
    issueCategoryConnectivityHealth: {
      id: 'pages.SiteList.issueCategoryConnectivityHealth',
      defaultMessage: 'Connectivity',
    },
    paginatorStatus: {
      id: 'pages.SiteList.paginatorStatus',
      defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# site}
      other {# sites}
    }`,
    },
    latestInventoryUpdate: {
      id: 'pages.SiteList.latestInventoryUpdate',
      defaultMessage: 'Latest Inventory Update',
    },
    createSite: {
      id: 'pages.SiteList.createSite',
      defaultMessage: 'Create Site',
    },
  }),
}

const FILTERS_CONFIG = [
  { geography: true, requiredPermissions: [] },
  { state: true, requiredPermissions: [] },
  { lga: true, requiredPermissions: [] },
  {
    siteName: true,
    requiredPermissions: ['site'],
  },
  {
    externalId: true,
    requiredPermissions: [],
  },
]

const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: ['name', 'state', 'lga', 'totalDevices', 'inventoryUpdatedOn'],
})
const filtersSanitizer = sanitizeFiltersStringBy(FILTERS_CONFIG)
const filtersFromLocation = composeSanitizer(
  flowRight(filtersSanitizer, searchParams => searchParams.get('filters') || ''),
  searchSanitizer
)

const enhance = compose(
  injectIntl,
  withProps(
    makeSortPageSelector({
      sortCol: 'name',
    }),
    ({ location }) => {
      const searchParams = new URLSearchParams(location.search)
      const filtersParams = new URLSearchParams(searchParams.get('filters') || '')
      return {
        filters: getFilters(filtersParams),
      }
    }
  ),
  connect(
    state => {
      return {
        items: state.site.items,
        table: state.site.table,
        userPermissions: state.user.jwt.permissions,
        user: state.user,
      }
    },
    {
      fetchSites,
      exportSites,
    }
  ),
  setPropTypes({
    location: PropTypes.object.isRequired,
    navigate: PropTypes.func.isRequired,
    table: PropTypes.instanceOf(Immutable.Record).isRequired,
    items: PropTypes.instanceOf(Immutable.Record).isRequired,
  }),
  withHandlers({
    onAlertClick:
      ({ navigate }) =>
      event => {
        event.stopPropagation()
        const {
          currentTarget: {
            dataset: { siteId },
          },
        } = event
        navigate(`/browse/site/${siteId}/alerts`)
      },

    onExcelClick:
      ({ location, exportSites, sortCol, sortDir, pageAt, pageSize }) =>
      formatType => {
        const format = formatType.id
        const { sanitized, value: filtersParams } = filtersFromLocation(location)

        if (!sanitized) {
          exportSites(filtersParams, sortCol, sortDir, pageAt, pageSize, format, 'sites')
        }
      },

    onRowClick:
      ({ navigate }) =>
      ({
        currentTarget: {
          dataset: { siteId },
        },
      }) =>
        navigate(`/browse/site/${siteId}`),
  }),
  lifecycle({
    UNSAFE_componentWillMount() {
      const { sanitized, value: searchParams } = searchSanitizer(this.props.location)
      const { sanitized: filtersSanitized, value: filtersParams } = filtersSanitizer(searchParams.get('filters') || '')
      if (sanitized || filtersSanitized) {
        searchParams.set('filters', filtersParams)

        this.props.navigate(
          {
            ...this.props.location,
            search: `?${searchParams.toString()}`,
          },
          { replace: true }
        )
      }
      const reducedFilters = reduceFiltersConfig(FILTERS_CONFIG, this.props.userPermissions)
      this.setState({
        reducedFilters,
      })
    },
  })
)

export const SiteList = ({
  navigate,
  location,
  // --- injected by recompose ---
  onExcelClick,
  sortCol,
  sortDir,
  pageAt,
  pageSize,
  onRowClick,
  onAlertClick,
  reducedFilters,
  user,
}) => {
  const { value: filtersParams } = filtersFromLocation(location)
  const filters = getFilters(filtersParams)
  const [siteList, setSiteList] = useState(false)
  const { formatMessage } = useI18n()

  const { data: { data, total } = false } = useQuery(
    [SITE_LIST.KEY, { sortCol, sortDir, pageAt, pageSize, filters }],
    async ({ queryKey: [, { sortCol, sortDir, pageAt, pageSize, filters }] }) =>
      fetchWrapperForQueries({
        endpoint: SITE_LIST.ENDPOINT,
        method: 'GET',
        params: {
          sortCol,
          sortDir,
          page: pageAt,
          size: pageSize,
          ...filters,
        },
      })
  )

  useEffect(() => {
    setSiteList(data)
  }, [data])
  return (
    <div className={cssClasses('Container')}>
      <Helmet title={formatMessage(messages.sitesTitle)} />
      <NavTitle title={formatMessage(messages.sitesTitle)} />
      <BrowseFilters navigate={navigate} location={location} config={reducedFilters}>
        <AspectButton
          type="button"
          color="primary"
          variant="contained"
          browseButton
          onClick={event => {
            event.stopPropagation()
            navigate('/browse/site/create')
          }}
        >
          {formatMessage(messages.createSite)}
        </AspectButton>
      </BrowseFilters>
      <DataTableCard key={`DataTableCard--table-${location.key}`}>
        <DataTableProgressBar disabled={siteList} />
        {!siteList && <BrowseEmptyList navigate={navigate} location={location} />}
        <ExportListButton
          onExcelClick={onExcelClick}
          onCsvClick={onExcelClick}
          visible={siteList && siteList.length}
          reportName="Sites"
        />

        {siteList && (
          <SiteDataTable className={cssClasses('SiteDataTable')}>
            <SiteDataTableHead
              navigate={navigate}
              location={location}
              sortColumnKey={sortCol}
              sortColumnDir={sortDir}
              columns={[
                {
                  key: 'name',
                  label: formatMessage(messages.siteName),
                  sortable: true,
                },
                {
                  key: 'state',
                  label: getCustomMessage(messages, 'state', user),
                  sortable: true,
                },
                {
                  key: 'lga',
                  label: getCustomMessage(messages, 'lga', user),
                  sortable: true,
                },
                {
                  key: 'siteId',
                  label: formatMessage(messages.externalId),
                  sortable: true,
                },
                {
                  key: 'totalDevices',
                  label: formatMessage(messages.totalDevices),
                  sortable: true,
                },
                {
                  key: 'inventoryUpdatedOn',
                  label: formatMessage(messages.latestInventoryUpdate),
                  sortable: true,
                },
                {
                  key: 'siteIssues',
                  label: formatMessage(messages.siteIssues),
                },
              ]}
            />
            <TableBody>
              {siteList &&
                siteList?.map(site => (
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
        )}
        {siteList && siteList.length < total && (
          <BrowseTablePaginator
            navigate={navigate}
            location={location}
            paginatorStatus={messages.paginatorStatus}
            total={total}
            pageAt={pageAt}
            pageSize={pageSize}
          />
        )}
      </DataTableCard>
    </div>
  )
}

export default enhance(SiteList)
