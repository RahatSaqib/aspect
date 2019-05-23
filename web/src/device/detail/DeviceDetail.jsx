import Immutable from 'immutable'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withHandlers, lifecycle, withProps } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Switch, Redirect, Route } from 'react-router-dom'
import isEditable from '../../shared/selectors/isEditable'
import { DelayShowingProgressCircular } from '../../components/shared/DelayShowingProgressBar'
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

      const { displayPreferences } = state.user

      return {
        editable: isEditable(state.user, 'device'),
        loading: !!state.device.requestedAt,
        device,
        displayPreferences,
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

    onDateRangeChange: ({ history, location }) => ({
      target: { value: dateRange },
    }) => {
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
  displayPreferences,
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
              disabled={!editable}
              displayPreferences={displayPreferences}
              updateSingleDevice={updateSingleDevice}
            />
          )}
        />
        <Route
          exact
          path={`${match.path}/operation`}
          render={props => (
            <DeviceDetailOperation
              intl={intl}
              {...props}
              device={device}
              disabled={!editable}
            />
          )}
        />
        <Route
          exact
          path={`${match.path}/alerts`}
          render={props => (
            <DeviceDetailAlerts
              intl={intl}
              {...props}
              device={device}
              disabled={!editable}
            />
          )}
        />
        <Route
          exact
          path={`${match.path}/edit`}
          render={props =>
            editable ? (
              <DeviceDetailEdit
                intl={intl}
                {...props}
                device={device}
                editable={editable}
                updateSingleDevice={updateSingleDevice}
              />
            ) : (
              <Redirect to={match.url} />
            )
          }
        />
      </Switch>
    )}
    {loading && (
      <DelayShowingProgressCircular
        className={cssClasses('DelayShowingProgressCircular')}
        disabled={false}
        variant="indeterminate"
      />
    )}
  </div>
)

export default enhance(DeviceDetail)
