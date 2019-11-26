import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withProps, withHandlers, lifecycle } from 'recompose'
import { defineMessages } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import TableBody from '@material-ui/core/TableBody'

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
import { fetchReporters } from '../ReporterRedux'
import {
  ReporterDataTable,
  ReporterDataTableHead,
  ReporterDataTableRow,
} from './ReporterDataTable'

const cssClasses = classnames.bind(require('./ReporterList.css'))

const messages = defineMessages({
  reportersTitle: {
    id: 'pages.ReporterList.reportersTitle',
    defaultMessage: 'Reporters',
  },
  reporterUser: {
    id: 'pages.ReporterList.user',
    defaultMessage: 'User',
  },
  reporterDevice: {
    id: 'pages.ReporterList.reporterDevice',
    defaultMessage: 'Device',
  },
  revoked: {
    id: 'pages.ReporterList.revoked',
    defaultMessage: 'Revoked',
  },
  connectedSince: {
    id: 'pages.ReporterList.connectedSince',
    defaultMessage: 'Connected Since',
  },
  lastSeen: {
    id: 'pages.ReporterList.lastSeen',
    defaultMessage: 'Last Seen',
  },
  numberOfTests: {
    id: 'pages.ReporterList.numberOfTestsLeft',
    defaultMessage: 'Number Of Tests Delivered',
  },
  delivered: {
    id: 'pages.ReporterList.delivered',
    defaultMessage: 'Delivered',
  },
  comfirmedFollowup: {
    id: 'pages.ReporterList.followup',
    defaultMessage: '% Confirmed Follow-up',
  },
  acknowledgedRatio: {
    id: 'pages.ReporterList.acknowledgedRatio',
    defaultMessage: '% Acknowledged',
  },
  flagged: {
    id: 'pages.ReporterList.flagged',
    defaultMessage: 'Flagged',
  },
  paginatorStatus: {
    id: 'pages.ReporterList.paginatorStatus',
    defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# reporter}
      other {# reporters}
    }`,
  },
})

const FILTERS_CONFIG = [
  { geography: true, requiredPermissions: [] },
  { state: true, requiredPermissions: [] },
  { lga: true, requiredPermissions: [] },
  {
    contactNameOrEmail: true,
    requiredPermissions: [],
  },
  { date: true, requiredPermissions: [] },
  { deviceName: true, requiredPermissions: [] },
  { revoked: true, requiredPermissions: [] },
  { treatmentStatus: true, requiredPermissions: [] },
  {
    assayAndResultCategory: true,
    requiredPermissions: ['assay:view', 'assay:admin', 'assay:edit'],
  },
]

const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: ['user', 'deviceName', 'createdOn', 'lastSeen', 'status'],
})
const filtersSanitizer = sanitizeFiltersStringBy(FILTERS_CONFIG)
const filtersFromLocation = composeSanitizer(
  _.flowRight(
    filtersSanitizer,
    searchParams => searchParams.get('filters') || ''
  ),
  searchSanitizer
)

const enhance = compose(
  withProps(
    makeSortPageSelector({
      sortCol: 'user',
    })
  ),
  connect(
    state => ({
      items: state.reporter.items,
      table: state.reporter.table,
      userPermissions: state.user.jwt.permissions,
    }),
    bindActionCreators.bind(null, {
      fetchReporters,
    })
  ),
  withHandlers({
    onInitialLoad: ({
      location,
      fetchReporters,
      sortCol,
      sortDir,
      pageAt,
      pageSize,
    }) => () => {
      const { sanitized, value: filtersParams } = filtersFromLocation(location)
      if (!sanitized) {
        fetchReporters(filtersParams, sortCol, sortDir, pageAt, pageSize)
      }
    },
  }),
  lifecycle({
    componentWillMount() {
      const { sanitized, value: searchParams } = searchSanitizer(
        this.props.location
      )
      const {
        sanitized: filtersSanitized,
        value: filtersParams,
      } = filtersSanitizer(searchParams.get('filters') || '')
      if (sanitized || filtersSanitized) {
        searchParams.set('filters', filtersParams)

        this.props.history.replace({
          ...this.props.location,
          search: searchParams.toString(),
        })
      }
      const reducedFilters = reduceFiltersConfig(
        FILTERS_CONFIG,
        this.props.userPermissions
      )
      this.setState({
        reducedFilters,
      })
    },

    componentDidMount() {
      this.props.onInitialLoad()
    },

    componentWillReceiveProps(nextProps) {
      if (this.props.location.search !== nextProps.location.search) {
        this.props.onInitialLoad()
      }
    },
  })
)

export const ReporterList = ({
  intl,
  history,
  location,
  table,
  items,
  // --- injected by recompose ---
  sortCol,
  sortDir,
  pageAt,
  pageSize,
  reducedFilters,
}) => (
  <div className={cssClasses('Container')}>
    <Helmet title={intl.formatMessage(messages.reportersTitle)} />
    <NavTitle title={intl.formatMessage(messages.reportersTitle)} />
    <BrowseFilters
      history={history}
      location={location}
      intl={intl}
      config={reducedFilters}
    />
    <DataTableCard key={`DataTableCard--table-${location.key}`}>
      <DataTableProgressBar disabled={!table.loading} />
      {items.currentIdList.isEmpty() && (
        <BrowseEmptyList history={history} location={location} intl={intl} />
      )}
      {!items.currentIdList.isEmpty() && (
        <ReporterDataTable
          selectable={false}
          className={cssClasses('ReporterDataTable')}
        >
          <ReporterDataTableHead
            history={history}
            location={location}
            sortColumnKey={sortCol}
            sortColumnDir={sortDir}
            columns={[
              {
                key: 'user',
                label: intl.formatMessage(messages.reporterUser),
                sortable: true,
              },
              {
                key: 'deviceName',
                label: intl.formatMessage(messages.reporterDevice),
                sortable: true,
              },
              {
                key: 'createdOn',
                label: intl.formatMessage(messages.connectedSince),
                sortable: true,
              },
              {
                key: 'lastSeen',
                label: intl.formatMessage(messages.lastSeen),
              },
              {
                key: 'delivered',
                label: intl.formatMessage(messages.delivered),
              },
              {
                key: 'comfirmedFollowup',
                label: intl.formatMessage(messages.comfirmedFollowup),
              },
              {
                key: 'acknowledgedRatio',
                label: intl.formatMessage(messages.acknowledgedRatio),
              },
              {
                key: 'totalFlagged',
                label: intl.formatMessage(messages.flagged),
              },
              {
                key: 'revoked',
                label: intl.formatMessage(messages.revoked),
                sortable: true,
              },
            ]}
          />
          <TableBody>
            {items.currentIdList
              .map(id => items.byId.get(id))
              .map(reporter => (
                <ReporterDataTableRow
                  key={reporter.get('id')}
                  intl={intl}
                  reporter={reporter}
                />
              ))}
          </TableBody>
        </ReporterDataTable>
      )}
      {!items.currentIdList.isEmpty() && (
        <BrowseTablePaginator
          history={history}
          location={location}
          intl={intl}
          className={cssClasses('BrowseTablePaginator')}
          paginatorStatus={messages.paginatorStatus}
          total={table.total}
          pageAt={pageAt}
          pageSize={pageSize}
        />
      )}
    </DataTableCard>
  </div>
)

export default enhance(ReporterList)
