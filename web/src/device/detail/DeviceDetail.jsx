// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import {
  injectIntl,
  defineMessages,
  intlShape
} from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Link } from 'react-router'
import Helmet from 'react-helmet'

// Material-UI
import Dialog from 'material-ui/Dialog'
import LinearProgress from 'material-ui/LinearProgress'
import { Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn } from 'material-ui/Table'
import { Card, CardHeader, CardText } from 'material-ui/Card'
import IconButton from 'material-ui/IconButton'
import ModeEdit from 'material-ui/svg-icons/editor/mode-edit'

// Our own imports
import { Unit } from '../../components/pureGrids'
import { longNumericFormat } from '../../shared/utils/dateFormat'
import isEditable from '../../shared/selectors/device'
import {
  fetchSingleDevice,
  updateSingleDevice
} from '../DeviceRedux'
import { ReadOnlyField } from '../../components/shared/ReadOnlyFields'
import JSONSchemaCard from '../../components/shared/JSONSchemaCard'
import DeviceDetailModalForm from './DeviceDetailModalForm'
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
  cancel: {
    id: 'pages.DeviceDetail.cancel',
    defaultMessage: 'Cancel'
  },
  update: {
    id: 'pages.DeviceDetail.update',
    defaultMessage: 'Update'
  },
  approved: {
    id: 'pages.DeviceDetail.approved',
    defaultMessage: 'Approved'
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
  fieldConfiguration: {
    id: 'pages.DeviceDetail.fieldConfiguration',
    defaultMessage: 'Configuration'
  },
  fieldOperationalData: {
    id: 'pages.DeviceDetail.fieldOperationalData',
    defaultMessage: 'Operational Data'
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
  },
  nestedDataSubtitle: {
    id: 'pages.DeviceDetail.nestedDataSubtitle',
    defaultMessage: '{count} fields'
  }
})

export class DeviceDetail extends PureComponent {

  static propTypes = {
    setPageTitle: PropTypes.func.isRequired,
    fetchSingleDevice: PropTypes.func.isRequired,
    params: PropTypes.shape({
      // see /api/src/device/endPoint.js, path: '/device/{deviceId}'
      deviceId: PropTypes.string.isRequired
    }).isRequired,
    device: PropTypes.shape({
      has: PropTypes.func.isRequired,
      // see /api/src/device/endPoint.js, path: '/device'
      // see /api/src/device/service.js, const SELECT_SHOW_FIELDS
      id: PropTypes.number,
      name: PropTypes.string,
      shortname: PropTypes.string,
      createdOn: PropTypes.string,
      lastPingOn: PropTypes.string,
      lastSeen: PropTypes.string,
      type: PropTypes.string,
      category: PropTypes.string,
      hasResults: PropTypes.number,
      hasConnectivity: PropTypes.number,
      status: PropTypes.string,
      totalTests: PropTypes.number,
      siteId: PropTypes.number,
      approvedOn: PropTypes.string,
      approvedBy: PropTypes.string,
      notes: PropTypes.string,
      serial: PropTypes.string
    }),
    intl: intlShape.isRequired,
    editable: PropTypes.bool.isRequired,
    updateSingleDevice: PropTypes.func.isRequired
  }

  static defaultProps = {
    device: null
  }

