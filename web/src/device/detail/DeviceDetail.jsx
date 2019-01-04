import Immutable from 'immutable'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withHandlers, lifecycle, withProps } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Switch, Route } from 'react-router-dom'
import isEditable from '../../shared/selectors/device'
import DelayShowingProgressBar from '../../components/shared/DelayShowingProgressBar'
import { fetchSingleDevice, updateSingleDevice } from '../DeviceRedux'
import DeviceDetailProfile from './profile/DeviceDetailProfile'
import DeviceDetailOperation from './operation/DeviceDetailOperation'
import DeviceDetailAlerts from './alerts/DeviceDetailAlerts'
import DeviceDetailEdit from './edit/DeviceDetailEdit'

const cssClasses = classnames.bind(require('./DeviceDetail.css'))

const EMPTY_MAP = Immutable.Map()

const enhance = compose(
  connect(
    (state, props) => {
      const device = state.device.items.byId.get(
        props.match.params.deviceId,
        EMPTY_MAP
      )

      return {
        editable: isEditable(state.user, device),
        loading: !!state.device.requestedAt,
        device,
      }
    },
    bindActionCreators.bind(null, {
      fetchSingleDevice,
      updateSingleDevice,
    })
  ),
  withHandlers({
    onInitialLoad: ({ location, match, fetchSingleDevice }) => () => {
      const searchParams = new URLSearchParams(location.search)
      fetchSingleDevice(match.params.deviceId, searchParams)
    },

    onDateRangeChange: ({ history, location }) => dateRange => {
      const searchParams = new URLSearchParams(location.search)
      searchParams.set('dateRange', dateRange)

      history.replace({
        ...location,
        search: searchParams.toString(),
      })
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
  }),
  withProps(({ location }) => {
    const searchParams = new URLSearchParams(location.search)

    return {
      dateRange: searchParams.get('dateRange') || '30',
    }
  })
)

export const DeviceDetail = ({
  intl,
  match,
  // --- injected by recompose ---
  loading,
  editable,
  dateRange,
  onDateRangeChange,
  device,
  updateSingleDevice,
}) => (
  <div>
    {device.get('id') && (
      <Switch>
        <Route
          exact
          path={match.path}
          render={props => (
            <DeviceDetailProfile
              intl={intl}
              {...props}
              dateRange={dateRange}
              onDateRangeChange={onDateRangeChange}
              device={device}
              updateSingleDevice={updateSingleDevice}
            />
          )}
        />
        <Route
          exact
          path={`${match.path}/operation`}
          render={props => (
            <DeviceDetailOperation intl={intl} {...props} device={device} />
          )}
        />
        <Route
          exact
          path={`${match.path}/alerts`}
          render={props => (
            <DeviceDetailAlerts intl={intl} {...props} device={device} />
          )}
        />
        <Route
          exact
          path={`${match.path}/edit`}
          render={props => (
            <DeviceDetailEdit
              intl={intl}
              {...props}
              device={device}
              editable={editable}
              updateSingleDevice={updateSingleDevice}
            />
          )}
        />
      </Switch>
    )}
    {loading && (
      <DelayShowingProgressBar
        className={cssClasses('DelayShowingProgressBar')}
        disabled={false}
        type="circular"
        variant="indeterminate"
      />
    )}
  </div>
)

export default enhance(DeviceDetail)
