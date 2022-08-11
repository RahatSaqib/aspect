import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { compose, setPropTypes } from 'recompose'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'
import { useParams } from 'react-router-dom'

// Material-UI
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'

// Our own imports
import { fetchDemoDevice, postDemoDeviceResult } from '../../../store/DemoRedux'

import { Unit } from '../../../oldComponents/pureGrids'
import ReadOnlyFields from '../../../oldComponents/shared/ReadOnlyFields'
import styles from './DeviceDemo.css'

const enhance = compose(
  WrapperComponent => props => {
    const { deviceId } = useParams()
    return <WrapperComponent {...props} deviceId={deviceId} />
  },
  connect(
    (state, props) => ({
      device: state.demo.deviceItems.byId.get(props.deviceId),
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

  componentDidUpdate(prevProps) {
    if (this.props.deviceId !== prevProps.deviceId) {
      this.handleFetchDevice()
    }
  }

  setPosting = posting => {
    this.setState({ posting })
  }

  handleFetchDevice = () => {
    this.props.fetchDemoDevice(this.props.deviceId)
  }

  handleSelectFieldChange =
    field =>
    ({ target: { value } }) => {
      this.setState({ [field]: value })
    }

  handlePostResult = () => {
    this.setPosting(true)
    const { resultId } = this.state
    this.props
      .postDemoDeviceResult(this.props.deviceId, { resultId })
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
          <TextField
            select
            margin="normal"
            value={assayId}
            label="Assay"
            fullWidth
            InputLabelProps={{ shrink: !!assayId }}
            onChange={this.handleSelectFieldChange('assayId')}
          >
            {assays.map(a => (
              <MenuItem key={a.get('id')} value={a.get('id')}>
                {a.get('name')}
              </MenuItem>
            ))}
          </TextField>
        </div>
        <div>
          <TextField
            select
            margin="normal"
            value={resultId}
            label="Result"
            fullWidth
            InputLabelProps={{ shrink: !!resultId }}
            onChange={this.handleSelectFieldChange('resultId')}
          >
            {results.map(r => (
              <MenuItem key={r.get('id')} value={r.get('id')}>
                {r.get('name')}
              </MenuItem>
            ))}
          </TextField>
        </div>
        <div>
          <Button color="primary" onClick={this.handlePostResult} disabled={!postEnabled} variant="contained">
            Post New Result
          </Button>
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
