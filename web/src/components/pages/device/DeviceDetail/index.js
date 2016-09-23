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
import Paper from 'material-ui/Paper'
import LinearProgress from 'material-ui/LinearProgress'

// Our own imports
import { isEditable } from '../../../../selectors/device'
import {
  fetchSingleDevice,
  updateSingleDevice
} from '../../../../action_creators/device_creators'
import ReadOnlyFields from '../../../shared/ReadOnlyFields'
import { FormContainer } from './Form'
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

  handleSubmit = data => {
    const { device } = this.props

    this.props.updateSingleDevice(device.get('id'), {
      // Map form fields to API fields
      name: data.get('name'),
      shortname: data.get('shortName'),
      notes: data.get('notes'),
      siteId: data.get('site')
    })
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

  renderFormContainer() {
    const { device } = this.props
    const initialValues = {
      // Map API fields to form fields
      name: device.get('name'),
      shortName: device.get('shortname'),
      notes: device.get('notes'),
      site: device.get('siteId')
    }
    return (
      <FormContainer
        enableReinitialize
        initialValues={initialValues}
        onSubmit={this.handleSubmit}
      />
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
        label: 'Shortname',
        value: device.get('shortname')
      },
      {
        label: 'Notes',
        value: device.get('notes')
      },
      {
        label: 'Site (ddl)',
        value: device.get('siteId')
      }
    ]
    return (
      <ReadOnlyFields fields={fields} />
    )
  }

  renderContent() {
    const { device, editable } = this.props
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
      <div className={styles.FieldsContainer}>
        {editable ?
        this.renderFormContainer() :
        this.renderReadOnlyFields()}
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
        <Paper>
          {this.renderProgress()}
          {this.renderContent()}
        </Paper>
      </div>
    )
  }
}

function mapStateToProps(state, props) {
  const device = state.device.items.byId.get(props.params.deviceId)

  return {
    editable: isEditable(state.user, device),
    device
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    fetchSingleDevice,
    updateSingleDevice
  }, dispatch)
}

export const DeviceDetailContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(DeviceDetail)
