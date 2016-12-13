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
import { SubmissionError } from 'redux-form/immutable'

// Material-UI
import { Card } from 'material-ui/Card'
import Checkbox from 'material-ui/Checkbox'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import AddIcon from 'material-ui/svg-icons/content/add'
import TransferIcon from 'material-ui/svg-icons/action/swap-horiz'
import RemoveIcon from 'material-ui/svg-icons/content/remove'
import Dialog from 'material-ui/Dialog'

// Our own imports
import EmptyList from '../../components/shared/EmptyList'
import GroupedDataTable from '../../components/shared/GroupedDataTable'
import ListFilterContainer from '../../filter/list/ListFilter'
import { configureListFilter } from '../../filter/FilterRedux'
import {
  fetchListFilteredInventoryItems,
  toggleGroupBySite,
  addOperation,
  removeOperation,
  transferOperation,
  adjustInventoryLevels,
  addInventory,
  removeInventory,
  transferInventory
} from '../InventoryRedux'
import InventoryAdjustmentForm from '../adjustment/InventoryAdjustmentForm'
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
  addTitle: {
    id: 'pages.InventoryAdjustmentForm.addTitle',
    defaultMessage: 'Add {consumableName}'
  },
  removeTitle: {
    id: 'pages.InventoryAdjustmentForm.removeTitle',
    defaultMessage: 'Remove {consumableName}'
  },
  transferTitle: {
    id: 'pages.InventoryAdjustmentForm.transferTitle',
    defaultMessage: 'Transfer {consumableName}'
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
    adjustInventoryLevels: PropTypes.func.isRequired,
    items: PropTypes.object.isRequired,
    currentAdjustmentOperation: PropTypes.string,
    adjustingInventoryItemId: PropTypes.string,
    addInventory: PropTypes.func.isRequired,
    removeInventory: PropTypes.func.isRequired,
    transferInventory: PropTypes.func.isRequired
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

  inventoryLevelAdjustmentIconButtons = (itemId) => {
    const { intl: { formatMessage }, adjustInventoryLevels } = this.props
    const buttonStyle = {
      marginTop: '0.2em',
      marginRight: '1em'
    }
    return (<div>
      <FloatingActionButton
        mini secondary style={buttonStyle}
        title={formatMessage(messages.addInventory)}
        onTouchTap={() => adjustInventoryLevels(itemId, addOperation)}
      >
        <AddIcon />
      </FloatingActionButton>
      <FloatingActionButton
        mini style={buttonStyle}
        title={formatMessage(messages.transferInventory)}
        onTouchTap={() => adjustInventoryLevels(itemId, transferOperation)}
      >
        <TransferIcon />
      </FloatingActionButton>
      <FloatingActionButton
        mini secondary style={buttonStyle}
        title={formatMessage(messages.removeInventory)}
        onTouchTap={() => adjustInventoryLevels(itemId, removeOperation)}
      >
        <RemoveIcon />
      </FloatingActionButton>
    </div>)
  }

  handleInventoryAdjustmentSubmit = (formValues) => {
    const {
      currentAdjustmentOperation,
      addInventory,
      removeInventory,
      transferInventory
    } = this.props
    switch (currentAdjustmentOperation) {
      case addOperation:
        return addInventory(formValues.get('id'), formValues.toJS())
      case removeOperation:
        return removeInventory(formValues.get('id'), formValues.toJS())
      case transferOperation:
        return transferInventory(formValues.get('id'), formValues.toJS())
      default:
        throw new SubmissionError({ _error: `Invalid operation ${currentAdjustmentOperation} for inventory adjustment form` })
    }
  }

  adjustInventorySucceeded = (...rest) => {
    console.log(rest)
  }

  render() {
    const {
      intl,
      items,
      table,
      adjustingInventoryItemId,
      currentAdjustmentOperation
    } = this.props
    const {
      formatMessage,
      formatDate,
      formatRelative
    } = intl
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

    const adjustingInventoryItem = adjustingInventoryItemId ? items.getIn(['byId', adjustingInventoryItemId]) : null
    const formHeaderValues = { consumableName: adjustingInventoryItem ? adjustingInventoryItem.get('consumableName') : null }
    const formHeader = currentAdjustmentOperation === addOperation ?
      formatMessage(messages.addTitle, formHeaderValues) :
      (currentAdjustmentOperation === removeOperation ?
        formatMessage(messages.removeTitle, formHeaderValues) :
        (currentAdjustmentOperation === transferOperation ?
          formatMessage(messages.transferTitle, formHeaderValues) : null))

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
        <Dialog
          title={formHeader} modal={false}
          open={currentAdjustmentOperation !== null && adjustingInventoryItem != null}
        >
          <InventoryAdjustmentForm
            operation={currentAdjustmentOperation}
            initialValues={adjustingInventoryItem}
            onSubmit={this.handleInventoryAdjustmentSubmit}
            onSubmitSuccess={this.adjustInventorySucceeded}
          />
        </Dialog>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    listFilter: state.filter.listFilter,
    items: state.inventory.items,
    table: state.inventory.table,
    currentAdjustmentOperation: state.inventory.currentAdjustmentOperation,
    adjustingInventoryItemId: state.inventory.adjustingInventoryItemId
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    configureListFilter,
    fetchListFilteredInventoryItems,
    toggleGroupBySite,
    adjustInventoryLevels,
    addInventory,
    removeInventory,
    transferInventory
  }, dispatch)
}

export const InventoryItemsListContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(InventoryItemsList)
