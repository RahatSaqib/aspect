import _ from 'lodash'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { compose, setPropTypes } from 'recompose'
import { defineMessages } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import Helmet from 'react-helmet'

// Material-UI

import LinearProgress from '@material-ui/core/LinearProgress'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import IconButton from '@material-ui/core/IconButton'
import ModeEdit from '@material-ui/icons/Edit'
import Tooltip from '@material-ui/core/Tooltip'
import ExpansionPanel from '@material-ui/core/ExpansionPanel'
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails'
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import Typography from '@material-ui/core/Typography'

// Our own imports
import AspectDialog from '../../components/shared/AspectDialog'
import { Unit } from '../../components/pureGrids'
import isEditable from '../../shared/selectors/device'
import { fetchSingleRouter, updateSingleRouter } from '../RouterRedux'
import { ReadOnlyField } from '../../components/shared/ReadOnlyFields'
import JSONSchemaCard from '../../components/shared/JSONSchemaCard'
import NavTitle from '../../globals/components/NavTitle'
import RouterDetailModalForm from './RouterDetailModalForm'
import DeviceDemoLink from '../../device/DeviceDemoLink'
import styles from './RouterDetail.css'

const messages = defineMessages({
  title: {
    id: 'pages.RouterDetail.title',
    defaultMessage: 'Router Detail',
  },
  editTooltip: {
    id: 'pages.RouterDetail.editTooltip',
    defaultMessage: 'Edit',
  },
  cancel: {
    id: 'pages.RouterDetail.cancel',
    defaultMessage: 'Cancel',
  },
  update: {
    id: 'pages.RouterDetail.update',
    defaultMessage: 'Update',
  },
  approved: {
    id: 'pages.RouterDetail.approved',
    defaultMessage: 'Approved',
  },
  fieldName: {
    id: 'pages.RouterDetail.fieldName',
    defaultMessage: 'Name',
  },
  fieldShortName: {
    id: 'pages.RouterDetail.fieldShortName',
    defaultMessage: 'ShortName',
  },
  fieldNotes: {
    id: 'pages.RouterDetail.fieldNotes',
    defaultMessage: 'Notes',
  },
  fieldSiteId: {
    id: 'pages.RouterDetail.fieldSiteId',
    defaultMessage: 'Site',
  },
  fieldConfiguration: {
    id: 'pages.RouterDetail.fieldConfiguration',
    defaultMessage: 'Configuration',
  },
  fieldFirstApprovedOn: {
    id: 'pages.RouterDetail.fieldFirstApprovedOn',
    defaultMessage: 'First Approved On',
  },
  fieldFirstApprovedBy: {
    id: 'pages.RouterDetail.fieldFirstApprovedBy',
    defaultMessage: 'First Approved By',
  },
  fieldHostId: {
    id: 'pages.RouterDetail.fieldHostId',
    defaultMessage: 'Host Id',
  },
  fieldSerial: {
    id: 'pages.RouterDetail.fieldSerial',
    defaultMessage: 'Serial',
  },
  fieldLastSeen: {
    id: 'pages.RouterDetail.fieldLastSeen',
    defaultMessage: 'Last Seen',
  },
  fieldFirstConnected: {
    id: 'pages.RouterDetail.fieldFirstConnected',
    defaultMessage: 'Connected',
  },
  fieldStatus: {
    id: 'pages.RouterDetail.fieldStatus',
    defaultMessage: 'Status',
  },
  fieldTotalNumberOfTests: {
    id: 'pages.RouterDetail.fieldTotalNumberOfTests',
    defaultMessage: 'Tests',
  },
  nestedDataSubtitle: {
    id: 'pages.RouterDetail.nestedDataSubtitle',
    defaultMessage: '{count} fields',
  },
})

