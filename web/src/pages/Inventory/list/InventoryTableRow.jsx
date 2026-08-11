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
import { useNavigate } from 'react-router-dom'
import AspectVertMenu from '../../../components/AspectVertMenu'
import PermissionChecker from '../../../components/PermissionChecker'
import styles from '../../../components/shared/DataTableRow.module.css'
import { DataTableCell as TableCell, DataTableRow as TableRow } from '../../../components/shared/tableBody'
import useAuthState from '../../../hooks/useAuthState'
import useFilterUpdate from '../../../hooks/useFilterUpdate'
import { formatDate } from '../../../utils/utils/dateFormat'
import { adjustmentActions } from '../adjustment/actionTypes'
import { modifyInventoryOnHand } from './InventoryItemsQueries'
import messages from './messages'

const InventoryTableRow = ({
  inventoryItem,
  breakOutByLot,
  inventoryOnHand,
  requireExpirationDate,
  requireLotNumber,
  refetch,
  onAdjust,
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

  const getActions = () => {
    const { inTransitFromSiteId: isInTransit, consumableId, siteConsumables } = inventoryItem
    const isCartridgeConfigured = siteConsumables.includes(consumableId)

    return [
      ...(!isCountry('PK')
        ? [
            {
              icon: 'FaCheck',
              text: formatMessage(messages.receiveInventory),
              disabled: !isInTransit,
              action: () => onAdjust(adjustmentActions.RECEIVE, inventoryItem),
            },
          ]
        : []),

      {
        icon: 'FaPlus',
        text: formatMessage(messages.addInventory),
        disabled: isInTransit || !isCartridgeConfigured,
        action: () => onAdjust(adjustmentActions.ADD, inventoryItem),
      },
      {
        icon: 'FaExchangeAlt',
        text: formatMessage(messages.transferInventory),
        disabled: isInTransit,
        action: () => onAdjust(adjustmentActions.TRANSFER, inventoryItem),
      },
      {
        icon: 'FaMinus',
        text: formatMessage(messages.removeInventory),
        disabled: isInTransit,
        action: () => onAdjust(adjustmentActions.REMOVE, inventoryItem),
      },
    ]
  }
  const { mutate: onModifyInventoryOnHandSubmit } = useMutation(
    values =>
      resultQtyOnHand !== inventoryItem.quantityOnHand
        ? modifyInventoryOnHand(values, {
            siteId: inventoryItem.siteId,
            consumableId: inventoryItem.consumableId,
            lotNumber: inventoryItem.lotNumber,
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
      const qty = parseInt(inventoryItem.quantityOnHand, 10)
      const newQty = parseInt(newQtyOnHand, 10)
      const movementQty = parseInt(resultQtyOnHand, 10)
      if (qty !== newQty && notes) {
        onModifyInventoryOnHandSubmit({
          quantity: movementQty,
          notes,
          expiresOn: inventoryItem.expiresOn,
        })
      }
    }
  }
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
    const qty = parseInt(inventoryItem.quantityOnHand, 10)
    const newQty = parseInt(evt.target.value, 10)

    setResultQtyOnHand(newQty - qty)

    setNewQtyOnHand(newQty)
  }
  return (
    <TableRow style={{ cursor: 'default' }} onBlur={updateInventoryOnBlur} onFocus={() => setShowCheck(false)}>
      <TableCell className={styles.TableCell}>{inventoryItem.siteName}</TableCell>
      <TableCell className={styles.TableCell}>
        {messages[inventoryItem.consumableNameI18nKey]
          ? formatMessage(messages[inventoryItem.consumableNameI18nKey])
          : inventoryItem.consumableName}
      </TableCell>
      <TableCell className={styles.TableCell}>
        {hasQtyOnHand(inventoryItem.quantityOnHand)}
        &nbsp;
        {inventoryItem.inTransitFromSiteName ? (
          <span>
            <small>
              {formatMessage(messages.inTransitFromSiteName, {
                inTransitFromSiteName: inventoryItem.inTransitFromSiteName,
              })}
            </small>
          </span>
        ) : (
          <span>
            <small>
              {inventoryItem.pendingTransfers
                ? formatMessage(messages.excludedLotInTransit, {
                    pendingTransfers: inventoryItem.pendingTransfers,
                    pendingTransfersQuantityOnHand: inventoryItem.pendingTransfersQuantityOnHand,
                  })
                : null}
            </small>
          </span>
        )}
        {!breakOutByLot && requireExpirationDate && inventoryItem.qtyExpired !== 0 ? (
          <span className={styles.alert}>
            &nbsp; ({inventoryItem.qtyExpired} {formatMessage(messages.expired)})
          </span>
        ) : null}
      </TableCell>
      <TableCell
        onClick={() => {
          if (inventoryItem.unreconciledQuantity && inventoryItem.siteType !== 'warehouse') {
            addFilter(
              omitBy(
                {
                  onlyUnreconciled: true,
                  countryId,
                  assayId: inventoryItem.assayId,
                  stateId: inventoryItem.stateId,
                  lgaId: inventoryItem.lgaId,
                  siteName: inventoryItem.siteName,
                },
                isNil
              ),
              '/browse/result'
            )
            navigate('/browse/result')
          }
        }}
        sx={
          inventoryItem.unreconciledQuantity && inventoryItem.siteType !== 'warehouse'
            ? { cursor: 'pointer', color: 'blue', textDecoration: 'underline' }
            : {}
        }
        className={styles.TableCell}
      >
        {inventoryItem.unreconciledQuantity}
      </TableCell>
      {inventoryItem.dailyConsumptionRate !== undefined ? (
        <TableCell className={styles.TableCell}>{hasDailyConsumption(inventoryItem.dailyConsumptionRate)}</TableCell>
      ) : null}
      {requireLotNumber && inventoryItem.lotNumber !== undefined ? (
        <TableCell className={styles.TableCell}>
          {inventoryItem.lotNumber ? inventoryItem.lotNumber : formatMessage(messages.notAvailable)}
        </TableCell>
      ) : null}
      {requireExpirationDate && inventoryItem.expiresOn !== undefined ? (
        <TableCell className={styles.TableCell}>
          <span
            className={
              inventoryItem.expiresOn !== null && new Date(inventoryItem.expiresOn) < new Date() ? styles.alert : null
            }
          >
            {inventoryItem.expiresOn ? formatDate(inventoryItem.expiresOn) : formatMessage(messages.notAvailable)}
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
              disabled={isNull(inventoryItem.quantityOnHand)}
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
              error={!!newQtyOnHand && newQtyOnHand !== inventoryItem.quantityOnHand}
              type="text"
              name="resultQuantityOnHandNotes"
              disabled={isNull(inventoryItem.quantityOnHand)}
              margin="normal"
              required={newQtyOnHand !== inventoryItem.quantityOnHand}
              onChange={evt => setNotes(evt.target.value)}
            />
          </TableCell>
          <TableCell size="small">
            {showCheck ? <CheckIcon color="primary" /> : null}
            {showError ? <ErrorIcon color="error" /> : null}
          </TableCell>
        </>
      ) : null}
      {inventoryItem.daysStockLeft !== undefined ? (
        <TableCell className={styles.TableCell}>
          {inventoryItem.daysStockLeft !== null
            ? round(inventoryItem.daysStockLeft, 2)
            : formatMessage(messages.notAvailable)}
        </TableCell>
      ) : null}
      {inventoryItem.projectedWaste !== undefined ? (
        <TableCell className={styles.TableCell}>
          {inventoryItem.projectedWaste !== null
            ? round(inventoryItem.projectedWaste, 2)
            : formatMessage(messages.notAvailable)}
        </TableCell>
      ) : null}
      {!inventoryOnHand ? (
        <PermissionChecker permissions={['inventory:edit']}>
          <TableCell className={styles.TableCell}>
            <AspectVertMenu actions={getActions()} />
          </TableCell>
        </PermissionChecker>
      ) : null}
    </TableRow>
  )
}

export default InventoryTableRow
