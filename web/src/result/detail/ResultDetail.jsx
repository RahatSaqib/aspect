import Immutable from 'immutable'
import _ from 'lodash'
import classnames from 'classnames/bind'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { compose, setPropTypes } from 'recompose'
import { defineMessages } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

// Material-UI
import Checkbox from 'material-ui/Checkbox'

// Our own imports
import config from '../../config'
import DelayShowingProgressBar from '../../components/shared/DelayShowingProgressBar'
import JSONSchemaCard from '../../components/shared/JSONSchemaCard'
import NavTitle from '../../globals/components/NavTitle'
import {
  fetchSingleResult,
  fetchResultLog,
  updateResultQcCheck,
  Result,
} from '../ResultRedux'
import ConnectedTagInput from '../../tag/ConnectedTagInput'
import { fetchTags, updateTags } from '../../tag/TagRedux'
import isEditable from '../../shared/selectors/result'

import { ReadOnlyField } from '../../components/shared/ReadOnlyFields'
import DetailPanel from '../../components/shared/detailPanel/DetailPanel'
import {
  ExpansionPanel,
  ExpansionPanelHeader,
  ExpansionPanelDetail,
} from '../../components/shared/expansionPanel'

import styles from './ResultDetail.css'

const cssClasses = classnames.bind(styles)

const EMPTY_MAP = Immutable.Map()

