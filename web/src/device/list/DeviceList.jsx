import classnames from 'classnames/bind'
import React from 'react'
import { compose, withHandlers, lifecycle, pure } from 'recompose'
import { injectIntl, defineMessages } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import { Card } from 'react-toolbox/lib/card'
import { ProgressBar } from 'react-toolbox/lib/progress_bar'

// Our own imports
import NavTitle from '../../globals/components/NavTitle'
import BrowseFilters from '../../globals/components/BrowseFilters'
import EmptyList from '../../components/shared/EmptyList'
import TablePaginator from '../../components/shared/TablePaginator'
import {
  DeviceDataTable,
  DeviceDataTableHead,
  DeviceDataTableRow,
} from '../../device/list/DeviceDataTable'
import { configureListFilter } from '../../filter/FilterRedux'
import { fetchListFilteredDevices, exportDevices } from '../DeviceRedux'

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

const enhance = compose(
  pure,
  injectIntl,
  connect(
    state => ({
      listFilter: state.filter.listFilter,
      items: state.device.items,
      table: state.device.table,
    }),
    bindActionCreators.bind(null, {
      configureListFilter,
      fetchListFilteredDevices,

      exportDevices,
    })
  ),
  withHandlers({
    onExportClick: ({ exportDevices, table }) => (
      formatType,
      receivedExportResponse
    ) =>
      exportDevices(
        { hasResults: 1 },
        formatType,
        table.sortCol,
        table.sortDir,
        table.page,
        table.pageSize,
        receivedExportResponse
      ),
    onHeadColumnClick: ({ fetchListFilteredDevices, table }) => ({
      currentTarget: { dataset: { column: nextSortCol } },
    }) =>
      fetchListFilteredDevices(
        { hasResults: 1 },
        nextSortCol,
        table.sortCol === nextSortCol
          ? table.sortDir === 'asc' ? 'desc' : 'asc'
          : table.sortDir,
        table.page,
        table.pageSize
      ),
    onRowClick: ({ history }) => ({
      currentTarget: { dataset: { deviceId } },
    }) => history.push(`/browse/device/${deviceId}`),
    onPageChange: ({ fetchListFilteredDevices, table }) => nextPage =>
      fetchListFilteredDevices(
        { hasResults: 1 },
        table.sortCol,
        table.sortDir,
        nextPage,
        table.pageSize
      ),
    onPageSizeChange: ({ fetchListFilteredDevices, table }) => nextPageSize =>
      fetchListFilteredDevices(
        { hasResults: 1 },
        table.sortCol,
        table.sortDir,
        0,
        nextPageSize
      ),
  }),
  lifecycle({
    componentWillMount() {
      this.props.configureListFilter({
        assayAndResultCategory: true,
        geography: true,
        siteName: true,
        date: true,
        deviceName: true,
        deviceStatus: true,
      })
    },

    componentDidMount() {
      this.props.onPageChange(0)
    },

    componentWillReceiveProps(nextProps) {
      if (this.props.listFilter !== nextProps.listFilter) {
        this.props.onPageChange(0)
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
  //
  onExportClick,
  onHeadColumnClick,
  onRowClick,
  onPageChange,
  onPageSizeChange,
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
      onClickExport={onExportClick}
      askConfirmationForExport={table.total > 1000}
    />
    {items.currentIdList.isEmpty() && <EmptyList />}
    {!items.currentIdList.isEmpty() &&
      <Card className={cssClasses('Card')}>
        <ProgressBar
          mode={table.loading ? 'indeterminate' : 'determinate'}
          disabled={!table.loading}
          className={cssClasses('ProgressBar')}
          theme={{
            indeterminate: cssClasses('ProgressBar--indeterminate'),
          }}
        />
        <DeviceDataTable
          selectable={false}
          className={cssClasses('DeviceDataTable')}
        >
          <DeviceDataTableHead
            sortColumnKey={table.sortCol}
            sortColumnDir={table.sortDir}
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
          {items.currentIdList.map(id => items.byId.get(id)).map(device =>
            <DeviceDataTableRow
              key={device.get('id')}
              onClick={onRowClick}
              data-device-Id={device.get('id')}
              columns={[
                {
                  column: device.get('name'),
                },
                {
                  column: device.get('state'),
                },
                {
                  column: device.get('status'),
                },
                {
                  column: intl.formatRelative(device.get('createdOn')),
                },
                {
                  column: intl.formatRelative(device.get('lastSeen')),
                },
                {
                  column: intl.formatNumber(device.get('lastMonth')),
                },
                {
                  column: intl.formatNumber(device.get('thisMonth')),
                },
              ]}
            />
          )}
        </DeviceDataTable>
        <TablePaginator
          className={cssClasses('TablePaginator')}
          intl={intl}
          paginatorStatus={messages.paginatorStatus}
          page={table.page}
          pageSize={table.pageSize}
          total={table.total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </Card>}
  </div>

export default enhance(DeviceList)
