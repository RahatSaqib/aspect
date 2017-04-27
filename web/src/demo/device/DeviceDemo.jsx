// Imports from packages
import _ from 'lodash'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import Helmet from 'react-helmet'

// Material-UI
import LinearProgress from 'material-ui/LinearProgress'
import MenuItem from 'material-ui/MenuItem'
import Paper from 'material-ui/Paper'
import RaisedButton from 'material-ui/RaisedButton'
import SelectField from 'material-ui/SelectField'

// Our own imports
import {
  fetchDemoDevice,
  postDemoDeviceResult
} from '../DemoRedux'

import { Unit } from '../../components/pureGrids'
import ReadOnlyFields from '../../components/shared/ReadOnlyFields'
import styles from './DeviceDemo.css'


export class DeviceDemo extends PureComponent {
  static propTypes = {
    params: PropTypes.object.isRequired,
    fetchDemoDevice: PropTypes.func.isRequired,
    postDemoDeviceResult: PropTypes.func.isRequired,
    device: PropTypes.object
  }

  static defaultProps = {
    device: null
  }

  state = {
    assayId: null,
    resultId: null,
    posting: false
  }

  componentDidMount() {
    this.handleFetchDevice()
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.params.deviceId !== nextProps.params.deviceId) {
      this.handleFetchDevice()
    }
  }

  setPosting = (posting) => {
    this.setState(Object.assign({}, this.state, { posting }))
  }

  handleFetchDevice = () => {
    this.props.fetchDemoDevice(this.props.params.deviceId)
  }

  handleSelectFieldChange = field => (event, index, value) => {
    this.setState(Object.assign({}, this.state, { [field]: value }))
  }

  handlePostResult = () => {
    this.setPosting(true)
    const { resultId } = this.state
    this.props.postDemoDeviceResult(this.props.params.deviceId, { resultId })
      .then(() => this.setPosting(false))
      .catch(() => this.setPosting(false))
  }

  renderProgress() {
    const { posting } = this.state
    const { device } = this.props

    return (posting || !device) && <LinearProgress />
  }

  renderFormContainer() {
    const { device } = this.props
    const { assayId, resultId, posting } = this.state

    const assays = device.get('assays')
    if (assays.isEmpty()) {
      return false
    }

    const assay = assays.find(a => a.get('id') === assayId)

    const results = assay ? assay.get('results') : []
    const result = assay && results.find(r => r.get('id') === resultId)

    const postEnabled = !posting && assay && result

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
        <div>
          <RaisedButton
            primary
            label="Post New Result"
            onTouchTap={this.handlePostResult}
            disabled={!postEnabled}
          />
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
        <Helmet title="Demo Device" titleTemplate="%s - Aspect" defaultTitle="Aspect" />
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

  return { device }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    fetchDemoDevice,
    postDemoDeviceResult
  }, dispatch)
}

export const DeviceDemoContainer = _.flowRight(
  connect(mapStateToProps, mapDispatchToProps)
)(DeviceDemo)
