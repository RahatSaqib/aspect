import _ from 'lodash'
import Immutable from 'immutable'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withHandlers, lifecycle, pure } from 'recompose'
import { injectIntl, defineMessages } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import { Card } from 'react-toolbox/lib/card'
import { Checkbox } from 'react-toolbox/lib/checkbox'
import { IconButton } from 'react-toolbox/lib/button'
import withTooltip from 'react-toolbox/lib/tooltip'
import { ProgressBar } from 'react-toolbox/lib/progress_bar'
import { IconMenu, MenuItem } from 'react-toolbox/lib/menu'
import MdAdd from 'react-icons/lib/md/add'
import MdTransfer from 'react-icons/lib/md/swap-horiz'
import MdRemove from 'react-icons/lib/md/remove'
import MdDone from 'react-icons/lib/md/done'
import MdMoreVert from 'react-icons/lib/md/more-vert'

import NavTitle from '../../globals/components/NavTitle'
import BrowseFilters from '../../globals/components/BrowseFilters'
import EmptyList from '../../components/shared/EmptyList'
import TablePaginator from '../../components/shared/TablePaginator'
import { showAcknowledgement } from '../../appNotification/AppNotificationRedux'
import { configureListFilter } from '../../filter/FilterRedux'
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
import {
  InventoryDataTable,
  InventoryDataTableHead,
  InventoryDataTableRow,
} from './InventoryDataTable'

const cssClasses = classnames.bind(require('./InventoryItemsList.css'))

const TooltipIconButton = withTooltip(IconButton)

const EMPTY_MAP = Immutable.Map()

