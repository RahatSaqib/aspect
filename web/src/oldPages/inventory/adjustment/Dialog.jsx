import React, { useEffect } from 'react'
import { Button, DialogActions, TextField } from '@mui/material'
import classnames from 'classnames/bind'
import { Formik } from 'formik'
import useI18n from '../../../hooks/useI18n'
import ConsumableSelectField from '../../../oldComponents/resource/ConsumableSelectField'
import ConsumableReasonSelectField, {
  testConductedReasonI18nKey,
} from '../../../oldComponents/resource/ConsumableReasonSelectField'
import SiteSelectField from '../../../oldComponents/resource/SiteSelectField'
import AspectDialog from '../../../oldComponents/shared/AspectDialog'
import DateTimeInput from '../../../oldComponents/shared/DateTimeInput'
import FormGroup from '../../../oldComponents/themedReactToolbox/FormGroup'
import { types } from '../../../store/InventoryRedux'
import styles from './InventoryAdjustmentDialogForm.css'
import messages, { newInventoryMessages, removeInventoryMessages, transformInventoryMessages } from './messages'
import { useDispatch } from 'react-redux'
import { fetchConsumableReasons, fetchConsumables } from '../../../store/ConsumableRedux'

function transformValues(values) {
  const { consumable, ...rest } = values
  return {
    ...rest,
    consumableId: consumable.id,
  }
}

function getQuantityOnHand(actionType, inventory, values) {
  let nextQuantity
  switch (actionType) {
    case types.SHOW_REMOVE_INVENTORY_DIALOG:
    case types.SHOW_TRANSFER_INVENTORY_DIALOG:
      nextQuantity = inventory.quantityOnHand - Number(values?.quantity ?? 0)
      break
    default:
      nextQuantity = inventory.quantityOnHand + Number(values?.quantity ?? 0)
  }
  return {
    nextQuantity,
    unitShortName: values?.consumable?.unitShortName,
  }
}

function transformInitialValue(inventory) {
  let value = { dateAdjusted: new Date() }

  if (inventory) {
    value = {
      ...value,
      toSiteId: inventory.siteId,
      consumable: {
        id: inventory.consumableId,
        name: inventory.consumableName,
        showExpirationDate: inventory.showExpirationDate,
        showLot: inventory.showLot,
        unitShortName: inventory.unitShortName,
      },
    }
  }

  return value
}

function transformLabels(actionType) {
  switch (actionType) {
    case types.SHOW_REMOVE_INVENTORY_DIALOG:
      return {
        dialogTitle: removeInventoryMessages.dialogTitle,
        quantity: removeInventoryMessages.quantity,
        dateAdjusted: removeInventoryMessages.dateAdjusted,
      }
    case types.SHOW_TRANSFER_INVENTORY_DIALOG:
      return {
        dialogTitle: transformInventoryMessages.dialogTitle,
        quantity: transformInventoryMessages.quantity,
        dateAdjusted: transformInventoryMessages.dateAdjusted,
      }
    default:
      return {
        dialogTitle: newInventoryMessages.dialogTitle,
        quantity: newInventoryMessages.quantity,
        dateAdjusted: newInventoryMessages.dateAdjusted,
      }
  }
}

const cssClasses = classnames.bind(styles)

export { testConductedReasonI18nKey }

