// Imports from packages
import _ from 'lodash'
import classnames from 'classnames/bind'
import React, { PureComponent, PropTypes } from 'react'
import {
  injectIntl,
  defineMessages
} from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import { Link } from 'react-router'

// Material-UI
import LinearProgress from 'material-ui/LinearProgress'
import { Card, CardHeader, CardText } from 'material-ui/Card'
import Checkbox from 'material-ui/Checkbox'

// Our own imports
import { Unit } from '../../components/pureGrids'
import JSONSchemaCard from '../../components/shared/JSONSchemaCard'
import {
  fetchSingleResult,
  updateSingleResult,
  updateResultWorkflowStatus
} from '../ResultRedux'
import { ReadOnlyField } from '../../components/shared/ReadOnlyFields'
import styles from './ResultDetail.css'

const cssClasses = classnames.bind(styles)

const messages = defineMessages({
  title: {
    id: 'pages.ResultDetail.title',
    defaultMessage: 'Result Detail'
  },
  fieldDeviceName: {
    id: 'pages.ResultDetail.fieldDeviceName',
    defaultMessage: 'Device'
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
  }
})

// Iterate JSON schema level 2 and reduce it with resultData into a fields list
export const makeLevel2TupleMapper = (resultData, outerKey) => ([key, value]) => ({
  label: value.get('title'),
  value: resultData.getIn([outerKey, key]) || ''
})

export class ResultDetail extends PureComponent {

  static propTypes = {
    setPageTitle: PropTypes.func.isRequired,
    fetchSingleResult: PropTypes.func.isRequired,
    updateResultWorkflowStatus: PropTypes.func.isRequired,
    updateSingleResult: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    result: PropTypes.object,
  }

  componentWillMount() {
    const { setPageTitle, intl } = this.props
    const { formatMessage } = intl
    setPageTitle(formatMessage(messages.title))
  }

  componentDidMount() {
    this.handleFetchResult()
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.params.resultId !== nextProps.params.resultId) {
      this.handleFetchResult()
    }
  }

  getAssayFields() {
    if (!this.hasResultWithAssay()) {
      return false
    }

    const { result } = this.props
    const resultDataSchema = result.getIn(['assay', 'resultDataSchema'])
    const resultData = result.get('resultData')

    return this.getSchemaFields(resultDataSchema, resultData)
  }

  getPatientFields() {
    if (!this.hasResultWithAssay()) {
      return false
    }

    const { result } = this.props
    const patientDataSchema = result.getIn(['assay', 'patientDataSchema'])
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
    this.props.fetchSingleResult(this.props.params.resultId)
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

  renderContent() {
    const { result, intl: { formatMessage, formatDate, formatTime } } = this.props
    const assay = result.get('assay')

    return (
      <div>
        { /* IDs and device/site */ }
        <Card>
          <CardText>
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
              label={formatMessage(messages.fieldDeviceName)}
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
                <ReadOnlyField label={assay.get('resultCategory1Label')} value={result.get('resultCategory1Name')} />
              </Unit> }
            { result.get('resultCategory2Name') &&
              <Unit sm="1-2" md="1-3" lg="1-4">
                <ReadOnlyField label={assay.get('resultCategory2Label')} value={result.get('resultCategory2Name')} />
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
    const { intl } = this.props
    const { formatMessage } = intl

    return (
      <div className={cssClasses('ContentDetails')}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        {this.renderPaper()}
      </div>
    )
  }
}

function mapStateToProps(state, props) {
  const result = state.result.items.byId.get(props.params.resultId)

  return {
    result
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    fetchSingleResult,
    updateSingleResult,
    updateResultWorkflowStatus
  }, dispatch)
}

export const ResultDetailContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(ResultDetail)
