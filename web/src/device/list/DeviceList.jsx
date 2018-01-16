import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withProps, withHandlers, lifecycle } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../shared/selectors/searchParams'
import { sanitizeFiltersStringBy } from '../../filter/utils'
import NavTitle from '../../globals/components/NavTitle'
import BrowseFilters from '../../globals/components/BrowseFilters'
import BrowseEmptyList from '../../globals/components/BrowseEmptyList'
import BrowseTablePaginator from '../../globals/components/BrowseTablePaginator'
import DataTableCard from '../../components/shared/DataTableCard'
import DataTableProgressBar from '../../components/shared/DataTableProgressBar'
import { fetchDevices, exportDevices } from '../DeviceRedux'
import {
  DeviceDataTable,
  DeviceDataTableHead,
  DeviceDataTableRow,
} from './DeviceDataTable'
import messages from './messages'

const cssClasses = classnames.bind(require('./DeviceList.css'))

const FILTERS_CONFIG = {
  assayAndResultCategory: true,
  geography: true,
  state: true,
  lga: true,
  siteName: true,
  date: true,
  deviceName: true,
  deviceStatus: true,
}

const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: [
    'name',
    'state',
    'status',
    'availabilityRate',
    'errorRate',
    'createdOn',
    'lastSeen',
    'lastMonth',
    'thisMonth',
  ],
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
      sortCol: 'name',
    })
  ),
  connect(
    state => ({
      items: state.device.items,
      table: state.device.table,
    }),
    bindActionCreators.bind(null, {
      fetchDevices,
      exportDevices,
    })
  ),
  withHandlers({
    onInitialLoad: ({
      location,
      fetchDevices,
      sortCol,
      sortDir,
      pageAt,
      pageSize,
    }) => () => {
      const { sanitized, value: filtersParams } = filtersFromLocation(location)
      if (!sanitized) {
        fetchDevices(
          filtersParams,
          { hasResults: 1 },
          sortCol,
          sortDir,
          pageAt,
          pageSize
        )
      }
    },
    onExportClick: ({
      location,
      exportDevices,
      sortCol,
      sortDir,
      pageAt,
      pageSize,
    }) => formatType => {
      const { sanitized, value: filtersParams } = filtersFromLocation(location)
      if (!sanitized) {
        exportDevices(
          filtersParams,
          { hasResults: 1 },
          formatType,
          sortCol,
          sortDir,
          pageAt,
          pageSize
        )
      }
    },
    onRowClick: ({ history }) => ({
      currentTarget: { dataset: { deviceId } },
    }) => history.push(`/browse/device/${deviceId}`),
    onAlertClick: ({ history }) => event => {
      event.stopPropagation()
      const { currentTarget: { dataset: { pathname } } } = event
      history.push(pathname)
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

export const DeviceList = ({
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
  onExportClick,
  onRowClick,
  onAlertClick,
}) => (
  <div className={cssClasses('Container')}>
    <Helmet title={intl.formatMessage(messages.devicesTitle)} />
    <NavTitle title={intl.formatMessage(messages.devicesTitle)} />
    <BrowseFilters
      history={history}
      location={location}
      intl={intl}
      config={FILTERS_CONFIG}
      onClickExport={onExportClick}
      askConfirmationForExport={table.total > 1000}
    />
    <DataTableCard>
      <DataTableProgressBar disabled={!table.loading} />
      {items.currentIdList.isEmpty() && (
        <BrowseEmptyList history={history} location={location} intl={intl} />
      )}
      {!items.currentIdList.isEmpty() && (
        <DeviceDataTable
          selectable={false}
          className={cssClasses('DeviceDataTable')}
        >
          <DeviceDataTableHead
            compact
            columns={[
              {
                key: 'empty',
                colSpan: 8,
              },
              {
                key: 'tests',
                colSpan: 2,
                label: intl.formatMessage(messages.numberOfTests),
              },
            ]}
          />
          <DeviceDataTableHead
            history={history}
            location={location}
            sortColumnKey={sortCol}
            sortColumnDir={sortDir}
            columns={[
              {
                key: 'name',
                label: intl.formatMessage(messages.deviceName),
                sortable: true,
              },
              {
                key: 'state',
                label: intl.formatMessage(messages.state),
                sortable: true,
              },
              {
                key: 'status',
                label: intl.formatMessage(messages.status),
                sortable: true,
              },
              {
                key: 'availabilityRate',
                label: intl.formatMessage(messages.availabilityRate),
                sortable: true,
              },
              {
                key: 'errorRate',
                label: intl.formatMessage(messages.errorRate),
                sortable: true,
              },
              {
                key: 'issues',
                label: intl.formatMessage(messages.issues),
              },
              {
                key: 'createdOn',
                sortable: true,
                label: intl.formatMessage(messages.reportingFor),
              },
              {
                key: 'lastSeen',
                sortable: true,
                label: intl.formatMessage(messages.lastSeen),
              },
              {
                key: 'lastMonth',
                sortable: true,
                label: intl.formatMessage(messages.lastMonth),
              },
              {
                key: 'thisMonth',
                sortable: true,
                label: intl.formatMessage(messages.thisMonth),
              },
            ]}
          />
          {items.currentIdList
            .map(id => items.byId.get(id))
            .map(device => (
              <DeviceDataTableRow
                key={device.get('id')}
                intl={intl}
                device={device}
                onClick={onRowClick}
                onAlertClick={onAlertClick}
                data-device-Id={device.get('id')}
              />
            ))}
        </DeviceDataTable>
      )}
      {!items.currentIdList.isEmpty() && (
        <BrowseTablePaginator
          history={history}
          location={location}
          intl={intl}
          paginatorStatus={messages.paginatorStatus}
          total={table.total}
          pageAt={pageAt}
          pageSize={pageSize}
        />
      )}
    </DataTableCard>
  </div>
)

export default enhance(DeviceList)
