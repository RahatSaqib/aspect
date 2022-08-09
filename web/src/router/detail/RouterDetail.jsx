import isFinite from 'lodash/isFinite'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { compose, setPropTypes } from 'recompose'
import { injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import LinearProgress from '@mui/material/LinearProgress'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import ModeEdit from '@mui/icons-material/Edit'
import Tooltip from '@mui/material/Tooltip'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Typography from '@mui/material/Typography'
import AspectDialog from '../../components/shared/AspectDialog'
import { Unit } from '../../components/pureGrids'
import isEditable from '../../shared/selectors/isEditable'
import { fetchSingleRouter, updateSingleRouter } from '../RouterRedux'
import { ReadOnlyField } from '../../components/shared/ReadOnlyFields'
import JSONSchemaCard from '../../components/shared/JSONSchemaCard'
import NavTitle from '../../globals/components/NavTitle'
import RouterDetailModalForm from './RouterDetailModalForm'
import DeviceDemoLink from '../../device/DeviceDemoLink'
import styles from './RouterDetail.css'

import messages from './messages'

const enhance = compose(
  injectIntl,
  WrapperComponent => props => {
    const { routerId } = useParams()
    return <WrapperComponent {...props} routerId={routerId} />
  },
  connect(
    (state, { routerId }) => {
      const router = state.router.items.byId.get(routerId)
      return {
        editable: isEditable(state.user, 'device'),
        router,
      }
    },
    {
      fetchSingleRouter,
      updateSingleRouter,
    }
  ),
  setPropTypes({
    editable: PropTypes.bool.isRequired,
    router: PropTypes.shape({
      has: PropTypes.func.isRequired,
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
      approval: PropTypes.string,
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

  componentDidUpdate(prevProps) {
    if (this.props.routerId !== prevProps.routerId) {
      this.handleFetchRouter()
    }
  }

  handleToggleEditDialog = () => {
    this.setState(prevState => ({
      isEditDialogOpen: !prevState.isEditDialogOpen,
    }))
  }

  handleToggleDialog = () => {
    this.setState(prevState => ({
      isDemoDialogOpen: !prevState.isDemoDialogOpen,
    }))
  }

  handleFetchRouter = () => {
    this.props.fetchSingleRouter(this.props.routerId).then(() => {
      const { router } = this.props

      this.handleFormChange({
        name: router.get('name') || '',
        shortName: router.get('shortName') || '',
        notes: router.get('notes') || '',
        approvalToken: router.get('approvalToken') || '',
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
      approvalToken: formatMessage(messages.approved),
      siteId: formatMessage(messages.fieldSiteId),
      configuration: formatMessage(messages.fieldConfiguration),
      cancel: formatMessage(messages.cancel),
      update: formatMessage(messages.update),
    }
    const dataSchema = router.getIn(['deviceType', 'configurationDataSchema'])

    return (
      <div>
        <Tooltip title={formatMessage(messages.editTooltip)} placement="bottom" disableInteractive>
          <IconButton aria-label={formatMessage(messages.editTooltip)} onClick={this.handleToggleEditDialog}>
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
    const contacts = router.get('contacts')
    if (!router || !router.has('deviceType')) {
      return false
    }

    // get date for current locale, 'date' - is a Date object or string value in DateTime format
    const getFormattedDate = date =>
      date !== null && date !== '' && isFinite(new Date(date).getTime()) ? formatDate(date) : date

    const configurationDataSchema = router
      .getIn(['deviceType', 'configurationDataSchema'])
      .sortBy((value, key) => `${value.get('type') !== 'object' ? '_' : ''}${key}`)

    const shortName = router.get('shortName')

    return (
      <div>
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
                      <Link to={`/browse/site/${router.get('siteId')}`} className={styles.Site}>
                        {router.get('siteName')}
                      </Link>
                    </div>
                    <div className={styles.StatusText}>
                      {formatMessage(messages.fieldLastSeen)} {formatRelative(router.get('lastSeen'))}
                      &nbsp;&nbsp;
                      {formatMessage(messages.fieldFirstConnected)} {formatRelative(router.get('createdOn'))}
                    </div>
                    <div className={styles.StatusText}>
                      {formatMessage(messages.fieldStatus)}: {router.get('approval')}
                      &nbsp;•&nbsp;
                      <Link to="/browse/result">
                        {router.get('totalTests')} {formatMessage(messages.fieldTotalNumberOfTests)}
                      </Link>
                    </div>
                  </div>
                )}
              />
            </Unit>
            <Unit sm="1-6" md="1-12">
              {this.renderEditButtonWithDialog()}
            </Unit>
          </CardContent>
        </Card>
        {/* Graphs */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Unit sm="1-1" md="1-2">
              <Typography variant="subtitle1">{formatMessage(messages.detailUtilOverTime)}</Typography>
            </Unit>
            <Unit sm="1-1" md="1-2">
              <Typography variant="subtitle1">{formatMessage(messages.detailErrorOverTime)}</Typography>
            </Unit>
          </AccordionSummary>
          <AccordionDetails>
            <Unit sm="1-1" md="1-2">
              <ReadOnlyField
                label=""
                value
                format={() => (
                  <img
                    alt="utilization rate"
                    src={require('../../MigratedComponents/Devices/Detail/utilization_rate.png')}
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
                    src={require('../../MigratedComponents/Devices/Detail/error_rates.png')}
                    style={{ width: '100%' }}
                  />
                )}
              />
            </Unit>
          </AccordionDetails>
        </Accordion>
        <AspectDialog modal={false} open={this.state.isDemoDialogOpen} onRequestClose={this.handleToggleDialog}>
          Not yet implemented
        </AspectDialog>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">{formatMessage(messages.detailContacts)}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2">
              {
                // temp fix to get router details to display
                contacts &&
                  contacts.map(c => (
                    <Link key={c.get('id')} to={`/browse/person/${c.get('id')}`} className={styles.Contact}>
                      {c.get('name')}
                    </Link>
                  ))
              }
            </Typography>
          </AccordionDetails>
        </Accordion>
        {/* Contacts */}
        <Accordion expanded onClick={this.handleToggleDialog}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">{formatMessage(messages.detailCalibration)}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2">
              {formatMessage(messages.detailCalibrationDate, {
                date: '12/1/2016',
              })}
            </Typography>
          </AccordionDetails>
        </Accordion>
        {/* Warranty */}
        <Accordion expanded onClick={this.handleToggleDialog}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">{formatMessage(messages.detailWarranty)}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2">
              {formatMessage(messages.detailWarrantyExpire, {
                date: '12/31/2018',
              })}
            </Typography>
          </AccordionDetails>
        </Accordion>
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
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">{formatMessage(messages.detailTechInfo)}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" component="div" style={{ width: '100%' }}>
              <Unit sm="1-2" md="1-3" lg="1-4">
                <ReadOnlyField
                  label={formatMessage(messages.fieldFirstApprovedOn)}
                  value={getFormattedDate(router.get('approvedOn'))}
                />
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
            </Typography>
          </AccordionDetails>
        </Accordion>
      </div>
    )
  }

  renderDemoButton() {
    return (
      <DeviceDemoLink to={`/demo/device/${this.props.routerId}`} className={styles.DemoLink} target="_blank">
        Demo
      </DeviceDemoLink>
    )
  }

  renderPaper() {
    return (
      <div>
        {this.props.router && this.props.router.has('deviceType') ? this.renderContent() : this.renderProgress()}
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
