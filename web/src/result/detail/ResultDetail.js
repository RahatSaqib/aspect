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

// Material-UI
import Paper from 'material-ui/Paper'
import LinearProgress from 'material-ui/LinearProgress'
import { Card, CardHeader, CardText } from 'material-ui/Card'

// Our own imports
import {
  fetchSingleResult
} from '../ResultRedux'
import {
  ReadOnlyField,
  ReadOnlyFields
} from '../../components/shared/ReadOnlyFields'
import styles from './ResultDetail.css'

const cx = classnames.bind(styles)

const messages = defineMessages({
  title: {
    id: 'pages.ResultDetail.title',
    defaultMessage: 'Result Detail'
  },
  fieldCountryName: {
    id: 'pages.ResultDetail.fieldCountryName',
    defaultMessage: 'Country'
  },
  fieldStateName: {
    id: 'pages.ResultDetail.fieldStateName',
    defaultMessage: 'State'
  },
  fieldLgaName: {
    id: 'pages.ResultDetail.fieldLgaName',
    defaultMessage: 'LGA'
  },
  fieldSiteName: {
    id: 'pages.ResultDetail.fieldSiteName',
    defaultMessage: 'Site Name'
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
  fieldResearchId: {
    id: 'pages.ResultDetail.fieldResearchId',
    defaultMessage: 'Research ID'
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
    defaultMessage: 'Added'
  },
  fieldUpdatedOn: {
    id: 'pages.ResultDetail.fieldUpdatedOn',
    defaultMessage: 'Updated'
  }
})

// Iterate JSON schema level 2 and reduce it with resultData into a fields list
export const makeLevel2TupleMapper = (resultData, outerKey) => ([key, value]) => ({
  label: value.get('title'),
  value: resultData.getIn([outerKey, key]) || ''
})

const DateTimeFormat = {
  // https://github.com/yahoo/react-intl/wiki/Components#date-formatting-components
  year  : '2-digit',
  month : '2-digit',
  day   : '2-digit',
  hour  : '2-digit',
  minute: '2-digit',
  second: '2-digit'
}

export class ResultDetail extends PureComponent {

  static propTypes = {
    setPageTitle: PropTypes.func.isRequired,
    fetchSingleResult: PropTypes.func.isRequired
  }

  handleFetchResult = () => {
    this.props.fetchSingleResult(this.props.params.resultId)
  }

  handleSubmit = data => {
    const { result } = this.props

    this.props.updateSingleResult(result.get('id'), {
      // Map form fields to API fields
      lastTestOn: data.get('lastTestOn'),
      patientId: data.get('patientId'),
      resultText: data.get('resultText')
    })
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

  hasResultWithAssay() {
    const { result } = this.props
    return result && result.has('assay')
  }

  renderProgress() {
    return (
      <LinearProgress />
    )
  }

  renderLeftColumnFields() {
    const { result, intl } = this.props
    const { formatMessage, formatDate } = intl
    const assay = result.get('assay')

    const fields = _.compact([
      {
        label: formatMessage(messages.fieldCountryName),
        value: result.get('countryName')
      },
      {
        label: formatMessage(messages.fieldStateName),
        value: result.get('stateName')
      },
      {
        label: formatMessage(messages.fieldLgaName),
        value: result.get('lgaName')
      },
      {
        label: formatMessage(messages.fieldSiteName),
        value: result.get('siteName')
      },
      {
        label: formatMessage(messages.fieldEndedOn),
        value: formatDate(result.get('endedOn'), DateTimeFormat)
      },
      {
        label: formatMessage(messages.fieldPatientId),
        value: result.get('patientId')
      },
      {
        label: assay.get('resultCategory1Label'), // TODO i18n
        value: result.get('resultCategory1Name')
      },
      {
        label: assay.get('resultCategory2Label'), // TODO i18n
        value: result.get('resultCategory2Name') || '-'
      },
      (result.get('errorCode') && {
        label: formatMessage(messages.fieldErrorCode),
        value: result.get('errorCode')
      }),
      (result.get('errorNotes') && {
        label: formatMessage(messages.fieldErrorNotes),
        value: result.get('errorNotes')
      }),
      {
        label: formatMessage(messages.fieldSampleId),
        value: result.get('sampleId')
      },
      {
        label: formatMessage(messages.fieldResearchId),
        value: result.get('researchId')
      },
      {
        label: formatMessage(messages.fieldResultDataResultText),
        value: result.getIn(['resultData', 'resultText'])
      },
      {
        label: formatMessage(messages.fieldNotes),
        value: result.get('notes')
      }
    ])
    return (
      <ReadOnlyFields
        fields={fields}
      />
    )
  }

  renderRightColumnFields() {
    const { result, intl } = this.props
    const { formatMessage, formatDate } = intl
    const assay = result.get('assay')

    const fields = _.compact([
      {
        label: formatMessage(messages.fieldAssayName),
        value: assay.get('name')
      },
      {
        label: formatMessage(messages.fieldReagentLotID),
        value: result.get('consumableLot')
      },
      {
        label: formatMessage(messages.fieldInstrumentSerial),
        value: result.get('instrumentSerial')
      },
      {
        label: formatMessage(messages.fieldModuleSerial),
        value: result.get('moduleSerial')
      },
      (result.get('moduleName') && {
        label: formatMessage(messages.fieldModuleName),
        value: result.get('moduleName')
      }),
      {
        label: formatMessage(messages.fieldConsumableSerial),
        value: result.get('consumableSerial')
      },
      {
        label: formatMessage(messages.fieldConsumableExpirationDate),
        value: formatDate(result.get('consumableExpirationDate'), DateTimeFormat)
      },
      {
        label: formatMessage(messages.fieldSenderVersion),
        value: result.get('senderVersion')
      },
      {
        label: formatMessage(messages.fieldSenderOperator),
        value: result.get('senderOperator')
      },
      {
        label: formatMessage(messages.fieldStartedOn),
        value: formatDate(result.get('startedOn'), DateTimeFormat)
      },
      {
        label: formatMessage(messages.fieldCreatedOn),
        value: formatDate(result.get('createdOn'), DateTimeFormat)
      },
      {
        label: formatMessage(messages.fieldUpdatedOn),
        value: formatDate(result.get('updatedOn'), DateTimeFormat)
      }
    ])
    return (
      <ReadOnlyFields
        fields={fields}
      />
    )
  }

  renderSchemaFields() {
    if (!this.hasResultWithAssay()) {
      return false
    }
    const { result } = this.props
    const resultDataSchema = result.getIn(['assay', 'resultDataSchema'])
    const resultData = result.get('resultData')

    return resultDataSchema
      .filter((value, key) => key !== 'resultText')
      .entrySeq()
      .map(([key, value]) => {
        // Level 1: "Probes"
        if (value.get('type') === 'object') {
          // Level 2: "Probes.ProbeA"
          const fields = value
            .get('properties')
            .entrySeq()
            .map(makeLevel2TupleMapper(resultData, key))
            .sortBy(({label}) => label)
            .toJS()

          return (
            <Card className={cx('Card')} key={key}>
              <CardHeader
                title={value.get('title')/* TODO: i18n */}
                actAsExpander={true}
                showExpandableButton={true}
              />
              <CardText expandable={true}>
                <ReadOnlyFields
                  fields={fields}
                />
              </CardText>
            </Card>
          )
        } else {
          // TODO: render level one string/number. Or there's no such case?
          return (
            <ReadOnlyField
              key={key}
              label={value.get('title')}
              value={resultData.get(key)}
            />
          )
        }
      })
  }

  renderContent() {
    return (
      <div className={cx('FieldsContainer')}>
        <div className="pure-g">
          <div className="pure-u-lg-1-2 pure-u-md-1-2 pure-u-sm-1-2">
            <div className={cx('FieldsContainer__LeftColumn__Content')}>
              {this.renderLeftColumnFields()}
            </div>
          </div>
          <div className="pure-u-lg-1-2 pure-u-md-1-2 pure-u-sm-1-2">
            <div className={cx('FieldsContainer__RightColumn__Content')}>
              {this.renderRightColumnFields()}
              {this.renderSchemaFields()}
            </div>
          </div>
        </div>
      </div>
    )
  }

  renderPaper() {
    return (
      <Paper>
        {
          this.hasResultWithAssay() ?
          this.renderContent() :
          this.renderProgress()
        }
      </Paper>
    )
  }

  render() {
    const { intl } = this.props
    const { formatMessage } = intl

    return (
      <div className={cx('Content')}>
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
    fetchSingleResult
  }, dispatch)
}

export const ResultDetailContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(ResultDetail)
