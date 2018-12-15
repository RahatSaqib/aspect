import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { compose, setPropTypes } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

// Material-UI
import LinearProgress from '@material-ui/core/LinearProgress'
import MenuItem from 'material-ui/MenuItem'
import Paper from '@material-ui/core/Paper'
import RaisedButton from 'material-ui/RaisedButton'
import SelectField from 'material-ui/SelectField'

// Our own imports
import { fetchDemoDevice, postDemoDeviceResult } from '../DemoRedux'

import { Unit } from '../../components/pureGrids'
import ReadOnlyFields from '../../components/shared/ReadOnlyFields'
import styles from './DeviceDemo.css'

const enhance = compose(
  setPropTypes({
    match: PropTypes.object.isRequired,
  }),
  connect(
    (state, props) => ({
      device: state.demo.deviceItems.byId.get(props.match.params.deviceId),
    }),
    dispatch =>
      bindActionCreators(
        {
          fetchDemoDevice,
          postDemoDeviceResult,
        },
        dispatch
      )
  ),
  setPropTypes({
    device: PropTypes.object,
    fetchDemoDevice: PropTypes.func.isRequired,
    postDemoDeviceResult: PropTypes.func.isRequired,
  })
)

export class DeviceDemo extends PureComponent {
  state = {
    assayId: null,
    resultId: null,
    posting: false,
  }

  componentDidMount() {
    this.handleFetchDevice()
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.match.params.deviceId !== nextProps.match.params.deviceId) {
      this.handleFetchDevice()
    }
  }

  setPosting = posting => {
    this.setState(Object.assign({}, this.state, { posting }))
  }

  handleFetchDevice = () => {
    this.props.fetchDemoDevice(this.props.match.params.deviceId)
  }

  handleSelectFieldChange = field => (event, index, value) => {
    this.setState(Object.assign({}, this.state, { [field]: value }))
  }

  handlePostResult = () => {
    this.setPosting(true)
    const { resultId } = this.state
    this.props
      .postDemoDeviceResult(this.props.match.params.deviceId, { resultId })
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
            onClick={this.handlePostResult}
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
        value: device.get('name'),
      },
      {
        label: 'API Key',
        value: device.get('access'),
      },
    ]
    return <ReadOnlyFields fields={fields} />
  }

  renderContent() {
    const { device } = this.props
    if (!device) {
      return null
    }

    return (
      <div className={styles.RowContainer}>
        <Unit lg="2-1">
          <div>{this.renderReadOnlyFields()}</div>
          <div>{this.renderFormContainer()}</div>
        </Unit>
      </div>
    )
  }

  render() {
    return (
      <div className={styles.Container}>
        <Helmet title="Demo Device" />
        <Paper>
          {this.renderProgress()}
          {this.renderContent()}
        </Paper>
      </div>
    )
  }
}

export default enhance(DeviceDemo)
