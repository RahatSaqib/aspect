// Imports from packages
import _ from 'lodash'
import React from 'react'
import {
  injectIntl,
  defineMessages
} from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

// Material-UI
import LinearProgress from 'material-ui/LinearProgress'

// Our own imports
import { fetchSingleDevice } from '../../../../action_creators/device_creators'
import ReadOnlyFields from '../../../shared/ReadOnlyFields'
import { EditableFieldsContainer } from './EditableFields'
import styles from './index.css'

const messages = defineMessages({
  title: {
    id: 'pages.DeviceDetail.title',
    defaultMessage: 'Device Detail'
  }
})

export class DeviceDetail extends React.PureComponent {

  handleFetchDevice = () => {
    this.props.fetchSingleDevice(this.props.params.deviceId)
  }

  componentDidMount() {
    this.handleFetchDevice()
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.params.deviceId !== nextProps.params.deviceId) {
      this.handleFetchDevice()
    }
  }

  renderProgress() {
    const { device } = this.props

    return !device && <LinearProgress />
  }

  renderContent() {
    const { device } = this.props
    if (!device) {
      return
    }
    const fields = [
      {
        label: 'First Connected',
        value: device.get('id')
      },
      {
        label: 'First Approved On',
        value: device.get('id')
      },
      {
        label: 'First Approved By',
        value: device.get('id')
      },
      {
        label: 'Serial',
        value: device.get('serial') || /* FIXME */ '<empty>'
      },
      {
        label: 'Last Seen',
        value: device.get('lastPingOn')
      },
      {
        label: 'Total Number of Tests',
        value: device.get('totalTests')
      }
    ]
    return (
      <div>
        <EditableFieldsContainer
          device={device}
        />
        <ReadOnlyFields
          fields={fields}
        />
      </div>
    )
  }

  render() {
    const { formatMessage } = this.props.intl

    return (
      <div className={styles.Content}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        {this.renderProgress()}
        {this.renderContent()}
      </div>
    )
  }
}

function mapStateToProps(state, props) {
  return {
    device: state.device.items.byId.get(props.params.deviceId)
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ fetchSingleDevice }, dispatch)
}

export const DeviceDetailContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(DeviceDetail)
