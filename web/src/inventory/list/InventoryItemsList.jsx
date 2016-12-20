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
import { SubmissionError, submit } from 'redux-form/immutable'

// Material-UI
import { Card } from 'material-ui/Card'
import Checkbox from 'material-ui/Checkbox'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import AddIcon from 'material-ui/svg-icons/content/add'
import TransferIcon from 'material-ui/svg-icons/action/swap-horiz'
import RemoveIcon from 'material-ui/svg-icons/content/remove'
import Dialog from 'material-ui/Dialog'
import RaisedButton from 'material-ui/RaisedButton'
import FlatButton from 'material-ui/FlatButton'

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
  finishAdjustingInventoryLevels,
  addInventory,
  removeInventory,
  transferInventory
} from '../InventoryRedux'
import InventoryAdjustmentForm, {
  testConductedReasonI18nKey
} from '../adjustment/InventoryAdjustmentForm'
import styles from './InventoryItemsList.css'
import { showAcknowledgement } from '../../appNotification/AppNotificationRedux'

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
    id: 'pages.InventoryItemsList.addTitle',
    defaultMessage: 'Add {consumableName}'
  },
  removeTitle: {
    id: 'pages.InventoryItemsList.removeTitle',
    defaultMessage: 'Remove {consumableName}'
  },
  transferTitle: {
    id: 'pages.InventoryItemsList.transferTitle',
    defaultMessage: 'Transfer {consumableName}'
  },
  submit: {
    id: 'pages.InventoryItemsList.submit',
    defaultMessage: 'Submit'
  },
  cancel: {
    id: 'pages.InventoryItemsList.cancel',
    defaultMessage: 'Cancel'
  },
  inventoryAdjustedSuccessfully: {
    id: 'pages.InventoryItemsList.inventoryAdjustedSuccessfully',
    defaultMessage: 'Inventory levels have been adjusted successfully'
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
    finishAdjustingInventoryLevels: PropTypes.func.isRequired,
    consumableReasons: PropTypes.object.isRequired,
    items: PropTypes.object.isRequired,
    inventoryAdjustment: PropTypes.object,
    addInventory: PropTypes.func.isRequired,
    removeInventory: PropTypes.func.isRequired,
    transferInventory: PropTypes.func.isRequired,
    submit: PropTypes.func.isRequired,
    showAcknowledgement: PropTypes.func.isRequired
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

  groupBySiteChecked = (event, isChecked) => {
    this.props.toggleGroupBySite(isChecked)
  }

  adjustInventoryLevels = (inventoryItemId, operation) => {
    const { adjustInventoryLevels, items } = this.props
    const inventoryItem = items.getIn(['byId', inventoryItemId])
    adjustInventoryLevels(inventoryItem, operation)
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
        onTouchTap={() => this.adjustInventoryLevels(itemId, addOperation)}
      >
        <AddIcon />
      </FloatingActionButton>
      <FloatingActionButton
        mini style={buttonStyle}
        title={formatMessage(messages.transferInventory)}
        onTouchTap={() => this.adjustInventoryLevels(itemId, transferOperation)}
      >
        <TransferIcon />
      </FloatingActionButton>
      <FloatingActionButton
        mini secondary style={buttonStyle}
        title={formatMessage(messages.removeInventory)}
        onTouchTap={() => this.adjustInventoryLevels(itemId, removeOperation)}
      >
        <RemoveIcon />
      </FloatingActionButton>
    </div>)
  }

  handleInventoryAdjustmentSubmit = (formValues) => {
    const {
      inventoryAdjustment,
      addInventory,
      removeInventory,
      transferInventory,
      consumableReasons
    } = this.props
    switch (inventoryAdjustment.get('operation')) {
      case addOperation:
        return addInventory(inventoryAdjustment.getIn(['adjustmentDetails', 'inventoryItemId']), {
          lotNumber: formValues.get('lotNumber'),
          expiresOn: formValues.get('expiresOn'),
          quantity: formValues.get('quantity'),
          notes: formValues.get('notes'),
          toSiteId: formValues.get('toSiteId'),
          dateAdjusted: formValues.get('dateAdjusted')
        })
      case removeOperation: {
        const selectedAdjustmentReason =
          consumableReasons.items.find(reason => reason.get('id') === formValues.get('reasonId'))
        const dateValues = selectedAdjustmentReason.get('i18nKey') === testConductedReasonI18nKey ? {
          dateAdjustedFrom: formValues.get('dateAdjustedFrom'),
          dateAdjustedTo: formValues.get('dateAdjustedTo')
        } : { dateAdjusted: formValues.get('dateAdjusted') }
        return removeInventory(inventoryAdjustment.getIn(['adjustmentDetails', 'inventoryItemId']),
          {
            ...dateValues,
            lotNumber: formValues.get('lotNumber'),
            expiresOn: formValues.get('expiresOn'),
            quantity: formValues.get('quantity'),
            notes: formValues.get('notes'),
            fromSiteId: formValues.get('fromSiteId'),
            reasonId: formValues.get('reasonId')
          })
      }
      case transferOperation:
        return transferInventory(inventoryAdjustment.getIn(['adjustmentDetails', 'inventoryItemId']), {
          lotNumber: formValues.get('lotNumber'),
          expiresOn: formValues.get('expiresOn'),
          quantity: formValues.get('quantity'),
          notes: formValues.get('notes'),
          fromSiteId: formValues.get('fromSiteId'),
          toSiteId: formValues.get('toSiteId'),
          dateAdjusted: formValues.get('dateAdjusted')
        })
      default:
        throw new SubmissionError({ _error: `Invalid operation ${inventoryAdjustment.get('operation')} for inventory adjustment form` })
    }
  }

  handleFetch = (...args) => {
    this.props.fetchListFilteredInventoryItems({}, ...args)
  }

  handleInventoryAdjustmentCancel = () => {
    this.props.finishAdjustingInventoryLevels()
  }

  adjustInventorySucceeded = () => {
    const { showAcknowledgement, table } = this.props
    showAcknowledgement({
      title: messages.inventoryAdjustedSuccessfully
    })
    this.handleFetch(table.get('sortCol') || 'siteName',
      table.get('sortDir') || 'asc', table.get('page') || 0,
      table.get('pageSize') || 10)
  }

  render() {
    const { intl, items, table, inventoryAdjustment, submit } = this.props
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

    const adjustingInventoryItem = inventoryAdjustment.get('adjustmentDetails')
    const formHeaderValues = {
      consumableName: adjustingInventoryItem ? adjustingInventoryItem.get('consumableName') : null
    }
    const formHeader = inventoryAdjustment.get('operation') === addOperation ?
      formatMessage(messages.addTitle, formHeaderValues) :
      (inventoryAdjustment.get('operation') === removeOperation ?
        formatMessage(messages.removeTitle, formHeaderValues) :
        (inventoryAdjustment.get('operation') === transferOperation ?
          formatMessage(messages.transferTitle, formHeaderValues) : null))

    const inventoryAdjustmentActions = [
      <RaisedButton
        disabled={inventoryAdjustment.get('updating')}
        onTouchTap={() => submit('inventoryAdjustment')}
        label={formatMessage(messages.submit)} secondary
      />,
      <FlatButton
        disabled={inventoryAdjustment.get('updating')}
        onTouchTap={this.handleInventoryAdjustmentCancel}
        secondary label={formatMessage(messages.cancel)}
      />
    ]
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
          title={formHeader} actions={inventoryAdjustmentActions}
          open={inventoryAdjustment.get('operation') !== null && adjustingInventoryItem != null}
          autoScrollBodyContent
        >
          <InventoryAdjustmentForm
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
    consumableReasons: state.consumable.get('consumableReasons'),
    listFilter: state.filter.listFilter,
    items: state.inventory.items,
    table: state.inventory.table,
    inventoryAdjustment: state.inventory.inventoryAdjustment
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    configureListFilter,
    fetchListFilteredInventoryItems,
    toggleGroupBySite,
    adjustInventoryLevels,
    finishAdjustingInventoryLevels,
    addInventory,
    removeInventory,
    transferInventory,
    submit,
    showAcknowledgement
  }, dispatch)
}

export const InventoryItemsListContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(InventoryItemsList)
