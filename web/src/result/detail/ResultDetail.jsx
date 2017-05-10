import Immutable from 'immutable'
import classnames from 'classnames/bind'
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
import Helmet from 'react-helmet'
import { Link } from 'react-router-dom'

// Material-UI
import LinearProgress from 'material-ui/LinearProgress'
import { Card, CardHeader, CardText } from 'material-ui/Card'
import Checkbox from 'material-ui/Checkbox'
import IconButton from 'material-ui/IconButton'
import Share from 'material-ui/svg-icons/social/share'

// Our own imports
import { Unit } from '../../components/pureGrids'
import JSONSchemaCard from '../../components/shared/JSONSchemaCard'
import NavTitle from '../../globals/components/NavTitle'
import {
  fetchSingleResult,
  updateSingleResult,
  updateResultWorkflowStatus,

  WorkflowLogModel,
  fetchWorkflowStatusLogs,
  Result
} from '../ResultRedux'

import ResultWorkflowStatusLog from './WorkflowLog'

import { ReadOnlyField } from '../../components/shared/ReadOnlyFields'
import styles from './ResultDetail.css'

const cssClasses = classnames.bind(styles)

const EMPTY_MAP = Immutable.Map()

const messages = defineMessages({
  title: {
    id: 'pages.ResultDetail.title',
    defaultMessage: 'Result Detail'
  },
  fieldDevice: {
    id: 'pages.ResultDetail.fieldDevice',
    defaultMessage: 'Device'
  },
  fieldSampleOriginSite: {
    id: 'pages.ResultDetail.fieldSampleOriginSite',
    defaultMessage: 'Sample Origin Site'
  },
  fieldEndedOn: {
    id: 'pages.ResultDetail.fieldEndedOn',
    defaultMessage: 'Ended Date'
  },
  fieldPatientId: {
    id: 'pages.ResultDetail.fieldPatientId',
    defaultMessage: 'Patient ID'
  },
  fieldErrorCode: {
    id: 'pages.ResultDetail.fieldErrorCode',
    defaultMessage: 'Error Code'
  },
  fieldErrorNotes: {
    id: 'pages.ResultDetail.fieldErrorNotes',
    defaultMessage: 'Error Notes'
  },
  fieldSampleId: {
    id: 'pages.ResultDetail.fieldSampleId',
    defaultMessage: 'Sample ID'
  },
  fieldResultDataResultText: {
    id: 'pages.ResultDetail.fieldResultDataResultText',
    defaultMessage: 'Result Text'
  },
  fieldNotes: {
    id: 'pages.ResultDetail.fieldNotes',
    defaultMessage: 'Notes'
  },
  fieldAssayName: {
    id: 'pages.ResultDetail.fieldAssayName',
    defaultMessage: 'Assay'
  },
  fieldReagentLotID: {
    id: 'pages.ResultDetail.fieldReagentLotID',
    defaultMessage: 'Reagent Lot ID'
  },
  fieldInstrumentSerial: {
    id: 'pages.ResultDetail.fieldInstrumentSerial',
    defaultMessage: 'Instrument Serial'
  },
  fieldModuleSerial: {
    id: 'pages.ResultDetail.fieldModuleSerial',
    defaultMessage: 'Module Serial'
  },
  fieldModuleName: {
    id: 'pages.ResultDetail.fieldModuleName',
    defaultMessage: 'Module Name'
  },
  fieldConsumableSerial: {
    id: 'pages.ResultDetail.fieldConsumableSerial',
    defaultMessage: 'Consumable Serial'
  },
  fieldConsumableExpirationDate: {
    id: 'pages.ResultDetail.fieldConsumableExpirationDate',
    defaultMessage: 'Consumable Expiration Date'
  },
  fieldSenderVersion: {
    id: 'pages.ResultDetail.fieldSenderVersion',
    defaultMessage: 'Sender Version'
  },
  fieldSenderOperator: {
    id: 'pages.ResultDetail.fieldSenderOperator',
    defaultMessage: 'Sender Operator'
  },
  fieldStartedOn: {
    id: 'pages.ResultDetail.fieldStartedOn',
    defaultMessage: 'Started'
  },
  fieldCreatedOn: {
    id: 'pages.ResultDetail.fieldCreatedOn',
    defaultMessage: 'Added to Aspect'
  },
  fieldUpdatedOn: {
    id: 'pages.ResultDetail.fieldUpdatedOn',
    defaultMessage: 'Updated'
  },
  fieldDate: {
    id: 'pages.ResultDetail.fieldDate',
    defaultMessage: 'Date'
  },
  fieldDuration: {
    id: 'pages.ResultDetail.fieldDuration',
    defaultMessage: 'Duration'
  },
  nestedDataSubtitle: {
    id: 'pages.ResultDetail.nestedDataSubtitle',
    defaultMessage: '{count} fields'
  },
})

