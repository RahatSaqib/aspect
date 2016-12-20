// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import {
  injectIntl,
  defineMessages
} from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Link } from 'react-router'
import Helmet from 'react-helmet'

// Material-UI
import Paper from 'material-ui/Paper'
import LinearProgress from 'material-ui/LinearProgress'
import { Card, CardHeader, CardText } from 'material-ui/Card'
import IconButton from 'material-ui/IconButton'
import ModeEdit from 'material-ui/svg-icons/editor/mode-edit'

// Our own imports
import { Unit } from '../../components/pureGrids'
import isEditable from '../../shared/selectors/device'
import {
  fetchSingleDevice,
  updateSingleDevice
} from '../DeviceRedux'
import ReadOnlyFields from '../../components/shared/ReadOnlyFields'
import { ReadOnlyField } from '../../components/shared/ReadOnlyFields'
import DeviceDetailForm from './DeviceDetailForm'
import DeviceDemoLink from '../DeviceDemoLink'
import styles from './DeviceDetail.css'

const messages = defineMessages({
  title: {
    id: 'pages.DeviceDetail.title',
    defaultMessage: 'Device Detail'
  },
  editTooltip: {
    id: 'pages.DeviceDetail.editTooltip',
    defaultMessage: 'Edit'
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
  fieldFirstApprovedOn: {
    id: 'pages.DeviceDetail.fieldFirstApprovedOn',
    defaultMessage: 'First Approved On'
  },
  fieldFirstApprovedBy: {
    id: 'pages.DeviceDetail.fieldFirstApprovedBy',
    defaultMessage: 'First Approved By'
  },
  fieldHostId: {
    id: 'pages.DeviceDetail.fieldHostId',
    defaultMessage: 'Host Id'
  },
  fieldSerial: {
    id: 'pages.DeviceDetail.fieldSerial',
    defaultMessage: 'Serial'
  },
  fieldLastSeen: {
    id: 'pages.DeviceDetail.fieldLastSeen',
    defaultMessage: 'Last Seen'
  },
  fieldFirstConnected: {
    id: 'pages.DeviceDetail.fieldFirstConnected',
    defaultMessage: 'Connected'
  },
  fieldStatus: {
    id: 'pages.DeviceDetail.fieldStatus',
    defaultMessage: 'Status'
  },
  fieldTotalNumberOfTests: {
    id: 'pages.DeviceDetail.fieldTotalNumberOfTests',
    defaultMessage: 'Tests'
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
    return (
      <LinearProgress />
    )
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

  renderContent() {
    const { device, editable, intl } = this.props
    const { formatMessage, formatDate, formatRelative } = intl

    return (
      <div>
        { /* IDs and site/results */ }
        <Card>
          <CardText>
            <Unit sm="5-6" md="11-12">
              <ReadOnlyField
                label=""
                value={device.get('name')}
                format={v =>
                  <div>
                    <h1 className={styles.Name}>
                      {v}
                    </h1>
                    <div>
                      <Link
                        to={`/site/${device.get('siteId')}`}
                        className={styles.Site}
                      >
                        {device.get('siteName')}
                      </Link>
                    </div>
                    <div>
                      {formatMessage(messages.fieldLastSeen)} {formatRelative(device.get('lastSeen'))}
                      &nbsp;&nbsp;
                      {formatMessage(messages.fieldFirstConnected)} {formatRelative(device.get('createdOn'))}
                    </div>
                    <div>
                      {formatMessage(messages.fieldStatus)}: {device.get('status')}
                      &nbsp;•&nbsp;
                      <Link to={`/result`}>
                        {device.get('totalTests')} {formatMessage(messages.fieldTotalNumberOfTests)}
                      </Link>
                    </div>
                  </div>
                }
              />
            </Unit>
            <Unit sm="1-6" md="1-12">
              <IconButton tooltip={formatMessage(messages.editTooltip)}>
                <ModeEdit />
              </IconButton>
            </Unit>
          </CardText>
        </Card>
        { /* Graphs */ }
        <Card initiallyExpanded>
          <CardText style={{ paddingTop: 5 }} className={styles.CardText}>
            <Unit sm="1-1" md="1-2">
              <CardHeader title="Utilization Rate Over Time" />
              <ReadOnlyField
                label=""
                value={true}
                format={() =>
                  <img role="presentation" src={require('./utilization_rate.png')} style={{ width: '100%' }} />
                }
              />
            </Unit>
            <Unit sm="1-1" md="1-2">
              <CardHeader title="Error Rates Over Time" />
              <ReadOnlyField
                label=""
                value={true}
                format={() =>
                  <img role="presentation" src={require('./error_rates.png')} style={{ width: '100%' }} />
                }
              />
            </Unit>
          </CardText>
        </Card>
        { /* Contacts */ }
        <Card initiallyExpanded>
          <CardHeader title="Contacts" actAsExpander showExpandableButton />
          <CardText actAsExpander expandable style={{ paddingTop: 5 }}>
            User 1, 2, 3, 4…
          </CardText>
        </Card>
        { /* Calibration */ }
        <Card>
          <CardHeader title="Calibration" actAsExpander showExpandableButton />
          <CardText actAsExpander expandable style={{ paddingTop: 5 }}>
            Not implemented
          </CardText>
        </Card>
        { /* Warranty */ }
        <Card>
          <CardHeader title="Warranty" actAsExpander showExpandableButton />
          <CardText actAsExpander expandable style={{ paddingTop: 5 }}>
            Not implemented
          </CardText>
        </Card>
        { /* Configuration */ }
        <Card>
          <CardHeader title="Configuration" actAsExpander showExpandableButton />
          <CardText actAsExpander expandable style={{ paddingTop: 5 }}>
            Not implemented
          </CardText>
        </Card>
        { /* Technical information */ }
        <Card>
          <CardHeader title="Technical information" actAsExpander showExpandableButton />
          <CardText actAsExpander expandable style={{ paddingTop: 5 }} className={styles.CardText}>
            <Unit sm="1-2" md="1-3" lg="1-4">
              <ReadOnlyField label={formatMessage(messages.fieldFirstApprovedOn)} value={device.get('approvedOn')} />
            </Unit>
            <Unit sm="1-2" md="1-3" lg="1-4">
              <ReadOnlyField label={formatMessage(messages.fieldFirstApprovedBy)} value={device.get('approvedBy')} />
            </Unit>
            <Unit sm="1-2" md="1-3" lg="1-4">
              <ReadOnlyField label={formatMessage(messages.fieldHostId)} value={device.get('hostId')} />
            </Unit>
            <Unit sm="1-2" md="1-3" lg="1-4">
              <ReadOnlyField label={formatMessage(messages.fieldSerial)} value={device.get('serial')} />
            </Unit>
          </CardText>
        </Card>
      </div>
    )
  }

  renderDemoButton() {
    return (
      <DeviceDemoLink
        to={`/demo/device/${this.props.params.deviceId}`}
        className={styles.DemoLink}
        target="_blank"
      >
        Demo
      </DeviceDemoLink>
    )
  }

  renderPaper() {
    return (
      <div>
        {
          this.props.device ?
          this.renderContent() :
          this.renderProgress()
        }
      </div>
    )
  }

  render() {
    const { intl } = this.props
    const { formatMessage } = intl

    return (
      <div className={styles.ContentDetails}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        {this.renderPaper()}
        {this.renderDemoButton()}
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
