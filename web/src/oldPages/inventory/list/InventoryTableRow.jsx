import React, { useState } from 'react'
import CheckIcon from '@mui/icons-material/Check'
import ErrorIcon from '@mui/icons-material/Error'
import TextField from '@mui/material/TextField'
import classnames from 'classnames/bind'
import isNull from 'lodash/isNull'
import round from 'lodash/round'
import { useMutation } from 'react-query'
import { useDispatch } from 'react-redux'
import AspectVertMenu from '../../../components/AspectVertMenu'
import useI18n from '../../../hooks/useI18n'
import styles from '../../../oldComponents/shared/DataTableRow.css'
import { DataTableRow as TableRow, DataTableCell as TableCell } from '../../../oldComponents/shared/tableBody'
import PermissionsProvider from '../../../providers/PermissionsProvider'
import {
  showAddInventoryDialog,
  showRemoveInventoryDialog,
  showTransferInventoryDialog,
  showReceiveInventoryDialog,
  modifyInventoryOnHand,
} from '../../../store/InventoryRedux'
import messages from './messages'

const cssClasses = classnames.bind(styles)

const InventoryTableRow = ({ inventoryItem, breakOutByLot, inventoryOnHand, refetch }) => {
  const { formatMessage, formatNumber } = useI18n()

  const [newQtyOnHand, setNewQtyOnHand] = useState('')
  const [showCheck, setShowCheck] = useState(false)
  const [showError, setShowError] = useState(false)
  const [resultQtyOnHand, setResultQtyOnHand] = useState('')
  const [notes, setNotes] = useState('')
  const dispatch = useDispatch()

  const getActions = isInTransit => [
    {
      icon: 'FaCheck',
      text: formatMessage(messages.receiveInventory),
      disabled: !isInTransit,
      action: ({ inventoryItemId }) => dispatch(showReceiveInventoryDialog(inventoryItemId)),
    },
    {
      icon: 'FaPlus',
      text: formatMessage(messages.addInventory),
      disabled: isInTransit,
      action: ({ inventoryItemId }) => dispatch(showAddInventoryDialog(inventoryItemId)),
    },
    {
      icon: 'FaExchangeAlt',
      text: formatMessage(messages.transferInventory),
      disabled: isInTransit,
      action: ({ inventoryItemId }) => dispatch(showTransferInventoryDialog(inventoryItemId)),
    },
    {
      icon: 'FaMinus',
      text: formatMessage(messages.removeInventory),
      disabled: isInTransit,
      action: ({ inventoryItemId }) => dispatch(showRemoveInventoryDialog(inventoryItemId)),
    },
  ]
  const { mutate: onModifyInventoryOnHandSubmit } = useMutation(
    values =>
      resultQtyOnHand !== inventoryItem.get('quantityOnHand')
        ? modifyInventoryOnHand(values, {
            siteId: inventoryItem.get('siteId'),
            consumableId: inventoryItem.get('consumableId'),
            lotNumber: inventoryItem.get('lotNumber'),
          })
        : () => true,
    {
      onError: error => {
        setShowError(true)
        throw new Error(error)
      },
      onSuccess: async () => {
        await refetch()
        setNewQtyOnHand('')
        setResultQtyOnHand('')
        setNotes('')
        setShowCheck(true)
      },
    }
  )
  const updateInventoryOnBlur = async () => {
    if (inventoryOnHand) {
      const qty = parseInt(inventoryItem.get('quantityOnHand'), 10)
      const newQty = parseInt(newQtyOnHand, 10)
      const movementQty = parseInt(resultQtyOnHand, 10)
      if (qty !== newQty && notes) {
        onModifyInventoryOnHandSubmit({
          quantity: movementQty,
          notes,
          expiresOn: inventoryItem.get('expiresOn'),
        })
      }
    }
  }
  const rowSpan = name => inventoryItem.getIn(['rowSpans', name])
  // helper funcs
  const hasQtyOnHand = qty => (isNull(qty) ? formatMessage(messages.notRecorded) : formatNumber(qty))
  const hasDailyConsumption = qty => (isNull(qty) ? formatMessage(messages.noConsumption) : formatNumber(round(qty, 2)))
  const newQtyHandler = evt => {
    if (!evt.target.value) {
      return setNewQtyOnHand('')
    }
    const qty = parseInt(inventoryItem.get('quantityOnHand'), 10)
    const newQty = parseInt(evt.target.value, 10)

    setResultQtyOnHand(newQty - qty)

    setNewQtyOnHand(newQty)
  }
  return (
    <TableRow
      className={cssClasses('TableRow')}
      key={rowSpan('id')}
      onBlur={updateInventoryOnBlur}
      onFocus={() => setShowCheck(false)}
    >
      <TableCell className={cssClasses('TableCell')} rowSpan={rowSpan('siteName')}>
        {inventoryItem.get('siteName')}
      </TableCell>

      <TableCell className={cssClasses('TableCell')} rowSpan={rowSpan('consumableName')}>
        {inventoryItem.get('consumableName')}
      </TableCell>
      <TableCell className={cssClasses('TableCell')}>
        {hasQtyOnHand(inventoryItem.get('quantityOnHand'))}
        &nbsp;
        {inventoryItem.get('inTransitFromSiteName') ? (
          <span>
            <small>
              {formatMessage(messages.inTransitFromSiteName, {
                inTransitFromSiteName: inventoryItem.get('inTransitFromSiteName'),
              })}
            </small>
          </span>
        ) : (
          <span>
            <small>
              {inventoryItem.get('pendingTransfers')
                ? formatMessage(messages.excludedLotInTransit, {
                    pendingTransfers: inventoryItem.get('pendingTransfers'),
                    pendingTransfersQuantityOnHand: inventoryItem.get('pendingTransfersQuantityOnHand'),
                  })
                : null}
            </small>
          </span>
        )}
        {!breakOutByLot && inventoryItem.get('qtyExpired') !== 0 ? (
          <span className={cssClasses('alert')}>
            &nbsp; ({parseFloat(inventoryItem.get('quantityOnHand')) <= 0 ? '' : '-'}
            {inventoryItem.get('qtyExpired')} Expired)
          </span>
        ) : null}
      </TableCell>
      {inventoryItem.get('dailyConsumptionRate') !== undefined ? (
        <TableCell className={cssClasses('TableCell')} rowSpan={rowSpan('dailyConsumptionRate')}>
          {hasDailyConsumption(inventoryItem.get('dailyConsumptionRate'))}
        </TableCell>
      ) : null}
      {inventoryItem.get('lotNumber') !== undefined ? (
        <TableCell className={cssClasses('TableCell')} rowSpan={rowSpan('lotNumber')}>
          {inventoryItem.get('lotNumber') ? inventoryItem.get('lotNumber') : 'N/A'}
        </TableCell>
      ) : null}
      {inventoryItem.get('expiresOn') !== undefined ? (
        <TableCell className={cssClasses('TableCell')} rowSpan={rowSpan('expiresOn')}>
          <span
            className={
              inventoryItem.get('expiresOn') !== null && new Date(inventoryItem.get('expiresOn')) < new Date()
                ? cssClasses('alert')
                : null
            }
          >
            {inventoryItem.get('expiresOn') ? inventoryItem.get('expiresOn').split('T')[0] : 'N/A'}
          </span>
        </TableCell>
      ) : null}
      {inventoryOnHand ? (
        <>
          <TableCell className={cssClasses('TableCell')} size="small">
            <TextField
              autoFocus
              type="number"
              name="newQuantityOnHand"
              value={newQtyOnHand}
              disabled={isNull(inventoryItem.get('quantityOnHand'))}
              onChange={newQtyHandler}
              margin="normal"
              FormHelperTextProps={{
                margin: 'dense',
              }}
            />
          </TableCell>
          <TableCell className={cssClasses('TableCell')} size="small">
            {resultQtyOnHand}
          </TableCell>
          <TableCell className={cssClasses('TableCell')} size="medium">
            <TextField
              size="large"
              value={notes}
              error={!!newQtyOnHand && newQtyOnHand !== inventoryItem.get('quantityOnHand')}
              type="text"
              name="resultQuantityOnHandNotes"
              disabled={isNull(inventoryItem.get('quantityOnHand'))}
              margin="normal"
              required={newQtyOnHand !== inventoryItem.get('quantityOnHand')}
              onChange={evt => setNotes(evt.target.value)}
            />
          </TableCell>
          <TableCell size="small">
            {showCheck ? <CheckIcon color="primary" /> : null}
            {showError ? <ErrorIcon color="error" /> : null}
          </TableCell>
        </>
      ) : null}
      {inventoryItem.get('daysStockLeft') !== undefined ? (
        <TableCell className={cssClasses('TableCell')} rowSpan={rowSpan('daysStockLeft')}>
          {inventoryItem.get('daysStockLeft') !== null ? round(inventoryItem.get('daysStockLeft'), 2) : 'N/A'}
        </TableCell>
      ) : null}
      {inventoryItem.get('projectedWaste') !== undefined ? (
        <TableCell className={cssClasses('TableCell')} rowSpan={rowSpan('projectedWaste')}>
          {inventoryItem.get('projectedWaste') !== null ? round(inventoryItem.get('projectedWaste'), 2) : 'N/A'}
        </TableCell>
      ) : null}
      {!inventoryOnHand ? (
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
      ) : null}
    </TableRow>
  )
}

export default InventoryTableRow
