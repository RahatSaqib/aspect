import React, { useState } from 'react'
import classnames from 'classnames/bind'
import isNull from 'lodash/isNull'
import TextField from '@material-ui/core/TextField'

import { useMutation } from 'react-query'
import Fade from '@material-ui/core/Fade'
import CancelSharpIcon from '@material-ui/icons/CancelSharp'
import CheckIcon from '@material-ui/icons/Check'
import { PropTypes } from 'prop-types'
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

const InventoryOnHandTableRow = ({ inventoryItem, refreshData }) => {
  const { formatMessage, formatNumber } = useI18n()
  const [newQtyOnHand, setNewQtyOnHand] = useState('')
  const [showCheck, setShowCheck] = useState(false)
  const [showError, setShowError] = useState(false)
  const [resultQtyOnHand, setResultQtyOnHand] = useState('')
  const [notes, setNotes] = useState('')
  const [isAdd, setIsAdd] = useState(false)

  // helper funcs
  const hasQtyOnHand = qty =>
    isNull(qty) ? formatMessage(messages.notRecorded) : formatNumber(qty)

  const newQtyHandler = evt => {
    if (!evt.target.value) {
      return setNewQtyOnHand('')
    }
    const qty = parseInt(inventoryItem.quantityOnHand, 10)
    const newQty = parseInt(evt.target.value, 10)

    setResultQtyOnHand(newQty - qty)
    if (qty > newQty) {
      setIsAdd(false)
    } else {
      setIsAdd(true)
    }
    setNewQtyOnHand(newQty)
  }

  const { mutate: onModifyInventoryOnHandSubmit } = useMutation(
    values =>
      resultQtyOnHand !== newQtyOnHand
        ? modifyInventoryOnHand(values, inventoryItem)
        : () => true,
    {
      onError: error => {
        setShowError(true)
        setTimeout(() => setShowError(false), 3000)
        throw new Error(error)
      },
      onSuccess: async () => {
        await refreshData()
        setNewQtyOnHand('')
        setResultQtyOnHand('')
        setNotes('')
        setShowCheck(true)
        setTimeout(() => setShowCheck(false), 3000)
      },
    }
  )

  const updateInventoryOnBlur = async () => {
    const qty = parseInt(inventoryItem.quantityOnHand, 10)
    const newQty = parseInt(newQtyOnHand, 10)
    const movementQty = parseInt(resultQtyOnHand, 10)

    if (qty !== newQty && notes) {
      onModifyInventoryOnHandSubmit({
        quantity: movementQty,
        isAdd,
        notes,
        expiresOn: inventoryItem.expiresOn,
      })
    }
  }

  return (
    <TableRow
      onBlur={updateInventoryOnBlur}
      className={cssClasses('TableRow')}
      key={inventoryItem.id}
    >
      {inventoryItem.expiresOn !== undefined ? (
        <TableCell className={cssClasses('TableCell')} size="small">
          <span
            className={
              inventoryItem.expiresOn !== null &&
              new Date(inventoryItem.expiresOn) < new Date()
                ? cssClasses('alert')
                : null
            }
          >
            {inventoryItem.expiresOn
              ? formatDate(inventoryItem.expiresOn)
              : 'N/A'}
          </span>
        </TableCell>
      ) : null}
      {inventoryItem !== undefined ? (
        <TableCell className={cssClasses('TableCell')} size="small">
          {inventoryItem?.lotNumber ? inventoryItem.lotNumber : 'N/A'}
        </TableCell>
      ) : null}
      <TableCell className={cssClasses('TableCell')}>
        {inventoryItem.inTransitFromSiteName ? (
          <span>
            {hasQtyOnHand(inventoryItem.quantityOnHand)}
            &nbsp;
            <small>
              {formatMessage(messages.inTransitFromSiteName, {
                inTransitFromSiteName: inventoryItem.inTransitFromSiteName,
              })}
            </small>
          </span>
        ) : (
          <span>
            {hasQtyOnHand(inventoryItem.quantityOnHand)}
            &nbsp;
            <small>
              {inventoryItem.pendingTransfers
                ? formatMessage(messages.excludedLotInTransit, {
                    pendingTransfers: inventoryItem.pendingTransfers,
                    pendingTransfersQuantityOnHand:
                      inventoryItem.pendingTransfersQuantityOnHand,
                  })
                : null}
            </small>
          </span>
        )}
      </TableCell>
      <TableCell className={cssClasses('TableCell')} size="small">
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
      <TableCell className={cssClasses('TableCell')} size="small">
        <TextField
          value={resultQtyOnHand}
          type="number"
          name="resultQuantityOnHand"
          margin="normal"
          disabled
        />
      </TableCell>
      <TableCell className={cssClasses('TableCell')} size="large">
        <TextField
          size="large"
          value={notes}
          error={
            !!newQtyOnHand && newQtyOnHand !== inventoryItem.quantityOnHand
          }
          type="text"
          name="resultQuantityOnHandNotes"
          margin="normal"
          required
          onChange={evt => setNotes(evt.target.value)}
        />
      </TableCell>
      <TableCell size="small">
        <Fade in={showCheck} timeout={1500}>
          <CheckIcon color="primary" />
        </Fade>
        <Fade in={showError} timeout={1500}>
          <CancelSharpIcon color="secondary" />
        </Fade>
      </TableCell>
    </TableRow>
  )
}

export default InventoryOnHandTableRow

InventoryOnHandTableRow.propTypes = {
  inventoryItem: PropTypes.oneOfType([PropTypes.object]).isRequired,
  refreshData: PropTypes.oneOfType([PropTypes.func]).isRequired,
}
