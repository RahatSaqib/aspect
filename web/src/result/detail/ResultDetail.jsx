import Immutable from 'immutable'
import classnames from 'classnames/bind'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { compose, setPropTypes, pure } from 'recompose'
import { injectIntl, defineMessages, intlShape } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import { Link } from 'react-router-dom'

// Material-UI
import LinearProgress from 'material-ui/LinearProgress'
import { Card, CardHeader, CardText } from 'material-ui/Card'
import IconButton from 'material-ui/IconButton'
import Share from 'material-ui/svg-icons/social/share'
import Checkbox from 'material-ui/Checkbox'

// Our own imports
import { Unit } from '../../components/pureGrids'
import JSONSchemaCard from '../../components/shared/JSONSchemaCard'
import NavTitle from '../../globals/components/NavTitle'
import {
  fetchSingleResult,
  updateSingleResult,
  updateResultQcCheck,
  WorkflowLogModel,
  fetchWorkflowStatusLogs,
  Result,
} from '../ResultRedux'

import ResultWorkflowStatusLog from './WorkflowLog'

import { ReadOnlyField } from '../../components/shared/ReadOnlyFields'
import styles from './ResultDetail.css'

const cssClasses = classnames.bind(styles)

const EMPTY_MAP = Immutable.Map()

const messages = defineMessages({
  title: {
    id: 'pages.ResultDetail.title',
    defaultMessage: 'Result Detail',
  },
  fieldDevice: {
    id: 'pages.ResultDetail.fieldDevice',
    defaultMessage: 'Device',
  },
  fieldSampleOriginSite: {
    id: 'pages.ResultDetail.fieldSampleOriginSite',
    defaultMessage: 'Sample Origin Site',
  },
  fieldSampleGroup: {
    id: 'pages.ResultDetail.fieldSampleGroup',
    defaultMessage: 'Sample Group',
  },
  fieldEndedOn: {
    id: 'pages.ResultDetail.fieldEndedOn',
    defaultMessage: 'Ended Date',
  },
  fieldPatientId: {
    id: 'pages.ResultDetail.fieldPatientId',
    defaultMessage: 'Patient ID',
  },
  fieldErrorCode: {
    id: 'pages.ResultDetail.fieldErrorCode',
    defaultMessage: 'Error Code',
  },
  fieldErrorNotes: {
    id: 'pages.ResultDetail.fieldErrorNotes',
    defaultMessage: 'Error Notes',
  },
  fieldSampleId: {
    id: 'pages.ResultDetail.fieldSampleId',
    defaultMessage: 'Sample ID',
  },
  fieldResultId: {
    id: 'pages.ResultDetail.fieldResultId',
    defaultMessage: 'Result ID',
  },
  fieldResultDataResultText: {
    id: 'pages.ResultDetail.fieldResultDataResultText',
    defaultMessage: 'Result Text',
  },
  fieldNotes: {
    id: 'pages.ResultDetail.fieldNotes',
    defaultMessage: 'Notes',
  },
  fieldAssayName: {
    id: 'pages.ResultDetail.fieldAssayName',
    defaultMessage: 'Assay',
  },
  fieldReagentLotID: {
    id: 'pages.ResultDetail.fieldReagentLotID',
    defaultMessage: 'Reagent Lot ID',
  },
  fieldInstrumentSerial: {
    id: 'pages.ResultDetail.fieldInstrumentSerial',
    defaultMessage: 'Instrument Serial',
  },
  fieldModuleSerial: {
    id: 'pages.ResultDetail.fieldModuleSerial',
    defaultMessage: 'Module Serial',
  },
  fieldModuleName: {
    id: 'pages.ResultDetail.fieldModuleName',
    defaultMessage: 'Module Name',
  },
  fieldConsumableSerial: {
    id: 'pages.ResultDetail.fieldConsumableSerial',
    defaultMessage: 'Consumable Serial',
  },
  fieldConsumableExpirationDate: {
    id: 'pages.ResultDetail.fieldConsumableExpirationDate',
    defaultMessage: 'Consumable Expiration Date',
  },
  fieldSenderVersion: {
    id: 'pages.ResultDetail.fieldSenderVersion',
    defaultMessage: 'Sender Version',
  },
  fieldSenderOperator: {
    id: 'pages.ResultDetail.fieldSenderOperator',
    defaultMessage: 'Sender Operator',
  },
  fieldStartedOn: {
    id: 'pages.ResultDetail.fieldStartedOn',
    defaultMessage: 'Started',
  },
  fieldCreatedOn: {
    id: 'pages.ResultDetail.fieldCreatedOn',
    defaultMessage: 'Added to Aspect',
  },
  fieldUpdatedOn: {
    id: 'pages.ResultDetail.fieldUpdatedOn',
    defaultMessage: 'Updated',
  },
  fieldDate: {
    id: 'pages.ResultDetail.fieldDate',
    defaultMessage: 'Ended On',
  },
  fieldDuration: {
    id: 'pages.ResultDetail.fieldDuration',
    defaultMessage: 'Duration',
  },
  fieldCollectedOn: {
    id: 'pages.ResultDetail.fieldCollectedOn',
    defaultMessage: 'Collected On',
  },
  fieldSampleType: {
    id: 'pages.ResultDetail.fieldSampleType',
    defaultMessage: 'Sample Type',
  },
  nestedDataSubtitle: {
    id: 'pages.ResultDetail.nestedDataSubtitle',
    defaultMessage: '{count} fields',
  },
  nullText: {
    id: 'pages.ResultDetail.nullText',
    defaultMessage: 'N/A',
  },
  externalID: {
    id: 'pages.ResultDetail.externalID',
    defaultMessage: 'External Result ID',
  },
  qcCheck: {
    id: 'pages.ResultDetail.qcCheck',
    defaultMessage: 'QC Check',
  },
  qcCheckDisabledHelp: {
    id: 'pages.ResultDetail.qcCheckDisabledHelp',
    defaultMessage:
      '"QC Check" is only enabled if the result is in the status "Ready for Delivery" and hasn\'t been sent to the terminal yet',
  },
})

