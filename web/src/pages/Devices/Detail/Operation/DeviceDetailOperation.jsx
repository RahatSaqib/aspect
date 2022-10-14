import React from 'react'
import { Card, IconButton, TableBody } from '@mui/material'
import classnames from 'classnames/bind'
import Immutable from 'immutable'
import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet'
import { MdFileDownload } from 'react-icons/md'
import { defineMessages } from 'react-intl'
import { connect } from 'react-redux'
import { useParams } from 'react-router-dom'
import { compose, withProps, withHandlers, lifecycle } from 'recompose'
import useI18n from '../../../../hooks/useI18n'
import BrowseEmptyList from '../../../../oldComponents/BrowseEmptyList'
import BrowseTablePaginator from '../../../../oldComponents/BrowseTablePaginator'
import DataTableProgressBar from '../../../../oldComponents/shared/DataTableProgressBar'
import Summary from '../../../../oldComponents/Summary'
import { fetchDeviceOperations } from '../../../../store/DeviceOperationRedux'
import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../../../utils/selectors/searchParams'
import { formatDate } from '../../../../utils/utils/dateFormat'
import styles from '../DeviceDetail.css'
import {
  DeviceOperationDataTable,
  DeviceOperationDataTableHead,
  DeviceOperationDataTableRow,
} from './DeviceOperationDataTable'

const cssClasses = classnames.bind(styles)

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
    {
      fetchDeviceOperations,
    }
  ),
  WrapperComponent => props => {
    const { deviceId } = useParams()
    return <WrapperComponent {...props} deviceId={deviceId} />
  },
  withHandlers({
    onInitialLoad:
      ({ deviceId, location, fetchDeviceOperations, sortCol, sortDir, pageAt, pageSize }) =>
      () => {
        const { sanitized, value: filtersParams } = filtersFromLocation(location)
        if (!sanitized) {
          filtersParams.set('deviceId', deviceId)
          fetchDeviceOperations(filtersParams, sortCol, sortDir, pageAt, pageSize)
        }
      },

    onExportClick:
      ({ location, exportResults, sortCol, sortDir, pageAt, pageSize }) =>
      formatType => {
        const { sanitized, value: filtersParams } = filtersFromLocation(location)
        if (!sanitized) {
          exportResults(filtersParams, formatType, sortCol, sortDir, pageAt, pageSize)
        }
      },
  }),
  lifecycle({
    componentDidMount() {
      this.props.onInitialLoad()
    },

    UNSAFE_componentWillReceiveProps(nextProps) {
      if (this.props.location.search !== nextProps.location.search) {
        this.props.onInitialLoad()
      }
    },
  })
)

export const DeviceDetailOperation = ({
  navigate,
  location,
  device,
  // --- injected by recompose ---
  table,
  items,
  sortCol,
  sortDir,
  pageAt,
  pageSize,
  onExportClick,
}) => {
  const intl = useI18n()
  return (
    <div>
      <Helmet title={device.get('name')} />
      <section className={cssClasses('Section', 'Section--first')}>
        <Card className={cssClasses('Section__Content')}>
          <div>
            <Summary title="Firmware" description="TODO: 72.43.102" />
            <Summary
              title={intl.formatMessage(messages.requirePrinter)}
              description={device.getIn(['configurationData', 'requirePrinter'])}
            />
            <Summary title={intl.formatMessage(messages.hostId)} description={device.get('hostId')} />
            <Summary title={intl.formatMessage(messages.serialNumber)} description={device.get('serial')} />
            <Summary
              title={intl.formatMessage(messages.firstApproved)}
              description={`${device.get('approvedBy')} (${formatDate(device.get('approvedOn', EMPTY_DATE))})`}
            />
          </div>
        </Card>
      </section>
      <section className={cssClasses('Section')}>
        <Card className={cssClasses('Section__Content')}>
          <header className={cssClasses('Header')}>
            <div className={cssClasses('Header__Title')}>Operation history</div>
            <div className={cssClasses('Header__Actions')}>
              <IconButton onClick={onExportClick}>
                <MdFileDownload />
              </IconButton>
            </div>
          </header>
          <div>
            <DataTableProgressBar disabled={!table.loading} />
            {items.currentIdList.isEmpty() && <BrowseEmptyList navigate={navigate} location={location} />}
            {!items.currentIdList.isEmpty() && (
              <DeviceOperationDataTable className={cssClasses('DeviceOperationDataTable')}>
                <DeviceOperationDataTableHead
                  navigate={navigate}
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
                <TableBody>
                  {items.currentIdList
                    .map(id => items.byId.get(id))
                    .map(deviceOperation => (
                      <DeviceOperationDataTableRow
                        key={deviceOperation.get('id')}
                        intl={intl}
                        deviceOperation={deviceOperation}
                        deviceOperationSchema={device.getIn(['deviceType', 'deviceOperationSchema'])}
                      />
                    ))}
                </TableBody>
              </DeviceOperationDataTable>
            )}
            {!items.currentIdList.isEmpty() && (
              <BrowseTablePaginator
                navigate={navigate}
                location={location}
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
}

DeviceDetailOperation.propTypes = {
  navigate: PropTypes.oneOfType([PropTypes.func]).isRequired,
  location: PropTypes.oneOfType([PropTypes.object]).isRequired,
  device: PropTypes.oneOfType([PropTypes.object]).isRequired,
  table: PropTypes.oneOfType([PropTypes.object]).isRequired,
  items: PropTypes.oneOfType([PropTypes.object]).isRequired,
  sortCol: PropTypes.string.isRequired,
  sortDir: PropTypes.string.isRequired,
  pageAt: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  onExportClick: PropTypes.func.isRequired,
}

export default enhance(DeviceDetailOperation)
