import React from 'react'
import classnames from 'classnames/bind'
import { useDispatch } from 'react-redux'
import { useIntl } from 'react-intl'

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

const cssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const InventoryTableRow = ({ inventoryItem, key }) => {
  const intl = useIntl()
  const dispatch = useDispatch()

  const getActions = isInTransit => [
    {
      icon: 'FaCheck',
      text: intl.formatMessage(messages.receiveInventory),
      disabled: !isInTransit,
      action: ({ inventoryItemId }) =>
        dispatch(showReceiveInventoryDialog(inventoryItemId)),
    },
    {
      icon: 'FaPlus',
      text: intl.formatMessage(messages.addInventory),
      disabled: isInTransit,
      action: ({ inventoryItemId }) =>
        dispatch(showAddInventoryDialog(inventoryItemId)),
    },
    {
      icon: 'FaExchangeAlt',
      text: intl.formatMessage(messages.transferInventory),
      disabled: isInTransit,
      action: ({ inventoryItemId }) =>
        dispatch(showTransferInventoryDialog(inventoryItemId)),
    },
    {
      icon: 'FaMinus',
      text: intl.formatMessage(messages.removeInventory),
      disabled: isInTransit,
      action: ({ inventoryItemId }) =>
        dispatch(showRemoveInventoryDialog(inventoryItemId)),
    },
  ]

  // helper funcs
  const hasProp = name => inventoryItem.get('visibleProperties').includes(name)
  const rowSpan = name => inventoryItem.getIn(['rowSpans', name])

  return (
    <TableRow key={key} className={cssClasses('TableRow')}>
      {hasProp('siteName') ? (
        <TableCell
          className={cssClasses('TableCell')}
          rowSpan={rowSpan('siteName')}
        >
          {inventoryItem.get('siteName')}
        </TableCell>
      ) : null}
      {hasProp('consumableName') ? (
        <TableCell
          className={cssClasses('TableCell')}
          rowSpan={rowSpan('consumableName')}
        >
          {inventoryItem.get('consumableName')}
        </TableCell>
      ) : null}
      {hasProp('quantityOnHand') ? (
        <TableCell
          className={cssClasses('TableCell')}
          rowSpan={rowSpan('quantityOnHand')}
        >
          {inventoryItem.get('inTransitFromSiteName') ? (
            <span>
              {intl.formatNumber(inventoryItem.get('quantityOnHand'))}
              &nbsp;
              <small>
                {intl.formatMessage(messages.inTransitFromSiteName, {
                  inTransitFromSiteName: inventoryItem.get(
                    'inTransitFromSiteName'
                  ),
                })}
              </small>
            </span>
          ) : (
            inventoryItem.get('quantityOnHand')
          )}
        </TableCell>
      ) : null}
      {hasProp('expiresOn') ? (
        <TableCell
          className={cssClasses('TableCell')}
          rowSpan={rowSpan('expiresOn')}
        >
          <span
            className={
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
      {hasProp('stockLeft') ? (
        <TableCell
          className={cssClasses('TableCell')}
          rowSpan={rowSpan('stockLeft')}
        >
          {inventoryItem.get('stockLeft')}
        </TableCell>
      ) : null}
      <TableCell className={cssClasses('TableCell')}>
        <AspectVertMenu
          params={{ inventoryItemId: inventoryItem.get('id') }}
          actions={getActions(inventoryItem.get('inTransitFromSiteId'))}
        />
      </TableCell>
    </TableRow>
  )
}

export default InventoryTableRow
