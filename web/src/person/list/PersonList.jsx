// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import {
  injectIntl,
  defineMessages
} from 'react-intl'
import { withRouter } from 'react-router'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

// Our own imports
import EmptyList from '../../components/shared/EmptyList'
import DataTable from '../../components/shared/DataTable'
import ListFilterContainer from '../../filter/list/ListFilter'
import { configureListFilter } from '../../filter/FilterRedux'
import { fetchListFilteredPersons } from '../PersonRedux'
import styles from './PersonList.css'

const messages = defineMessages({
  title: {
    id: 'pages.PersonList.title',
    defaultMessage: 'Contacts'
  },
  personName: {
    id: 'pages.PersonList.personName',
    defaultMessage: 'Name'
  },
  level: {
    id: 'pages.PersonList.level',
    defaultMessage: 'Role'
  },
  state: {
    id: 'pages.PersonList.state',
    defaultMessage: 'State'
  },
  lga: {
    id: 'pages.PersonList.lga',
    defaultMessage: 'County'
  }
})

export class PersonList extends PureComponent {

  static propTypes = {
    setPageTitle: PropTypes.func.isRequired,
    table: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    items: PropTypes.object.isRequired,
    configureListFilter: PropTypes.func.isRequired,
    listFilter: PropTypes.object.isRequired,
    router: PropTypes.object.isRequired,
    fetchListFilteredPersons: PropTypes.func.isRequired
  }

  componentWillMount() {
    const { setPageTitle, configureListFilter, intl } = this.props
    const { formatMessage } = intl
    setPageTitle(formatMessage(messages.title))
    configureListFilter({ geography: true, contactNameOrEmail: true })
  }

  componentDidMount() {
    this.handleFetch()
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.listFilter !== nextProps.listFilter) {
      this.handleFetch()
    }
  }

  handleItemIdSelection = (personId) => {
    this.props.router.push(`/person/${personId}`)
  }

  handleFetch = (...args) => {
    this.props.fetchListFilteredPersons({}, ...args)
  }

  render() {
    const { intl, items, table } = this.props
    const { formatMessage } = intl
    const isSettledAndEmpty = !table.loading && items.currentIdList.isEmpty()
    const columns = [
      { db: 'name', title: formatMessage(messages.personName) },
      { db: 'level', title: formatMessage(messages.level), hideOnXs: true },
      { db: 'state', title: formatMessage(messages.state), hideOnXs: true },
      { db: 'lga', title: formatMessage(messages.lga), hideOnXs: true }
    ]

    return (
      <div className={styles.Content}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <ListFilterContainer subject={formatMessage(messages.title)} />
        <EmptyList isEmpty={isSettledAndEmpty} />
        {!isSettledAndEmpty && (
          <DataTable
            selectable
            handleItemIdSelection={this.handleItemIdSelection}
            handleFetch={this.handleFetch}
            items={this.props.items}
            table={this.props.table}
            columns={columns}
          />
        )}
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    listFilter: state.filter.listFilter,
    items: state.person.items,
    table: state.person.table
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    configureListFilter,
    fetchListFilteredPersons
  }, dispatch)
}

export const PersonListContainer = _.flowRight(
  injectIntl,
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(PersonList)
