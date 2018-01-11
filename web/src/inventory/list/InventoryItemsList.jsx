import _ from 'lodash'
import Immutable from 'immutable'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withProps, withHandlers, lifecycle } from 'recompose'
import { defineMessages } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import { Checkbox } from 'react-toolbox/lib/checkbox'
import { IconButton } from 'react-toolbox/lib/button'
import withTooltip from 'react-toolbox/lib/tooltip'
import { IconMenu, MenuItem } from 'react-toolbox/lib/menu'
import MdAdd from 'react-icons/lib/md/add'
import MdTransfer from 'react-icons/lib/md/swap-horiz'
import MdRemove from 'react-icons/lib/md/remove'
import MdDone from 'react-icons/lib/md/done'
import MdMoreVert from 'react-icons/lib/md/more-vert'

import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../shared/selectors/searchParams'
import { sanitizeFiltersStringBy } from '../../filter/utils'
import NavTitle from '../../globals/components/NavTitle'
import BrowseFilters from '../../globals/components/BrowseFilters'
import BrowseEmptyList from '../../globals/components/BrowseEmptyList'
import BrowseTablePaginator from '../../globals/components/BrowseTablePaginator'
import DataTableCard from '../../components/shared/DataTableCard'
import DataTableProgressBar from '../../components/shared/DataTableProgressBar'
import { showAcknowledgement } from '../../appNotification/AppNotificationRedux'
import { testConductedReasonI18nKey } from '../adjustment/InventoryAdjustmentDialogForm'
import NewInventoryDialogForm from '../adjustment/NewInventoryDialogForm'
import AddInventoryDialogForm from '../adjustment/AddInventoryDialogForm'
import ReceiveInventoryDialogForm from '../adjustment/ReceiveInventoryDialogForm'
import RemoveInventoryDialogForm from '../adjustment/RemoveInventoryDialogForm'
import TransferInventoryDialogForm from '../adjustment/TransferInventoryDialogForm'
import {
  types,
  fetchInventoryItems,
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

const FILTERS_CONFIG = {
  consumable: true,
  geography: true,
  state: true,
  lga: true,
  siteName: true,
  date: true,
}

const searchSanitizer = makeSearchParamsSanitizer({
  availableSortCol: [
    'siteName',
    'consumableName',
    'quantityOnHand',
    'expiresOn',
  ],
})
const filtersSanitizer = sanitizeFiltersStringBy(FILTERS_CONFIG)
const filtersFromLocation = composeSanitizer(
  _.flowRight(
    filtersSanitizer,
    searchParams => searchParams.get('filters') || ''
  ),
  searchSanitizer
)

const enhance = compose(
  withProps(
    makeSortPageSelector({
      sortCol: 'siteName',
    })
  ),
  connect(
    state => ({
      consumableReasons: state.consumable.consumableReasons,
      items: state.inventory.items,
      table: state.inventory.table,
      inventoryAdjustment: state.inventory.inventoryAdjustment,
    }),
    bindActionCreators.bind(null, {
      showAcknowledgement,

      fetchInventoryItems,
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
    onInitialLoad: ({
      location,
      fetchInventoryItems,
      sortCol,
      sortDir,
      pageAt,
      pageSize,
    }) => () => {
      const { sanitized, value: filtersParams } = filtersFromLocation(location)
      if (!sanitized) {
        fetchInventoryItems(filtersParams, sortCol, sortDir, pageAt, pageSize)
      }
    },
  }),
  lifecycle({
    componentWillMount() {
      const { sanitized, value: searchParams } = searchSanitizer(
        this.props.location
      )
      const {
        sanitized: filtersSanitized,
        value: filtersParams,
      } = filtersSanitizer(searchParams.get('filters') || '')
      if (sanitized || filtersSanitized) {
        searchParams.set('filters', filtersParams)

        this.props.history.replace({
          ...this.props.location,
          search: searchParams.toString(),
        })
      }
    },

    componentDidMount() {
      this.props.onInitialLoad()
    },

    componentWillReceiveProps(nextProps) {
      if (this.props.location.search !== nextProps.location.search) {
        this.props.onInitialLoad()
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
    onGroupBySiteChange: ({
      toggleGroupBySite,
      onInitialLoad,
    }) => isInputChecked => {
      toggleGroupBySite(isInputChecked)
      onInitialLoad()
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

const themes = {
  TooltipIconButton: {
    tooltip: cssClasses('TooltipIconButton__tooltip'),
    toggle: cssClasses('TooltipIconButton__toggle'),
  },
}

export const InventoryItemsList = ({
  intl,
  history,
  location,
  table,
  items,
  inventoryAdjustment,
  // --- injected by recompose ---
  sortCol,
  sortDir,
  pageAt,
  pageSize,
  showNewInventoryDialog,
  showReceiveInventoryDialog,
  showAddInventoryDialog,
  showTransferInventoryDialog,
  showRemoveInventoryDialog,
  hideAdjustInventoryDialog,
  onGroupBySiteChange,
  onAddInventorySubmit,
  onRemoveInventorySubmit,
  onTransferInventorySubmit,
  onReceiveInventorySubmit,
}) => (
  <div className={cssClasses('Container')}>
    <Helmet title={intl.formatMessage(messages.inventoryItemsTitle)} />
    <NavTitle title={intl.formatMessage(messages.inventoryItemsTitle)} />
    <BrowseFilters
      history={history}
      location={location}
      intl={intl}
      config={FILTERS_CONFIG}
      dateFilterLabel={intl.formatMessage(messages.expiresOn)}
    />
    <DataTableCard className={cssClasses('DataTableCard--action')}>
      <Checkbox
        className={cssClasses('Checkbox')}
        name="groupBySite"
        checked={table.get('groupBy').includes('siteId')}
        onChange={onGroupBySiteChange}
        label={intl.formatMessage(messages.groupBySite)}
      />
      <TooltipIconButton
        theme={themes.TooltipIconButton}
        icon={<MdAdd />}
        tooltip={intl.formatMessage(messages.addInventory)}
        onClick={showNewInventoryDialog}
      />
    </DataTableCard>
    <DataTableCard className={cssClasses('DataTableCard--table')}>
      <DataTableProgressBar disabled={!table.loading} />
      {items.currentIdList.isEmpty() && (
        <BrowseEmptyList history={history} location={location} intl={intl} />
      )}
      {!items.currentIdList.isEmpty() && (
        <InventoryDataTable
          selectable={false}
          className={cssClasses('InventoryDataTable')}
        >
          <InventoryDataTableHead
            history={history}
            location={location}
            sortColumnKey={sortCol}
            sortColumnDir={sortDir}
            columns={[
              {
                key: 'siteName',
                label: intl.formatMessage(messages.siteName),
                sortable: true,
              },
              {
                key: 'consumableName',
                label: intl.formatMessage(messages.consumableName),
                sortable: true,
              },
              {
                key: 'quantityOnHand',
                label: intl.formatMessage(messages.quantityOnHand),
                sortable: true,
              },
              {
                key: 'expiresOn',
                label: intl.formatMessage(messages.expiresOn),
                sortable: true,
              },
              {
                key: 'expiresIn',
                label: intl.formatMessage(messages.expiresIn),
                'data-column': 'expiresOn',
                sortable: true,
              },
              {
                key: 'action',
              },
            ]}
          />
          {items.currentIdList
            .map(id => items.byId.get(id))
            .map(inventoryItem => (
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
                  {inventoryItem.get('inTransitFromSiteId') && (
                    <MenuItem
                      value={showReceiveInventoryDialog}
                      icon={<MdDone />}
                      caption={intl.formatMessage(messages.receiveInventory)}
                    />
                  )}
                  {!inventoryItem.get('inTransitFromSiteId') && (
                    <MenuItem
                      value={showAddInventoryDialog}
                      icon={<MdAdd />}
                      caption={intl.formatMessage(messages.addInventory)}
                    />
                  )}

                  {!inventoryItem.get('inTransitFromSiteId') && (
                    <MenuItem
                      value={showTransferInventoryDialog}
                      icon={<MdTransfer />}
                      caption={intl.formatMessage(messages.transferInventory)}
                    />
                  )}
                  {!inventoryItem.get('inTransitFromSiteId') && (
                    <MenuItem
                      value={showRemoveInventoryDialog}
                      icon={<MdRemove />}
                      caption={intl.formatMessage(messages.removeInventory)}
                    />
                  )}
                </IconMenu>
              </InventoryDataTableRow>
            ))}
        </InventoryDataTable>
      )}
      {!items.currentIdList.isEmpty() && (
        <BrowseTablePaginator
          history={history}
          location={location}
          intl={intl}
          paginatorStatus={messages.paginatorStatus}
          total={table.total}
          pageAt={pageAt}
          pageSize={pageSize}
        />
      )}
    </DataTableCard>
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
)

export default enhance(InventoryItemsList)
