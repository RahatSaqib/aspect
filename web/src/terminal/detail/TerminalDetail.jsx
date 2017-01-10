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
import Dialog from 'material-ui/Dialog'
import LinearProgress from 'material-ui/LinearProgress'
import { Card, CardHeader, CardText } from 'material-ui/Card'
import IconButton from 'material-ui/IconButton'
import ModeEdit from 'material-ui/svg-icons/editor/mode-edit'

// Our own imports
import { Unit } from '../../components/pureGrids'
import isEditable from '../../shared/selectors/device'
import {
  fetchSingleTerminal,
  updateSingleTerminal
} from '../TerminalRedux'
import { ReadOnlyField } from '../../components/shared/ReadOnlyFields'
import JSONSchemaCard from '../../components/shared/JSONSchemaCard'
import TerminalDetailModalForm from './TerminalDetailModalForm'
import DeviceDemoLink from '../../device/DeviceDemoLink'
import styles from './TerminalDetail.css'

const messages = defineMessages({
  title: {
    id: 'pages.TerminalDetail.title',
    defaultMessage: 'Terminal Detail'
  },
  editTooltip: {
    id: 'pages.TerminalDetail.editTooltip',
    defaultMessage: 'Edit'
  },
  cancel: {
    id: 'pages.TerminalDetail.cancel',
    defaultMessage: 'Cancel'
  },
  update: {
    id: 'pages.TerminalDetail.update',
    defaultMessage: 'Update'
  },
  fieldName: {
    id: 'pages.TerminalDetail.fieldName',
    defaultMessage: 'Name'
  },
  fieldShortname: {
    id: 'pages.TerminalDetail.fieldShortname',
    defaultMessage: 'Shortname'
  },
  fieldNotes: {
    id: 'pages.TerminalDetail.fieldNotes',
    defaultMessage: 'Notes'
  },
  fieldSiteId: {
    id: 'pages.TerminalDetail.fieldSiteId',
    defaultMessage: 'Site'
  },
  fieldConfiguration: {
    id: 'pages.DeviceDetail.fieldConfiguration',
    defaultMessage: 'Configuration'
  },
  fieldFirstApprovedOn: {
    id: 'pages.TerminalDetail.fieldFirstApprovedOn',
    defaultMessage: 'First Approved On'
  },
  fieldFirstApprovedBy: {
    id: 'pages.TerminalDetail.fieldFirstApprovedBy',
    defaultMessage: 'First Approved By'
  },
  fieldHostId: {
    id: 'pages.TerminalDetail.fieldHostId',
    defaultMessage: 'Host Id'
  },
  fieldSerial: {
    id: 'pages.TerminalDetail.fieldSerial',
    defaultMessage: 'Serial'
  },
  fieldLastSeen: {
    id: 'pages.TerminalDetail.fieldLastSeen',
    defaultMessage: 'Last Seen'
  },
  fieldFirstConnected: {
    id: 'pages.TerminalDetail.fieldFirstConnected',
    defaultMessage: 'Connected'
  },
  fieldStatus: {
    id: 'pages.TerminalDetail.fieldStatus',
    defaultMessage: 'Status'
  },
  fieldTotalNumberOfTests: {
    id: 'pages.TerminalDetail.fieldTotalNumberOfTests',
    defaultMessage: 'Tests'
  },
  nestedDataSubtitle: {
    id: 'pages.TerminalDetail.nestedDataSubtitle',
    defaultMessage: '{count} fields'
  }
})

export class TerminalDetail extends PureComponent {

