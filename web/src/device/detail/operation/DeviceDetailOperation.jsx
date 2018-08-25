import Immutable from 'immutable'
import classnames from 'classnames/bind'
import React from 'react'
import { defineMessages } from 'react-intl'
import { compose, withProps, withHandlers, lifecycle } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Button } from 'react-toolbox/lib/button'
import { Card } from 'react-toolbox/lib/card'
import MdFileDownload from 'react-icons/lib/md/file-download'
import Helmet from 'react-helmet'
import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../../shared/selectors/searchParams'
import { formatDate } from '../../../shared/utils/dateFormat'
import DataTableProgressBar from '../../../components/shared/DataTableProgressBar'
import BrowseTablePaginator from '../../../globals/components/BrowseTablePaginator'
import BrowseEmptyList from '../../../globals/components/BrowseEmptyList'
import { fetchDeviceOperations } from '../../../deviceOperation/DeviceOperationRedux'
import DeviceDetailBackBar from '../DeviceDetailBackBar'
import Summary from '../Summary'
import {
  DeviceOperationDataTable,
  DeviceOperationDataTableHead,
  DeviceOperationDataTableRow,
} from './DeviceOperationDataTable'

const cssClasses = classnames.bind(require('../DeviceDetail.css'))

const EMPTY_DATE = new Date()

const messages = defineMessages({
  firmware: {
    id: 'pages.DeviceDetailOperation.firmware',
    defaultMessage: 'Firmware',
  },
  requirePrinter: {
    id: 'pages.DeviceDetailOperation.requirePrinter',
    defaultMessage: 'Require printer',
  },
  hostId: {
    id: 'pages.DeviceDetailEdit.hostId',
    defaultMessage: 'Host ID',
  },
  serialNumber: {
    id: 'pages.DeviceDetailEdit.serialNumber',
    defaultMessage: 'Serial number',
  },
  firstApproved: {
    id: 'pages.DeviceDetailEdit.firstApproved',
    defaultMessage: 'First approved',
  },
  startedOn: {
    id: 'pages.DeviceDetailOperation.startedOn',
    defaultMessage: 'Date',
  },
  id: {
    id: 'pages.DeviceDetailOperation.id',
    defaultMessage: 'ID',
  },
  voltage: {
    id: 'pages.DeviceDetailOperation.voltage',
    defaultMessage: 'Voltage',
  },
  temperature: {
    id: 'pages.DeviceDetailOperation.temperature',
    defaultMessage: 'Temperature',
  },
  paginatorStatus: {
    id: 'pages.DeviceDetailOperation.paginatorStatus',
    defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# record}
      other {# records}
    }`,
  },
})

const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: ['startedOn', 'id'],
})
const filtersFromLocation = composeSanitizer(
  () => ({
    sanitized: false,
    value: new URLSearchParams(),
  }),
  searchSanitizer
)

const enhance = compose(
  withProps(
    makeSortPageSelector({
      sortCol: 'startedOn',
      sortDir: 'desc',
    })
  ),
  connect(
    state => ({
      items: state.deviceOperation.items,
      table: state.deviceOperation.table,
    }),
    bindActionCreators.bind(null, {
      fetchDeviceOperations,
    })
  ),
  withHandlers({
    onInitialLoad: ({
      match,
      location,
      fetchDeviceOperations,
      sortCol,
      sortDir,
      pageAt,
      pageSize,
    }) => () => {
      const { sanitized, value: filtersParams } = filtersFromLocation(location)
      if (!sanitized) {
        filtersParams.set('deviceId', match.params.deviceId)
        fetchDeviceOperations(filtersParams, sortCol, sortDir, pageAt, pageSize)
      }
    },

    onExportClick: ({
      location,
      exportResults,
      sortCol,
      sortDir,
      pageAt,
      pageSize,
    }) => formatType => {
      const { sanitized, value: filtersParams } = filtersFromLocation(location)
      if (!sanitized) {
        exportResults(
          filtersParams,
          formatType,
          sortCol,
          sortDir,
          pageAt,
          pageSize
        )
      }
    },
  }),
  lifecycle({
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

export const DeviceDetailOperation = ({
  intl,
  history,
  location,
  match,
  device,
  // --- injected by recompose ---
  table,
  items,
  sortCol,
  sortDir,
  pageAt,
  pageSize,
  onExportClick,
}) => (
  <div>
    <Helmet title={device.get('name')} />
    <DeviceDetailBackBar
      intl={intl}
      history={history}
      location={location}
      match={match}
      title={device.get('name')}
    />
    <section className={cssClasses('Section', 'Section--first')}>
      <Card className={cssClasses('Section__Content')}>
        <div>
          <Summary title="Firmware" description="TODO: 72.43.102" />
          <Summary
            title={intl.formatMessage(messages.requirePrinter)}
            description={device.getIn(['configurationData', 'requirePrinter'])}
          />
          <Summary
            title={intl.formatMessage(messages.hostId)}
            description={device.get('hostId')}
          />
          <Summary
            title={intl.formatMessage(messages.serialNumber)}
            description={device.get('serial')}
          />
          <Summary
            title={intl.formatMessage(messages.firstApproved)}
            description={`${device.get('approvedBy')} (${formatDate(
              device.get('approvedOn', EMPTY_DATE)
            )})`}
          />
        </div>
      </Card>
    </section>
    <section className={cssClasses('Section')}>
      <Card className={cssClasses('Section__Content')}>
        <header className={cssClasses('Header')}>
          <div className={cssClasses('Header__Title')}>Operation history</div>
          <div className={cssClasses('Header__Actions')}>
            <Button icon={<MdFileDownload />} onClick={onExportClick} />
          </div>
        </header>
        <div>
          <DataTableProgressBar disabled={!table.loading} />
          {items.currentIdList.isEmpty() && (
            <BrowseEmptyList
              history={history}
              location={location}
              intl={intl}
            />
          )}
          {!items.currentIdList.isEmpty() && (
            <DeviceOperationDataTable
              selectable={false}
              className={cssClasses('DeviceOperationDataTable')}
            >
              <DeviceOperationDataTableHead
                history={history}
                location={location}
                sortColumnKey={sortCol}
                sortColumnDir={sortDir}
                columns={Immutable.List([
                  {
                    key: 'startedOn',
                    label: intl.formatMessage(messages.startedOn),
                    sortable: true,
                  },
                  {
                    key: 'id',
                    label: intl.formatMessage(messages.id),
                    sortable: true,
                  },
                ]).concat(
                  device
                    .getIn(['deviceType', 'deviceOperationSchema'])
                    .map((schema, key) => ({
                      key,
                      label: intl.formatMessage(
                        /* available keys: messages.voltage, messages.temperature */
                        messages[key]
                      ),
                    }))
                    .valueSeq()
                )}
              />
              {items.currentIdList
                .map(id => items.byId.get(id))
                .map(deviceOperation => (
                  <DeviceOperationDataTableRow
                    key={deviceOperation.get('id')}
                    intl={intl}
                    deviceOperation={deviceOperation}
                    deviceOperationSchema={device.getIn([
                      'deviceType',
                      'deviceOperationSchema',
                    ])}
                  />
                ))}
            </DeviceOperationDataTable>
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
        </div>
      </Card>
    </section>
  </div>
)

export default enhance(DeviceDetailOperation)
