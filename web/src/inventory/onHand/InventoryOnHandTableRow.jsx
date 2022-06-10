import React, { useState } from 'react'
import classnames from 'classnames/bind'
import isNull from 'lodash/isNull'
import TextField from '@material-ui/core/TextField'

import useI18n from '../../Hooks/i18n/useI18n'
import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'
import { formatDate } from '../../shared/utils/dateFormat'
import messages from '../list/messages'

import styles from '../../components/shared/DataTableRow.css'

const cssClasses = classnames.bind(styles)

const InventoryTableRow = ({ inventoryItem }) => {
  const { formatMessage, formatNumber } = useI18n()

  const [newQtyOnHand, setNewQtyOnHand] = useState(0)
  const [resultQtyOnHand, setResultQtyOnHand] = useState(0)
  const rowSpan = name => inventoryItem.getIn(['rowSpans', name])
  // helper funcs
  const hasQtyOnHand = qty =>
    isNull(qty) ? formatMessage(messages.notRecorded) : formatNumber(qty)

  const newQtyHandler = evt => {
    const qty = inventoryItem.get('quantityOnHand')
    const newQty = evt.target.value
    if (qty < newQty) {
      setResultQtyOnHand(newQty - qty)
    }
    setNewQtyOnHand(evt.target.value)
  }
  return (
    <TableRow className={cssClasses('TableRow')}>
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
      <TableCell
        className={cssClasses('TableCell')}
        rowSpan={rowSpan('newQuantityOnHand')}
      >
        <TextField
          autoFocus
          type="number"
          name="newQuantityOnHand"
          value={newQtyOnHand}
          onChange={newQtyHandler}
          margin="normal"
          FormHelperTextProps={{
            margin: 'dense',
          }}
        />
        {/* <span>{inventoryItem.get('newQuantityOnHand')}</span> */}
      </TableCell>
      <TableCell
        className={cssClasses('TableCell')}
        rowSpan={rowSpan('resultQuantityOnHand')}
      >
        <TextField
          value={resultQtyOnHand}
          type="number"
          name="resultQuantityOnHand"
          margin="normal"
          disabled
        />
        {/* <span>{inventoryItem.get('resultQuantityOnHand')}</span> */}
      </TableCell>
    </TableRow>
  )
}

export default InventoryTableRow