  static propTypes = {
    setPageTitle: PropTypes.func.isRequired,
    fetchSingleTerminal: PropTypes.func.isRequired,
    params: PropTypes.object.isRequired,
    terminal: PropTypes.object,
    intl: PropTypes.object.isRequired,
    editable: PropTypes.bool.isRequired,
    updateSingleTerminal: PropTypes.func.isRequired
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
    this.handleFetchTerminal()
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.params.terminalId !== nextProps.params.terminalId) {
      this.handleFetchTerminal()
    }
  }

  handleToggleEditDialog = () => {
    this.setState({ isEditDialogOpen: !this.state.isEditDialogOpen })
  }

  handleToggleDialog = () => {
    this.setState({ isDemoDialogOpen: !this.state.isDemoDialogOpen })
  }

  handleFetchTerminal = () => {
    this.props.fetchSingleTerminal(this.props.params.terminalId)
      .then(() => {
        const { terminal } = this.props

        this.handleFormChange({
          name: terminal.get('name') || '',
          shortname: terminal.get('shortname') || '',
          notes: terminal.get('notes') || '',
          siteId: terminal.get('siteId'),
          configurationData: terminal.get('configurationData')
        })
      })
  }

  handleFormatNestedSubtitle = data => (
    this.props.intl.formatMessage(messages.nestedDataSubtitle, { count: data.size })
  )

  handleFormChange = values => this.setState({ values })

  handleSubmit = (data) => {
    const { terminal } = this.props

    return this.props.updateSingleTerminal(terminal.get('id'), {
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
    const { terminal, editable, intl } = this.props
    if (!editable || !terminal || !terminal.has('deviceType')) {
      return false
    }

    const { formatMessage } = intl
    const labels = {
      name: formatMessage(messages.fieldName),
      shortname: formatMessage(messages.fieldShortname),
      notes: formatMessage(messages.fieldNotes),
      siteId: formatMessage(messages.fieldSiteId),
      configuration: formatMessage(messages.fieldConfiguration),
      cancel: formatMessage(messages.cancel),
      update: formatMessage(messages.update)
    }
    const dataSchema = terminal
      .getIn(['deviceType', 'configurationDataSchema'])

    return (
      <div>
        <IconButton
          tooltip={formatMessage(messages.editTooltip)}
          onTouchTap={this.handleToggleEditDialog}
        >
          <ModeEdit />
        </IconButton>
        <TerminalDetailModalForm
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
    const { terminal, intl } = this.props
    const { formatMessage, formatDate, formatRelative } = intl

    if (!terminal || !terminal.has('deviceType')) {
      return false
    }

    // get date for current locale, 'date' - is a Date object or string value in DateTime format
    const getFormattedDate = date => (date !== null && date !== '' && isFinite(new Date(date)) ? formatDate(date) : date)

    const configurationDataSchema = terminal
      .getIn(['deviceType', 'configurationDataSchema'])
      .sortBy((value, key) => `${value.get('type') !== 'object' ? '_' : ''}${key}`)

    return (
      <div>
        { /* IDs and site/results */ }
        <Card>
          <CardText>
            <Unit sm="5-6" md="11-12">
              <ReadOnlyField
                label=""
                value={terminal.get('name')}
                format={v =>
                  <div>
                    <h1 className={styles.Name}>
                      {v} <small>({terminal.get('shortname')})</small>
                    </h1>
                    <div className={styles.StatusText}>
                      <Link
                        to={`/site/${terminal.get('siteId')}`}
                        className={styles.Site}
                      >
                        {terminal.get('siteName')}
                      </Link>
                    </div>
                    <div className={styles.StatusText}>
                      {formatMessage(messages.fieldLastSeen)} {formatRelative(terminal.get('lastSeen'))}
                      &nbsp;&nbsp;
                      {formatMessage(messages.fieldFirstConnected)} {formatRelative(terminal.get('createdOn'))}
                    </div>
                    <div className={styles.StatusText}>
                      {formatMessage(messages.fieldStatus)}: {terminal.get('status')}
                      &nbsp;•&nbsp;
                      <Link to="/result">
                        {terminal.get('totalTests')} {formatMessage(messages.fieldTotalNumberOfTests)}
                      </Link>
                    </div>
                  </div>
                }
              />
            </Unit>
            <Unit sm="1-6" md="1-12">
              { /* Dialog for TerminalDetailModalForm */ }
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
                  <img role="presentation" src={require('../../device/detail/utilization_rate.png')} style={{ width: '100%' }} />
                }
              />
            </Unit>
            <Unit sm="1-1" md="1-2">
              <CardHeader title="Error Rates Over Time" />
              <ReadOnlyField
                label=""
                value
                format={() =>
                  <img role="presentation" src={require('../../device/detail/error_rates.png')} style={{ width: '100%' }} />
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
        { /* Configuration */ }
        <JSONSchemaCard
          title={formatMessage(messages.fieldConfiguration)}
          initiallyExpanded
          renderField={field => <ReadOnlyField {...field} />}
          formatNestedSubtitle={this.handleFormatNestedSubtitle}
          dataSchema={configurationDataSchema}
          data={terminal.get('configurationData')}
        />
        { /* Technical information */ }
        <Card initiallyExpanded>
          <CardHeader title="Technical information" actAsExpander showExpandableButton />
          <CardText actAsExpander expandable style={{ paddingTop: 10 }} className={styles.CardText}>
            <Unit sm="1-2" md="1-3" lg="1-4">
              <ReadOnlyField label={formatMessage(messages.fieldFirstApprovedOn)} value={getFormattedDate(terminal.get('approvedOn'))} />
            </Unit>
            <Unit sm="1-2" md="1-3" lg="1-4">
              <ReadOnlyField label={formatMessage(messages.fieldFirstApprovedBy)} value={terminal.get('approvedBy')} />
            </Unit>
            <Unit sm="1-2" md="1-3" lg="1-4">
              <ReadOnlyField label={formatMessage(messages.fieldHostId)} value={terminal.get('hostId')} />
            </Unit>
            <Unit sm="1-2" md="1-3" lg="1-4">
              <ReadOnlyField label={formatMessage(messages.fieldSerial)} value={terminal.get('serial')} />
            </Unit>
          </CardText>
        </Card>
      </div>
    )
  }

  renderDemoButton() {
    return (
      <DeviceDemoLink
        to={`/demo/device/${this.props.params.terminalId}`}
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
          this.props.terminal && this.props.terminal.has('deviceType') ?
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
      <div className={styles.Content}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        {this.renderPaper()}
        {this.renderDemoButton()}
      </div>
    )
  }
}

function mapStateToProps(state, props) {
  const terminal = state.terminal.items.byId.get(props.params.terminalId)

  return {
    editable: isEditable(state.user, terminal),
    terminal
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    fetchSingleTerminal,
    updateSingleTerminal
  }, dispatch)
}

export const TerminalDetailContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(TerminalDetail)
