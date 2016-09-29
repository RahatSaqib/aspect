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
  },
  fieldName: {
    id: 'pages.DeviceDetail.fieldName',
    defaultMessage: 'Name'
  },
  fieldShortname: {
    id: 'pages.DeviceDetail.fieldShortname',
    defaultMessage: 'Shortname'
  },
  fieldNotes: {
    id: 'pages.DeviceDetail.fieldNotes',
    defaultMessage: 'Notes'
  },
  fieldSiteId: {
    id: 'pages.DeviceDetail.fieldSiteId',
    defaultMessage: 'Site'
  },
  siteLoadMore: {
    id: 'pages.DeviceDetail.siteLoadMore',
    defaultMessage: 'Load more'
  },
  siteLoadingMore: {
    id: 'pages.DeviceDetail.siteLoadingMore',
    defaultMessage: 'Loading……'
  },
  fieldFirstConnected: {
    id: 'pages.DeviceDetail.fieldFirstConnected',
    defaultMessage: 'First Connected'
  },
  fieldFirstApprovedOn: {
    id: 'pages.DeviceDetail.fieldFirstApprovedOn',
    defaultMessage: 'First Approved On'
  },
  fieldFirstApprovedBy: {
    id: 'pages.DeviceDetail.fieldFirstApprovedBy',
    defaultMessage: 'First Approved By'
  },
  fieldSerial: {
    id: 'pages.DeviceDetail.fieldSerial',
    defaultMessage: 'Serial'
  },
  fieldLastSeen: {
    id: 'pages.DeviceDetail.fieldLastSeen',
    defaultMessage: 'Last Seen'
  },
  fieldTotalNumberOfTests: {
    id: 'pages.DeviceDetail.fieldTotalNumberOfTests',
    defaultMessage: 'Total Number of Tests'
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
    const { device, intl: { formatMessage } } = this.props
    const labels = {
      name: formatMessage(messages.fieldName),
      shortName: formatMessage(messages.fieldShortname),
      notes: formatMessage(messages.fieldNotes),
      site: formatMessage(messages.fieldSiteId),
      loadMoreText: formatMessage(messages.siteLoadMore),
      loadingMoreText: formatMessage(messages.siteLoadingMore)
    }
    const initialValues = {
      // Map API fields to form fields
      name: device.get('name'),
      shortName: device.get('shortname'),
      notes: device.get('notes') || /* FIXME */ '',
      site: device.get('siteId')
    }
    return (
      <FormContainer
        labels={labels}
        enableReinitialize
        initialValues={initialValues}
        onSubmit={this.handleSubmit}
      />
    )
  }

  renderReadOnlyFields() {
    const { device, intl: { formatMessage } } = this.props
    const fields = [
      {
        label: formatMessage(messages.fieldName),
        value: device.get('name')
      },
      {
        label: formatMessage(messages.fieldShortname),
        value: device.get('shortname')
      },
      {
        label: formatMessage(messages.fieldNotes),
        value: device.get('notes')
      },
      {
        label: formatMessage(messages.fieldSiteId),
        value: device.get('siteId')
      }
    ]
    return (
      <ReadOnlyFields fields={fields} />
    )
  }

  renderContent() {
    const { device, editable, intl: { formatMessage, formatRelative } } = this.props
    if (!device) {
      return
    }
    const fields = [
      {
        label: formatMessage(messages.fieldFirstConnected),
        value: device.get('id')
      },
      {
        label: formatMessage(messages.fieldFirstApprovedOn),
        value: device.get('id')
      },
      {
        label: formatMessage(messages.fieldFirstApprovedBy),
        value: device.get('id')
      },
      {
        label: formatMessage(messages.fieldSerial),
        value: device.get('serial') || /* FIXME */ '<empty>'
      },
      {
        label: formatMessage(messages.fieldLastSeen),
        value: formatRelative(device.get('lastSeen'))
      },
      {
        label: formatMessage(messages.fieldTotalNumberOfTests),
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
