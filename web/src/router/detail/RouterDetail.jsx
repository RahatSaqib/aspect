import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { compose, setPropTypes, pure } from 'recompose'
import {
  injectIntl,
  defineMessages,
  intlShape
} from 'react-intl'
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
import {
  fetchSingleRouter,
  updateSingleRouter
} from '../RouterRedux'
import { ReadOnlyField } from '../../components/shared/ReadOnlyFields'
import JSONSchemaCard from '../../components/shared/JSONSchemaCard'
import NavTitle from '../../globals/components/NavTitle'
import RouterDetailModalForm from './RouterDetailModalForm'
import DeviceDemoLink from '../../device/DeviceDemoLink'
import styles from './RouterDetail.css'

const messages = defineMessages({
  title: {
    id: 'pages.RouterDetail.title',
    defaultMessage: 'Router Detail'
  },
  editTooltip: {
    id: 'pages.RouterDetail.editTooltip',
    defaultMessage: 'Edit'
  },
  cancel: {
    id: 'pages.RouterDetail.cancel',
    defaultMessage: 'Cancel'
  },
  update: {
    id: 'pages.RouterDetail.update',
    defaultMessage: 'Update'
  },
  approved: {
    id: 'pages.RouterDetail.approved',
    defaultMessage: 'Approved'
  },
  fieldName: {
    id: 'pages.RouterDetail.fieldName',
    defaultMessage: 'Name'
  },
  fieldShortname: {
    id: 'pages.RouterDetail.fieldShortname',
    defaultMessage: 'Shortname'
  },
  fieldNotes: {
    id: 'pages.RouterDetail.fieldNotes',
    defaultMessage: 'Notes'
  },
  fieldSiteId: {
    id: 'pages.RouterDetail.fieldSiteId',
    defaultMessage: 'Site'
  },
  fieldConfiguration: {
    id: 'pages.RouterDetail.fieldConfiguration',
    defaultMessage: 'Configuration'
  },
  fieldFirstApprovedOn: {
    id: 'pages.RouterDetail.fieldFirstApprovedOn',
    defaultMessage: 'First Approved On'
  },
  fieldFirstApprovedBy: {
    id: 'pages.RouterDetail.fieldFirstApprovedBy',
    defaultMessage: 'First Approved By'
  },
  fieldHostId: {
    id: 'pages.RouterDetail.fieldHostId',
    defaultMessage: 'Host Id'
  },
  fieldSerial: {
    id: 'pages.RouterDetail.fieldSerial',
    defaultMessage: 'Serial'
  },
  fieldLastSeen: {
    id: 'pages.RouterDetail.fieldLastSeen',
    defaultMessage: 'Last Seen'
  },
  fieldFirstConnected: {
    id: 'pages.RouterDetail.fieldFirstConnected',
    defaultMessage: 'Connected'
  },
  fieldStatus: {
    id: 'pages.RouterDetail.fieldStatus',
    defaultMessage: 'Status'
  },
  fieldTotalNumberOfTests: {
    id: 'pages.RouterDetail.fieldTotalNumberOfTests',
    defaultMessage: 'Tests'
  },
  nestedDataSubtitle: {
    id: 'pages.RouterDetail.nestedDataSubtitle',
    defaultMessage: '{count} fields'
  }
})

