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
import { Card } from 'material-ui/Card'
import Checkbox from 'material-ui/Checkbox'

// Our own imports
import EmptyList from '../../components/shared/EmptyList'
import GroupedDataTable from '../../components/shared/GroupedDataTable'
import ListFilterContainer from '../../filter/list/ListFilter'
import { configureListFilter } from '../../filter/FilterRedux'
import {
  fetchListFilteredInventoryItems,
  toggleGroupBySite
} from '../InventoryRedux'
import styles from './InventoryItemsList.css'

const messages = defineMessages({
  title: {
    id: 'pages.InventoryItemsList.title',
    defaultMessage: 'Inventory on Hand'
  },
  groupBySite: {
    id: 'pages.InventoryItemsList.groupBySite',
    defaultMessage: 'Group by Site'
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

  componentDidMount() {
    this.handleFetch()
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.listFilter !== nextProps.listFilter) {
      this.handleFetch()
    }
  }

  handleFetch = (...args) => {
    this.props.fetchListFilteredInventoryItems({}, ...args)
  }

  groupBySiteChecked = (event, isChecked) => {
    this.props.toggleGroupBySite(isChecked)
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

    return (
      <div className={styles.Content}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <ListFilterContainer
          subject={formatMessage(messages.title)}
          dateFilterLabel={formatMessage(messages.expiresOn)}
        />
        <Card>
          <Checkbox
            checked={table.get('groupBy').includes('siteId')}
            onCheck={this.groupBySiteChecked}
            label={formatMessage(messages.groupBySite)}
            labelPosition="right"
            style={{ padding: '1em' }}
          />
        </Card>
        <EmptyList isEmpty={items.currentIdList.isEmpty()} />
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
    toggleGroupBySite
  }, dispatch)
}

export const InventoryItemsListContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(InventoryItemsList)