const enhance = compose(
  setPropTypes({
    match: PropTypes.shape({
      params: PropTypes.shape({
        resultId: PropTypes.string.isRequired
      }).isRequired
    }).isRequired,
  }),
  pure,
  injectIntl,
  connect((state, props) => {
    const result = state.result.items.byId.get(props.match.params.resultId)

    return {
      result,
      workflowLog: state.result.workflowLog,
    }
  }, dispatch => (
    bindActionCreators({
      fetchSingleResult,
      updateSingleResult,
      updateResultWorkflowStatus,
      fetchWorkflowStatusLogs,
    }, dispatch)
  )),
  setPropTypes({
    intl: intlShape.isRequired,
    result: PropTypes.objectOf(Result),
    workflowLog: PropTypes.objectOf(WorkflowLogModel).isRequired,
    fetchSingleResult: PropTypes.func.isRequired,
    updateResultWorkflowStatus: PropTypes.func.isRequired,
    updateSingleResult: PropTypes.func.isRequired,
    fetchWorkflowStatusLogs: PropTypes.func.isRequired,
  }),
)

export class ResultDetail extends PureComponent {
  componentDidMount() {
    this.handleFetchResult()
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.match.params.resultId !== nextProps.match.params.resultId) {
      this.handleFetchResult()
    }
  }

  getAssayFields() {
    if (!this.hasResultWithAssay()) {
      return false
    }

    const { result } = this.props
    const resultDataSchema = result.getIn(['assay', 'resultDataSchema']) || EMPTY_MAP
    const resultData = result.get('resultData')

    return this.getSchemaFields(resultDataSchema, resultData)
  }

  getPatientFields() {
    if (!this.hasResultWithAssay()) {
      return false
    }

    const { result } = this.props
    const patientDataSchema = result.getIn(['assay', 'patientDataSchema']) || EMPTY_MAP
    const patientData = result.get('patientData')

    return this.getSchemaFields(patientDataSchema, patientData)
  }

  /*
    Takes a schema definition and JSON data field and
    returns the data as ReadOnlyFields
   */
  getSchemaFields(schema, data) {
    const { intl: { formatNumber } } = this.props

    return schema
      .filter((value, key) => key !== 'resultText' && value && value.get('type') !== 'object')
      .sortBy(value => value.get('order'))
      .entrySeq()
      .map(([key, value]) =>
        (
          <Unit sm="1-2" md="1-2" lg="1-4" key={key}>
            { /* Todo: i18n */ }
            <ReadOnlyField
              label={value.get('title')}
              value={data.get(key) || ''}
              format={value.get('type') === 'number' ? formatNumber : null}
            />
          </Unit>
      ))
  }

  getDuration(startedOn, endedOn) {
    if (!startedOn || !endedOn) {
      return null
    }

    const duration = new Date(endedOn) - new Date(startedOn)

    const seconds = parseInt((duration / 1000) % 60, 10)
    const minutes = parseInt((duration / (1000 * 60)) % 60, 10)
    const hours = parseInt((duration / (1000 * 60 * 60)) % 24, 10)

    return `${hours}h ${minutes}m ${seconds}s`
  }

  handleCheck = () => {
    const { result } = this.props

    this.props.updateResultWorkflowStatus(result.get('id'))
  }

  handleFetchResult = () => {
    this.props.fetchSingleResult(this.props.match.params.resultId)

    // refresh grid 'Result Workflow Status Logs'
    this.handleFetchWorkflowStatusLogs()
  }

  handleFetchWorkflowStatusLogs = (...args) => {
    this.props.fetchWorkflowStatusLogs(this.props.match.params.resultId, ...args)
  }

  hasResultWithAssay() {
    const { result } = this.props
    return result && result.has('assay')
  }

  handleSubmit = (data) => {
    const { result } = this.props

    this.props.updateSingleResult(result.get('id'), {
      // Map form fields to API fields
      lastTestOn: data.get('lastTestOn'),
      patientId: data.get('patientId'),
      resultText: data.get('resultText')
    })
  }

  renderProgress() {
    return (
      <LinearProgress />
    )
  }

  renderCheckbox() {
    if (!this.hasResultWithAssay()) {
      return
    }
    const { result } = this.props
    const checked = result.get('resultWorkflowStatus') === 'Acknowledged'
    return (
      <Checkbox
        disabled={checked}
        label="Acknowledged"
        labelStyle={{ marginLeft: -12 }}
        style={{ marginTop: 23 }}
        checked={checked}
        onCheck={this.handleCheck}
      />
    )
  }

  renderLowerLevelSchemaSections() {
    if (!this.hasResultWithAssay()) {
      return false
    }

    const { result, intl } = this.props
    const dataSchema = result
      .getIn(['assay', 'resultDataSchema'])
      .delete('resultText')

    return (
      <JSONSchemaCard
        title="Data"
        renderField={field => <ReadOnlyField {...field} />}
        formatNestedSubtitle={
          data => intl.formatMessage(messages.nestedDataSubtitle, { count: data.size })
        }
        dataSchema={dataSchema}
        data={result.get('resultData')}
      />
    )
  }

  renderShareButton() {
    return (
      <div>
        <IconButton>
          <Share />
        </IconButton>
      </div>
    )
  }

  renderContent() {
    const { result, intl: { formatMessage, formatDate, formatTime } } = this.props
    const assay = result.get('assay')

    return (
      <div>
        { /* IDs and device/site */ }
        <Card>
          <CardText>
            <Unit sm="5-6" md="11-12">
              <ReadOnlyField
                label={formatMessage(messages.fieldSampleOriginSite)}
                value={result.get('sampleOriginSiteName')}
                format={v =>
                  <div>
                    <Link to={`/site/${result.get('sampleOriginSiteId')}`}>
                      {v}
                    </Link>
                  </div>
                }
              />
            </Unit>
            <Unit sm="1-6" md="1-12">
              {this.renderShareButton()}
            </Unit>
            <Unit sm="1-2" md="1-2" lg="5-12">
              <ReadOnlyField label={formatMessage(messages.fieldSampleId)} value={result.get('sampleId')} />
            </Unit>
            <Unit sm="1-2" md="1-2" lg="5-12">
              <ReadOnlyField label={formatMessage(messages.fieldPatientId)} value={result.get('patientId')} />
            </Unit>
            <Unit sm="1-2" md="1-2" lg="1-6">
              <ReadOnlyField label={formatMessage(messages.fieldDate)} value={result.get('endedOn')} format={formatDate} />
            </Unit>
            <ReadOnlyField
              label={formatMessage(messages.fieldDevice)}
              value={result.get('deviceName')}
              format={v =>
                <div>
                  <Link to={`/device/${result.get('deviceId')}`}>
                    {v}
                  </Link>
                  &nbsp;at&nbsp;
                  <Link to={`/site/${result.get('siteId')}`}>
                    {result.get('siteName')}
                  </Link>
                </div>
              }
            />
          </CardText>
        </Card>
        { /* Result-related data (categories, resultText, probes...) */ }
        <Card>
          <CardText>
            { result.get('resultCategory1Name') &&
              <Unit sm="1-2" md="1-2" lg="1-4">
                <ReadOnlyField label={assay.get('resultCategory1Label') || ''} value={result.get('resultCategory1Name')} />
              </Unit> }
            { result.get('resultCategory2Name') &&
              <Unit sm="1-2" md="1-3" lg="1-4">
                <ReadOnlyField label={assay.get('resultCategory2Label') || ''} value={result.get('resultCategory2Name')} />
              </Unit> }
            {
              this.getAssayFields()
            }
            <Unit sm="1-1" md="1-2" lg="1-4">
              {this.renderCheckbox()}
            </Unit>
            { result.get('errorCode') ?
              <Unit sm="1-2" md="1-2" lg="1-4">
                <ReadOnlyField label={formatMessage(messages.fieldErrorCode)} value={result.get('errorCode')} />
              </Unit> :
              null }
            { result.get('errorNotes') ?
              <Unit sm="1-2" md="1-2" lg="3-4">
                <ReadOnlyField label={formatMessage(messages.fieldErrorNotes)} value={result.get('errorNotes')} />
              </Unit> :
              null }
            <Unit sm="1-1" md="1-1" lg="1-2">
              <ReadOnlyField label={formatMessage(messages.fieldResultDataResultText)} value={result.getIn(['resultData', 'resultText'])} />
            </Unit>
            <Unit sm="1-1" md="1-1" lg="1-2">
              <ReadOnlyField label={formatMessage(messages.fieldNotes)} value={result.get('notes')} />
            </Unit>
          </CardText>
        </Card>
        { /* Patient Info */ }
        <Card initiallyExpanded>
          <CardHeader title="Patient Information" actAsExpander showExpandableButton />
          <CardText actAsExpander expandable style={{ paddingTop: 0 }}>
            {
              this.getPatientFields()
            }
          </CardText>
        </Card>
        { /* Technical Info */ }
        <Card initiallyExpanded>
          <CardHeader title="Technical Information" actAsExpander showExpandableButton />
          <CardText actAsExpander expandable style={{ paddingTop: 0 }}>
            <Unit sm="1-1" md="1-2" lg="1-3">
              <ReadOnlyField
                label={formatMessage(messages.fieldStartedOn)}
                value={result.get('startedOn')}
                format={v => `${formatDate(v)} ${formatTime(v)}`}
              />
            </Unit>
            <Unit sm="1-1" md="1-2" lg="1-3">
              <ReadOnlyField
                label={formatMessage(messages.fieldEndedOn)}
                value={result.get('endedOn')}
                format={v => `${formatDate(v)} ${formatTime(v)}`}
              />
            </Unit>
            <Unit sm="1-1" md="1-2" lg="1-3">
              <ReadOnlyField label={formatMessage(messages.fieldDuration)} value={this.getDuration(result.get('startedOn'), result.get('endedOn'))} />
            </Unit>
            <Unit sm="1-1" md="1-2" lg="1-3">
              <ReadOnlyField
                label={formatMessage(messages.fieldCreatedOn)}
                value={result.get('createdOn')}
                format={v => `${formatDate(v)} ${formatTime(v)}`}
              />
            </Unit>
            <Unit sm="1-1" md="1-2" lg="2-3">
              <ReadOnlyField
                label={formatMessage(messages.fieldUpdatedOn)}
                value={result.get('updatedOn')}
                format={v => `${formatDate(v)} ${formatTime(v)}`}
              />
            </Unit>
            <Unit sm="1-1" md="1-2" lg="1-3">
              <ReadOnlyField label={formatMessage(messages.fieldReagentLotID)} value={result.get('consumableLot')} />
            </Unit>
            <Unit sm="1-1" md="1-2" lg="1-3">
              <ReadOnlyField label={formatMessage(messages.fieldConsumableSerial)} value={result.get('consumableSerial')} />
            </Unit>
            <Unit sm="1-1" md="1-2" lg="1-3">
              <ReadOnlyField label={formatMessage(messages.fieldConsumableExpirationDate)} value={result.get('consumableExpirationDate')} format={formatDate} />
            </Unit>
            <Unit sm="1-1" md="1-2" lg="1-3">
              <ReadOnlyField label={formatMessage(messages.fieldInstrumentSerial)} value={result.get('instrumentSerial')} />
            </Unit>
            <Unit sm="1-1" md="1-2" lg="1-3">
              <ReadOnlyField label={formatMessage(messages.fieldModuleSerial)} value={result.get('moduleSerial')} />
            </Unit>
            <Unit sm="1-1" md="1-2" lg="1-3">
              <ReadOnlyField label={formatMessage(messages.fieldModuleName)} value={result.get('moduleName')} />
            </Unit>
            <Unit sm="1-1" md="1-2" lg="1-3">
              <ReadOnlyField label={formatMessage(messages.fieldSenderOperator)} value={result.get('senderOperator')} />
            </Unit>
            <Unit sm="1-1" md="1-2" lg="1-3">
              <ReadOnlyField label={formatMessage(messages.fieldSenderVersion)} value={result.get('senderVersion')} />
            </Unit>
            <Unit sm="1-1" md="1-2" lg="1-3">
              <ReadOnlyField label={formatMessage(messages.fieldAssayName)} value={result.get('assayName')} />
            </Unit>
          </CardText>
        </Card>
        { /* Render lower-level sections in assay schema in cards */ }
        {this.renderLowerLevelSchemaSections()}
      </div>
    )
  }

  renderPaper() {
    return (
      <div>
        {
          this.hasResultWithAssay() ?
          this.renderContent() :
          this.renderProgress()
        }
      </div>
    )
  }

  render() {
    const { intl, workflowLog } = this.props
    const { formatMessage } = intl

    return (
      <div className={cssClasses('ContentDetails')}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <NavTitle title={formatMessage(messages.title)} />

        {this.renderPaper()}

        <ResultWorkflowStatusLog
          intl={intl}
          workflowLog={workflowLog}
          handleFetch={this.handleFetchWorkflowStatusLogs}
        />

      </div>
    )
  }
}

export default enhance(ResultDetail)
