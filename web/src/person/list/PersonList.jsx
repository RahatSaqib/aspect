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
import { fetchListFilteredPersons } from '../PersonRedux'
import styles from './PersonList.css'
import { Items } from '../../shared/metaReducers/items'
import { Table } from '../../shared/metaReducers/table'

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
    defaultMessage: 'Job'
  },
  state: {
    id: 'pages.PersonList.state',
    defaultMessage: 'State'
  },
  lga: {
    id: 'pages.PersonList.lga',
    defaultMessage: 'County'
  },
  filterTemplate: {
    id: 'pages.ResultList.filterTemplate',
    defaultMessage: 'Viewing contacts <GEOGRAPHY><NAME>'
  }
})

const enhance = compose(
  setPropTypes({
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired, // eslint-disable-line
  }),
  pure,
  injectIntl,
  connect(state => ({
    listFilter: state.filter.listFilter,
    items: state.person.items,
    table: state.person.table,
  }), dispatch => (
    bindActionCreators({
      fetchListFilteredPersons,
      configureListFilter,
    }, dispatch)
  )),
  setPropTypes({
    intl: intlShape.isRequired,
    listFilter: PropTypes.objectOf(ListFilter).isRequired,
    items: PropTypes.objectOf(Items).isRequired,
    table: PropTypes.objectOf(Table).isRequired,
    fetchListFilteredPersons: PropTypes.func.isRequired,
    configureListFilter: PropTypes.func.isRequired,
  }),
)

export class PersonList extends PureComponent {
  componentWillMount() {
    const { configureListFilter } = this.props
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
    this.props.history.push(`/person/${personId}`)
  }

  handleFetch = (...args) => {
    this.props.fetchListFilteredPersons({}, ...args)
  }

  render() {
    const { intl } = this.props
    const { formatMessage } = intl
    const columns = [
      { db: 'name', title: formatMessage(messages.personName) },
      { db: 'level', title: formatMessage(messages.level), hideOnXs: true },
      { db: 'state', title: formatMessage(messages.state), hideOnXs: true },
      { db: 'lga', title: formatMessage(messages.lga), hideOnXs: true }
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
          selectable
          handleItemIdSelection={this.handleItemIdSelection}
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

export default enhance(PersonList)
