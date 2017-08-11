import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { compose, setPropTypes, pure } from 'recompose'
import { defineMessages, intlShape } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
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
import { fetchSingleReporter, updateSingleReporter } from '../ReporterRedux'
import { ReadOnlyField } from '../../components/shared/ReadOnlyFields'
import JSONSchemaCard from '../../components/shared/JSONSchemaCard'
import NavTitle from '../../globals/components/NavTitle'
import ReporterDetailModalForm from './ReporterDetailModalForm'
import DeviceDemoLink from '../../device/DeviceDemoLink'
import styles from './ReporterDetail.css'

const messages = defineMessages({
  title: {
    id: 'pages.ReporterDetail.title',
    defaultMessage: 'Reporter Detail',
  },
  editTooltip: {
    id: 'pages.ReporterDetail.editTooltip',
    defaultMessage: 'Edit',
  },
  cancel: {
    id: 'pages.ReporterDetail.cancel',
    defaultMessage: 'Cancel',
  },
  update: {
    id: 'pages.ReporterDetail.update',
    defaultMessage: 'Update',
  },
  approved: {
    id: 'pages.DeviceDetail.approved',
    defaultMessage: 'Approved',
  },
  fieldName: {
    id: 'pages.ReporterDetail.fieldName',
    defaultMessage: 'Name',
  },
  fieldShortname: {
    id: 'pages.ReporterDetail.fieldShortname',
    defaultMessage: 'Shortname',
  },
  fieldNotes: {
    id: 'pages.ReporterDetail.fieldNotes',
    defaultMessage: 'Notes',
  },
  fieldSiteId: {
    id: 'pages.ReporterDetail.fieldSiteId',
    defaultMessage: 'Site',
  },
  fieldConfiguration: {
    id: 'pages.DeviceDetail.fieldConfiguration',
    defaultMessage: 'Configuration',
  },
  fieldFirstApprovedOn: {
    id: 'pages.ReporterDetail.fieldFirstApprovedOn',
    defaultMessage: 'First Approved On',
  },
  fieldFirstApprovedBy: {
    id: 'pages.ReporterDetail.fieldFirstApprovedBy',
    defaultMessage: 'First Approved By',
  },
  fieldHostId: {
    id: 'pages.ReporterDetail.fieldHostId',
    defaultMessage: 'Host Id',
  },
  fieldSerial: {
    id: 'pages.ReporterDetail.fieldSerial',
    defaultMessage: 'Serial',
  },
  fieldLastSeen: {
    id: 'pages.ReporterDetail.fieldLastSeen',
    defaultMessage: 'Last Seen',
  },
  fieldFirstConnected: {
    id: 'pages.ReporterDetail.fieldFirstConnected',
    defaultMessage: 'Connected',
  },
  fieldStatus: {
    id: 'pages.ReporterDetail.fieldStatus',
    defaultMessage: 'Status',
  },
  fieldTotalNumberOfTests: {
    id: 'pages.ReporterDetail.fieldTotalNumberOfTests',
    defaultMessage: 'Tests',
  },
  nestedDataSubtitle: {
    id: 'pages.ReporterDetail.nestedDataSubtitle',
    defaultMessage: '{count} fields',
  },
})

