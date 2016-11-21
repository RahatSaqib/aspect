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
import { Card, CardTitle } from 'material-ui/Card'
import Toggle from 'material-ui/Toggle'

// Our own imports
import GroupedDataTable from '../../components/shared/GroupedDataTable'
import ListFilterContainer from '../../filter/list/ListFilter'
import { configureListFilter } from '../../filter/FilterRedux'
import {
  fetchListFilteredInventoryItems,
  toggleGroupBySite,
  toggleGroupByConsumable
} from '../InventoryRedux'
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
  },
  expiresIn: {
    id: 'pages.InventoryItemsList.expiresIn',
    defaultMessage: 'Expires'
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
    toggleGroupBySite: PropTypes.func.isRequired,
    toggleGroupByConsumable: PropTypes.func.isRequired,
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

  toggleGroupBySite = () => {
    this.props.toggleGroupBySite()
  }

  toggleGroupByConsumable = () => {
    this.props.toggleGroupByConsumable()
  }

  render() {
    const { intl, items, table } = this.props
    const { formatMessage, formatDate, formatRelative } = intl
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
      format: data => (data ? formatDate(data, { format: 'user-timezone' }) : 'N/A')
    }, {
      fieldName: 'expiresOn',
      headerText: formatMessage(messages.expiresIn),
      format: data => (data ? formatRelative(data) : 'Never')
    }]
    const groupByToggleStyles = {
      marginLeft: '2em',
      display: 'inline-block',
      width: 'auto'
    }
    return (
      <div className={styles.Content}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <ListFilterContainer />
        <Card>
          <CardTitle title="Group Items" className={styles.GroupBy__Header} />
          <Toggle
            toggled={table.get('groupBy').includes('siteId')}
            onToggle={this.toggleGroupBySite}
            label="By Site"
            labelPosition="right"
            style={groupByToggleStyles}
          />
          {
            table.get('groupBy').includes('siteId') &&
            <Toggle
              toggled={table.get('groupBy').includes('consumableId')}
              onToggle={this.toggleGroupByConsumable}
              label="By Consumable"
              labelPosition="right"
              style={groupByToggleStyles}
            />
          }
        </Card>
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
    fetchListFilteredInventoryItems,
    toggleGroupBySite,
    toggleGroupByConsumable
  }, dispatch)
}

export const InventoryItemsListContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(InventoryItemsList)
