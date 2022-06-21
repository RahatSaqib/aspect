import React, { useState } from 'react'
import classnames from 'classnames/bind'
import isNull from 'lodash/isNull'
import TextField from '@material-ui/core/TextField'
import { useDispatch } from 'react-redux'
import { useMutation } from 'react-query'

import useI18n from '../../Hooks/i18n/useI18n'
import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'
import { formatDate } from '../../shared/utils/dateFormat'
import messages from '../list/messages'
import styles from '../../components/shared/DataTableRow.css'

import { modifyInventoryOnHand } from '../InventoryRedux'

const cssClasses = classnames.bind(styles)

const InventoryTableRow = ({ inventoryItem, refreshData }) => {
  const { formatMessage, formatNumber } = useI18n()
  const [newQtyOnHand, setNewQtyOnHand] = useState('')
  const [resultQtyOnHand, setResultQtyOnHand] = useState('')
  const [notes, setNotes] = useState('')
  const [isAdd, setIsAdd] = useState(false)
  const dispatch = useDispatch()

  const rowSpan = name => inventoryItem.getIn(['rowSpans', name])
  // helper funcs
  const hasQtyOnHand = qty =>
    isNull(qty) ? formatMessage(messages.notRecorded) : formatNumber(qty)

  const newQtyHandler = evt => {
    if (!evt.target.value) {
      return setNewQtyOnHand('')
    }
    const qty = parseInt(inventoryItem.get('quantityOnHand'), 10)
    const newQty = parseInt(evt.target.value, 10)
    if (qty === newQty) {
      setResultQtyOnHand(newQty)
    } else if (qty > newQty) {
      setResultQtyOnHand(newQty - qty)
      setIsAdd(false)
    } else {
      setResultQtyOnHand(newQty + qty)
      setIsAdd(true)
    }
    setNewQtyOnHand(newQty)
  }

  const { mutate: onModifyInventoryOnHandSubmit } = useMutation(
    values => modifyInventoryOnHand(values, dispatch, inventoryItem),
    {
      onSuccess: async () => {
        await refreshData()
        setNewQtyOnHand(0)
        setResultQtyOnHand(0)
        setNotes('')
      },
    }
  )

  const updateInventoryOnBlur = async () => {
    const qty = parseInt(inventoryItem.get('quantityOnHand'), 10)
    const newQty = parseInt(newQtyOnHand, 10)
    if (qty !== newQty && notes && notes.length >= 5) {
      onModifyInventoryOnHandSubmit({
        quantity: newQty,
        isAdd,
        notes,
        expiresOn: inventoryItem.get('expiresOn'),
      })
    }
  }

  return (
    <TableRow onBlur={updateInventoryOnBlur} className={cssClasses('TableRow')}>
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
      </TableCell>
      <TableCell
        className={cssClasses('TableCell')}
        rowSpan={rowSpan('quantityOnHandNote')}
      >
        <TextField
          value={notes}
          error={!!newQtyOnHand && notes.length < 5}
          type="text"
          name="resultQuantityOnHand"
          margin="normal"
          helperText={formatMessage(messages.inventoryOnMandatoryNote)}
          onChange={evt => setNotes(evt.target.value)}
        />
      </TableCell>
    </TableRow>
  )
}

export default InventoryTableRow
