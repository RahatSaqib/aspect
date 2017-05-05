import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { compose, setPropTypes, pure } from 'recompose'
import {
  injectIntl,
  defineMessages,
  intlShape
} from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

// Our own imports
import DataTableWithEmptyList from '../../components/shared/DataTableWithEmptyList'
import NavTitle from '../../globals/components/NavTitle'
import ListFilterContainer from '../../filter/list/ListFilter'
import { configureListFilter, ListFilter } from '../../filter/FilterRedux'
import { fetchListFilteredNotifications } from '../NotificationRedux'
import styles from './NotificationList.css'
import { Items } from '../../shared/metaReducers/items'
import { Table } from '../../shared/metaReducers/table'

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
  },
  filterTemplate: {
    id: 'pages.NotificationList.filterTemplate',
    defaultMessage: 'Viewing all notifications<NAME>.'
  }
})

const enhance = compose(
  setPropTypes({
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
  }),
  pure,
  injectIntl,
  connect(state => ({
    listFilter: state.filter.listFilter,
    items: state.notification.items,
    table: state.notification.table,
  }), dispatch => (
    bindActionCreators({
      fetchListFilteredNotifications,
      configureListFilter,
    }, dispatch)
  )),
  setPropTypes({
    intl: intlShape.isRequired,
    listFilter: PropTypes.objectOf(ListFilter).isRequired,
    items: PropTypes.objectOf(Items).isRequired,
    table: PropTypes.objectOf(Table).isRequired,
    fetchListFilteredNotifications: PropTypes.func.isRequired,
    configureListFilter: PropTypes.func.isRequired,
  }),
)

export class NotificationList extends PureComponent {
  componentWillMount() {
    const { configureListFilter } = this.props
    configureListFilter({ contactNameOrEmail: true })
  }

  componentDidMount() {
    this.handleFetch()
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
    const columns = [
      { db: 'type', title: formatMessage(messages.type), hideOnXs: true },
      { db: 'name', title: formatMessage(messages.name) },
      { db: 'assignedContacts', title: formatMessage(messages.assignedContacts) }
    ]

    return (
      <div className={styles.Content}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <NavTitle title={formatMessage(messages.title)} />
        <ListFilterContainer
          subject={formatMessage(messages.title)}
          filterTemplate={formatMessage(messages.filterTemplate)}
        />
        <DataTableWithEmptyList
          handleFetch={this.handleFetch}
          items={this.props.items}
          table={this.props.table}
          columns={columns}
          intl={intl}
        />
      </div>
    )
  }
}

export default enhance(NotificationList)