const enhance = compose(
  setPropTypes({
    match: PropTypes.shape({
      params: PropTypes.shape({
        routerId: PropTypes.string.isRequired
      }).isRequired
    }).isRequired,
  }),
  pure,
  injectIntl,
  connect((state, props) => {
    const router = state.router.items.byId.get(props.match.params.routerId)

    return {
      editable: isEditable(state.user, router),
      router,
    }
  }, dispatch => (
    bindActionCreators({
      fetchSingleRouter,
      updateSingleRouter,
    }, dispatch)
  )),
  setPropTypes({
    intl: intlShape.isRequired,
    editable: PropTypes.bool.isRequired,
    router: PropTypes.shape({
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
    fetchSingleRouter: PropTypes.func.isRequired,
    updateSingleRouter: PropTypes.func.isRequired,
  }),
)

export class RouterDetail extends PureComponent {
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
    this.props.fetchSingleRouter(this.props.match.params.routerId)
      .then(() => {
        const { router } = this.props

        this.handleFormChange({
          name: router.get('name') || '',
          shortname: router.get('shortname') || '',
          notes: router.get('notes') || '',
          statusToken: router.get('statusToken') || '',
          siteId: router.get('siteId'),
          configurationData: router.get('configurationData')
        })
      })
  }

  handleFormatNestedSubtitle = data => (
    this.props.intl.formatMessage(messages.nestedDataSubtitle, { count: data.size })
  )

  handleFormChange = values => this.setState({ values })

  handleSubmit = (data) => {
    const { router } = this.props

    return this.props.updateSingleRouter(router.get('id'), {
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
    const { router, editable, intl } = this.props
    if (!editable || !router || !router.has('deviceType')) {
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
      update: formatMessage(messages.update)
    }
    const dataSchema = router
      .getIn(['deviceType', 'configurationDataSchema'])

    return (
      <div>
        <IconButton
          tooltip={formatMessage(messages.editTooltip)}
          onTouchTap={this.handleToggleEditDialog}
        >
          <ModeEdit />
        </IconButton>
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
    const getFormattedDate = date => (date !== null && date !== '' && isFinite(new Date(date)) ? formatDate(date) : date)

    const configurationDataSchema = router
      .getIn(['deviceType', 'configurationDataSchema'])
      .sortBy((value, key) => `${value.get('type') !== 'object' ? '_' : ''}${key}`)

    const shortname = router.get('shortname')

    return (
      <div>
        { /* IDs and site/results */ }
        <Card>
          <CardText>
            <Unit sm="5-6" md="11-12">
              <ReadOnlyField
                label=""
                value={router.get('name')}
                format={v =>
                  <div>
                    <h1 className={styles.Name}>
                      {v} {shortname && <small>({shortname})</small>}
                    </h1>
                    <div className={styles.StatusText}>
                      <Link
                        to={`/site/${router.get('siteId')}`}
                        className={styles.Site}
                      >
                        {router.get('siteName')}
                      </Link>
                    </div>
                    <div className={styles.StatusText}>
                      {formatMessage(messages.fieldLastSeen)} {formatRelative(router.get('lastSeen'))}
                      &nbsp;&nbsp;
                      {formatMessage(messages.fieldFirstConnected)} {formatRelative(router.get('createdOn'))}
                    </div>
                    <div className={styles.StatusText}>
                      {formatMessage(messages.fieldStatus)}: {router.get('status')}
                      &nbsp;•&nbsp;
                      <Link to="/result">
                        {router.get('totalTests')} {formatMessage(messages.fieldTotalNumberOfTests)}
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
                  <img alt="utilization rate" src={require('../../device/detail/utilization_rate.png')} style={{ width: '100%' }} />
                }
              />
            </Unit>
            <Unit sm="1-1" md="1-2">
              <CardHeader title="Error Rates Over Time" />
              <ReadOnlyField
                label=""
                value
                format={() =>
                  <img alt="error rates" src={require('../../device/detail/error_rates.png')} style={{ width: '100%' }} />
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
            {router.get('contacts').map(c => (
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
        { /* Configuration */ }
        <JSONSchemaCard
          title={formatMessage(messages.fieldConfiguration)}
          initiallyExpanded
          renderField={field => <ReadOnlyField {...field} />}
          formatNestedSubtitle={this.handleFormatNestedSubtitle}
          dataSchema={configurationDataSchema}
          data={router.get('configurationData')}
        />
        { /* Technical information */ }
        <Card initiallyExpanded>
          <CardHeader title="Technical information" actAsExpander showExpandableButton />
          <CardText actAsExpander expandable style={{ paddingTop: 10 }} className={styles.CardText}>
            <Unit sm="1-2" md="1-3" lg="1-4">
              <ReadOnlyField label={formatMessage(messages.fieldFirstApprovedOn)} value={getFormattedDate(router.get('approvedOn'))} />
            </Unit>
            <Unit sm="1-2" md="1-3" lg="1-4">
              <ReadOnlyField label={formatMessage(messages.fieldFirstApprovedBy)} value={router.get('approvedBy')} />
            </Unit>
            <Unit sm="1-2" md="1-3" lg="1-4">
              <ReadOnlyField label={formatMessage(messages.fieldHostId)} value={router.get('hostId')} />
            </Unit>
            <Unit sm="1-2" md="1-3" lg="1-4">
              <ReadOnlyField label={formatMessage(messages.fieldSerial)} value={router.get('serial')} />
            </Unit>
          </CardText>
        </Card>
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
        {
          this.props.router && this.props.router.has('deviceType') ?
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
        <NavTitle title={formatMessage(messages.title)} />
        {this.renderPaper()}
        {this.renderDemoButton()}
      </div>
    )
  }
}

export default enhance(RouterDetail)
