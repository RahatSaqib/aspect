import React from 'react'
import classnames from 'classnames/bind'
import { useDispatch } from 'react-redux'
import { useIntl } from 'react-intl'

import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'
import { formatDate, formatRelative } from '../../shared/utils/dateFormat'
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

const InventoryTableRow = ({ inventoryItem, ...restProps }) => {
  const intl = useIntl()
  const dispatch = useDispatch()

  const actions = [
    {
      icon: 'FaCheck',
      text: intl.formatMessage(
        messages.receiveInventory
      ),
      action: ({ inventoryItemId }) => dispatch(showReceiveInventoryDialog(inventoryItemId))
    },
    {
      icon: 'FaPlus',
      text: intl.formatMessage(messages.addInventory),
      action: ({ inventoryItemId }) => dispatch(showAddInventoryDialog(inventoryItemId))
    },
    {
      icon: 'FaExchangeAlt',
      text: intl.formatMessage(
        messages.transferInventory
      ),
      action: ({ inventoryItemId }) => dispatch(showTransferInventoryDialog(inventoryItemId))
    },
    {
      icon: 'FaMinus',
      text: intl.formatMessage(
        messages.removeInventory
      ),
      action: ({ inventoryItemId }) => dispatch(showRemoveInventoryDialog(inventoryItemId))
    },
  ]

  return (
    <TableRow
      {...restProps}
      className={cssClasses(restProps.className, 'TableRow')}
    >
      {inventoryItem.get('visibleProperties').includes('siteName') && (
        <TableCell
          className={cssClasses('TableCell')}
          rowSpan={inventoryItem.getIn(['rowSpans', 'siteName'])}
        >
          {inventoryItem.get('siteName')}
        </TableCell>
      )}
      {inventoryItem.get('visibleProperties').includes('consumableName') && (
        <TableCell
          className={cssClasses('TableCell')}
          rowSpan={inventoryItem.getIn(['rowSpans', 'consumableName'])}
        >
          {inventoryItem.get('consumableName')}
        </TableCell>
      )}
      {inventoryItem.get('visibleProperties').includes('quantityOnHand') && (
        <TableCell
          className={cssClasses('TableCell')}
          rowSpan={inventoryItem.getIn(['rowSpans', 'quantityOnHand'])}
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
      )}
      {inventoryItem.get('visibleProperties').includes('expiresOn') && (
        <TableCell
          className={cssClasses('TableCell')}
          rowSpan={inventoryItem.getIn(['rowSpans', 'expiresOn'])}
        >
          {inventoryItem.get('expiresOn')
            ? formatDate(inventoryItem.get('expiresOn'))
            : 'N/A'}
        </TableCell>
      )}
      {inventoryItem.get('visibleProperties').includes('expiresOn') && (
        <TableCell
          className={cssClasses('TableCell')}
          rowSpan={inventoryItem.getIn(['rowSpans', 'expiresOn'])}
        >
          {inventoryItem.get('expiresOn')
            ? formatRelative(intl, inventoryItem.get('expiresOn'))
            : intl.formatMessage(messages.never)}
        </TableCell>
      )}
      <TableCell className={cssClasses('TableCell')}>
        <AspectVertMenu params={{ inventoryItemId: inventoryItem.get('id') }} actions={actions} />
      </TableCell>
    </TableRow>
  )
}

export default InventoryTableRow
