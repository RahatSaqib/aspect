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

// Our own imports
import {
  fetchSingleResult
} from '../ResultRedux'
import ReadOnlyFields from '../../components/shared/ReadOnlyFields'
import styles from './ResultDetail.css'

const cx = classnames.bind(styles)

const messages = defineMessages({
  title: {
    id: 'pages.ResultDetail.title',
    defaultMessage: 'Result Detail'
  },
  fieldSiteName: {
    id: 'pages.ResultDetail.fieldSiteName',
    defaultMessage: 'Deployment Full Name'
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
  fieldEndedOn: {
    id: 'pages.ResultDetail.fieldEndedOn',
    defaultMessage: 'Ended Date'
  },
  fieldPatientId: {
    id: 'pages.ResultDetail.fieldPatientId',
    defaultMessage: 'Patient ID'
  },
  fieldResultDataResultText: {
    id: 'pages.ResultDetail.fieldResultDataResultText',
    defaultMessage: 'Result Text'
  },
  fieldAssayName: {
    id: 'pages.ResultDetail.fieldAssayName',
    defaultMessage: 'Assay'
  },
  fieldInstrumentSerial: {
    id: 'pages.ResultDetail.fieldInstrumentSerial',
    defaultMessage: 'Instrument Serial'
  },
  fieldModuleSerial: {
    id: 'pages.ResultDetail.fieldModuleSerial',
    defaultMessage: 'Module Serial'
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
    defaultMessage: 'Started Date'
  },
  fieldUpdatedOn: {
    id: 'pages.ResultDetail.fieldUpdatedOn',
    defaultMessage: 'Updated Date'
  }
})

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

  renderProgress() {
    const { result } = this.props

    return !result && <LinearProgress />
  }

  renderLeftColumnFields() {
    const { result, intl: { formatMessage } } = this.props
    const assay = result.get('assay')

    const fields = [
      {
        label: formatMessage(messages.fieldSiteName),
        value: result.get('siteName')
      },
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
        label: formatMessage(messages.fieldEndedOn),
        value: result.get('endedOn')
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
      {
        label: formatMessage(messages.fieldResultDataResultText),
        value: result.getIn(['resultData', 'resultText'])
      }
    ]
    return (
      <ReadOnlyFields
        className={cx('FieldsContainer__LeftColumn__Content')}
        fields={fields}
      />
    )
  }

  renderRightColumnFields() {
    const { result, intl: { formatMessage } } = this.props
    const assay = result.get('assay')

    const fields = [
      {
        label: formatMessage(messages.fieldAssayName),
        value: assay.get('name')
      },
      {
        label: formatMessage(messages.fieldInstrumentSerial),
        value: result.get('instrumentSerial')
      },
      {
        label: formatMessage(messages.fieldModuleSerial),
        value: result.get('moduleSerial')
      },
      {
        label: formatMessage(messages.fieldConsumableSerial),
        value: result.get('consumableSerial')
      },
      {
        label: formatMessage(messages.fieldConsumableExpirationDate),
        value: result.get('consumableExpirationDate')
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
        value: result.get('startedOn')
      },
      {
        label: formatMessage(messages.fieldUpdatedOn),
        value: result.get('updatedOn')
      }
    ]
    return (
      <ReadOnlyFields
        className={cx('FieldsContainer__RightColumn__Content')}
        fields={fields}
      />
    )
  }

  renderContent() {
    const { result } = this.props
    if (!result) {
      return
    }
    return (
      <div className={cx('FieldsContainer')}>
        <div className="pure-g">
          <div className="pure-u-lg-1-2 pure-u-md-1-2 pure-u-sm-1-2">
            {this.renderLeftColumnFields()}
          </div>
          <div className="pure-u-lg-1-2 pure-u-md-1-2 pure-u-sm-1-2">
            {this.renderRightColumnFields()}
          </div>
        </div>
      </div>
    )
  }

  render() {
    const { intl } = this.props
    const { formatMessage } = intl

    return (
      <div className={cx('Content')}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <Paper>
          {this.renderProgress()}
          {this.renderContent()}
        </Paper>
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
