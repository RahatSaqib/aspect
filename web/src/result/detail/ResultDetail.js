// Imports from packages
import _ from 'lodash'
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
import { isEditable } from '../../shared/selectors/result'
import {
  fetchSingleResult,
  updateSingleResult
} from '../ResultRedux'
import ReadOnlyFields from '../../components/shared/ReadOnlyFields'
import { FormContainer } from './ResultDetailForm'
import styles from './ResultDetail.css'

const messages = defineMessages({
  title: {
    id: 'pages.ResultDetail.title',
    defaultMessage: 'Result Detail'
  },
  fieldLastTestOn: {
    id: 'pages.ResultDetail.fieldLastTestOn',
    defaultMessage: 'Last Test On'
  },
  fieldPatientId: {
    id: 'pages.ResultDetail.fieldPatientId',
    defaultMessage: 'Patient'
  },
  fieldResultText: {
    id: 'pages.ResultDetail.fieldResultText',
    defaultMessage: 'Result Text'
  }
})

export class ResultDetail extends PureComponent {

  static propTypes = {
    setPageTitle: PropTypes.func.isRequired,
    fetchSingleResult: PropTypes.func.isRequired
  }

  handleFetchDevice = () => {
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
    this.handleFetchDevice()
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.params.resultId !== nextProps.params.resultId) {
      this.handleFetchDevice()
    }
  }

  renderProgress() {
    const { result } = this.props

    return !result && <LinearProgress />
  }

  renderFormContainer() {
    const { result, intl: { formatMessage } } = this.props
    const labels = {
      lastTestOn: formatMessage(messages.fieldLastTestOn),
      patientId: formatMessage(messages.fieldPatientId),
      resultText: formatMessage(messages.fieldResultText)
    }

    const initialValues = {
      // Map API fields to form fields
      lastTestOn: result.get('lastTestOn'),
      patientId: result.get('patientId'),
      resultText: result.get('resultText')
    }
    return (
      <FormContainer
        labels={labels}
        enableReinitialize
        initialValues={initialValues}
        onSubmit={this.handleSubmit}
      />
    )
  }

  renderReadOnlyFields() {
    const { result, intl: { formatMessage } } = this.props
    const fields = [
      {
        label: formatMessage(messages.fieldLastTestOn),
        value: result.get('lastTestOn')
      },
      {
        label: formatMessage(messages.fieldPatientId),
        value: result.get('patientId')
      },
      {
        label: formatMessage(messages.fieldResultText),
        value: result.get('resultText')
      }
    ]
    return (
      <ReadOnlyFields fields={fields} />
    )
  }

  renderContent() {
    const { result, editable } = this.props
    if (!result) {
      return
    }
    return (
      <div className={styles.FieldsContainer}>
        {editable ?
        this.renderFormContainer() :
        this.renderReadOnlyFields()}
      </div>
    )
  }

  render() {
    const { intl } = this.props
    const { formatMessage } = intl

    return (
      <div className={styles.Content}>
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
    editable: isEditable(state.user, result),
    result
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    fetchSingleResult,
    updateSingleResult
  }, dispatch)
}

export const ResultDetailContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(ResultDetail)
