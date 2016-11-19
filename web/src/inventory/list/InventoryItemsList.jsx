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
import GroupedDataTable from '../../components/shared/GroupedDataTable'
import ListFilterContainer from '../../filter/list/ListFilter'
import { configureListFilter } from '../../filter/FilterRedux'
import { fetchListFilteredInventoryItems } from '../InventoryRedux'
import styles from './InventoryItemsList.css'

const messages = defineMessages({
  title: {
    id: 'pages.InventoryItemsList.title',
    defaultMessage: 'Inventory on Hand'
  },
  siteName: {
    id: 'pages.InventoryItemsList.siteName',
    defaultMessage: 'Site Name'
  },
  consumableName: {
    id: 'pages.InventoryItemsList.consumableName',
    defaultMessage: 'Consumable'
  },
  quantityOnHand: {
    id: 'pages.InventoryItemsList.quantityOnHand',
    defaultMessage: 'Quantity on Hand'
  },
  expiresOn: {
    id: 'pages.InventoryItemsList.expiresOn',
    defaultMessage: 'Expires On'
  }
})

export class InventoryItemsList extends PureComponent {

  static propTypes = {
    setPageTitle: PropTypes.func.isRequired,
    table: PropTypes.object.isRequired,
    configureListFilter: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    listFilter: PropTypes.object.isRequired,
    fetchListFilteredInventoryItems: PropTypes.func.isRequired,
    items: PropTypes.object.isRequired
  }

  componentWillMount() {
    const { setPageTitle, configureListFilter, intl: { formatMessage } } = this.props
    setPageTitle(formatMessage(messages.title))
    configureListFilter({
      consumable: true,
      geography: true,
      date: true,
      siteName: true })
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.listFilter !== nextProps.listFilter) {
      this.handleFetch()
    }
  }

  handleFetch = (...args) => {
    this.props.fetchListFilteredInventoryItems({}, ...args)
  }

  render() {
    const { intl, items, table } = this.props
    const { formatMessage, formatDate } = intl
    const columns = [{
      fieldName: 'siteName',
      headerText: formatMessage(messages.siteName)
    }, {
      fieldName: 'consumableName',
      headerText: formatMessage(messages.consumableName)
    }, {
      fieldName: 'quantityOnHand',
      headerText: formatMessage(messages.quantityOnHand)
    }, {
      fieldName: 'expiresOn',
      headerText: formatMessage(messages.expiresOn),
      format: data => formatDate(data, { format: 'user-timezone' })
    }]
    return (
      <div className={styles.Content}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <ListFilterContainer />
        <GroupedDataTable
          handleFetch={this.handleFetch}
          items={items}
          table={table}
          columns={columns}
          intl={intl}
          messages={messages}
        />
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    listFilter: state.filter.listFilter,
    items: state.inventory.items,
    table: state.inventory.table
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    configureListFilter,
    fetchListFilteredInventoryItems
  }, dispatch)
}

export const InventoryItemsListContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(InventoryItemsList)