  state = {
    isEditDialogOpen: false,
    isDemoDialogOpen: false,
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

  handleToggleEditDialog = () => {
    this.setState({ isEditDialogOpen: !this.state.isEditDialogOpen })
  }

  handleToggleDialog = () => {
    this.setState({ isDemoDialogOpen: !this.state.isDemoDialogOpen })
  }

  handleFetchDevice = () => {
    this.props.fetchSingleDevice(this.props.params.deviceId)
      .then(() => {
        const { device } = this.props

        this.handleFormChange({
          name: device.get('name') || '',
          shortname: device.get('shortname') || '',
          notes: device.get('notes') || '',
          statusToken: device.get('statusToken') || '',
          siteId: device.get('siteId'),
          configurationData: device.get('configurationData')
        })
      })
  }

  handleFormatNestedSubtitle = data => (
    this.props.intl.formatMessage(messages.nestedDataSubtitle, { count: data.size })
  )

  handleFormChange = values => this.setState({ values })

  handleSubmit = (data) => {
    const { device } = this.props

    return this.props.updateSingleDevice(device.get('id'), {
      ...data,
      configurationData: data.configurationData.toJS()
    })
      .then(this.handleToggleEditDialog)
  }

  renderProgress() {
    return (
      <LinearProgress />
    )
  }

  renderEditButtonWithDialog() {
    const { device, editable, intl } = this.props
    if (!editable || !device || !device.has('deviceType')) {
      return false
    }

    const { formatMessage } = intl
    const labels = {
      name: formatMessage(messages.fieldName),
      shortname: formatMessage(messages.fieldShortname),
      notes: formatMessage(messages.fieldNotes),
      siteId: formatMessage(messages.fieldSiteId),
      statusToken: formatMessage(messages.approved),
      configuration: formatMessage(messages.fieldConfiguration),
      cancel: formatMessage(messages.cancel),
      update: formatMessage(messages.update)
    }
    const dataSchema = device
      .getIn(['deviceType', 'configurationDataSchema'])

    return (
      <div>
        <IconButton
          tooltip={formatMessage(messages.editTooltip)}
          onTouchTap={this.handleToggleEditDialog}
        >
          <ModeEdit />
        </IconButton>
        <DeviceDetailModalForm
          formatNestedSubtitle={this.handleFormatNestedSubtitle}
          configurationDataSchema={dataSchema}
          isDialogOpen={this.state.isEditDialogOpen}
          onCancel={this.handleToggleEditDialog}
          onChange={this.handleFormChange}
          values={this.state.values}
          labels={labels}
          onSubmit={this.handleSubmit}
        />
      </div>
    )
  }

  renderContent() {
    const { device, intl } = this.props
    const { formatMessage, formatDate, formatRelative } = intl

    if (!device || !device.has('deviceType')) {
      return false
    }

    // get date for current locale, 'date' - is a Date object or string value in DateTime format
    const getFormattedDate = date => (date !== null && date !== '' && isFinite(new Date(date)) ? formatDate(date) : date)

    const configurationDataSchema = device
      .getIn(['deviceType', 'configurationDataSchema'])
      .sortBy((value, key) => `${value.get('type') !== 'object' ? '_' : ''}${key}`)

    const formatDeviceOperationStartedOn = startedOn => (
      formatDate(startedOn, longNumericFormat)
    )
    const formatDeviceOperationValue = (properties, value) => {
      switch (properties.get('type')) {
        case 'number': return `${value.toFixed(properties.get('decimals'))}`
        default: return value
      }
    }
    const formatDeviceOperationData = (properties, value) => ([
      properties.get('prefix'),
      formatDeviceOperationValue(properties, value),
      properties.get('suffix')
    ].join(''))

    const shortname = device.get('shortname')

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
                      {v} {shortname && <small>({shortname})</small>}
                    </h1>
                    <div className={styles.StatusText}>
                      <Link
                        to={`/site/${device.get('siteId')}`}
                        className={styles.Site}
                      >
                        {device.get('siteName')}
                      </Link>
                    </div>
                    <div className={styles.StatusText}>
                      {formatMessage(messages.fieldLastSeen)} {formatRelative(device.get('lastSeen'))}
                      &nbsp;•&nbsp;
                      {formatMessage(messages.fieldFirstConnected)} {formatRelative(device.get('createdOn'))}
                    </div>
                    <div className={styles.StatusText}>
                      {formatMessage(messages.fieldStatus)}: {device.get('status')}
                      &nbsp;•&nbsp;
                      <Link to="/result">
                        {device.get('totalTests')} {formatMessage(messages.fieldTotalNumberOfTests)}
                      </Link>
                    </div>
                  </div>
                }
              />
            </Unit>
            <Unit sm="1-6" md="1-12">
              { /* Dialog for DeviceDetailModalForm */ }
              {this.renderEditButtonWithDialog()}
            </Unit>
          </CardText>
        </Card>
        { /* Graphs */ }
        <Card expanded>
          <CardText style={{ paddingTop: 10 }} className={styles.CardText}>
            <Unit sm="1-1" md="1-2">
              <CardHeader title="Utilization Rate Over Time" />
              <ReadOnlyField
                label=""
                value
                format={() =>
                  <img alt="utilization rate" src={require('./utilization_rate.png')} style={{ width: '100%' }} />
                }
              />
            </Unit>
            <Unit sm="1-1" md="1-2">
              <CardHeader title="Error Rates Over Time" />
              <ReadOnlyField
                label=""
                value
                format={() =>
                  <img alt="error rate" src={require('./error_rates.png')} style={{ width: '100%' }} />
                }
              />
            </Unit>
          </CardText>
        </Card>
        { /* Dialog for demo purpose */ }
        <Dialog
          modal={false}
          open={this.state.isDemoDialogOpen}
          onRequestClose={this.handleToggleDialog}
        >
          Not yet implemented
        </Dialog>
        { /* Contacts */ }
        <Card initiallyExpanded>
          <CardHeader title="Contacts" actAsExpander showExpandableButton />
          <CardText actAsExpander expandable style={{ paddingTop: 10 }}>
            {device.get('contacts').map(c => (
              <Link
                key={c.get('id')}
                to={`/person/${c.get('id')}`}
                className={styles.Contact}
              >
                {c.get('name')}
              </Link>
            ))}
          </CardText>
        </Card>
        { /* Calibration */ }
        <Card onClick={this.handleToggleDialog} expanded>
          <CardHeader title="Calibration" actAsExpander showExpandableButton />
          <CardText style={{ paddingTop: 10 }}>
            Last calibrated 12/1/2016
          </CardText>
        </Card>
        { /* Warranty */ }
        <Card onClick={this.handleToggleDialog} expanded>
          <CardHeader title="Warranty" actAsExpander showExpandableButton />
          <CardText style={{ paddingTop: 10 }}>
            Expires 12/31/2018
          </CardText>
        </Card>
        { /* Technical information */ }
        <Card initiallyExpanded>
          <CardHeader title="Technical information" actAsExpander showExpandableButton />
          <CardText actAsExpander expandable style={{ paddingTop: 10 }} className={styles.CardText}>
            <Unit sm="1-2" md="1-3" lg="1-4">
              <ReadOnlyField label={formatMessage(messages.fieldFirstApprovedOn)} value={getFormattedDate(device.get('approvedOn'))} />
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
        { /* Configuration */ }
        <JSONSchemaCard
          title={formatMessage(messages.fieldConfiguration)}
          renderField={field => <ReadOnlyField {...field} />}
          formatNestedSubtitle={this.handleFormatNestedSubtitle}
          dataSchema={configurationDataSchema}
          data={device.get('configurationData')}
        />
        { /* Operational Data */ }
        <Card>
          <CardHeader title="Device Operation Data" actAsExpander showExpandableButton />
          <CardText actAsExpander expandable style={{ paddingTop: 10 }}>
            <Table selectable={false}>
              <TableHeader adjustForCheckbox={false} displaySelectAll={false}>
                <TableRow>
                  <TableHeaderColumn style={{ width: '10%' }}>ID</TableHeaderColumn>
                  <TableHeaderColumn>Started On</TableHeaderColumn>
                  {device.getIn(['deviceType', 'deviceOperationSchema']).map(properties => (
                    <TableHeaderColumn key={`dos${properties.get('title')}`}>{properties.get('title')}</TableHeaderColumn>
                  )).valueSeq()}
                </TableRow>
              </TableHeader>
              <TableBody displayRowCheckbox={false}>
                {device.get('deviceOperations').map(deviceOperation => (
                  <TableRow key={deviceOperation.get('id')}>
                    <TableRowColumn style={{ width: '10%' }}>{deviceOperation.get('id')}</TableRowColumn>
                    <TableRowColumn>
                      {formatDeviceOperationStartedOn(deviceOperation.get('startedOn'))}
                    </TableRowColumn>
                    {device.getIn(['deviceType', 'deviceOperationSchema']).map((properties, key) => (
                      <TableRowColumn key={`${deviceOperation.get('id')}${deviceOperation.getIn(['data', key])}`}>
                        {formatDeviceOperationData(properties, deviceOperation.getIn(['data', key]))}
                      </TableRowColumn>
                    )).valueSeq()}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
          this.props.device && this.props.device.has('contacts') ?
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
        <br />
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
