import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { defineMessages } from 'react-intl'
import { TableRow, TableCell } from 'react-toolbox/lib/table'

import { formatDate } from '../../shared/utils/dateFormat'

const cssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const messages = defineMessages({
  inTransitFromSiteName: {
    id: 'pages.InventoryItemsList.inTransitFromSiteName',
    defaultMessage: '* in transit from {inTransitFromSiteName}',
  },
  never: {
    id: 'pages.InventoryItemsList.never',
    defaultMessage: 'Never',
  },
})

const enhance = _.identity

const InventoryTableRow = ({ intl, inventoryItem, children, ...restProps }) => (
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
          ? intl.formatRelative(inventoryItem.get('expiresOn'))
          : intl.formatMessage(messages.never)}
      </TableCell>
    )}
    <TableCell className={cssClasses('TableCell')}>{children}</TableCell>
  </TableRow>
)

export default enhance(InventoryTableRow)