const messages = defineMessages({
  inventoryItemsTitle: {
    id: 'pages.InventoryItemsList.inventoryItemsTitle',
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
  paginatorStatus: {
    id: 'pages.InventoryItemsList.paginatorStatus',
    defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# supply}
      other {# supplies}
    }`,
  },

  inventoryAdjustedSuccessfully: {
    id: 'pages.InventoryItemsList.inventoryAdjustedSuccessfully',
    defaultMessage: 'Inventory levels have been adjusted successfully',
  },
})

const enhance = compose(
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
  withHandlers({
    onHeadColumnClick: ({ fetchListFilteredInventoryItems, table }) => ({
      currentTarget: { dataset: { column: nextSortCol } },
    }) =>
      fetchListFilteredInventoryItems(
        nextSortCol,
        table.sortCol === nextSortCol
          ? table.sortDir === 'asc' ? 'desc' : 'asc'
          : table.sortDir,
        table.page,
        table.pageSize
      ),
    onPageChange: ({ fetchListFilteredInventoryItems, table }) => nextPage =>
      fetchListFilteredInventoryItems(
        table.sortCol,
        table.sortDir,
        nextPage,
        table.pageSize
      ),
    onPageSizeChange: ({
      fetchListFilteredInventoryItems,
      table,
    }) => nextPageSize =>
      fetchListFilteredInventoryItems(
        table.sortCol,
        table.sortDir,
        0,
        nextPageSize
      ),
  }),
  lifecycle({
    componentWillMount() {
      this.props.configureListFilter({
        consumable: true,
        geography: true,
        siteName: true,
        date: true,
      })
    },

    componentDidMount() {
      this.props.onPageChange(0)
    },

    componentWillReceiveProps(nextProps) {
      if (this.props.listFilter !== nextProps.listFilter) {
        this.props.onPageChange(0)
      }
    },
  }),
  withHandlers({
    onAdjustInventorySucceeded: ({
      table,
      showAcknowledgement,
      onPageChange,
    }) => () => {
      showAcknowledgement({
        title: messages.inventoryAdjustedSuccessfully,
      })
      onPageChange(table.page)
    },
  }),
  withHandlers({
    onGroupBySiteChange: ({ toggleGroupBySite }) => isInputChecked => {
      toggleGroupBySite(isInputChecked)
    },

    onAddInventorySubmit: ({
      addInventory,
      onAdjustInventorySucceeded,
    }) => values =>
      addInventory(_.omit(values, ['canExpire'])).then(
        onAdjustInventorySucceeded
      ),

    onRemoveInventorySubmit: ({
      consumableReasons,
      removeInventory,
      onAdjustInventorySucceeded,
    }) => values => {
      const selectedAdjustmentReason = consumableReasons.items.find(
        reason => reason.get('id') === values.reasonId
      )
      if (
        selectedAdjustmentReason.get('i18nKey') === testConductedReasonI18nKey
      ) {
        return removeInventory(
          _.omit(values, ['canExpire', 'dateAdjusted'])
        ).then(onAdjustInventorySucceeded)
      }
      return removeInventory(
        _.omit(values, ['canExpire', 'dateAdjustedFrom', 'dateAdjustedTo'])
      ).then(onAdjustInventorySucceeded)
    },

    onTransferInventorySubmit: ({
      transferInventory,
      onAdjustInventorySucceeded,
    }) => values =>
      transferInventory(_.omit(values, ['canExpire'])).then(
        onAdjustInventorySucceeded
      ),

    onReceiveInventorySubmit: ({
      receiveInventory,
      onAdjustInventorySucceeded,
    }) => values =>
      receiveInventory(_.omit(values, ['canExpire'])).then(
        onAdjustInventorySucceeded
      ),
  })
)

const makeOnInventoryItemActionSelect = inventoryItemId => showDialogFn =>
  showDialogFn(inventoryItemId)

export const InventoryItemsList = ({
  intl,
  history,
  location,
  table,
  items,
  inventoryAdjustment,
  showNewInventoryDialog,
  showReceiveInventoryDialog,
  showAddInventoryDialog,
  showTransferInventoryDialog,
  showRemoveInventoryDialog,
  hideAdjustInventoryDialog,
  //
  onHeadColumnClick,
  onPageChange,
  onPageSizeChange,
  // -- extra --
  onGroupBySiteChange,
  onAddInventorySubmit,
  onRemoveInventorySubmit,
  onTransferInventorySubmit,
  onReceiveInventorySubmit,
}) =>
  <div className={cssClasses('Container')}>
    <Helmet
      title={intl.formatMessage(messages.inventoryItemsTitle)}
      titleTemplate="%s - Aspect"
      defaultTitle="Aspect"
    />
    <NavTitle title={intl.formatMessage(messages.inventoryItemsTitle)} />
    <BrowseFilters
      history={history}
      location={location}
      intl={intl}
      dateFilterLabel={intl.formatMessage(messages.expiresOn)}
    />
    <Card className={cssClasses('Card', 'Card--action')}>
      <Checkbox
        className={cssClasses('Checkbox')}
        name="groupBySite"
        checked={table.get('groupBy').includes('siteId')}
        onChange={onGroupBySiteChange}
        label={intl.formatMessage(messages.groupBySite)}
      />
      <TooltipIconButton
        theme={{
          tooltip: cssClasses('TooltipIconButton__tooltip'),
          toggle: cssClasses('TooltipIconButton__toggle'),
        }}
        icon={<MdAdd />}
        tooltip={intl.formatMessage(messages.addInventory)}
        onClick={showNewInventoryDialog}
      />
    </Card>
    {items.currentIdList.isEmpty() && <EmptyList />}
    {!items.currentIdList.isEmpty() &&
      <Card className={cssClasses('Card')}>
        <ProgressBar
          mode={table.loading ? 'indeterminate' : 'determinate'}
          disabled={!table.loading}
          className={cssClasses('ProgressBar')}
          theme={{
            indeterminate: cssClasses('ProgressBar--indeterminate'),
          }}
        />
        <InventoryDataTable
          selectable={false}
          className={cssClasses('InventoryDataTable')}
        >
          <InventoryDataTableHead
            sortColumnKey={table.sortCol}
            sortColumnDir={table.sortDir}
            columns={[
              {
                key: 'siteName',
                label: intl.formatMessage(messages.siteName),
                onClick: onHeadColumnClick,
              },
              {
                key: 'consumableName',
                label: intl.formatMessage(messages.consumableName),
                onClick: onHeadColumnClick,
              },
              {
                key: 'quantityOnHand',
                label: intl.formatMessage(messages.quantityOnHand),
                onClick: onHeadColumnClick,
              },
              {
                key: 'expiresOn',
                label: intl.formatMessage(messages.expiresOn),
                onClick: onHeadColumnClick,
              },
              {
                key: 'expiresIn',
                label: intl.formatMessage(messages.expiresIn),
                'data-column': 'expiresOn',
                onClick: onHeadColumnClick,
              },
              {
                key: 'action',
              },
            ]}
          />
          {items.currentIdList
            .map(id => items.byId.get(id))
            .map(inventoryItem =>
              <InventoryDataTableRow
                key={inventoryItem.get('id')}
                intl={intl}
                inventoryItem={inventoryItem}
              >
                <IconMenu
                  icon={<MdMoreVert />}
                  position="topRight"
                  onSelect={makeOnInventoryItemActionSelect(
                    inventoryItem.get('id')
                  )}
                >
                  {inventoryItem.get('inTransitFromSiteId') &&
                    <MenuItem
                      value={showReceiveInventoryDialog}
                      icon={<MdDone />}
                      caption={intl.formatMessage(messages.receiveInventory)}
                    />}
                  {!inventoryItem.get('inTransitFromSiteId') &&
                    <MenuItem
                      value={showAddInventoryDialog}
                      icon={<MdAdd />}
                      caption={intl.formatMessage(messages.addInventory)}
                    />}

                  {!inventoryItem.get('inTransitFromSiteId') &&
                    <MenuItem
                      value={showTransferInventoryDialog}
                      icon={<MdTransfer />}
                      caption={intl.formatMessage(messages.transferInventory)}
                    />}
                  {!inventoryItem.get('inTransitFromSiteId') &&
                    <MenuItem
                      value={showRemoveInventoryDialog}
                      icon={<MdRemove />}
                      caption={intl.formatMessage(messages.removeInventory)}
                    />}
                </IconMenu>
              </InventoryDataTableRow>
            )}
        </InventoryDataTable>
        <TablePaginator
          className={cssClasses('TablePaginator')}
          intl={intl}
          paginatorStatus={messages.paginatorStatus}
          page={table.page}
          pageSize={table.pageSize}
          total={table.total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </Card>}
    <NewInventoryDialogForm
      intl={intl}
      isDialogActive={
        inventoryAdjustment.get('actionType') ===
        types.SHOW_NEW_INVENTORY_DIALOG
      }
      onCancel={hideAdjustInventoryDialog}
      onSubmit={onAddInventorySubmit}
    />
    <AddInventoryDialogForm
      intl={intl}
      inventoryItem={items.getIn(
        ['byId', inventoryAdjustment.get('inventoryItemId')],
        EMPTY_MAP
      )}
      isDialogActive={
        inventoryAdjustment.get('actionType') ===
        types.SHOW_ADD_INVENTORY_DIALOG
      }
      onCancel={hideAdjustInventoryDialog}
      onSubmit={onAddInventorySubmit}
    />
    <RemoveInventoryDialogForm
      intl={intl}
      inventoryItem={items.getIn(
        ['byId', inventoryAdjustment.get('inventoryItemId')],
        EMPTY_MAP
      )}
      isDialogActive={
        inventoryAdjustment.get('actionType') ===
        types.SHOW_REMOVE_INVENTORY_DIALOG
      }
      onCancel={hideAdjustInventoryDialog}
      onSubmit={onRemoveInventorySubmit}
    />
    <TransferInventoryDialogForm
      intl={intl}
      inventoryItem={items.getIn(
        ['byId', inventoryAdjustment.get('inventoryItemId')],
        EMPTY_MAP
      )}
      isDialogActive={
        inventoryAdjustment.get('actionType') ===
        types.SHOW_TRANSFER_INVENTORY_DIALOG
      }
      onCancel={hideAdjustInventoryDialog}
      onSubmit={onTransferInventorySubmit}
    />
    <ReceiveInventoryDialogForm
      intl={intl}
      inventoryItem={items.getIn(
        ['byId', inventoryAdjustment.get('inventoryItemId')],
        EMPTY_MAP
      )}
      isDialogActive={
        inventoryAdjustment.get('actionType') ===
        types.SHOW_RECEIVE_INVENTORY_DIALOG
      }
      onCancel={hideAdjustInventoryDialog}
      onSubmit={onReceiveInventorySubmit}
    />
  </div>

export default enhance(InventoryItemsList)
