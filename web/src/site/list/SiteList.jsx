import flowRight from 'lodash/flowRight'
import fromPairs from 'lodash/fromPairs'
import classnames from 'classnames/bind'
import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import {
  compose,
  withProps,
  withHandlers,
  lifecycle,
  setPropTypes,
} from 'recompose'
import { defineMessages, injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'
import TableBody from '@material-ui/core/TableBody'
import Immutable from 'immutable'
import { useQuery } from 'react-query'
import PropTypeOf from '../../shared/types'

import {
  getCustomMessage,
  commonDefinitions,
} from '../../shared/utils/customMessages'
import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../shared/selectors/searchParams'
import {
  sanitizeFiltersStringBy,
  reduceFiltersConfig,
} from '../../filter/utils'
import NavTitle from '../../globals/components/NavTitle'
import BrowseFilters from '../../globals/components/BrowseFilters'
import BrowseEmptyList from '../../globals/components/BrowseEmptyList'
import BrowseTablePaginator from '../../globals/components/BrowseTablePaginator'
import DataTableCard from '../../components/shared/DataTableCard'
import DataTableProgressBar from '../../components/shared/DataTableProgressBar'
import { fetchSites, exportSites } from '../SiteRedux'
import {
  SiteDataTable,
  SiteDataTableHead,
  SiteDataTableRow,
} from './SiteDataTable'
import ExportListButton from '../../globals/components/ExportListButton'
import fetchWrapperForQueries from '../../MigratedComponents/QueryFetch/index'
import { SITE_LIST } from '../../MigratedComponents/QueryFetch/Site/index'

import styles from './SiteList.css'

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
  availableSortCol: [
    'name',
    'state',
    'lga',
    'totalDevices',
    'inventoryUpdatedOn',
  ],
})
const filtersSanitizer = sanitizeFiltersStringBy(FILTERS_CONFIG)
const filtersFromLocation = composeSanitizer(
  flowRight(
    filtersSanitizer,
    searchParams => searchParams.get('filters') || ''
  ),
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
      const filtersParams = new URLSearchParams(
        searchParams.get('filters') || ''
      )
      return {
        filters: fromPairs([...filtersParams.entries()]),
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
    intl: PropTypeOf.intl.isRequired,
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
      ({ location, exportSites, sortCol, sortDir, pageAt, table }) =>
      formatType => {
        const format = formatType.id
        const { sanitized, value: filtersParams } =
          filtersFromLocation(location)
        if (!sanitized) {
          exportSites(
            filtersParams,
            sortCol,
            sortDir,
            pageAt,
            table.get('total') > 0 ? table.get('total') : 1,
            format,
            'sites'
          )
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
    componentWillMount() {
      const { sanitized, value: searchParams } = searchSanitizer(
        this.props.location
      )
      const { sanitized: filtersSanitized, value: filtersParams } =
        filtersSanitizer(searchParams.get('filters') || '')
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
      const reducedFilters = reduceFiltersConfig(
        FILTERS_CONFIG,
        this.props.userPermissions
      )
      this.setState({
        reducedFilters,
      })
    },
  })
)

export const SiteList = ({
  intl,
  navigate,
  location,
  table,
  items,
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
  const filters = fromPairs([...filtersParams.entries()])
  const [siteList, setSiteList] = useState(false)

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
      <Helmet title={intl.formatMessage(messages.sitesTitle)} />
      <NavTitle title={intl.formatMessage(messages.sitesTitle)} />
      <BrowseFilters
        navigate={navigate}
        location={location}
        intl={intl}
        config={reducedFilters}
      />
      <DataTableCard key={`DataTableCard--table-${location.key}`}>
        <DataTableProgressBar disabled={!table.loading} />
        {!siteList && (
          <BrowseEmptyList
            navigate={navigate}
            location={location}
            intl={intl}
          />
        )}
        <ExportListButton
          onExcelClick={onExcelClick}
          onCsvClick={onExcelClick}
          visible={!items.currentIdList.isEmpty()}
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
                  label: intl.formatMessage(messages.siteName),
                  sortable: true,
                },
                {
                  key: 'state',
                  label: getCustomMessage(intl, messages, 'state', user),
                  sortable: true,
                },
                {
                  key: 'lga',
                  label: getCustomMessage(intl, messages, 'lga', user),
                  sortable: true,
                },
                {
                  key: 'siteId',
                  label: intl.formatMessage(messages.externalId),
                  sortable: true,
                },
                {
                  key: 'totalDevices',
                  label: intl.formatMessage(messages.totalDevices),
                  sortable: true,
                },
                {
                  key: 'inventoryUpdatedOn',
                  label: intl.formatMessage(messages.latestInventoryUpdate),
                  sortable: true,
                },
                {
                  key: 'siteIssues',
                  label: intl.formatMessage(messages.siteIssues),
                },
              ]}
            />
            <TableBody>
              {siteList &&
                siteList?.map(site => (
                  <SiteDataTableRow
                    key={site.id}
                    intl={intl}
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
            intl={intl}
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
