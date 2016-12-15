// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import Helmet from 'react-helmet'

// Material-UI
import Paper from 'material-ui/Paper'

// Our own imports
import { Unit } from '../../components/pureGrids'
import {
  fetchDemoDevice
} from '../DemoRedux'
import ReadOnlyFields from '../../components/shared/ReadOnlyFields'
import styles from './DeviceDemo.css'

export class DeviceDemo extends PureComponent {
  static propTypes = {
    params: PropTypes.object.isRequired,
    fetchDemoDevice: PropTypes.func.isRequired,
    device: PropTypes.object
  }

  componentDidMount() {
    this.handleFetchDevice()
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.params.deviceId !== nextProps.params.deviceId) {
      this.handleFetchDevice()
    }
  }

  handleFetchDevice = () => {
    this.props.fetchDemoDevice(this.props.params.deviceId)
  }

  renderReadOnlyFields() {
    const { device } = this.props
    const fields = [
      {
        label: 'Name',
        value: device.get('name')
      },
      {
        label: 'API Key',
        value: device.get('access')
      }
    ]
    return (
      <ReadOnlyFields fields={fields} />
    )
  }

  renderContent() {
    const { device } = this.props
    if (!device) {
      return null
    }

    return (
      <div className={styles.RowContainer}>
        <Unit lg="2-1">
          <div>
            {this.renderReadOnlyFields()}
          </div>
        </Unit>
      </div>
    )
  }

  render() {
    return (
      <div className={styles.Content}>
        <Helmet title="Device Demo" titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <Paper>
          {this.renderContent()}
        </Paper>
      </div>
    )
  }
}

function mapStateToProps(state, props) {
  const device = state.demo.deviceItems.byId.get(props.params.deviceId)

  return {
    device
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    fetchDemoDevice
  }, dispatch)
}

export const DeviceDemoContainer = _.flowRight(
  connect(mapStateToProps, mapDispatchToProps)
)(DeviceDemo)
