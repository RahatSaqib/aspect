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
  fetchSingleDevice
} from '../../device/DeviceRedux'
import ReadOnlyFields from '../../components/shared/ReadOnlyFields'
import styles from './DeviceDemo.css'

export class DeviceDemo extends PureComponent {
  static propTypes = {
    params: PropTypes.object.isRequired,
    fetchSingleDevice: PropTypes.func.isRequired,
    device: PropTypes.object
  }

  state = {
    values: {
      name: ''
    }
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
    this.props.fetchSingleDevice(this.props.params.deviceId)
      .then(() => {
        const { device } = this.props

        this.handleFormChange({
          name: device.get('name') || '',
          shortname: device.get('shortname') || ''
        })
      })
  }

  handleFormChange = values => this.setState({ values })

  renderReadOnlyFields() {
    const { device } = this.props
    const fields = [
      {
        label: 'Name',
        value: device.get('name')
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
        <Unit lg="1-2">
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
  const device = state.device.items.byId.get(props.params.deviceId)

  return {
    device
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    fetchSingleDevice
  }, dispatch)
}

export const DeviceDemoContainer = _.flowRight(
  connect(mapStateToProps, mapDispatchToProps)
)(DeviceDemo)
