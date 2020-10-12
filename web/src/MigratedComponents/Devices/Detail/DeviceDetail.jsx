import Immutable from 'immutable'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withHandlers, lifecycle, withProps } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { defineMessages, useIntl } from 'react-intl'

import {
  Switch,
  Redirect,
  Route,
  useHistory,
  useParams,
  useLocation,
} from 'react-router-dom'
import isEditable from '../../../shared/selectors/isEditable'
import { DelayShowingProgressCircular } from '../../../components/shared/DelayShowingProgressBar'
import {
  fetchSingleDevice,
  updateSingleDevice,
  fetchPerformanceReport,
} from '../../../device/DeviceRedux'
import DeviceDetailProfile from './profile/DeviceDetailProfile'
import DeviceDetailOperation from './operation/DeviceDetailOperation'
import DeviceDetailAlerts from './Alerts/DeviceDetailAlerts'
import DeviceDetailEdit from './edit/DeviceDetailEdit'

import Shell from '../../Shell'
import ShellHeader from '../../Shell/Header'
import ShellContent from '../../Shell/Content'
import AspectButton from '../../../components/shared/AspectButton'

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
        performanceReport: state.device.performanceReport,
      }
    },
    bindActionCreators.bind(null, {
      fetchSingleDevice,
      updateSingleDevice,
      fetchPerformanceReport,
    })
  ),
  withHandlers({
    onInitialLoad: ({
      location,
      match,
      fetchSingleDevice,
      fetchPerformanceReport,
    }) => () => {
      const searchParams = new URLSearchParams(location.search)
      fetchSingleDevice(match.params.deviceId, searchParams)
      fetchPerformanceReport(match.params.deviceId)
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

const messages = defineMessages({
  profile: {
    id: 'pages.DeviceDetail.profile',
    defaultMessage: 'Profile',
  },
  operation: {
    id: 'pages.DeviceDetail.operation',
    defaultMessage: 'Operation',
  },
  alerts: {
    id: 'pages.DeviceDetail.alerts',
    defaultMessage: 'Alerts',
  },
  edit: {
    id: 'pages.DeviceDetail.edit',
    defaultMessage: 'Edit',
  },
})

export const DeviceDetail = ({
  match,
  // --- injected by recompose ---
  loading,
  editable,
  dateRange,
  onDateRangeChange,
  device,
  displayPreferences,
  updateSingleDevice,
}) => {
  const history = useHistory()
  const { deviceId } = useParams()
  const intl = useIntl()
  return (
    <Shell>
      <ShellHeader title="Devices">
        {[
          {
            label: intl.formatMessage(messages.profile),
            path: `/browse/device/${deviceId}`,
          },
          {
            label: intl.formatMessage(messages.alerts),
            path: `/browse/device/${deviceId}/alerts`,
          },
          {
            label: intl.formatMessage(messages.edit),
            path: `/browse/device/${deviceId}/edit`,
          },
        ].map(({ label, path, disabled = false }) => (
          <AspectButton
            key={path}
            onClick={({
              currentTarget: {
                dataset: { path },
              },
            }) => history.push(path)}
            disabled={disabled}
            data-path={path}
            color="primary"
            variant="contained"
            inverse={path !== history?.location?.pathname}
          >
            {label}
          </AspectButton>
        ))}
      </ShellHeader>
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
    </Shell>
  )
}

export default enhance(DeviceDetail)