export function Dialog(props) {
  const { onCancel, onSubmit, inventoryItem, actionType } = props
  const { formatMessage } = useI18n()
  const inventory = inventoryItem?.toJS?.() ?? undefined
  const labels = transformLabels(actionType)
  const dispatch = useDispatch()
  useEffect(() => dispatch(fetchConsumables(false)), [dispatch])
  useEffect(() => dispatch(fetchConsumableReasons(false)), [dispatch])

  return (
    <Formik
      enableReinitialize
      initialValues={transformInitialValue(inventory)}
      onSubmit={values => onSubmit(transformValues(values))}
    >
      {({ values, isValid, handleBlur, handleSubmit, errors, touched, handleChange, setFieldValue, isSubmitting }) => {
        return (
          <AspectDialog
            maxWidth="sm"
            open={!!actionType}
            onClose={onCancel}
            title={formatMessage(labels.dialogTitle, {
              consumableName: values?.consumable?.name ?? formatMessage(messages.defaultConsumableName),
            })}
          >
            <form className={cssClasses('Form')}>
              <div className={cssClasses('Form__Content')}>
                {!inventory ? (
                  <ConsumableSelectField
                    name="consumable"
                    returnItem
                    floatingLabelText={formatMessage(messages.consumable)}
                    floatingLabelFixed
                    value={values.consumable?.id}
                    onConsumableChange={(_, consumable) => setFieldValue('consumable', consumable)}
                    fullWidth
                  />
                ) : null}

                {values?.consumable?.showLot ? (
                  <TextField
                    fullWidth
                    type="text"
                    name="lotNumber"
                    label={formatMessage(messages.lotNumber)}
                    value={values.lotNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    margin="normal"
                    FormHelperTextProps={{
                      margin: 'dense',
                    }}
                    inputProps={{ maxLength: 500 }}
                  />
                ) : null}

                {values?.consumable?.showExpirationDate && (
                  <FormGroup label={formatMessage(messages.expiryDate)}>
                    <DateTimeInput
                      fullWidth
                      margin="normal"
                      dateFormat="yyyy-MM-dd"
                      RootProps={{
                        name: 'expiresOn',
                      }}
                      onChange={(_, date) => setFieldValue('expiresOn', date)}
                      value={values.expiresOn}
                    />
                  </FormGroup>
                )}

                <SiteSelectField
                  name="toSiteId"
                  floatingLabelText={formatMessage(messages.toSiteName)}
                  value={values.toSiteId}
                  onSiteChange={site => setFieldValue('toSiteId', site)}
                  errorStyle={{
                    float: 'left',
                    whiteSpace: 'nowrap',
                    textOverflow: 'visible',
                  }}
                  fullWidth
                  tabIndex="0"
                  aria-haspopup
                />

                <TextField
                  fullWidth
                  type="text"
                  name="quantity"
                  label={formatMessage(labels.quantity)}
                  value={values.quantity}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  margin="normal"
                  FormHelperTextProps={{
                    margin: 'dense',
                  }}
                  inputProps={{ maxLength: 500 }}
                />

                {inventory ? (
                  <p className={cssClasses('Field__quantity--status')}>
                    <span>{values?.consumable?.unitShortName}</span>
                    <span>
                      {formatMessage(messages.nextQuantityStatus, getQuantityOnHand(actionType, inventory, values))}
                    </span>
                  </p>
                ) : null}

                {actionType === types.SHOW_REMOVE_INVENTORY_DIALOG ? (
                  <ConsumableReasonSelectField
                    name="reasonId"
                    floatingLabelText={formatMessage(messages.reason)}
                    value={values.reasonId}
                    onConsumableReasonIdChange={id => setFieldValue('reasonId', id)}
                    margin="normal"
                  />
                ) : null}

                <FormGroup label={formatMessage(labels.dateAdjusted)}>
                  <DateTimeInput
                    fullWidth
                    margin="normal"
                    dateFormat="yyyy-MM-dd"
                    RootProps={{
                      name: 'dateAdjusted',
                    }}
                    value={values.dateAdjusted}
                    onChange={(_, date) => setFieldValue('dateAdjusted', date)}
                  />
                </FormGroup>

                <TextField
                  fullWidth
                  type="notes"
                  name="notes"
                  label={formatMessage(messages.notes)}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  multiline
                  rows={2}
                  margin="normal"
                  FormHelperTextProps={{
                    margin: 'dense',
                  }}
                  inputProps={{ maxLength: 2000 }}
                />
                <DialogActions>
                  <Button color="primary" onClick={onCancel}>
                    {formatMessage(messages.cancel)}
                  </Button>
                  <Button
                    color="primary"
                    variant="contained"
                    disabled={!isValid || isSubmitting}
                    onClick={handleSubmit}
                  >
                    {formatMessage(messages.submit)}
                  </Button>
                </DialogActions>
              </div>
            </form>
          </AspectDialog>
        )
      }}
    </Formik>
  )
}
