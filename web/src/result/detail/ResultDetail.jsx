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
import MdChevronLeft from 'react-icons/lib/md/chevron-left'
import MdChevronRight from 'react-icons/lib/md/chevron-right'
import MdClose from 'react-icons/lib/md/clear'
import { Button } from 'react-toolbox/lib/button'

// Our own imports
import config from '../../config'
import DelayShowingProgressBar from '../../components/shared/DelayShowingProgressBar'
import JSONSchemaCard from '../../components/shared/JSONSchemaCard'
import NavTitle from '../../globals/components/NavTitle'
import {
  fetchSingleResult,
  fetchResultLog,
  updateResultQcCheck,
  saveResultFormDataValue,
  setResultFormDataValue,
  saveResultFormData,
  Result,
} from '../ResultRedux'
import ConnectedTagInput from '../../tag/ConnectedTagInput'
import { fetchTags, updateTags } from '../../tag/TagRedux'
import isEditable from '../../shared/selectors/result'
import { Unit } from '../../components/pureGrids'
import { ReadOnlyField } from '../../components/shared/ReadOnlyFields'
import DetailPanel from '../../components/shared/detailPanel/DetailPanel'
import {
  ExpansionPanel,
  ExpansionPanelHeader,
  ExpansionPanelDetail,
} from '../../components/shared/expansionPanel'
import CustomField from './CustomField'

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
  images: {
    id: 'pages.ResultDetail.images',
    defaultMessage: 'Images',
  },
  noImagesHelp: {
    id: 'pages.ResultDetail.noImagesHelp',
    defaultMessage: 'No images attached for this result',
  },
  totalFilesLabel: {
    id: 'pages.ResultDetail.totalFilesLabel',
    defaultMessage: 'Total files: {totalFiles}',
  },
  additionalResultDetails: {
    id: 'pages.ResultDetail.additionalResultDetails',
    defaultMessage: 'Additional Result Details',
  },
  confirmedInterpretationOfResult: {
    id: 'pages.ResultDetail.formFields.confirmedInterpretationOfResult',
    defaultMessage: 'Confirmed Interpretation of Result',
  },
  submit: {
    id: 'pages.ResultDetail.formFields.submit',
    defaultMessage: 'Submit',
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
      const formDataSaving = state.result.get('formDataSaving')
      const formDataDirty = state.result.get('formDataDirty')
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
        formDataSaving,
        formDataDirty,
      }
    },
    dispatch =>
      bindActionCreators(
        {
          fetchSingleResult,
          fetchResultLog,
          updateResultQcCheck,
          saveResultFormDataValue,
          setResultFormDataValue,
          saveResultFormData,
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
    formDataSaving: PropTypes.bool.isRequired,
    formDataDirty: PropTypes.bool.isRequired,
    saveResultFormData: PropTypes.func.isRequired,
  })
)

const THUMBNAIL_MODE_NORMAL = 'THUMBNAIL_MODE_NORMAL'
const THUMBNAIL_MODE_PREVIEW = 'THUMBNAIL_MODE_PREVIEW'

export class ResultDetail extends PureComponent {
  state = {
    resultId: undefined,
    thumbnailMode: THUMBNAIL_MODE_NORMAL,
    imageIndex: 0,
  }

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

  submitFormData = () => {
    const { result } = this.props
    const formData = result.get('formData')
    this.props.saveResultFormData(
      result.get('id'),
      _.isNil(formData) ? null : formData.toJS()
    )
  }

  clickThumbnail(imageIndex) {
    this.setState({
      thumbnailMode: THUMBNAIL_MODE_PREVIEW,
      imageIndex,
    })
  }

  handleToggle() {
    this.setState({ isShown: !this.state.isShown })
  }

  handleFetchResult = () => {
    const { match: { params: { resultId } } } = this.props
    this.props.fetchSingleResult(resultId)

    this.props.fetchResultLog(resultId)

    this.props.fetchTags(resultId, 'result')
  }

  hasResultWithAssay() {
    const { result } = this.props
    return result && result.has('assay')
  }

  drawIconPrev = isFirst => (
    <div className={cssClasses('ButPreview')}>
      <MdChevronLeft
        className={cssClasses({
          disabled: isFirst,
        })}
        onClick={() => this.switchImage(-1, { isFirst })}
      />
    </div>
  )
  drawIconNext = isLast => (
    <div className={cssClasses('ButPreview')}>
      <MdChevronRight
        className={cssClasses({
          disabled: isLast,
        })}
        onClick={() => this.switchImage(1, { isLast })}
      />
    </div>
  )
  drawIconClose = () => (
    <div className={cssClasses('ButPreview', 'Close')}>
      <MdClose
        className={cssClasses('ClosePreview')}
        onClick={() => {
          this.setState({ thumbnailMode: THUMBNAIL_MODE_NORMAL })
        }}
      />
    </div>
  )

  switchImage = (dir, { isFirst, isLast }) => {
    let { imageIndex } = this.state
    imageIndex += (!isFirst && dir === -1) || (!isLast && dir === 1) ? dir : 0
    this.setState({ imageIndex })
  }

  renderProgress() {
    return <DelayShowingProgressBar type="linear" mode="indeterminate" />
  }