const enhance = compose(
  setPropTypes({
    match: PropTypes.shape({
      params: PropTypes.shape({
        routerId: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
  }),
  connect(
    (state, props) => {
      const router = state.router.items.byId.get(props.match.params.routerId)

      return {
        editable: isEditable(state.user, router),
        router,
      }
    },
    dispatch =>
      bindActionCreators(
        {
          fetchSingleRouter,
          updateSingleRouter,
        },
        dispatch
      )
  ),
  setPropTypes({
    editable: PropTypes.bool.isRequired,
    router: PropTypes.shape({
      has: PropTypes.func.isRequired,
      // see /api/src/device/endPoint.js, path: '/device'
      // see /api/src/device/service.js, const SELECT_SHOW_FIELDS
      id: PropTypes.number,
      name: PropTypes.string,
      shortName: PropTypes.string,
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
    fetchSingleRouter: PropTypes.func.isRequired,
    updateSingleRouter: PropTypes.func.isRequired,
  })
)

export class RouterDetail extends PureComponent {
  state = {
    isEditDialogOpen: false,
    isDemoDialogOpen: false,
    values: {
      name: '',
      shortName: '',
      notes: '',
      siteId: '',
    },
  }

  componentDidMount() {
    this.handleFetchRouter()
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.match.params.routerId !== nextProps.match.params.routerId) {
      this.handleFetchRouter()
    }
  }

  handleToggleEditDialog = () => {
    this.setState({ isEditDialogOpen: !this.state.isEditDialogOpen })
  }

  handleToggleDialog = () => {
    this.setState({ isDemoDialogOpen: !this.state.isDemoDialogOpen })
  }

  handleFetchRouter = () => {
    this.props.fetchSingleRouter(this.props.match.params.routerId).then(() => {
      const { router } = this.props

      this.handleFormChange({
        name: router.get('name') || '',
        shortName: router.get('shortName') || '',
        notes: router.get('notes') || '',
        statusToken: router.get('statusToken') || '',
        siteId: router.get('siteId'),
        configurationData: router.get('configurationData'),
      })
    })
  }

  handleFormatNestedSubtitle = data =>
    this.props.intl.formatMessage(messages.nestedDataSubtitle, {
      count: data.size,
    })

  handleFormChange = values => this.setState({ values })

  handleSubmit = data => {
    const { router } = this.props

    return this.props
      .updateSingleRouter(router.get('id'), {
        ...data,
        configurationData: data.configurationData.toJS(),
      })
      .then(this.handleToggleEditDialog)
  }

  renderProgress() {
    return <LinearProgress />
  }

  renderEditButtonWithDialog() {
    const { router, editable, intl } = this.props
    if (!editable || !router || !router.has('deviceType')) {
      return false
    }

    const { formatMessage } = intl
    const labels = {
      name: formatMessage(messages.fieldName),
      shortName: formatMessage(messages.fieldShortName),
      notes: formatMessage(messages.fieldNotes),
      statusToken: formatMessage(messages.approved),
      siteId: formatMessage(messages.fieldSiteId),
      configuration: formatMessage(messages.fieldConfiguration),
      cancel: formatMessage(messages.cancel),
      update: formatMessage(messages.update),
    }
    const dataSchema = router.getIn(['deviceType', 'configurationDataSchema'])

    return (
      <div>
        <Tooltip title={formatMessage(messages.editTooltip)} placement="bottom">
          <IconButton
            aria-label={formatMessage(messages.editTooltip)}
            onClick={this.handleToggleEditDialog}
          >
            <ModeEdit fontSize="large" />
          </IconButton>
        </Tooltip>
        <RouterDetailModalForm
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
    const { router, intl } = this.props
    const { formatMessage, formatDate, formatRelative } = intl
    if (!router || !router.has('deviceType')) {
      return false
    }

    // get date for current locale, 'date' - is a Date object or string value in DateTime format
    const getFormattedDate = date =>
      date !== null && date !== '' && _.isFinite(new Date(date).getTime())
        ? formatDate(date)
        : date

    const configurationDataSchema = router
      .getIn(['deviceType', 'configurationDataSchema'])
      .sortBy(
        (value, key) => `${value.get('type') !== 'object' ? '_' : ''}${key}`
      )

    const shortName = router.get('shortName')

    return (
      <div>
        {/* IDs and site/results */}
        <Card>
          <CardContent>
            <Unit sm="5-6" md="11-12">
              <ReadOnlyField
                label=""
                value={router.get('name')}
                format={v => (
                  <div>
                    <h1 className={styles.Name}>
                      {v} {shortName && <small>({shortName})</small>}
                    </h1>
                    <div className={styles.StatusText}>
                      <Link
                        to={`/browse/site/${router.get('siteId')}`}
                        className={styles.Site}
                      >
                        {router.get('siteName')}
                      </Link>
                    </div>
                    <div className={styles.StatusText}>
                      {formatMessage(messages.fieldLastSeen)}{' '}
                      {formatRelative(router.get('lastSeen'))}
                      &nbsp;&nbsp;
                      {formatMessage(messages.fieldFirstConnected)}{' '}
                      {formatRelative(router.get('createdOn'))}
                    </div>
                    <div className={styles.StatusText}>
                      {formatMessage(messages.fieldStatus)}
                      : {router.get('status')}
                      &nbsp;•&nbsp;
                      <Link to="/browse/result">
                        {router.get('totalTests')}{' '}
                        {formatMessage(messages.fieldTotalNumberOfTests)}
                      </Link>
                    </div>
                  </div>
                )}
              />
            </Unit>
            <Unit sm="1-6" md="1-12">
              {/* Dialog for DeviceDetailModalForm */}
              {this.renderEditButtonWithDialog()}
            </Unit>
          </CardContent>
        </Card>
        {/* Graphs */}
        <ExpansionPanel defaultExpanded className={styles.Panel}>
          <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
            <Unit sm="1-1" md="1-2">
              <Typography variant="subtitle1">
                Utilization Rate Over Time
              </Typography>
            </Unit>
            <Unit sm="1-1" md="1-2">
              <Typography variant="subtitle1">Error Rates Over Time</Typography>
            </Unit>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            <Unit sm="1-1" md="1-2">
              <ReadOnlyField
                label=""
                value
                format={() => (
                  <img
                    alt="utilization rate"
                    src={require('../../device/detail/utilization_rate.png')}
                    style={{ width: '100%' }}
                  />
                )}
              />
            </Unit>
            <Unit sm="1-1" md="1-2">
              <ReadOnlyField
                label=""
                value
                format={() => (
                  <img
                    alt="error rates"
                    src={require('../../device/detail/error_rates.png')}
                    style={{ width: '100%' }}
                  />
                )}
              />
            </Unit>
          </ExpansionPanelDetails>
        </ExpansionPanel>
        {/* Dialog for demo purpose */}
        <AspectDialog
          modal={false}
          open={this.state.isDemoDialogOpen}
          onRequestClose={this.handleToggleDialog}
        >
          Not yet implemented
        </AspectDialog>
        {/* Contacts */}
        <ExpansionPanel defaultExpanded className={styles.Panel}>
          <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Contacts</Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            <Typography variant="body2">
              {router.get('contacts').map(c => (
                <Link
                  key={c.get('id')}
                  to={`/browse/person/${c.get('id')}`}
                  className={styles.Contact}
                >
                  {c.get('name')}
                </Link>
              ))}
            </Typography>
          </ExpansionPanelDetails>
        </ExpansionPanel>
        {/* Calibration */}
        <ExpansionPanel
          expanded
          onClick={this.handleToggleDialog}
          className={styles.Panel}
        >
          <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Calibration</Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            <Typography variant="body2">Last calibrated 12/1/2016</Typography>
          </ExpansionPanelDetails>
        </ExpansionPanel>
        {/* Warranty */}
        <ExpansionPanel
          expanded
          onClick={this.handleToggleDialog}
          className={styles.Panel}
        >
          <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Warranty</Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            <Typography variant="body2">Expires 12/31/2018</Typography>
          </ExpansionPanelDetails>
        </ExpansionPanel>
        {/* Configuration */}
        <JSONSchemaCard
          title={formatMessage(messages.fieldConfiguration)}
          initiallyExpanded
          renderField={field => <ReadOnlyField {...field} />}
          formatNestedSubtitle={this.handleFormatNestedSubtitle}
          dataSchema={configurationDataSchema}
          data={router.get('configurationData')}
        />
        {/* Technical information */}
        <ExpansionPanel defaultExpanded className={styles.Panel}>
          <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Technical information</Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            <Typography
              variant="body2"
              component="div"
              style={{ width: '100%' }}
            >
              <Unit sm="1-2" md="1-3" lg="1-4">
                <ReadOnlyField
                  label={formatMessage(messages.fieldFirstApprovedOn)}
                  value={getFormattedDate(router.get('approvedOn'))}
                />
              </Unit>
              <Unit sm="1-2" md="1-3" lg="1-4">
                <ReadOnlyField
                  label={formatMessage(messages.fieldFirstApprovedBy)}
                  value={router.get('approvedBy')}
                />
              </Unit>
              <Unit sm="1-2" md="1-3" lg="1-4">
                <ReadOnlyField
                  label={formatMessage(messages.fieldHostId)}
                  value={router.get('hostId')}
                />
              </Unit>
              <Unit sm="1-2" md="1-3" lg="1-4">
                <ReadOnlyField
                  label={formatMessage(messages.fieldSerial)}
                  value={router.get('serial')}
                />
              </Unit>
            </Typography>
          </ExpansionPanelDetails>
        </ExpansionPanel>
      </div>
    )
  }

  renderDemoButton() {
    return (
      <DeviceDemoLink
        to={`/demo/device/${this.props.match.params.routerId}`}
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
        {this.props.router && this.props.router.has('deviceType')
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

export default enhance(RouterDetail)
