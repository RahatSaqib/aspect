import React from 'react'
import classnames from 'classnames/bind'
import { useDispatch } from 'react-redux'
import isNull from 'lodash/isNull'
import round from 'lodash/round'

import useI18n from '../../Hooks/i18n/useI18n'
import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'
import { formatDate } from '../../shared/utils/dateFormat'
import messages from './messages'
import {
  showAddInventoryDialog,
  showRemoveInventoryDialog,
  showTransferInventoryDialog,
  showReceiveInventoryDialog,
} from '../InventoryRedux'
import AspectVertMenu from '../../MigratedComponents/AspectVertMenu'

import styles from '../../components/shared/DataTableRow.css'
import PermissionsProvider from '../../Providers/PermissionsProvider'

const cssClasses = classnames.bind(styles)

const InventoryTableRow = ({
  inventoryItem,
  breakOutByLot,
  navigate,
  location,
}) => {
  const { formatMessage, formatNumber } = useI18n()
  const dispatch = useDispatch()

  const getActions = isInTransit => [
    {
      icon: 'FaCheck',
      text: formatMessage(messages.receiveInventory),
      disabled: !isInTransit,
      action: ({ inventoryItemId }) =>
        dispatch(showReceiveInventoryDialog(inventoryItemId)),
    },
    {
      icon: 'FaPlus',
      text: formatMessage(messages.addInventory),
      disabled: isInTransit,
      action: ({ inventoryItemId }) =>
        dispatch(showAddInventoryDialog(inventoryItemId)),
    },
    {
      icon: 'FaExchangeAlt',
      text: formatMessage(messages.transferInventory),
      disabled: isInTransit,
      action: ({ inventoryItemId }) =>
        dispatch(showTransferInventoryDialog(inventoryItemId)),
    },
    {
      icon: 'FaMinus',
      text: formatMessage(messages.removeInventory),
      disabled: isInTransit,
      action: ({ inventoryItemId }) =>
        dispatch(showRemoveInventoryDialog(inventoryItemId)),
    },
    {
      icon: 'FaSquare',
      text: formatMessage(messages.inventoryOnHand),
      disabled: isInTransit || breakOutByLot,
      action: ({ inventoryItem }) => {
        const siteId = inventoryItem.get('siteId')
        const consumableId = inventoryItem.get('consumableId')
        navigate(
          {
            ...location,
            pathname: `/browse/inventory/onHand/${siteId}/${consumableId}`,
          },
          { replace: true }
        )
      },
    },
  ]

  const rowSpan = name => inventoryItem.getIn(['rowSpans', name])
  // helper funcs
  const hasQtyOnHand = qty =>
    isNull(qty) ? formatMessage(messages.notRecorded) : formatNumber(qty)
  const hasDailyConsumption = qty =>
    isNull(qty)
      ? formatMessage(messages.noConsumption)
      : formatNumber(round(qty, 2))

  return (
    <TableRow className={cssClasses('TableRow')}>
      <TableCell
        className={cssClasses('TableCell')}
        rowSpan={rowSpan('siteName')}
      >
        {inventoryItem.get('siteName')}
      </TableCell>

      <TableCell
        className={cssClasses('TableCell')}
        rowSpan={rowSpan('consumableName')}
      >
        {inventoryItem.get('consumableName')}
      </TableCell>
      <TableCell
        className={cssClasses('TableCell')}
        rowSpan={rowSpan('quantityOnHand')}
      >
        {inventoryItem.get('inTransitFromSiteName') ? (
          <span>
            {hasQtyOnHand(inventoryItem.get('quantityOnHand'))}
            &nbsp;
            <small>
              {formatMessage(messages.inTransitFromSiteName, {
                inTransitFromSiteName: inventoryItem.get(
                  'inTransitFromSiteName'
                ),
              })}
            </small>
          </span>
        ) : (
          <span>
            {hasQtyOnHand(inventoryItem.get('quantityOnHand'))}
            &nbsp;
            <small>
              {inventoryItem.get('pendingTransfers')
                ? formatMessage(messages.excludedLotInTransit, {
                    pendingTransfers: inventoryItem.get('pendingTransfers'),
                    pendingTransfersQuantityOnHand: inventoryItem.get(
                      'pendingTransfersQuantityOnHand'
                    ),
                  })
                : null}
            </small>
          </span>
        )}
      </TableCell>
      {inventoryItem.get('dailyConsumptionRate') !== undefined ? (
        <TableCell
          className={cssClasses('TableCell')}
          rowSpan={rowSpan('dailyConsumptionRate')}
        >
          {hasDailyConsumption(inventoryItem.get('dailyConsumptionRate'))}
        </TableCell>
      ) : null}
      {inventoryItem.get('lotNumber') !== undefined ? (
        <TableCell
          className={cssClasses('TableCell')}
          rowSpan={rowSpan('lotNumber')}
        >
          {inventoryItem.get('lotNumber')
            ? inventoryItem.get('lotNumber')
            : 'N/A'}
        </TableCell>
      ) : null}
      {inventoryItem.get('expiresOn') !== undefined ? (
        <TableCell
          className={cssClasses('TableCell')}
          rowSpan={rowSpan('expiresOn')}
        >
          <span
            className={
              inventoryItem.get('expiresOn') !== null &&
              new Date(inventoryItem.get('expiresOn')) < new Date()
                ? cssClasses('alert')
                : null
            }
          >
            {inventoryItem.get('expiresOn')
              ? formatDate(inventoryItem.get('expiresOn'))
              : 'N/A'}
          </span>
        </TableCell>
      ) : null}
      {inventoryItem.get('daysStockLeft') !== undefined ? (
        <TableCell
          className={cssClasses('TableCell')}
          rowSpan={rowSpan('daysStockLeft')}
        >
          {inventoryItem.get('daysStockLeft') !== null
            ? round(inventoryItem.get('daysStockLeft'), 2)
            : 'N/A'}
        </TableCell>
      ) : null}
      {inventoryItem.get('projectedWaste') !== undefined ? (
        <TableCell
          className={cssClasses('TableCell')}
          rowSpan={rowSpan('projectedWaste')}
        >
          {inventoryItem.get('projectedWaste') !== null
            ? round(inventoryItem.get('projectedWaste'), 2)
            : 'N/A'}
        </TableCell>
      ) : null}
      {
        <PermissionsProvider permissions={['inventory:edit']}>
          <TableCell className={cssClasses('TableCell')}>
            <AspectVertMenu
              params={{
                inventoryItemId: inventoryItem.get('id'),
                inventoryItem,
              }}
              actions={getActions(inventoryItem.get('inTransitFromSiteId'))}
            />
          </TableCell>
        </PermissionsProvider>
      }
    </TableRow>
  )
}

export default InventoryTableRow
