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
  fetchSingleRouter,
  updateSingleRouter
} from '../RouterRedux'
import ReadOnlyFields from '../../components/shared/ReadOnlyFields'
import RouterDetailForm from './RouterDetailForm'
import styles from './RouterDetail.css'

const messages = defineMessages({
  title: {
    id: 'pages.RouterDetail.title',
    defaultMessage: 'Router Detail'
  },
  fieldName: {
    id: 'pages.RouterDetail.fieldName',
    defaultMessage: 'Name'
  },
  fieldShortname: {
    id: 'pages.RouterDetail.fieldShortname',
    defaultMessage: 'Shortname'
  },
  fieldNotes: {
    id: 'pages.RouterDetail.fieldNotes',
    defaultMessage: 'Notes'
  },
  fieldSiteId: {
    id: 'pages.RouterDetail.fieldSiteId',
    defaultMessage: 'Site'
  },
  siteLoadMore: {
    id: 'pages.RouterDetail.siteLoadMore',
    defaultMessage: 'Load more'
  },
  siteLoadingMore: {
    id: 'pages.RouterDetail.siteLoadingMore',
    defaultMessage: 'Loading……'
  },
  fieldFirstConnected: {
    id: 'pages.RouterDetail.fieldFirstConnected',
    defaultMessage: 'First Connected'
  },
  fieldFirstApprovedOn: {
    id: 'pages.RouterDetail.fieldFirstApprovedOn',
    defaultMessage: 'First Approved On'
  },
  fieldFirstApprovedBy: {
    id: 'pages.RouterDetail.fieldFirstApprovedBy',
    defaultMessage: 'First Approved By'
  },
  fieldSerial: {
    id: 'pages.RouterDetail.fieldSerial',
    defaultMessage: 'Serial'
  },
  fieldLastSeen: {
    id: 'pages.RouterDetail.fieldLastSeen',
    defaultMessage: 'Last Seen'
  },
  fieldTotalNumberOfTests: {
    id: 'pages.RouterDetail.fieldTotalNumberOfTests',
    defaultMessage: 'Total Number of Tests'
  }
})

export class RouterDetail extends PureComponent {

  static propTypes = {
    setPageTitle: PropTypes.func.isRequired,
    fetchSingleRouter: PropTypes.func.isRequired,
    params: PropTypes.object.isRequired,
    router: PropTypes.object,
    intl: PropTypes.object.isRequired,
    editable: PropTypes.bool.isRequired,
    updateSingleRouter: PropTypes.func.isRequired
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
    this.handleFetchRouter()
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.params.deviceId !== nextProps.params.deviceId) {
      this.handleFetchRouter()
    }
  }

  handleFetchRouter = () => {
    this.props.fetchSingleRouter(this.props.params.deviceId)
      .then(() => {
        const { router } = this.props

        this.handleFormChange({
          name: router.get('name') || '',
          shortname: router.get('shortname') || '',
          notes: router.get('notes') || '',
          siteId: router.get('siteId')
        })
      })
  }

  handleFormChange = values => this.setState({ values })

  handleSubmit = (data) => {
    const { router } = this.props

    return this.props.updateSingleRouter(router.get('id'), data)
  }

  renderProgress() {
    const { router } = this.props

    return !router && <LinearProgress />
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
      <RouterDetailForm
        onChange={this.handleFormChange}
        values={this.state.values}
        labels={labels}
        onSubmit={this.handleSubmit}
      />
    )
  }

  renderReadOnlyFields() {
    const { router, intl: { formatMessage } } = this.props
    const fields = [
      {
        label: formatMessage(messages.fieldName),
        value: router.get('name')
      },
      {
        label: formatMessage(messages.fieldShortname),
        value: router.get('shortname')
      },
      {
        label: formatMessage(messages.fieldNotes),
        value: router.get('notes')
      },
      {
        label: formatMessage(messages.fieldSiteId),
        value: router.get('siteId')
      }
    ]
    return (
      <ReadOnlyFields fields={fields} />
    )
  }

  renderContent() {
    const { router, editable, intl: { formatMessage, formatDate } } = this.props
    if (!router) {
      return null
    }

    // get date for current locale, 'date' - is a Date object or string value in DateTime format
    const getFormattedDate = date => (date !== null && date !== '' && isFinite(new Date(date)) ? formatDate(date) : date)

    const fields = [
      {
        label: formatMessage(messages.fieldFirstConnected),
        value: router.get('id')
      },
      {
        label: formatMessage(messages.fieldFirstApprovedOn),
        value: getFormattedDate(router.get('approvedOn')) || ''
      },
      {
        label: formatMessage(messages.fieldFirstApprovedBy),
        value: router.get('approvedBy') || ''
      },
      {
        label: formatMessage(messages.fieldSerial),
        value: router.get('serial') || /* FIXME */ '<empty>'
      },
      {
        label: formatMessage(messages.fieldLastSeen),
        value: getFormattedDate(router.get('lastSeen')) || ''
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
      </div>
    )
  }
}

function mapStateToProps(state, props) {
  const router = state.router.items.byId.get(props.params.deviceId)

  return {
    editable: isEditable(state.user, router),
    router
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    fetchSingleRouter,
    updateSingleRouter
  }, dispatch)
}

export const RouterDetailContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(RouterDetail)
