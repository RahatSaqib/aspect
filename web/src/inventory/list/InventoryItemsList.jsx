import _ from 'lodash'
import Immutable from 'immutable'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import React, { PureComponent } from 'react'
import { compose, setPropTypes, pure } from 'recompose'
import { injectIntl, defineMessages, intlShape } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

// Material-UI
import { Card } from 'material-ui/Card'
import Checkbox from 'material-ui/Checkbox'
import AddIcon from 'material-ui/svg-icons/content/add'
import TransferIcon from 'material-ui/svg-icons/action/swap-horiz'
import RemoveIcon from 'material-ui/svg-icons/content/remove'
import DoneIcon from 'material-ui/svg-icons/action/done'
import IconButton from 'material-ui/IconButton'
import IconMenu from 'material-ui/IconMenu'
import MenuItem from 'material-ui/MenuItem'
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert'

// Our own imports
import NavTitle from '../../globals/components/NavTitle'
import BrowseFilters from '../../globals/components/BrowseFilters'
import { Items } from '../../shared/metaReducers/items'
import { Table } from '../../shared/metaReducers/table'
import EmptyList from '../../components/shared/EmptyList'
import GroupedDataTable from '../../components/shared/GroupedDataTable'
import { showAcknowledgement } from '../../appNotification/AppNotificationRedux'
import { configureListFilter, ListFilter } from '../../filter/FilterRedux'
import { testConductedReasonI18nKey } from '../adjustment/InventoryAdjustmentDialogForm'
import NewInventoryDialogForm from '../adjustment/NewInventoryDialogForm'
import AddInventoryDialogForm from '../adjustment/AddInventoryDialogForm'
import ReceiveInventoryDialogForm from '../adjustment/ReceiveInventoryDialogForm'
import RemoveInventoryDialogForm from '../adjustment/RemoveInventoryDialogForm'
import TransferInventoryDialogForm from '../adjustment/TransferInventoryDialogForm'
import {
  types,
  fetchListFilteredInventoryItems,
  toggleGroupBySite,
  showNewInventoryDialog,
  showAddInventoryDialog,
  showRemoveInventoryDialog,
  showTransferInventoryDialog,
  showReceiveInventoryDialog,
  hideAdjustInventoryDialog,
  addInventory,
  removeInventory,
  transferInventory,
  receiveInventory,
} from '../InventoryRedux'

const cssClasses = classnames.bind(require('./InventoryItemsList.css'))

const EMPTY_MAP = Immutable.Map()

const messages = defineMessages({
  title: {
    id: 'pages.InventoryItemsList.title',
    defaultMessage: 'Inventory on Hand',
  },
  groupBySite: {
    id: 'pages.InventoryItemsList.groupBySite',
    defaultMessage: 'Group by Site',
  },
  siteName: {
    id: 'pages.InventoryItemsList.siteName',
    defaultMessage: 'Site Name',
  },
  consumableName: {
    id: 'pages.InventoryItemsList.consumableName',
    defaultMessage: 'Consumable',
  },
  quantityOnHand: {
    id: 'pages.InventoryItemsList.quantityOnHand',
    defaultMessage: 'Quantity on Hand',
  },
  inTransitFromSiteName: {
    id: 'pages.InventoryItemsList.inTransitFromSiteName',
    defaultMessage: '* in transit from {inTransitFromSiteName}',
  },
  expiresOn: {
    id: 'pages.InventoryItemsList.expiresOn',
    defaultMessage: 'Expires On',
  },
  expiresIn: {
    id: 'pages.InventoryItemsList.expiresIn',
    defaultMessage: 'Expires',
  },
  adjust: {
    id: 'pages.InventoryItemsList.adjust',
    defaultMessage: 'Adjust',
  },
  addInventory: {
    id: 'pages.InventoryItemsList.addInventory',
    defaultMessage: 'Add Inventory',
  },
  transferInventory: {
    id: 'pages.InventoryItemsList.transferInventory',
    defaultMessage: 'Transfer Inventory',
  },
  receiveInventory: {
    id: 'pages.InventoryItemsList.receiveInventory',
    defaultMessage: 'Receive Inventory in Transit',
  },
  removeInventory: {
    id: 'pages.InventoryItemsList.removeInventory',
    defaultMessage: 'Remove Inventory',
  },

  inventoryAdjustedSuccessfully: {
    id: 'pages.InventoryItemsList.inventoryAdjustedSuccessfully',
    defaultMessage: 'Inventory levels have been adjusted successfully',
  },
})

