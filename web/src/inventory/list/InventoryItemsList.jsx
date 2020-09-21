import flowRight from 'lodash/flowRight'
import fromPairs from 'lodash/fromPairs'
import omit from 'lodash/omit'
import Immutable from 'immutable'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withProps, withHandlers, lifecycle } from 'recompose'
import { injectIntl } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'

import TableBody from '@material-ui/core/TableBody'

import {
  makeSortPageSelector,
  makeSearchParamsSanitizer,
  composeSanitizer,
} from '../../shared/selectors/searchParams'
import {
  sanitizeFiltersStringBy,
  reduceFiltersConfig,
} from '../../filter/utils'
import CheckboxField from '../../components/shared/CheckboxField'
import NavTitle from '../../globals/components/NavTitle'
import BrowseFilters from '../../globals/components/BrowseFilters'
import BrowseEmptyList from '../../globals/components/BrowseEmptyList'
import BrowseTablePaginator from '../../globals/components/BrowseTablePaginator'
import DataTableCard from '../../components/shared/DataTableCard'
import ExportListButton from '../../globals/components/ExportListButton'
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
  exportSupplies,
} from '../InventoryRedux'
import {
  InventoryDataTable,
  InventoryDataTableHead,
  InventoryDataTableRow,
} from './InventoryDataTable'
import requirePermissions from '../../components/shared/requirePermissions'
import AspectButton from '../../components/shared/AspectButton'
import messages from './messages'

const cssClasses = classnames.bind(require('./InventoryItemsList.css'))

const EMPTY_MAP = Immutable.Map()

const FILTERS_CONFIG = [
  { consumable: true, requiredPermissions: [] },
  { geography: true, requiredPermissions: [] },
  { state: true, requiredPermissions: [] },
  { lga: true, requiredPermissions: [] },
  {
    siteName: true,
    requiredPermissions: ['site:view'],
  },
  { date: true, requiredPermissions: [] },
]

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
  flowRight(
    filtersSanitizer,
    searchParams => searchParams.get('filters') || ''
  ),
  searchSanitizer
)

const enhance = compose(
  injectIntl,
  withProps(
    makeSortPageSelector({
      sortCol: 'siteName',
    }),
    ({ location }) => {
      const searchParams = new URLSearchParams(location.search)
      const filtersParams = new URLSearchParams(
        searchParams.get('filters') || ''
      )
      return {
        filters: fromPairs([...filtersParams.entries()]),
      }
    }
  ),
  connect(
    state => ({
      consumableReasons: state.consumable.consumableReasons,
      items: state.inventory.items,
      table: state.inventory.table,
      inventoryAdjustment: state.inventory.inventoryAdjustment,
      userPermissions: state.user.jwt.permissions,
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

      exportSupplies,
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

    onExcelClick: ({
      location,
      exportSupplies,
      sortCol,
      sortDir,
      pageAt,
      table,
    }) => formatType => {
      const format = formatType.id
      const { sanitized, value: filtersParams } = filtersFromLocation(location)
      if (!sanitized) {
        exportSupplies(
          filtersParams,
          sortCol,
          sortDir,
          pageAt,
          table.get('total') > 0 ? table.get('total') : 1,
          format,
          'supplies'
        )
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
      const reducedFilters = reduceFiltersConfig(
        FILTERS_CONFIG,
        this.props.userPermissions
      )
      this.setState({
        reducedFilters,
      })
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
    onGroupBySiteChange: ({ toggleGroupBySite, onInitialLoad }) => (
      event,
      isInputChecked
    ) => {
      toggleGroupBySite(isInputChecked)
      onInitialLoad()
    },

    onAddInventorySubmit: ({
      addInventory,
      onAdjustInventorySucceeded,
    }) => values =>
      addInventory(omit(values, ['canExpire'])).then(
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
          omit(values, ['canExpire', 'dateAdjusted'])
        ).then(onAdjustInventorySucceeded)
      }
      return removeInventory(
        omit(values, ['canExpire', 'dateAdjustedFrom', 'dateAdjustedTo'])
      ).then(onAdjustInventorySucceeded)
    },

    onTransferInventorySubmit: ({
      transferInventory,
      onAdjustInventorySucceeded,
    }) => values =>
      transferInventory(omit(values, ['canExpire'])).then(
        onAdjustInventorySucceeded
      ),

    onReceiveInventorySubmit: ({
      receiveInventory,
      onAdjustInventorySucceeded,
    }) => values =>
      receiveInventory(omit(values, ['canExpire'])).then(
        onAdjustInventorySucceeded
      ),
  })
)

export const InventoryItemsList = ({
  intl,
  history,
  location,
  table,
  items,
  inventoryAdjustment,
  // --- injected by recompose ---
  onExcelClick,
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
  reducedFilters,
}) => {
  const AddNewButton = requirePermissions({
    permissions: ['inventory:edit'],
  })(AspectButton)
  return (
    <div className={cssClasses('Container')}>
      <Helmet title={intl.formatMessage(messages.inventoryItemsTitle)} />
      <NavTitle title={intl.formatMessage(messages.inventoryItemsTitle)} />
      <BrowseFilters
        history={history}
        location={location}
        intl={intl}
        config={reducedFilters}
        dateFilterLabel={intl.formatMessage(messages.expiresOn)}
      >
        <AddNewButton
          type="button"
          color="primary"
          variant="contained"
          onClick={showNewInventoryDialog}
          browseButton
        >
          {intl.formatMessage(messages.addInventory)}
        </AddNewButton>
      </BrowseFilters>

      <DataTableCard className={cssClasses('DataTableCard--action')}>
        <CheckboxField
          className={cssClasses('Checkbox')}
          name="groupBySite"
          checked={table.get('groupBy').includes('siteId')}
          label={intl.formatMessage(messages.groupBySite)}
          onChange={onGroupBySiteChange}
        />
      </DataTableCard>
      <DataTableCard
        key={`DataTableCard--table-${location.key}`}
        className={cssClasses('DataTableCard--table')}
      >
        <DataTableProgressBar disabled={!table.loading} />
        <ExportListButton
          onExcelClick={onExcelClick}
          onCsvClick={onExcelClick}
          visible={!items.currentIdList.isEmpty()}
          reportName="Supplies"
        />
        {items.currentIdList.isEmpty() && (
          <BrowseEmptyList history={history} location={location} intl={intl} />
        )}
        {!items.currentIdList.isEmpty() && (
          <InventoryDataTable className={cssClasses('InventoryDataTable')}>
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
            <TableBody>
              {items.currentIdList
                .map(id => items.byId.get(id))
                .map(inventoryItem => (
                  <InventoryDataTableRow
                    key={inventoryItem.get('id')}
                    inventoryItem={inventoryItem}
                  />
                ))}
            </TableBody>
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
}

export default enhance(InventoryItemsList)
