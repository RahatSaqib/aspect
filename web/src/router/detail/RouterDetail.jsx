// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
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
import { Unit } from '../../components/pureGrids'
import isEditable from '../../shared/selectors/device'
import {
  fetchSingleDevice,
  updateSingleDevice
} from '../RouterRedux'
import ReadOnlyFields from '../../components/shared/ReadOnlyFields'
import DeviceDetailForm from './RouterDetailForm'
import styles from './RouterDetail.css'

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

export class DeviceDetail extends PureComponent {

  static propTypes = {
    setPageTitle: PropTypes.func.isRequired,
    fetchSingleDevice: PropTypes.func.isRequired,
    params: PropTypes.object.isRequired,
    device: PropTypes.object,
    intl: PropTypes.object.isRequired,
    editable: PropTypes.bool.isRequired,
    updateSingleDevice: PropTypes.func.isRequired
  }

  state = {
    values: {
      name: '',
      shortname: '',
      notes: '',
      siteId: ''
    }
  }

  componentWillMount() {
    const { setPageTitle, intl } = this.props
    const { formatMessage } = intl
    setPageTitle(formatMessage(messages.title))
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
          shortname: device.get('shortname') || '',
          notes: device.get('notes') || '',
          siteId: device.get('siteId')
        })
      })
  }

  handleFormChange = values => this.setState({ values })

  handleSubmit = (data) => {
    const { device } = this.props

    return this.props.updateSingleDevice(device.get('id'), data)
  }

  renderProgress() {
    const { device } = this.props

    return !device && <LinearProgress />
  }

  renderFormContainer() {
    const { intl: { formatMessage } } = this.props
    const labels = {
      name: formatMessage(messages.fieldName),
      shortname: formatMessage(messages.fieldShortname),
      notes: formatMessage(messages.fieldNotes),
      siteId: formatMessage(messages.fieldSiteId),
      loadMoreText: formatMessage(messages.siteLoadMore),
      loadingMoreText: formatMessage(messages.siteLoadingMore)
    }
    return (
      <DeviceDetailForm
        onChange={this.handleFormChange}
        values={this.state.values}
        labels={labels}
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
    const { device, editable, intl: { formatMessage, formatDate } } = this.props
    if (!device) {
      return null
    }

    // get date for current locale, 'date' - is a Date object or string value in DateTime format
    const getFormattedDate = date => (date !== null && date !== '' && isFinite(new Date(date)) ? formatDate(date) : date)

    const fields = [
      {
        label: formatMessage(messages.fieldFirstConnected),
        value: device.get('id')
      },
      {
        label: formatMessage(messages.fieldFirstApprovedOn),
        value: getFormattedDate(device.get('approvedOn')) || ''
      },
      {
        label: formatMessage(messages.fieldFirstApprovedBy),
        value: device.get('approvedBy') || ''
      },
      {
        label: formatMessage(messages.fieldSerial),
        value: device.get('serial') || /* FIXME */ '<empty>'
      },
      {
        label: formatMessage(messages.fieldLastSeen),
        value: getFormattedDate(device.get('lastSeen')) || ''
      },
      {
        label: formatMessage(messages.fieldTotalNumberOfTests),
        value: device.get('totalTests')
      }
    ]
    return (
      <div className={styles.RowContainer}>
        <Unit lg="1-2">
          <div>
            {editable ? this.renderFormContainer() : this.renderReadOnlyFields()}
          </div>
        </Unit>
        <Unit lg="1-2">
          <div>
            <ReadOnlyFields
              fields={fields}
            />
          </div>
        </Unit>
      </div>
    )
  }

  render() {
    const { intl } = this.props
    const { formatMessage } = intl

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

export const RouterDetailContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(DeviceDetail)