const enhance = compose(
  setPropTypes({
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired, // eslint-disable-line
  }),
  pure,
  injectIntl,
  connect(
    state => ({
      consumableReasons: state.consumable.consumableReasons,
      listFilter: state.filter.listFilter,
      items: state.inventory.items,
      table: state.inventory.table,
      inventoryAdjustment: state.inventory.inventoryAdjustment,
    }),
    bindActionCreators.bind(null, {
      showAcknowledgement,

      configureListFilter,
      fetchListFilteredInventoryItems,
      toggleGroupBySite,

      showNewInventoryDialog,
      showAddInventoryDialog,
      showRemoveInventoryDialog,
      showTransferInventoryDialog,
      showReceiveInventoryDialog,
      hideAdjustInventoryDialog,

      addInventory,
      removeInventory,
      transferInventory,
      receiveInventory,
    })
  ),
  setPropTypes({
    intl: intlShape.isRequired,
    consumableReasons: PropTypes.object.isRequired,
    listFilter: PropTypes.objectOf(ListFilter).isRequired,
    items: PropTypes.objectOf(Items).isRequired,
    table: PropTypes.objectOf(Table).isRequired,
    inventoryAdjustment: PropTypes.object,
    showAcknowledgement: PropTypes.func.isRequired,
    configureListFilter: PropTypes.func.isRequired,
    fetchListFilteredInventoryItems: PropTypes.func.isRequired,
    toggleGroupBySite: PropTypes.func.isRequired,
    showNewInventoryDialog: PropTypes.func.isRequired,
    showAddInventoryDialog: PropTypes.func.isRequired,
    showRemoveInventoryDialog: PropTypes.func.isRequired,
    showTransferInventoryDialog: PropTypes.func.isRequired,
    showReceiveInventoryDialog: PropTypes.func.isRequired,
    hideAdjustInventoryDialog: PropTypes.func.isRequired,
    addInventory: PropTypes.func.isRequired,
    removeInventory: PropTypes.func.isRequired,
    transferInventory: PropTypes.func.isRequired,
    receiveInventory: PropTypes.func.isRequired,
  })
)

