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

// Our own imports
import { fetchSingleDevice } from '../../../action_creators/device_creators'
import styles from './DeviceDetail.css'

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

  render() {
    const { formatMessage } = this.props.intl

    return (
      <div className={styles.Content}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        {JSON.stringify(this.props.device, null, 2)}
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