const enhance = compose(
  setPropTypes({
    match: PropTypes.shape({
      params: PropTypes.shape({
        reporterId: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
  }),
  pure,
  connect(
    (state, props) => {
      const reporter = state.reporter.items.byId.get(
        props.match.params.reporterId
      )

      return {
        editable: isEditable(state.user, reporter),
        reporter,
      }
    },
    dispatch =>
      bindActionCreators(
        {
          fetchSingleReporter,
          updateSingleReporter,
        },
        dispatch
      )
  ),
  setPropTypes({
    intl: intlShape.isRequired,
    editable: PropTypes.bool.isRequired,
    reporter: PropTypes.shape({
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
      serial: PropTypes.string,
    }),
    fetchSingleReporter: PropTypes.func.isRequired,
    updateSingleReporter: PropTypes.func.isRequired,
  })
)

export class ReporterDetail extends PureComponent {
  state = {
    isEditDialogOpen: false,
    isDemoDialogOpen: false,
    values: {
      name: '',
      shortname: '',
      notes: '',
      siteId: '',
    },
  }

  componentDidMount() {
    this.handleFetchReporter()
  }

  componentWillReceiveProps(nextProps) {
    if (
      this.props.match.params.reporterId !== nextProps.match.params.reporterId
    ) {
      this.handleFetchReporter()
    }
  }

  handleToggleEditDialog = () => {
    this.setState({ isEditDialogOpen: !this.state.isEditDialogOpen })
  }

  handleToggleDialog = () => {
    this.setState({ isDemoDialogOpen: !this.state.isDemoDialogOpen })
  }

  handleFetchReporter = () => {
    this.props
      .fetchSingleReporter(this.props.match.params.reporterId)
      .then(() => {
        const { reporter } = this.props

        this.handleFormChange({
          name: reporter.get('name') || '',
          shortname: reporter.get('shortname') || '',
          notes: reporter.get('notes') || '',
          statusToken: reporter.get('statusToken') || '',
          siteId: reporter.get('siteId'),
          configurationData: reporter.get('configurationData'),
        })
      })
  }

  handleFormatNestedSubtitle = data =>
    this.props.intl.formatMessage(messages.nestedDataSubtitle, {
      count: data.size,
    })

  handleFormChange = values => this.setState({ values })

  handleSubmit = data => {
    const { reporter } = this.props

    return this.props
      .updateSingleReporter(reporter.get('id'), {
        ...data,
        configurationData: data.configurationData.toJS(),
      })
      .then(this.handleToggleEditDialog)
  }

  renderProgress() {
    return <LinearProgress />
  }

  renderEditButtonWithDialog() {
    const { reporter, editable, intl } = this.props
    if (!editable || !reporter || !reporter.has('deviceType')) {
      return false
    }

    const { formatMessage } = intl
    const labels = {
      name: formatMessage(messages.fieldName),
      shortname: formatMessage(messages.fieldShortname),
      notes: formatMessage(messages.fieldNotes),
      statusToken: formatMessage(messages.approved),
      siteId: formatMessage(messages.fieldSiteId),
      configuration: formatMessage(messages.fieldConfiguration),
      cancel: formatMessage(messages.cancel),
      update: formatMessage(messages.update),
    }
    const dataSchema = reporter.getIn(['deviceType', 'configurationDataSchema'])

    return (
      <div>
        <IconButton
          tooltip={formatMessage(messages.editTooltip)}
          onTouchTap={this.handleToggleEditDialog}
        >
          <ModeEdit />
        </IconButton>
        <ReporterDetailModalForm
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
    const { reporter, intl } = this.props
    const { formatMessage, formatDate, formatRelative } = intl

    if (!reporter || !reporter.has('deviceType')) {
      return false
    }

    // get date for current locale, 'date' - is a Date object or string value in DateTime format
    const getFormattedDate = date =>
      date !== null && date !== '' && isFinite(new Date(date))
        ? formatDate(date)
        : date

    const configurationDataSchema = reporter
      .getIn(['deviceType', 'configurationDataSchema'])
      .sortBy(
        (value, key) => `${value.get('type') !== 'object' ? '_' : ''}${key}`
      )

    const shortname = reporter.get('shortname')

    return (
      <div>
        {/* IDs and site/results */}
        <Card>
          <CardText>
            <Unit sm="5-6" md="11-12">
              <ReadOnlyField
                label=""
                value={reporter.get('name')}
                format={v =>
                  <div>
                    <h1 className={styles.Name}>
                      {v}{' '}
                      {shortname &&
                        <small>
                          ({shortname})
                        </small>}
                    </h1>
                    <div className={styles.StatusText}>
                      <Link
                        to={`/browse/site/${reporter.get('siteId')}`}
                        className={styles.Site}
                      >
                        {reporter.get('siteName')}
                      </Link>
                    </div>
                    <div className={styles.StatusText}>
                      {formatMessage(messages.fieldLastSeen)}{' '}
                      {formatRelative(reporter.get('lastSeen'))}
                      &nbsp;&nbsp;
                      {formatMessage(messages.fieldFirstConnected)}{' '}
                      {formatRelative(reporter.get('createdOn'))}
                    </div>
                    <div className={styles.StatusText}>
                      {formatMessage(messages.fieldStatus)}
                      : {reporter.get('status')}
                      &nbsp;•&nbsp;
                      <Link to="/browse/result">
                        {reporter.get('totalTests')}{' '}
                        {formatMessage(messages.fieldTotalNumberOfTests)}
                      </Link>
                    </div>
                  </div>}
              />
            </Unit>
            <Unit sm="1-6" md="1-12">
              {/* Dialog for ReporterDetailModalForm */}
              {this.renderEditButtonWithDialog()}
            </Unit>
          </CardText>
        </Card>
        {/* Graphs */}
        <Card expanded>
          <CardText style={{ paddingTop: 10 }} className={styles.CardText}>
            <Unit sm="1-1" md="1-2">
              <CardHeader title="Utilization Rate Over Time" />
              <ReadOnlyField
                label=""
                value
                format={() =>
                  <img
                    alt="utilization rate"
                    src={require('../../device/detail/utilization_rate.png')}
                    style={{ width: '100%' }}
                  />}
              />
            </Unit>
            <Unit sm="1-1" md="1-2">
              <CardHeader title="Error Rates Over Time" />
              <ReadOnlyField
                label=""
                value
                format={() =>
                  <img
                    alt="error rate"
                    src={require('../../device/detail/error_rates.png')}
                    style={{ width: '100%' }}
                  />}
              />
            </Unit>
          </CardText>
        </Card>
        {/* Dialog for demo purpose */}
        <Dialog
          modal={false}
          open={this.state.isDemoDialogOpen}
          onRequestClose={this.handleToggleDialog}
        >
          Not yet implemented
        </Dialog>
        {/* Calibration */}
        <Card onClick={this.handleToggleDialog} expanded>
          <CardHeader title="Calibration" actAsExpander showExpandableButton />
          <CardText style={{ paddingTop: 10 }}>
            Last calibrated 12/1/2016
          </CardText>
        </Card>
        {/* Warranty */}
        <Card onClick={this.handleToggleDialog} expanded>
          <CardHeader title="Warranty" actAsExpander showExpandableButton />
          <CardText style={{ paddingTop: 10 }}>Expires 12/31/2018</CardText>
        </Card>
        {/* Configuration */}
        <JSONSchemaCard
          title={formatMessage(messages.fieldConfiguration)}
          initiallyExpanded
          renderField={field => <ReadOnlyField {...field} />}
          formatNestedSubtitle={this.handleFormatNestedSubtitle}
          dataSchema={configurationDataSchema}
          data={reporter.get('configurationData')}
        />
        {/* Technical information */}
        <Card initiallyExpanded>
          <CardHeader
            title="Technical information"
            actAsExpander
            showExpandableButton
          />
          <CardText
            actAsExpander
            expandable
            style={{ paddingTop: 10 }}
            className={styles.CardText}
          >
            <Unit sm="1-2" md="1-3" lg="1-4">
              <ReadOnlyField
                label={formatMessage(messages.fieldFirstApprovedOn)}
                value={getFormattedDate(reporter.get('approvedOn'))}
              />
            </Unit>
            <Unit sm="1-2" md="1-3" lg="1-4">
              <ReadOnlyField
                label={formatMessage(messages.fieldFirstApprovedBy)}
                value={reporter.get('approvedBy')}
              />
            </Unit>
            <Unit sm="1-2" md="1-3" lg="1-4">
              <ReadOnlyField
                label={formatMessage(messages.fieldHostId)}
                value={reporter.get('hostId')}
              />
            </Unit>
            <Unit sm="1-2" md="1-3" lg="1-4">
              <ReadOnlyField
                label={formatMessage(messages.fieldSerial)}
                value={reporter.get('serial')}
              />
            </Unit>
          </CardText>
        </Card>
      </div>
    )
  }

  renderDemoButton() {
    return (
      <DeviceDemoLink
        to={`/demo/device/${this.props.match.params.reporterId}`}
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
        {this.props.reporter && this.props.reporter.has('deviceType')
          ? this.renderContent()
          : this.renderProgress()}
      </div>
    )
  }

  render() {
    const { intl } = this.props
    const { formatMessage } = intl

    return (
      <div className={styles.Container}>
        <Helmet title={formatMessage(messages.title)} />
        <NavTitle title={formatMessage(messages.title)} />
        {this.renderPaper()}
        {this.renderDemoButton()}
      </div>
    )
  }
}

export default enhance(ReporterDetail)
