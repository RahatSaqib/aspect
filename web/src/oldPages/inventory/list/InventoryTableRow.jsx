import React, { useState } from 'react'
import CheckIcon from '@mui/icons-material/Check'
import ErrorIcon from '@mui/icons-material/Error'
import { TextField } from '@mui/material'
import isNil from 'lodash/isNil'
import isNull from 'lodash/isNull'
import omitBy from 'lodash/omitBy'
import round from 'lodash/round'
import { useIntl } from 'react-intl'
import { useMutation } from 'react-query'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import AspectVertMenu from '../../../components/AspectVertMenu'
import PermissionChecker from '../../../components/PermissionChecker'
import useAuthState from '../../../hooks/useAuthState'
import useFilterUpdate from '../../../hooks/useFilterUpdate'
import styles from '../../../oldComponents/shared/DataTableRow.module.css'
import { DataTableCell as TableCell, DataTableRow as TableRow } from '../../../oldComponents/shared/tableBody'
import {
  modifyInventoryOnHand,
  showAddInventoryDialog,
  showReceiveInventoryDialog,
  showRemoveInventoryDialog,
  showTransferInventoryDialog,
} from '../../../store/InventoryRedux'
import { formatDate } from '../../../utils/utils/dateFormat'
import messages from './messages'

const InventoryTableRow = ({
  inventoryItem,
  breakOutByLot,
  inventoryOnHand,
  requireExpirationDate,
  requireLotNumber,
  refetch,
}) => {
  const { formatMessage, formatNumber } = useIntl()
  const [addFilter] = useFilterUpdate()
  const navigate = useNavigate()
  const { isCountry, countryId } = useAuthState()
  const [newQtyOnHand, setNewQtyOnHand] = useState('')
  const [newQtyOnHandError, setNewQtyOnHandError] = useState(false)
  const [showCheck, setShowCheck] = useState(false)
  const [showError, setShowError] = useState(false)
  const [resultQtyOnHand, setResultQtyOnHand] = useState('')
  const [notes, setNotes] = useState('')
  const dispatch = useDispatch()

  const getActions = inventoryItem => {
    const { inTransitFromSiteId: isInTransit, consumableId, siteConsumables } = inventoryItem.toJS()
    const isCartridgeConfigured = siteConsumables.includes(consumableId)

    return [
      ...(!isCountry('PK')
        ? [
            {
              icon: 'FaCheck',
              text: formatMessage(messages.receiveInventory),
              disabled: !isInTransit,
              action: ({ inventoryItemId }) => dispatch(showReceiveInventoryDialog(inventoryItemId)),
            },
          ]
        : []),

      {
        icon: 'FaPlus',
        text: formatMessage(messages.addInventory),
        disabled: isInTransit || !isCartridgeConfigured,
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
  }
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
    if (inventoryOnHand && !newQtyOnHandError) {
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
    const { value } = evt.target
    if (Number(value) < 0) {
      setNewQtyOnHandError(true)
      return
    }
    setNewQtyOnHandError(false)

    if (!value) {
      return setNewQtyOnHand('')
    }
    const qty = parseInt(inventoryItem.get('quantityOnHand'), 10)
    const newQty = parseInt(evt.target.value, 10)

    setResultQtyOnHand(newQty - qty)

    setNewQtyOnHand(newQty)
  }
  return (
    <TableRow
      style={{ cursor: 'default' }}
      key={rowSpan('id')}
      onBlur={updateInventoryOnBlur}
      onFocus={() => setShowCheck(false)}
    >
      <TableCell className={styles.TableCell} rowSpan={rowSpan('siteName')}>
        {inventoryItem.get('siteName')}
      </TableCell>
      <TableCell className={styles.TableCell}>
        {messages[inventoryItem.get('consumableNameI18nKey')]
          ? formatMessage(messages[inventoryItem.get('consumableNameI18nKey')])
          : inventoryItem.get('consumableName')}
      </TableCell>
      <TableCell className={styles.TableCell}>
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
        {!breakOutByLot && requireExpirationDate && inventoryItem.get('qtyExpired') !== 0 ? (
          <span className={styles.alert}>
            &nbsp; ({inventoryItem.get('qtyExpired')} {formatMessage(messages.expired)})
          </span>
        ) : null}
      </TableCell>
      <TableCell
        onClick={() => {
          if (inventoryItem.get('unreconciledQuantity') && inventoryItem.get('siteType') !== 'warehouse') {
            addFilter(
              omitBy(
                {
                  onlyUnreconciled: true,
                  countryId,
                  assayId: inventoryItem.get('assayId'),
                  stateId: inventoryItem.get('stateId'),
                  lgaId: inventoryItem.get('lgaId'),
                  siteName: inventoryItem.get('siteName'),
                },
                isNil
              ),
              '/browse/result'
            )
            navigate('/browse/result')
          }
        }}
        sx={
          inventoryItem.get('unreconciledQuantity') && inventoryItem.get('siteType') !== 'warehouse'
            ? { cursor: 'pointer', color: 'blue', textDecoration: 'underline' }
            : {}
        }
        className={styles.TableCell}
      >
        {inventoryItem.get('unreconciledQuantity')}
      </TableCell>
      {inventoryItem.get('dailyConsumptionRate') !== undefined ? (
        <TableCell className={styles.TableCell} rowSpan={rowSpan('dailyConsumptionRate')}>
          {hasDailyConsumption(inventoryItem.get('dailyConsumptionRate'))}
        </TableCell>
      ) : null}
      {requireLotNumber && inventoryItem.get('lotNumber') !== undefined ? (
        <TableCell className={styles.TableCell} rowSpan={rowSpan('lotNumber')}>
          {inventoryItem.get('lotNumber') ? inventoryItem.get('lotNumber') : formatMessage(messages.notAvailable)}
        </TableCell>
      ) : null}
      {requireExpirationDate && inventoryItem.get('expiresOn') !== undefined ? (
        <TableCell className={styles.TableCell} rowSpan={rowSpan('expiresOn')}>
          <span
            className={
              inventoryItem.get('expiresOn') !== null && new Date(inventoryItem.get('expiresOn')) < new Date()
                ? styles.alert
                : null
            }
          >
            {inventoryItem.get('expiresOn')
              ? formatDate(inventoryItem.get('expiresOn'))
              : formatMessage(messages.notAvailable)}
          </span>
        </TableCell>
      ) : null}
      {inventoryOnHand ? (
        <>
          <TableCell className={styles.TableCell} size="small">
            <TextField
              autoFocus
              type="number"
              name="newQuantityOnHand"
              value={newQtyOnHand}
              error={newQtyOnHandError}
              disabled={isNull(inventoryItem.get('quantityOnHand'))}
              onChange={newQtyHandler}
              margin="normal"
              FormHelperTextProps={{
                margin: 'dense',
              }}
              onKeyDown={e => {
                if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                  e.preventDefault()
                }
              }}
            />
          </TableCell>
          <TableCell className={styles.TableCell} size="small">
            {resultQtyOnHand}
          </TableCell>
          <TableCell className={styles.TableCell} size="medium">
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
        <TableCell className={styles.TableCell} rowSpan={rowSpan('daysStockLeft')}>
          {inventoryItem.get('daysStockLeft') !== null
            ? round(inventoryItem.get('daysStockLeft'), 2)
            : formatMessage(messages.notAvailable)}
        </TableCell>
      ) : null}
      {inventoryItem.get('projectedWaste') !== undefined ? (
        <TableCell className={styles.TableCell} rowSpan={rowSpan('projectedWaste')}>
          {inventoryItem.get('projectedWaste') !== null
            ? round(inventoryItem.get('projectedWaste'), 2)
            : formatMessage(messages.notAvailable)}
        </TableCell>
      ) : null}
      {!inventoryOnHand ? (
        <PermissionChecker permissions={['inventory:edit']}>
          <TableCell className={styles.TableCell}>
            <AspectVertMenu
              params={{
                inventoryItemId: inventoryItem.get('id'),
                inventoryItem,
              }}
              actions={getActions(inventoryItem)}
            />
          </TableCell>
        </PermissionChecker>
      ) : null}
    </TableRow>
  )
}

export default InventoryTableRow
