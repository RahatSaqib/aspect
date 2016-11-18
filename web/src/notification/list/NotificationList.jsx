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

// Our own imports
import DataTable from '../../components/shared/DataTable'
import ListFilterContainer from '../../filter/list/ListFilter'
import { configureListFilter } from '../../filter/FilterRedux'
import { fetchListFilteredNotifications } from '../NotificationRedux'
import styles from './NotificationList.css'

const messages = defineMessages({
  title: {
    id: 'pages.NotificationList.title',
    defaultMessage: 'Notifications'
  },
  type: {
    id: 'pages.NotificationList.type',
    defaultMessage: 'Type'
  },
  name: {
    id: 'pages.NotificationList.name',
    defaultMessage: 'Name'
  },
  assignedContacts: {
    id: 'pages.NotificationList.assignedContacts',
    defaultMessage: 'Assigned Contacts'
  }
})

export class NotificationList extends PureComponent {

  static propTypes = {
    setPageTitle: PropTypes.func.isRequired,
    table: PropTypes.object.isRequired,
    configureListFilter: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    listFilter: PropTypes.object.isRequired,
    fetchListFilteredNotifications: PropTypes.func.isRequired,
    items: PropTypes.object.isRequired
  }

  componentWillMount() {
    const { setPageTitle, configureListFilter, intl } = this.props
    const { formatMessage } = intl
    setPageTitle(formatMessage(messages.title))
    configureListFilter({ contactNameOrEmail: true })
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.listFilter !== nextProps.listFilter) {
      this.handleFetch()
    }
  }

  handleFetch = (...args) => {
    this.props.fetchListFilteredNotifications({}, ...args)
  }

  render() {
    const { intl } = this.props
    const { formatMessage } = intl

    return (
      <div className={styles.Content}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <ListFilterContainer />
        <DataTable
          handleFetch={this.handleFetch}
          items={this.props.items}
          table={this.props.table}
          columns={[
            { db: 'type', title: formatMessage(messages.type), hideOnXs: true },
            { db: 'name', title: formatMessage(messages.name) },
            { db: 'assignedContacts', title: formatMessage(messages.assignedContacts) }
          ]}
        />
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    listFilter: state.filter.listFilter,
    items: state.notification.items,
    table: state.notification.table
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    configureListFilter,
    fetchListFilteredNotifications
  }, dispatch)
}

export const NotificationListContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(NotificationList)