const messages = defineMessages({
  title: {
    id: 'pages.ResultDetail.title',
    defaultMessage: 'Result Detail',
  },
  qcCheck: {
    id: 'pages.ResultDetail.qcCheck',
    defaultMessage: 'QC Check',
  },
  qcCheckDisabledHelp: {
    id: 'pages.ResultDetail.qcCheckDisabledHelp',
    defaultMessage:
      '"QC Check" is only enabled if the result is in the status "Ready for Delivery" and hasn\'t been sent to the reporter yet',
  },
  fieldRawData: {
    id: 'pages.ResultDetail.rawData',
    defaultMessage: 'Raw Data',
  },
  createdOnLabel: {
    id: 'pages.ResultDetail.createdOnLabel',
    defaultMessage: 'Created on: {date}',
  },
  tags: {
    id: 'pages.ResultDetail.tags',
    defaultMessage: 'Tags',
  },
  fieldFollowup: {
    id: 'pages.ResultDetail.fieldFollowup',
    defaultMessage: 'Followup',
  },
  confirmed: {
    id: 'pages.ResultDetail.confirmed',
    defaultMessage: 'Confirmed',
  },
  noLogsHelp: {
    id: 'pages.ResultDetail.noLogsHelp',
    defaultMessage: 'No log entries found for this result',
  },
  attachments: {
    id: 'pages.ResultDetail.attachments',
    defaultMessage: 'Attachments',
  },
  noFilesHelp: {
    id: 'pages.ResultDetail.noFilesHelp',
    defaultMessage: 'No files attached for this result',
  },
  totalFilesLabel: {
    id: 'pages.ResultDetail.totalFilesLabel',
    defaultMessage: 'Total files: {totalFiles}',
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
  connect(
    (state, props) => {
      const result = state.result.items.byId.get(props.match.params.resultId)
      const screenSchema = state.result.get('screenSchema')
      const resultTags = state.tag.tags.getIn(
        ['result', props.match.params.resultId],
        Immutable.List()
      )
      return {
        result,
        screenSchema,
        deviceLogs: state.result.deviceLogs,
        resultTags,
        editable: isEditable(state.user, result),
        token: state.user.access,
      }
    },
    dispatch =>
      bindActionCreators(
        {
          fetchSingleResult,
          fetchResultLog,
          updateResultQcCheck,
          fetchTags,
          updateTags,
        },
        dispatch
      )
  ),
  setPropTypes({
    result: PropTypes.objectOf(Result),
    resultTags: PropTypes.instanceOf(Immutable.List).isRequired,
    editable: PropTypes.bool.isRequired,
    fetchSingleResult: PropTypes.func.isRequired,
    fetchResultLog: PropTypes.func.isRequired,
    updateResultQcCheck: PropTypes.func.isRequired,
    fetchTags: PropTypes.func.isRequired,
    updateTags: PropTypes.func.isRequired,
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

  onResultTagChange = (qryId, qryType, tags) => {
    this.props.updateTags(qryId, qryType, tags.join(','))
  }

  handleToggle() {
    this.setState({ isShown: !this.state.isShown })
  }

  handleFetchResult = () => {
    this.props.fetchSingleResult(this.props.match.params.resultId)

    this.props.fetchResultLog(this.props.match.params.resultId)

    this.props.fetchTags(this.props.match.params.resultId, 'result')
  }

  hasResultWithAssay() {
    const { result } = this.props
    return result && result.has('assay')
  }

  renderProgress() {
    return <DelayShowingProgressBar type="linear" mode="indeterminate" />
  }

  renderRawResult() {
    const { intl: { formatMessage }, deviceLogs } = this.props
    const logs = deviceLogs.toJS()

    return (
      <ExpansionPanel>
        <ExpansionPanelHeader label={formatMessage(messages.fieldRawData)}>
          {_.isEmpty(logs) && (
            <div className={cssClasses('HelpBlock')}>
              {formatMessage(messages.noLogsHelp)}
            </div>
          )}
        </ExpansionPanelHeader>
        {!_.isEmpty(logs) && (
          <ExpansionPanelDetail>
            {logs.map(log => {
              const createdOn = new Date(log.createdOn)
              const rawMessage = JSON.parse(log.rawMessage)
              return (
                <ReadOnlyField
                  label={formatMessage(messages.createdOnLabel, {
                    date: createdOn.toUTCString(),
                  })}
                  value={<pre>{JSON.stringify(rawMessage, null, 1)}</pre>}
                />
              )
            })}
          </ExpansionPanelDetail>
        )}
      </ExpansionPanel>
    )
  }

  renderLowerLevelSchemaSections() {
    if (!this.hasResultWithAssay()) {
      return false
    }

    const { result } = this.props
    const dataSchema = (
      result.getIn(['assay', 'resultDataSchema']) || EMPTY_MAP
    )
      .delete('resultText')
      .filter(field => field.get('type') === 'object')

    return (
      <JSONSchemaCard
        renderField={field => <ReadOnlyField {...field} />}
        dataSchema={dataSchema}
        data={result.get('resultData')}
      />
    )
  }

  renderAttachmentSection() {
    const { intl: { formatMessage }, result, token } = this.props
    const files = result.get('files').toJS()
    const resultId = result.get('id')

    return (
      <ExpansionPanel>
        <ExpansionPanelHeader label={formatMessage(messages.attachments)}>
          {_.isEmpty(files) && (
            <div className={cssClasses('HelpBlock')}>
              {formatMessage(messages.noFilesHelp)}
            </div>
          )}
          {!_.isEmpty(files) && (
            <div>
              {formatMessage(messages.totalFilesLabel, {
                totalFiles: files.length,
              })}
            </div>
          )}
        </ExpansionPanelHeader>
        {!_.isEmpty(files) && (
          <ExpansionPanelDetail>
            {files.map(file => {
              const { id, name } = file
              const path = `/result/file/${resultId}/${id}/${name}?token=${token}`
              return (
                <ReadOnlyField
                  label={file.name}
                  value={
                    <div>
                      <img alt="" src={`${config.aspectApi}${path}`} />
                    </div>
                  }
                />
              )
            })}
          </ExpansionPanelDetail>
        )}
      </ExpansionPanel>
    )
  }

  renderContent() {
    const { result, screenSchema, resultTags, editable, intl } = this.props

    return (
      <div>
        <DetailPanel
          intl={intl}
          data={result}
          schema={screenSchema}
          className={cssClasses('FieldsContainer')}
        >
          <ExpansionPanel className={cssClasses('FieldsContainer')}>
            <ExpansionPanelHeader
              label={intl.formatMessage(messages.fieldFollowup)}
            >
              <Checkbox
                name="Status"
                label={intl.formatMessage(messages.confirmed)}
                labelStyle={{ marginLeft: -12 }}
                checked={result.get('qcCheck') === 1}
                onCheck={this.onChangeQcCheck}
                disabled={
                  result.get('resultWorkflowStatusExternalId') !== 'Deliverable'
                }
                title={
                  result.get('resultWorkflowStatusExternalId') !== 'Deliverable'
                    ? intl.formatMessage(messages.qcCheckDisabledHelp)
                    : ''
                }
              />
            </ExpansionPanelHeader>
          </ExpansionPanel>
          <ExpansionPanel disabled>
            <ExpansionPanelHeader label={intl.formatMessage(messages.tags)}>
              <ConnectedTagInput
                qryId={result.get('id')}
                disabled={!editable}
                qryType="result"
                allowCreate
                onTagChange={this.onResultTagChange}
                value={resultTags.toJS()}
              />
            </ExpansionPanelHeader>
          </ExpansionPanel>

          {/* Render lower-level sections in assay schema in cards */}
          {this.renderLowerLevelSchemaSections()}
          {/* Render Raw Result sections */}
          {this.renderRawResult()}

          {/* Render files attachment */}
          {this.renderAttachmentSection()}
        </DetailPanel>
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
    const { intl } = this.props
    const { formatMessage } = intl

    return (
      <div className={cssClasses('Container')}>
        <Helmet title={formatMessage(messages.title)} />
        <NavTitle title={formatMessage(messages.title)} />

        {this.renderPaper()}
      </div>
    )
  }
}

export default enhance(ResultDetail)
