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
import { Unit } from '../../components/pureGrids'
import isEditable from '../../shared/selectors/device'
import {
  fetchSingleTerminal,
  updateSingleTerminal
} from '../TerminalRedux'
import ReadOnlyFields from '../../components/shared/ReadOnlyFields'
import TerminalDetailForm from './TerminalDetailForm'
import DeviceDemoLink from '../../device/DeviceDemoLink'
import styles from './TerminalDetail.css'

const messages = defineMessages({
  title: {
    id: 'pages.TerminalDetail.title',
    defaultMessage: 'Terminal Detail'
  },
  fieldName: {
    id: 'pages.TerminalDetail.fieldName',
    defaultMessage: 'Name'
  },
  fieldShortname: {
    id: 'pages.TerminalDetail.fieldShortname',
    defaultMessage: 'Shortname'
  },
  fieldNotes: {
    id: 'pages.TerminalDetail.fieldNotes',
    defaultMessage: 'Notes'
  },
  fieldSiteId: {
    id: 'pages.TerminalDetail.fieldSiteId',
    defaultMessage: 'Site'
  },
  siteLoadMore: {
    id: 'pages.TerminalDetail.siteLoadMore',
    defaultMessage: 'Load more'
  },
  siteLoadingMore: {
    id: 'pages.TerminalDetail.siteLoadingMore',
    defaultMessage: 'Loading……'
  },
  fieldFirstConnected: {
    id: 'pages.TerminalDetail.fieldFirstConnected',
    defaultMessage: 'First Connected'
  },
  fieldFirstApprovedOn: {
    id: 'pages.TerminalDetail.fieldFirstApprovedOn',
    defaultMessage: 'First Approved On'
  },
  fieldFirstApprovedBy: {
    id: 'pages.TerminalDetail.fieldFirstApprovedBy',
    defaultMessage: 'First Approved By'
  },
  fieldSerial: {
    id: 'pages.TerminalDetail.fieldSerial',
    defaultMessage: 'Serial'
  },
  fieldLastSeen: {
    id: 'pages.TerminalDetail.fieldLastSeen',
    defaultMessage: 'Last Seen'
  },
  fieldTotalNumberOfTests: {
    id: 'pages.TerminalDetail.fieldTotalNumberOfTests',
    defaultMessage: 'Total Number of Tests'
  }
})

export class TerminalDetail extends PureComponent {

  static propTypes = {
    setPageTitle: PropTypes.func.isRequired,
    fetchSingleTerminal: PropTypes.func.isRequired,
    params: PropTypes.object.isRequired,
    terminal: PropTypes.object,
    intl: PropTypes.object.isRequired,
    editable: PropTypes.bool.isRequired,
    updateSingleTerminal: PropTypes.func.isRequired
  }

  state = {
    values: {
      name: '',
      shortname: '',
      notes: '',
      siteId: ''
    }
  }

  componentWillMount() {
    const { setPageTitle, intl } = this.props
    const { formatMessage } = intl
    setPageTitle(formatMessage(messages.title))
  }

  componentDidMount() {
    this.handleFetchTerminal()
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.params.terminalId !== nextProps.params.terminalId) {
      this.handleFetchTerminal()
    }
  }

  handleFetchTerminal = () => {
    this.props.fetchSingleTerminal(this.props.params.terminalId)
      .then(() => {
        const { terminal } = this.props

        this.handleFormChange({
          name: terminal.get('name') || '',
          shortname: terminal.get('shortname') || '',
          notes: terminal.get('notes') || '',
          siteId: terminal.get('siteId')
        })
      })
  }

  handleFormChange = values => this.setState({ values })

  handleSubmit = (data) => {
    const { terminal } = this.props

    return this.props.updateSingleTerminal(terminal.get('id'), data)
  }

  renderProgress() {
    const { terminal } = this.props

    return !terminal && <LinearProgress />
  }

  renderFormContainer() {
    const { intl: { formatMessage } } = this.props
    const labels = {
      name: formatMessage(messages.fieldName),
      shortname: formatMessage(messages.fieldShortname),
      notes: formatMessage(messages.fieldNotes),
      siteId: formatMessage(messages.fieldSiteId),
      loadMoreText: formatMessage(messages.siteLoadMore),
      loadingMoreText: formatMessage(messages.siteLoadingMore)
    }
    return (
      <TerminalDetailForm
        onChange={this.handleFormChange}
        values={this.state.values}
        labels={labels}
        onSubmit={this.handleSubmit}
      />
    )
  }

  renderReadOnlyFields() {
    const { terminal, intl: { formatMessage } } = this.props
    const fields = [
      {
        label: formatMessage(messages.fieldName),
        value: terminal.get('name')
      },
      {
        label: formatMessage(messages.fieldShortname),
        value: terminal.get('shortname')
      },
      {
        label: formatMessage(messages.fieldNotes),
        value: terminal.get('notes')
      },
      {
        label: formatMessage(messages.fieldSiteId),
        value: terminal.get('siteId')
      }
    ]
    return (
      <ReadOnlyFields fields={fields} />
    )
  }

  renderDemoButton() {
    return (
      <DeviceDemoLink
        to={`/demo/device/${this.props.params.terminalId}`}
        className={styles.DemoLink}
        target="_blank"
      >
        Demo
      </DeviceDemoLink>
    )
  }

  renderContent() {
    const { terminal, editable, intl: { formatMessage, formatDate } } = this.props
    if (!terminal) {
      return null
    }

    // get date for current locale, 'date' - is a Date object or string value in DateTime format
    const getFormattedDate = date => (date !== null && date !== '' && isFinite(new Date(date)) ? formatDate(date) : date)

    const fields = [
      {
        label: formatMessage(messages.fieldFirstConnected),
        value: terminal.get('id')
      },
      {
        label: formatMessage(messages.fieldFirstApprovedOn),
        value: getFormattedDate(terminal.get('approvedOn')) || ''
      },
      {
        label: formatMessage(messages.fieldFirstApprovedBy),
        value: terminal.get('approvedBy') || ''
      },
      {
        label: formatMessage(messages.fieldSerial),
        value: terminal.get('serial') || /* FIXME */ '<empty>'
      },
      {
        label: formatMessage(messages.fieldLastSeen),
        value: getFormattedDate(terminal.get('lastSeen')) || ''
      }
    ]
    return (
      <div className={styles.RowContainer}>
        <Unit lg="1-2">
          <div>
            {editable ? this.renderFormContainer() : this.renderReadOnlyFields()}
          </div>
        </Unit>
        <Unit lg="1-2">
          <div>
            <ReadOnlyFields
              fields={fields}
            />
          </div>
        </Unit>
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
        {this.renderDemoButton()}
      </div>
    )
  }
}

function mapStateToProps(state, props) {
  const terminal = state.terminal.items.byId.get(props.params.terminalId)

  return {
    editable: isEditable(state.user, terminal),
    terminal
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    fetchSingleTerminal,
    updateSingleTerminal
  }, dispatch)
}

export const TerminalDetailContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(TerminalDetail)
