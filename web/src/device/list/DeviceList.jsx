import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withProps, withHandlers, lifecycle, pure } from 'recompose'
import { injectIntl, defineMessages } from 'react-intl'
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

const cssClasses = classnames.bind(require('./DeviceList.css'))

const messages = defineMessages({
  devicesTitle: {
    id: 'pages.DeviceList.devicesTitle',
    defaultMessage: 'Devices',
  },
  deviceName: {
    id: 'pages.DeviceList.deviceName',
    defaultMessage: 'Device Name',
  },
  state: {
    id: 'pages.DeviceList.state',
    defaultMessage: 'State',
  },
  status: {
    id: 'pages.DeviceList.status',
    defaultMessage: 'Status',
  },
  reportingFor: {
    id: 'pages.DeviceList.reportingFor',
    defaultMessage: 'Reporting For',
  },
  lastSeen: {
    id: 'pages.DeviceList.lastSeen',
    defaultMessage: 'Last Seen',
  },
  numberOfTestsLeft: {
    id: 'pages.DeviceList.numberOfTestsLeft',
    defaultMessage: 'Number',
  },
  numberOfTestsRight: {
    id: 'pages.DeviceList.numberOfTestsRight',
    defaultMessage: 'Of Tests',
  },
  lastMonth: {
    id: 'pages.DeviceList.lastMonth',
    defaultMessage: 'Last Month',
  },
  thisMonth: {
    id: 'pages.DeviceList.thisMonth',
    defaultMessage: 'This Month',
  },
  paginatorStatus: {
    id: 'pages.DeviceList.paginatorStatus',
    defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# device}
      other {# devices}
    }`,
  },
})

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
    'createdOn',
    'lastSeen',
    'lastMonth',
    'thisMonth',
  ],
})
const filtersSanitizer = sanitizeFiltersStringBy(FILTERS_CONFIG)
const filtersFromLocation = composeSanitizer(
  _.flowRight(filtersSanitizer, searchParams => searchParams.get('filters')),
  searchSanitizer
)

const enhance = compose(
  pure,
  injectIntl,
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
  withProps(
    makeSortPageSelector({
      sortCol: 'name',
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
    onHeadColumnClick: ({ history, location, sortCol, sortDir }) => ({
      currentTarget: { dataset: { column: nextSortCol } },
    }) => {
      const searchParams = new URLSearchParams(location.search)

      if (sortCol !== nextSortCol) {
        searchParams.set('sortCol', nextSortCol)
      } else {
        searchParams.set('sortDir', sortDir !== 'asc' ? 'asc' : 'desc')
      }

      history.replace({
        ...location,
        search: searchParams.toString(),
      })
    },
    onRowClick: ({ history }) => ({
      currentTarget: { dataset: { deviceId } },
    }) => history.push(`/browse/device/${deviceId}`),
  }),
  lifecycle({
    componentWillMount() {
      const { sanitized, value: searchParams } = searchSanitizer(
        this.props.location
      )
      const {
        sanitized: filtersSanitized,
        value: filtersParams,
      } = filtersSanitizer(searchParams.get('filters'))
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
  onHeadColumnClick,
  onRowClick,
}) =>
  <div className={cssClasses('Container')}>
    <Helmet
      title={intl.formatMessage(messages.devicesTitle)}
      titleTemplate="%s - Aspect"
      defaultTitle="Aspect"
    />
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
      {items.currentIdList.isEmpty() &&
        <BrowseEmptyList history={history} location={location} intl={intl} />}
      {!items.currentIdList.isEmpty() &&
        <DeviceDataTable
          selectable={false}
          className={cssClasses('DeviceDataTable')}
        >
          <DeviceDataTableHead
            sortColumnKey={sortCol}
            sortColumnDir={sortDir}
            columns={[
              {
                key: 'name',
                label: intl.formatMessage(messages.deviceName),
                onClick: onHeadColumnClick,
              },
              {
                key: 'state',
                label: intl.formatMessage(messages.state),
                onClick: onHeadColumnClick,
              },
              {
                key: 'status',
                label: intl.formatMessage(messages.status),
                onClick: onHeadColumnClick,
              },
              {
                key: 'createdOn',
                label: intl.formatMessage(messages.reportingFor),
                onClick: onHeadColumnClick,
              },
              {
                key: 'lastSeen',
                label: intl.formatMessage(messages.lastSeen),
                onClick: onHeadColumnClick,
              },
              {
                key: 'lastMonth',
                className: cssClasses('DeviceDataTableHead__Tests--left'),
                onClick: onHeadColumnClick,
                label: (
                  <span>
                    {intl.formatMessage(messages.numberOfTestsLeft)}
                    <br />
                    {intl.formatMessage(messages.lastMonth)}
                  </span>
                ),
              },
              {
                key: 'thisMonth',
                className: cssClasses('DeviceDataTableHead__Tests--right'),
                onClick: onHeadColumnClick,
                label: (
                  <span>
                    {intl.formatMessage(messages.numberOfTestsRight)}
                    <br />
                    {intl.formatMessage(messages.thisMonth)}
                  </span>
                ),
              },
            ]}
          />
          {items.currentIdList
            .map(id => items.byId.get(id))
            .map(device =>
              <DeviceDataTableRow
                key={device.get('id')}
                intl={intl}
                device={device}
                onClick={onRowClick}
                data-device-Id={device.get('id')}
              />
            )}
        </DeviceDataTable>}
      {!items.currentIdList.isEmpty() &&
        <BrowseTablePaginator
          history={history}
          location={location}
          intl={intl}
          paginatorStatus={messages.paginatorStatus}
          total={table.total}
          pageAt={pageAt}
          pageSize={pageSize}
        />}
    </DataTableCard>
  </div>

export default enhance(DeviceList)