const enhance = compose(
  setPropTypes({
    match: PropTypes.shape({
      params: PropTypes.shape({
        resultId: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
  }),
  pure,
  injectIntl,
  connect(
    (state, props) => {
      const result = state.result.items.byId.get(props.match.params.resultId)

      return {
        result,
        workflowLog: state.result.workflowLog,
      }
    },
    dispatch =>
      bindActionCreators(
        {
          fetchSingleResult,
          updateSingleResult,
          updateResultQcCheck,
          fetchWorkflowStatusLogs,
        },
        dispatch
      )
  ),
  setPropTypes({
    intl: intlShape.isRequired,
    result: PropTypes.objectOf(Result),
    workflowLog: PropTypes.objectOf(WorkflowLogModel).isRequired,
    fetchSingleResult: PropTypes.func.isRequired,
    updateSingleResult: PropTypes.func.isRequired,
    updateResultQcCheck: PropTypes.func.isRequired,
    fetchWorkflowStatusLogs: PropTypes.func.isRequired,
  })
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

  onChangeQcCheck = event => {
    const { result } = this.props

    this.props.updateResultQcCheck(result.get('id'), event.target.checked)
  }

  getAssayFields() {
    if (!this.hasResultWithAssay()) {
      return false
    }

    const { result } = this.props
    const resultDataSchema =
      result.getIn(['assay', 'resultDataSchema']) || EMPTY_MAP
    const resultData = result.get('resultData')

    return this.getSchemaFields(resultDataSchema, resultData)
  }

  getPatientFields() {
    if (!this.hasResultWithAssay()) {
      return false
    }

    const { result } = this.props
    const patientDataSchema =
      result.getIn(['assay', 'patientDataSchema']) || EMPTY_MAP
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
      .filter(
        (value, key) =>
          key !== 'resultText' && value && value.get('type') !== 'object'
      )
      .sortBy(value => value.get('order'))
      .entrySeq()
      .map(([key, value]) =>
        <Unit sm="1-2" md="1-2" lg="1-4" key={key}>
          {/* Todo: i18n */}
          <ReadOnlyField
            label={value.get('title')}
            value={data.get(key) || ''}
            format={value.get('type') === 'number' ? formatNumber : null}
          />
        </Unit>
      )
  }

  getDuration(startedOn, endedOn) {
    if (!startedOn || !endedOn) {
      return null
    }

    const duration = new Date(endedOn) - new Date(startedOn)

    const seconds = parseInt(duration / 1000 % 60, 10)
    const minutes = parseInt(duration / (1000 * 60) % 60, 10)
    const hours = parseInt(duration / (1000 * 60 * 60) % 24, 10)

    return `${hours}h ${minutes}m ${seconds}s`
  }

  handleFetchResult = () => {
    this.props.fetchSingleResult(this.props.match.params.resultId)

    // refresh grid 'Result Workflow Status Logs'
    this.handleFetchWorkflowStatusLogs()
  }

  handleFetchWorkflowStatusLogs = (...args) => {
    this.props.fetchWorkflowStatusLogs(
      this.props.match.params.resultId,
      ...args
    )
  }

  hasResultWithAssay() {
    const { result } = this.props
    return result && result.has('assay')
  }

  handleSubmit = data => {
    const { result } = this.props

    this.props.updateSingleResult(result.get('id'), {
      // Map form fields to API fields
      lastTestOn: data.get('lastTestOn'),
      patientId: data.get('patientId'),
      resultText: data.get('resultText'),
    })
  }

  renderProgress() {
    return <LinearProgress />
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
        formatNestedSubtitle={data =>
          intl.formatMessage(messages.nestedDataSubtitle, { count: data.size })}
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
    const {
      result,
      intl: { formatMessage, formatDate, formatTime },
    } = this.props
    const assay = result.get('assay')
    const date = result.get('endedOn')

    return (
      <div>
        {/* IDs and device/site */}
        <Card>
          <CardText>
            <Unit sm="5-6" md="11-12">
              <ReadOnlyField
                label={formatMessage(messages.fieldSampleOriginSite)}
                value={result.get('sampleOriginSiteName')}
                format={v =>
                  <div>
                    <Link
                      to={`/browse/site/${result.get('sampleOriginSiteId')}`}
                    >
                      {v}
                    </Link>
                  </div>}
              />
            </Unit>
            <Unit sm="1-6" md="1-12">
              {this.renderShareButton()}
            </Unit>
            <Unit sm="1-2" md="1-2" lg="1-4">
              <ReadOnlyField
                label={formatMessage(messages.fieldSampleId)}
                value={result.get('sampleId')}
              />
            </Unit>
            <Unit sm="1-2" md="1-2" lg="1-4">
              <ReadOnlyField
                label={formatMessage(messages.fieldSampleGroup)}
                value={result.get('sampleGroup')}
              />
            </Unit>
            <Unit sm="1-2" md="1-2" lg="1-4">
              <ReadOnlyField
                label={formatMessage(messages.fieldSampleType)}
                nullText={formatMessage(messages.nullText)}
                value={result.get('sampleTypeName')}
              />
            </Unit>
            <Unit sm="1-2" md="1-2" lg="1-4">
              <ReadOnlyField
                label={formatMessage(messages.fieldPatientId)}
                value={result.get('patientId')}
              />
            </Unit>
            <Unit sm="1-2" md="1-2" lg="1-4">
              <ReadOnlyField
                label={formatMessage(messages.fieldCollectedOn)}
                nullText={formatMessage(messages.nullText)}
                value={result.get('sampleCollectedOn')}
                format={formatDate}
              />
            </Unit>
            <Unit sm="1-2" md="1-2" lg="1-4">
              <ReadOnlyField
                label={formatMessage(messages.fieldDate)}
                nullText={formatMessage(messages.nullText)}
                value={date}
                format={formatDate}
              />
            </Unit>
            <Unit sm="1-2" md="1-2" lg="1-2">
              <ReadOnlyField
                label={formatMessage(messages.fieldDevice)}
                value={result.get('deviceName')}
                format={v =>
                  <div>
                    <Link to={`/browse/device/${result.get('deviceId')}`}>
                      {v}
                    </Link>
                    &nbsp;at&nbsp;
                    <Link to={`/browse/site/${result.get('siteId')}`}>
                      {result.get('siteName')}
                    </Link>
                  </div>}
              />
            </Unit>
          </CardText>
        </Card>
        {/* Result-related data (categories, resultText, probes...) */}
        <Card>
          <CardText>
            {result.get('resultCategory1Name') &&
              <Unit sm="1-2" md="1-2" lg="1-4">
                <ReadOnlyField
                  label={assay.get('resultCategory1Label') || ''}
                  value={result.get('resultCategory1Name')}
                />
              </Unit>}
            {result.get('resultCategory2Name') &&
              <Unit sm="1-2" md="1-3" lg="1-4">
                <ReadOnlyField
                  label={assay.get('resultCategory2Label') || ''}
                  value={result.get('resultCategory2Name')}
                />
              </Unit>}
            {this.getAssayFields()}
            <Unit sm="1-2" md="1-2" lg="1-2">
              <ReadOnlyField
                label={formatMessage(messages.fieldResultDataResultText)}
                value={result.getIn(['resultData', 'resultText'])}
              />
            </Unit>
            {result.get('errorCode')
              ? <Unit sm="1-2" md="1-2" lg="1-4">
                  <ReadOnlyField
                    label={formatMessage(messages.fieldErrorCode)}
                    value={result.get('errorCode')}
                  />
                </Unit>
              : null}
            {result.get('errorNotes')
              ? <Unit sm="1-2" md="1-2" lg="3-4">
                  <ReadOnlyField
                    label={formatMessage(messages.fieldErrorNotes)}
                    value={result.get('errorNotes')}
                  />
                </Unit>
              : null}
            <Unit sm="1-1" md="1-2" lg="1-4">
              <ReadOnlyField
                label="Workflow Status"
                value={result.get('resultWorkflowStatus')}
              />
            </Unit>
            <Unit sm="1-2" md="1-2" lg="1-4">
              <ReadOnlyField
                label={formatMessage(messages.fieldNotes)}
                value={result.get('notes')}
              />
            </Unit>
            <Unit sm="1-2" md="1-2" lg="1-4">
              <Checkbox
                name="Status"
                label={formatMessage(messages.qcCheck)}
                labelStyle={{ marginLeft: -12 }}
                style={{ marginTop: 23 }}
                checked={result.get('qcCheck') === 1}
                onCheck={this.onChangeQcCheck}
                disabled={
                  result.get('resultWorkflowStatusExternalId') !== 'Deliverable'
                }
                title={
                  result.get('resultWorkflowStatusExternalId') !== 'Deliverable'
                    ? formatMessage(messages.qcCheckDisabledHelp)
                    : ''
                }
              />
            </Unit>
          </CardText>
        </Card>
        {/* Patient Info */}
        <Card initiallyExpanded>
          <CardHeader
            title="Patient Information"
            actAsExpander
            showExpandableButton
          />
          <CardText actAsExpander expandable style={{ paddingTop: 0 }}>
            {this.getPatientFields()}
          </CardText>
        </Card>
        {/* Technical Info */}
        <Card initiallyExpanded>
          <CardHeader
            title="Technical Information"
            actAsExpander
            showExpandableButton
          />
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
              <ReadOnlyField
                label={formatMessage(messages.fieldDuration)}
                value={this.getDuration(
                  result.get('startedOn'),
                  result.get('endedOn')
                )}
              />
            </Unit>
            <Unit sm="1-1" md="1-2" lg="1-3">
              <ReadOnlyField
                label={formatMessage(messages.fieldCreatedOn)}
                value={result.get('createdOn')}
                format={v => `${formatDate(v)} ${formatTime(v)}`}
              />
            </Unit>
            <Unit sm="1-1" md="1-2" lg="1-3">
              <ReadOnlyField
                label={formatMessage(messages.fieldUpdatedOn)}
                value={result.get('updatedOn')}
                format={v => `${formatDate(v)} ${formatTime(v)}`}
              />
            </Unit>
            <Unit sm="1-1" md="1-2" lg="1-3">
              <ReadOnlyField
                label={formatMessage(messages.externalID)}
                value={result.get('externalId')}
              />
            </Unit>
            <Unit sm="1-1" md="1-2" lg="1-3">
              <ReadOnlyField
                label={formatMessage(messages.fieldReagentLotID)}
                value={result.get('consumableLot')}
              />
            </Unit>
            <Unit sm="1-1" md="1-2" lg="1-3">
              <ReadOnlyField
                label={formatMessage(messages.fieldConsumableSerial)}
                value={result.get('consumableSerial')}
              />
            </Unit>
            <Unit sm="1-1" md="1-2" lg="1-3">
              <ReadOnlyField
                label={formatMessage(messages.fieldConsumableExpirationDate)}
                value={result.get('consumableExpirationDate')}
                format={formatDate}
              />
            </Unit>
            <Unit sm="1-1" md="1-2" lg="1-3">
              <ReadOnlyField
                label={formatMessage(messages.fieldInstrumentSerial)}
                value={result.get('instrumentSerial')}
              />
            </Unit>
            <Unit sm="1-1" md="1-2" lg="1-3">
              <ReadOnlyField
                label={formatMessage(messages.fieldModuleSerial)}
                value={result.get('moduleSerial')}
              />
            </Unit>
            <Unit sm="1-1" md="1-2" lg="1-3">
              <ReadOnlyField
                label={formatMessage(messages.fieldModuleName)}
                value={result.get('moduleName')}
              />
            </Unit>
            <Unit sm="1-1" md="1-2" lg="1-3">
              <ReadOnlyField
                label={formatMessage(messages.fieldSenderOperator)}
                value={result.get('senderOperator')}
              />
            </Unit>
            <Unit sm="1-1" md="1-2" lg="1-3">
              <ReadOnlyField
                label={formatMessage(messages.fieldSenderVersion)}
                value={result.get('senderVersion')}
              />
            </Unit>
            <Unit sm="1-1" md="1-2" lg="1-3">
              <ReadOnlyField
                label={formatMessage(messages.fieldAssayName)}
                value={result.get('assayName')}
              />
            </Unit>
          </CardText>
        </Card>
        {/* Render lower-level sections in assay schema in cards */}
        {this.renderLowerLevelSchemaSections()}
      </div>
    )
  }

  renderPaper() {
    return (
      <div>
        {this.hasResultWithAssay()
          ? this.renderContent()
          : this.renderProgress()}
      </div>
    )
  }

  render() {
    const { intl, workflowLog } = this.props
    const { formatMessage } = intl

    return (
      <div className={cssClasses('ContentDetails')}>
        <Helmet
          title={formatMessage(messages.title)}
          titleTemplate="%s - Aspect"
          defaultTitle="Aspect"
        />
        <NavTitle title={formatMessage(messages.title)} />

        {this.renderPaper()}

        <ResultWorkflowStatusLog
          intl={intl}
          table={workflowLog.table}
          items={workflowLog.items}
          onFetch={this.handleFetchWorkflowStatusLogs}
        />
      </div>
    )
  }
}

export default enhance(ResultDetail)
