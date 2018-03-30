import _ from 'lodash'
import classnames from 'classnames/bind'
import Immutable from 'immutable'
import React from 'react'
import { bindActionCreators } from 'redux'
import {
  compose,
  withProps,
  lifecycle,
  withStateHandlers,
  pure,
} from 'recompose'
import { connect } from 'react-redux'
import { Card } from 'react-toolbox/lib/card'

import { findKeyInTree } from '../../shared/utils/dom'

import { Unit } from '../../components/pureGrids'
import requirePermissions from '../../components/shared/requirePermissions'
import { fetchDeviceDashboard } from '../DashboardRedux'
import Title from './Title'
import CountryWithPoints from './CountryWithPoints'
import SummaryItemsBlock from './SummaryItemsBlock'
import messages from './messages'

const cssClasses = classnames.bind(require('./Status.css'))

const EMPTY_LIST = Immutable.List()

const enhance = compose(
  pure,
  requirePermissions({
    permissions: ['device:admin', 'device:view', 'device:edit'],
  }),
  connect(
    state => ({
      deviceList: state.dashboard.deviceList,
      deviceSummaryMap: state.dashboard.deviceSummaryMap,
    }),
    bindActionCreators.bind(null, {
      fetchDeviceDashboard,
    })
  ),
  lifecycle({
    componentDidMount() {
      this.props.fetchDeviceDashboard()
    },
  }),
  withStateHandlers(
    () => ({
      activeDeviceIds: [],
    }),
    {
      onSummaryItemClick: (state, { history }) => ({ target }) => {
        const searchParams = new URLSearchParams()
        const filtersParams = new URLSearchParams()
        filtersParams.set(
          'deviceIds',
          JSON.parse(findKeyInTree(target, 'deviceIds'))
        )
        searchParams.set('filters', filtersParams)

        history.push({
          pathname: '/browse/device',
          search: searchParams.toString(),
        })
      },

      onMouseEnter: () => ({ target }) => ({
        activeDeviceIds: JSON.parse(findKeyInTree(target, 'deviceIds')),
      }),
      onMouseLeave: ({ activeDeviceIds }) => ({ target }) => ({
        activeDeviceIds: _.isEqual(
          JSON.parse(findKeyInTree(target, 'deviceIds')),
          activeDeviceIds
        )
          ? []
          : activeDeviceIds,
      }),
    }
  ),
  withProps(({ deviceList, activeDeviceIds }) => {
    const deviceStateAbbrs = deviceList.map(it => it.get('stateAbbr')).toSet()

    return {
      fill: ({ properties: { postal } }) =>
        deviceStateAbbrs.has(postal) ? '#00c4e0' : '#a4e6f2',
      points: deviceList
        .map(it => ({
          id: it.get('id'),
          size: 6,
          fill: _.includes(activeDeviceIds, it.get('id'))
            ? '#EB4D62'
            : '#73D749',
          latitude: it.get('latitude'),
          longitude: it.get('longitude'),
        }))
        .toJS(),
    }
  })
)

export const DeviceStatus = ({
  intl,
  className,
  title,
  fill,
  points,
  deviceSummaryMap,
  onSummaryItemClick,
  onMouseEnter,
  onMouseLeave,
}) => (
  <Card className={className}>
    <Title colorClassName={cssClasses('Title__Color--device')} title={title} />
    <div>
      <Unit sm="1-2" lg="1-4">
        <CountryWithPoints
          countryIsoAlpha2Code="US"
          fill={fill}
          points={points}
        />
      </Unit>
      <Unit sm="1-2" lg="1-4">
        <SummaryItemsBlock
          data-device-ids={JSON.stringify(
            deviceSummaryMap
              .getIn(['operational', 'deviceIds'], EMPTY_LIST)
              .map(_.toString)
          )}
          onClick={onSummaryItemClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          intl={intl}
          title={intl.formatMessage(messages.summaryOperationalDevicesTitle)}
          items={deviceSummaryMap
            .getIn(['operational', 'items'], EMPTY_LIST)
            .toJS()}
        />
      </Unit>
      <Unit sm="1-2" lg="1-4">
        <SummaryItemsBlock
          data-device-ids={JSON.stringify(
            deviceSummaryMap
              .getIn(['warrantyExpiring', 'deviceIds'], EMPTY_LIST)
              .map(_.toString)
          )}
          onClick={onSummaryItemClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          intl={intl}
          title={intl.formatMessage(messages.summaryWarrantyExpiringTitle)}
          items={deviceSummaryMap
            .getIn(['warrantyExpiring', 'items'], EMPTY_LIST)
            .toJS()}
        />
        <SummaryItemsBlock
          data-device-ids={JSON.stringify(
            deviceSummaryMap
              .getIn(['calibration', 'deviceIds'], EMPTY_LIST)
              .map(_.toString)
          )}
          onClick={onSummaryItemClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          intl={intl}
          title={intl.formatMessage(messages.summaryCalibrationTitle)}
          items={deviceSummaryMap
            .getIn(['calibration', 'items'], EMPTY_LIST)
            .toJS()}
        />
      </Unit>
      <Unit sm="1-2" lg="1-4">
        <SummaryItemsBlock
          data-device-ids={JSON.stringify(
            deviceSummaryMap
              .getIn(['uploadingData', 'deviceIds'], EMPTY_LIST)
              .map(_.toString)
          )}
          onClick={onSummaryItemClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          intl={intl}
          title={intl.formatMessage(messages.summaryUploadingDataTitle)}
          items={deviceSummaryMap
            .getIn(['uploadingData', 'items'], EMPTY_LIST)
            .toJS()}
        />
        <SummaryItemsBlock
          data-device-ids={JSON.stringify(
            deviceSummaryMap
              .getIn(['testFailures', 'deviceIds'], EMPTY_LIST)
              .map(_.toString)
          )}
          onClick={onSummaryItemClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          intl={intl}
          title={intl.formatMessage(messages.summaryTestFailuresTitle)}
          items={deviceSummaryMap
            .getIn(['testFailures', 'items'], EMPTY_LIST)
            .toJS()}
        />
      </Unit>
    </div>
  </Card>
)

export default enhance(DeviceStatus)