  renderRawResult() {
    const { intl: { formatMessage }, deviceLogs } = this.props
    const logs = deviceLogs.toJS()

    return (
      <ExpansionPanel disabled={_.isEmpty(logs)}>
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
              const rawMessage = log.rawMessage
                ? JSON.parse(log.rawMessage)
                : ''
              return (
                <ReadOnlyField
                  label={formatMessage(messages.createdOnLabel, {
                    date: createdOn.toUTCString(),
                  })}
                  value={
                    <pre className={cssClasses('RawResultContainer')}>
                      {JSON.stringify(rawMessage, null, 1)}
                    </pre>
                  }
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

  renderFormData() {
    const {
      intl: { formatMessage },
      result,
      saveResultFormDataValue,
      setResultFormDataValue,
      formDataSaving,
      formDataDirty,
    } = this.props
    if (!result || !result.getIn(['formSchema', 'fields'])) {
      return false
    }
    const [...fieldKeys] = result
      .getIn(['formSchema', 'fields'])
      .sortBy(value => value.get('order'))
      .keys()
    if (_.isEmpty(fieldKeys)) {
      return false
    }
    const showSubmitButton =
      result.getIn(['formSchema', 'sendChangesOn']) === 'submit'
    const updateFormData = showSubmitButton
      ? setResultFormDataValue
      : saveResultFormDataValue
    const sectionLabel =
      fieldKeys.length === 1
        ? formatMessage(
            messages[
              result.getIn(['formSchema', 'fields', fieldKeys[0], 'i18nLabel'])
            ]
          )
        : formatMessage(messages.additionalResultDetails)
    const formData = result.get('formData') || Immutable.Map({})
    const isMultiField = fieldKeys.length > 1
    return (
      <ExpansionPanel className={cssClasses('FieldsContainer')} disabled>
        <ExpansionPanelHeader label={sectionLabel}>
          <div className={cssClasses('FormDataContainer')}>
            {fieldKeys.map(formFieldKey => {
              const { intl: { formatMessage } } = this.props
              const fieldSchema = result.getIn([
                'formSchema',
                'fields',
                formFieldKey,
              ])
              return (
                <Unit
                  key={formFieldKey}
                  xs="1-2"
                  xl="1-3"
                  className={cssClasses('Flexed')}
                >
                  <CustomField
                    resultId={result.get('id')}
                    formFieldKey={formFieldKey}
                    fieldSchema={fieldSchema}
                    formData={formData}
                    formatMessage={formatMessage}
                    isMultiField={isMultiField}
                    updateFormData={updateFormData}
                  />
                </Unit>
              )
            })}
            {showSubmitButton && (
              <Button
                disabled={!formDataDirty}
                raised
                label={formatMessage(messages.submit)}
                onClick={this.submitFormData}
                className={cssClasses('FormDataSubmitButton')}
              />
            )}
            {formDataSaving && this.renderProgress()}
          </div>
          <div className={cssClasses('FormProgressContainer')}>
            {this.renderProgress()}
          </div>
        </ExpansionPanelHeader>
      </ExpansionPanel>
    )
  }

  renderImagesSection() {
    const { intl: { formatMessage }, result, token } = this.props

    const files = result.get('files') || Immutable.List()
    const totalFiles = files.count()
    const resultId = result.get('id')
    // if new result item - reset local state
    if (resultId !== this.state.resultId) {
      this.setState({
        resultId,
        imageIndex: 0,
        thumbnailMode: THUMBNAIL_MODE_NORMAL,
      })
    }
    const { imageIndex, thumbnailMode } = this.state
    const isFirst = imageIndex === 0
    const isLast = imageIndex === totalFiles - 1
    const isPreview = thumbnailMode === THUMBNAIL_MODE_PREVIEW
    const path = file => `${config.aspectApi}${file.get('url')}?token=${token}`
    const selectedFile = totalFiles > 0 && files.get(imageIndex)

    return (
      <ExpansionPanel disabled={totalFiles === 0}>
        <ExpansionPanelHeader
          // Left side - labels for expanded and collapsed modes
          label={formatMessage(messages.images)}
          expandedLabel={`${formatMessage(messages.images)} (${totalFiles})`}
          // Right side - text only for collapsed mode when list is not empty
          collapsedChildren={
            totalFiles > 0 && (
              <div>
                {formatMessage(messages.totalFilesLabel, { totalFiles })}
              </div>
            )
          }
        >
          {/* text to show when list is empty */}
          {totalFiles === 0 && (
            <div className={cssClasses('HelpBlock')}>
              {formatMessage(messages.noImagesHelp)}
            </div>
          )}
        </ExpansionPanelHeader>
        {totalFiles > 0 && (
          <ExpansionPanelDetail>
            <div
              className={cssClasses('FilesContainer', { Preview: isPreview })}
            >
              <div className={cssClasses('AllThumbnails')}>
                {files.map((file, index) => (
                  <div className={cssClasses('ThumbnailContainer')}>
                    <div
                      className={cssClasses('ThumbnailImageContainer', {
                        selected: isPreview && imageIndex === index,
                      })}
                      role="button"
                      tabIndex={index}
                      onKeyDown={() => {}}
                      onClick={() => this.clickThumbnail(index, isPreview)}
                    >
                      <img
                        title="Click to preview"
                        alt={file.get('name')}
                        className={cssClasses('ThumbnailImage')}
                        src={path(file)}
                      />
                    </div>
                    <div className={cssClasses('ThumbnailFilename')}>
                      {file.get('name')}
                    </div>
                  </div>
                ))}
              </div>
              <div className={cssClasses('PreviewContainer')}>
                <div>{this.drawIconPrev(isFirst)}</div>
                <div className={cssClasses('ImageContainer')}>
                  <img
                    title="Click to preview"
                    alt={selectedFile.get('name')}
                    className={cssClasses('Image')}
                    src={path(selectedFile)}
                  />
                </div>
                <div>
                  {this.drawIconClose()}
                  {this.drawIconNext(isLast)}
                </div>
              </div>
            </div>
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
          {/* Render images attachment */}
          {this.renderImagesSection()}

          {/* Render lower-level sections in assay schema in cards */}
          {this.renderFormData()}

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
    const { intl: { formatMessage } } = this.props

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
