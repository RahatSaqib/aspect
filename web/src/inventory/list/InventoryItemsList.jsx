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
import FloatingActionButton from 'material-ui/FloatingActionButton'
import AddIcon from 'material-ui/svg-icons/content/add'
import TransferIcon from 'material-ui/svg-icons/action/swap-horiz'
import RemoveIcon from 'material-ui/svg-icons/content/remove'

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
  },
  adjust: {
    id: 'pages.InventoryItemsList.adjust',
    defaultMessage: 'Adjust'
  },
  addInventory: {
    id: 'pages.InventoryItemsList.addInventory',
    defaultMessage: 'Add Inventory'
  },
  transferInventory: {
    id: 'pages.InventoryItemsList.transferInventory',
    defaultMessage: 'Transfer Inventory'
  },
  removeInventory: {
    id: 'pages.InventoryItemsList.removeInventory',
    defaultMessage: 'Remove Inventory'
  },
  filterTemplate: {
    id: 'pages.InventoryItemsList.filterTemplate',
    defaultMessage: 'Viewing <CONSUMABLE> <GEOGRAPHY> at all sites<NAME>.'
  },
  filterTemplateOptional: {
    id: 'pages.InventoryItemsList.filterTemplateOptional',
    defaultMessage: 'Expiring<DATE>.'
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

  showAddInventoryForm = (...rest) => {
    console.log(rest)
  }

  showTransferInventoryForm = (...rest) => {
    console.log(rest)
  }

  showRemoveInventoryForm = (...rest) => {
    console.log(rest)
  }

  inventoryLevelAdjustmentIconButtons = (itemId) => {
    const { intl: { formatMessage } } = this.props
    const buttonStyle = {
      marginTop: '0.2em',
      marginRight: '1em'
    }
    return (<div>
      <FloatingActionButton
        mini secondary style={buttonStyle}
        title={formatMessage(messages.addInventory)}
        onTouchTap={() => this.showAddInventoryForm(itemId)}
      >
        <AddIcon />
      </FloatingActionButton>
      <FloatingActionButton
        mini style={buttonStyle}
        title={formatMessage(messages.transferInventory)}
        onTouchTap={() => this.showTransferInventoryForm(itemId)}
      >
        <TransferIcon />
      </FloatingActionButton>
      <FloatingActionButton
        mini secondary style={buttonStyle}
        title={formatMessage(messages.removeInventory)}
        onTouchTap={() => this.showRemoveInventoryForm(itemId)}
      >
        <RemoveIcon />
      </FloatingActionButton>
    </div>)
  }

  render() {
    const { intl, items, table } = this.props
    const { formatMessage, formatDate, formatRelative } = intl
    const isSettledAndEmpty = !table.loading && items.currentIdList.isEmpty()
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
          filterTemplate={formatMessage(messages.filterTemplate)}
          filterTemplateOptional={formatMessage(messages.filterTemplateOptional)}
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
        <EmptyList isEmpty={isSettledAndEmpty} />
        {!isSettledAndEmpty && (
          <GroupedDataTable
            handleFetch={this.handleFetch}
            items={items}
            table={table}
            columns={columns}
            intl={intl}
            messages={messages}
            actionComponent={this.inventoryLevelAdjustmentIconButtons}
          />
        )}
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