export class InventoryItemsList extends PureComponent {
  componentWillMount() {
    const { configureListFilter } = this.props
    configureListFilter({
      consumable: true,
      geography: true,
      date: true,
      siteName: true,
    })
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

  handleShowAddInventoryDialog = ({
    currentTarget: { dataset: { inventoryItemId } },
  }) => {
    this.props.showAddInventoryDialog(inventoryItemId)
  }
  handleShowRemoveInventoryDialog = ({
    currentTarget: { dataset: { inventoryItemId } },
  }) => {
    this.props.showRemoveInventoryDialog(inventoryItemId)
  }
  handleShowTransferInventoryDialog = ({
    currentTarget: { dataset: { inventoryItemId } },
  }) => {
    this.props.showTransferInventoryDialog(inventoryItemId)
  }
  handleShowReceiveInventoryDialog = ({
    currentTarget: { dataset: { inventoryItemId } },
  }) => {
    this.props.showReceiveInventoryDialog(inventoryItemId)
  }

  adjustInventorySucceeded = () => {
    const { showAcknowledgement, table } = this.props
    showAcknowledgement({
      title: messages.inventoryAdjustedSuccessfully,
    })
    this.handleFetch(
      table.get('sortCol') || 'siteName',
      table.get('sortDir') || 'asc',
      table.get('page') || 0,
      table.get('pageSize') || 10
    )
  }

  handleAddInventorySubmit = values =>
    this.props
      .addInventory(_.omit(values, ['canExpire']))
      .then(this.adjustInventorySucceeded)

  handleRemoveInventorySubmit = values => {
    const selectedAdjustmentReason = this.props.consumableReasons.items.find(
      reason => reason.get('id') === values.reasonId
    )
    if (
      selectedAdjustmentReason.get('i18nKey') === testConductedReasonI18nKey
    ) {
      return this.props
        .removeInventory(_.omit(values, ['canExpire', 'dateAdjusted']))
        .then(this.adjustInventorySucceeded)
    }
    return this.props
      .removeInventory(
        _.omit(values, ['canExpire', 'dateAdjustedFrom', 'dateAdjustedTo'])
      )
      .then(this.adjustInventorySucceeded)
  }

  handleTransferInventorySubmit = values =>
    this.props
      .transferInventory(_.omit(values, ['canExpire']))
      .then(this.adjustInventorySucceeded)

  handleReceiveInventorySubmit = values =>
    this.props
      .receiveInventory(_.omit(values, ['canExpire']))
      .then(this.adjustInventorySucceeded)

  renderInventoryLevelAdjustmentIconButtons = itemId => {
    const { intl, items } = this.props
    const item = items.getIn(['byId', itemId])
    return (
      <IconMenu
        iconButtonElement={
          <IconButton>
            <MoreVertIcon />
          </IconButton>
        }
        anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
        targetOrigin={{ horizontal: 'right', vertical: 'top' }}
        useLayerForClickAway
      >
        {item.get('inTransitFromSiteId') &&
          <MenuItem
            primaryText={intl.formatMessage(messages.receiveInventory)}
            leftIcon={<DoneIcon />}
            data-inventory-item-id={itemId}
            onTouchTap={this.handleShowReceiveInventoryDialog}
          />}
        {!item.get('inTransitFromSiteId') &&
          <MenuItem
            primaryText={intl.formatMessage(messages.addInventory)}
            leftIcon={<AddIcon />}
            data-inventory-item-id={itemId}
            onTouchTap={this.handleShowAddInventoryDialog}
          />}
        {!item.get('inTransitFromSiteId') &&
          <MenuItem
            primaryText={intl.formatMessage(messages.transferInventory)}
            leftIcon={<TransferIcon />}
            data-inventory-item-id={itemId}
            onTouchTap={this.handleShowTransferInventoryDialog}
          />}
        {!item.get('inTransitFromSiteId') &&
          <MenuItem
            primaryText={intl.formatMessage(messages.removeInventory)}
            leftIcon={<RemoveIcon />}
            data-inventory-item-id={itemId}
            onTouchTap={this.handleShowRemoveInventoryDialog}
          />}
      </IconMenu>
    )
  }

  render() {
    const {
      intl,
      items,
      table,
      hideAdjustInventoryDialog,
      inventoryAdjustment: { actionType, inventoryItemId },
    } = this.props
    const isSettledAndEmpty = !table.loading && items.currentIdList.isEmpty()

    const columns = [
      {
        fieldName: 'siteName',
        headerText: intl.formatMessage(messages.siteName),
      },
      {
        fieldName: 'consumableName',
        headerText: intl.formatMessage(messages.consumableName),
      },
      {
        fieldName: 'quantityOnHand',
        headerText: intl.formatMessage(messages.quantityOnHand),
        format: (data, item) => {
          if (item.get('inTransitFromSiteName')) {
            return (
              <span>
                {intl.formatNumber(data)}
                &nbsp;
                <small>
                  {intl.formatMessage(messages.inTransitFromSiteName, {
                    inTransitFromSiteName: item.get('inTransitFromSiteName'),
                  })}
                </small>
              </span>
            )
          }
          return intl.formatNumber(data)
        },
      },
      {
        fieldName: 'expiresOn',
        headerText: intl.formatMessage(messages.expiresOn),
        format: data =>
          data ? intl.formatDate(data, { format: 'user-timezone' }) : 'N/A',
      },
      {
        fieldName: 'expiresOn',
        headerText: intl.formatMessage(messages.expiresIn),
        format: data => (data ? intl.formatRelative(data) : 'Never'),
      },
    ]

    const inventoryItem = items.getIn(['byId', inventoryItemId], EMPTY_MAP)

    return (
      <div className={cssClasses('Content')}>
        <Helmet
          title={intl.formatMessage(messages.title)}
          titleTemplate="%s - Aspect"
          defaultTitle="Aspect"
        />
        <NavTitle title={intl.formatMessage(messages.title)} />
        <BrowseFilters
          history={this.props.history}
          location={this.props.location}
          intl={intl}
          dateFilterLabel={intl.formatMessage(messages.expiresOn)}
        />
        <Card>
          <Checkbox
            checked={table.get('groupBy').includes('siteId')}
            onCheck={this.groupBySiteChecked}
            label={intl.formatMessage(messages.groupBySite)}
            labelPosition="right"
            style={{ padding: '1em', width: '10em', display: 'inline-block' }}
          />
          <IconButton
            onTouchTap={this.props.showNewInventoryDialog}
            tooltip={intl.formatMessage(messages.addInventory)}
            style={{ float: 'right', margin: '0.3em 0 0', fontSize: 'auto' }}
          >
            <AddIcon />
          </IconButton>
        </Card>
        {isSettledAndEmpty && <EmptyList />}
        {!isSettledAndEmpty &&
          <GroupedDataTable
            handleFetch={this.handleFetch}
            items={items}
            table={table}
            columns={columns}
            intl={intl}
            messages={messages}
            actionComponent={this.renderInventoryLevelAdjustmentIconButtons}
          />}

        <NewInventoryDialogForm
          intl={intl}
          isDialogActive={actionType === types.SHOW_NEW_INVENTORY_DIALOG}
          onCancel={hideAdjustInventoryDialog}
          onSubmit={this.handleAddInventorySubmit}
        />
        <AddInventoryDialogForm
          intl={intl}
          inventoryItem={inventoryItem}
          isDialogActive={actionType === types.SHOW_ADD_INVENTORY_DIALOG}
          onCancel={hideAdjustInventoryDialog}
          onSubmit={this.handleAddInventorySubmit}
        />
        <RemoveInventoryDialogForm
          intl={intl}
          inventoryItem={inventoryItem}
          isDialogActive={actionType === types.SHOW_REMOVE_INVENTORY_DIALOG}
          onCancel={hideAdjustInventoryDialog}
          onSubmit={this.handleRemoveInventorySubmit}
        />
        <TransferInventoryDialogForm
          intl={intl}
          inventoryItem={inventoryItem}
          isDialogActive={actionType === types.SHOW_TRANSFER_INVENTORY_DIALOG}
          onCancel={hideAdjustInventoryDialog}
          onSubmit={this.handleTransferInventorySubmit}
        />
        <ReceiveInventoryDialogForm
          intl={intl}
          inventoryItem={inventoryItem}
          isDialogActive={actionType === types.SHOW_RECEIVE_INVENTORY_DIALOG}
          onCancel={hideAdjustInventoryDialog}
          onSubmit={this.handleReceiveInventorySubmit}
        />
      </div>
    )
  }
}

export default enhance(InventoryItemsList)
