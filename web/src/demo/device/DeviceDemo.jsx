// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import Helmet from 'react-helmet'

// Material-UI
import LinearProgress from 'material-ui/LinearProgress'
import MenuItem from 'material-ui/MenuItem'
import Paper from 'material-ui/Paper'
import SelectField from 'material-ui/SelectField'

// Our own imports
import {
  fetchDemoDevice
} from '../DemoRedux'

import { Unit } from '../../components/pureGrids'
import ReadOnlyFields from '../../components/shared/ReadOnlyFields'
import styles from './DeviceDemo.css'


export class DeviceDemo extends PureComponent {
  static propTypes = {
    params: PropTypes.object.isRequired,
    fetchDemoDevice: PropTypes.func.isRequired,
    device: PropTypes.object
  }

  state = {
    assayId: null,
    resultId: null
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

  handleSelectFieldChange = field => (event, index, value) => {
    this.setState(Object.assign({}, this.state, { [field]: value }))
  }

  renderProgress() {
    const { device } = this.props

    return !device && <LinearProgress />
  }

  renderFormContainer() {
    const { device } = this.props
    let { assayId, resultId } = this.state

    const assays = device.get('assays')
    let assay = assays.find(a => a.get('id') === assayId)
    if (!assay) {
      assay = assays.get(0)
      assayId = assay && assay.get('id')
    }

    let results = []
    if (assay) {
      results = assay.get('results')
      let result = results.find(r => r.get('id') === resultId)
      if (!result) {
        result = results.get(0)
        resultId = result && result.get('id')
      }
    }

    return (
      <div>
        <div>
          <SelectField
            value={assayId}
            floatingLabelText="Assay"
            fullWidth
            onChange={this.handleSelectFieldChange('assayId')}
          >
            {assays.map(a => (
              <MenuItem
                key={a.get('id')}
                value={a.get('id')}
                primaryText={a.get('name')}
              />
            ))}
          </SelectField>
        </div>
        <div>
          <SelectField
            value={resultId}
            floatingLabelText="Result"
            fullWidth
            onChange={this.handleSelectFieldChange('resultId')}
          >
            {results.map(r => (
              <MenuItem
                key={r.get('id')}
                value={r.get('id')}
                primaryText={r.get('name')}
              />
            ))}
          </SelectField>
        </div>
      </div>
    )
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
          <div>
            {this.renderFormContainer()}
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
          {this.renderProgress()}
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
