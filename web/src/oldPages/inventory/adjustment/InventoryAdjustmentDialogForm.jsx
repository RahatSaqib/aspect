import React, { useEffect } from 'react'
import { Button, TextField } from '@mui/material'
import classnames from 'classnames/bind'
import Immutable from 'immutable'
import has from 'lodash/has'
import identity from 'lodash/identity'
import isNil from 'lodash/isNil'
import { defineMessages } from 'react-intl'
import { connect, useDispatch } from 'react-redux'
import ConsumableReasonSelectField, {
  testConductedReasonI18nKey,
} from '../../../oldComponents/resource/ConsumableReasonSelectField'
import ConsumableSelectField from '../../../oldComponents/resource/ConsumableSelectField'
import SiteSelectField from '../../../oldComponents/resource/SiteSelectField'
import AspectDialog from '../../../oldComponents/shared/AspectDialog'
import DateTimeInput from '../../../oldComponents/shared/DateTimeInput'
import FormGroup from '../../../oldComponents/themedReactToolbox/FormGroup'
import { fetchConsumables } from '../../../store/ConsumableRedux'
import { types } from '../../../store/InventoryRedux'
import styles from './InventoryAdjustmentDialogForm.css'
import messages from './messages'

const cssClasses = classnames.bind(styles)

const EMPTY_MAP = Immutable.Map()

export { testConductedReasonI18nKey }

export const sharedMessages = defineMessages({
  consumableRequired: {
    id: 'pages.InventoryAdjustmentDialogForm.consumableRequired',
    defaultMessage: 'Please specify a consumable',
  },
  expiryDateRequired: {
    id: 'pages.InventoryAdjustmentDialogForm.expiryDateRequired',
    defaultMessage: 'Please specify an expiry date',
  },
  siteRequired: {
    id: 'pages.InventoryAdjustmentDialogForm.siteRequired',
    defaultMessage: 'Please select a site',
  },
  reasonRequired: {
    id: 'pages.InventoryAdjustmentDialogForm.reasonRequired',
    defaultMessage: 'Please select a reason',
  },
  dateRequired: {
    id: 'pages.InventoryAdjustmentDialogForm.dateRequired',
    defaultMessage: 'Please specify a date',
  },
  dateFromAfterDateTo: {
    id: 'pages.InventoryAdjustmentDialogForm.dateFromAfterDateTo',
    defaultMessage: 'Please choose a date later or equal to from date',
  },
})

export const SHARED_DEFAULT_VALUES = {
  lotNumber: '',
  canExpire: false,
  expiresOn: undefined,
  fromSiteId: undefined,
  toSiteId: undefined,
  quantity: '',
  dateAdjusted: new Date(),
  notes: '',
}

export const sharedFields = {
  lotNumber: {
    fieldName: 'lotNumber',
    valueFromChangeEvent: it => it.target.value,
  },
  canExpire: {
    fieldName: 'canExpire',
    valueFromChangeEvent: identity,
  },
  expiresOn: {
    fieldName: 'expiresOn',
    valueFromChangeEvent: identity,
  },
  quantity: {
    fieldName: 'quantity',
    valueFromChangeEvent: ({ target: { value } }) => {
      if (/^\d+\.?\d*$/.test(value)) {
        return parseInt(value, 10)
      }
      return 0
    },
  },
  dateAdjusted: {
    fieldName: 'dateAdjusted',
    valueFromChangeEvent: identity,
  },
  notes: {
    fieldName: 'notes',
    valueFromChangeEvent: it => it.target.value,
  },
  // Partial:
  toSiteId: {
    fieldName: 'toSiteId',
    valueFromChangeEvent: identity,
  },
  fromSiteId: {
    fieldName: 'fromSiteId',
    valueFromChangeEvent: identity,
  },
}

export const connectConsumableFromInventoryItem = connect((state, { inventoryItem }) => ({
  consumable: state.consumable.consumables.items.find(
    c => inventoryItem && c.get('id') === inventoryItem.get('consumableId'),
    null,
    EMPTY_MAP
  ),
  isReceiveInventoryDialog:
    state.inventory.inventoryAdjustment.get('actionType') === types.SHOW_RECEIVE_INVENTORY_DIALOG,
}))

export const InventoryAdjustmentDialogForm = ({
  intl,
  isDialogActive,
  onCancel,
  // --- injected by recompose ---
  isReceiveInventoryDialog,
  consumable,
  consumableReason,
  dateFormat = 'yyyy-MM-dd',
  currInventoryItem = null,
  labels,
  form,
  values,
  meta,
  onConsumableIdChange,
  onLotNumberChange,
  onExpiresOnChange,
  onFromSiteIdChange,
  onToSiteIdChange,
  onQuantityChange,
  onReasonIdChange,
  onDateAdjustedFromChange,
  onDateAdjustedToChange,
  onDateAdjustedChange,
  onNotesChange,
  handleSubmit,
}) => {
  const dispatch = useDispatch()

  useEffect(() => dispatch(fetchConsumables(false)), [dispatch])

  const showLot = (currInventoryItem && currInventoryItem.get('showLot')) || (consumable && consumable.get('showLot'))
  const showExpirationDate =
    (currInventoryItem && currInventoryItem.get('showExpirationDate')) ||
    (consumable && consumable.get('showExpirationDate'))
  return (
    <AspectDialog
      actions={[
        <Button color="primary" onClick={onCancel}>
          {intl.formatMessage(messages.cancel)}
        </Button>,
        <Button color="primary" variant="contained" disabled={!form.valid || form.submitting} onClick={handleSubmit}>
          {intl.formatMessage(messages.submit)}
        </Button>,
      ]}
      maxWidth="sm"
      open={isDialogActive}
      onClose={onCancel}
      title={labels.dialogTitle}
    >
      <form className={cssClasses('Form')}>
        <div className={cssClasses('Form__Content')}>
          <section>
            {(!currInventoryItem || has(values, 'consumableId')) && (
              <ConsumableSelectField
                name="consumableId"
                floatingLabelText={intl.formatMessage(messages.consumable)}
                floatingLabelFixed
                disabled={form.submitting || (currInventoryItem && !isNil(currInventoryItem.get('consumableId')))}
                value={values.consumableId}
                onConsumableChange={onConsumableIdChange}
                errorText={meta.consumableId && meta.consumableId.touched && meta.consumableId.error}
                fullWidth
              />
            )}
          </section>
          <section>
            {showLot ? (
              <TextField
                fullWidth
                type="text"
                name="lotNumber"
                label={intl.formatMessage(messages.lotNumber)}
                disabled={form.submitting || (currInventoryItem && !isNil(currInventoryItem.get('lotNumber')))}
                value={values.lotNumber}
                onChange={onLotNumberChange}
                error={meta.lotNumber.touched && meta.lotNumber.error}
                helperText={meta.lotNumber.touched && meta.lotNumber.error}
                margin="normal"
                FormHelperTextProps={{
                  margin: 'dense',
                }}
                inputProps={{ maxLength: 500 }}
              />
            ) : (
              <div />
            )}
            {showExpirationDate && consumable.get('canExpire') && (
              <FormGroup label={intl.formatMessage(messages.expiryDate)}>
                <DateTimeInput
                  fullWidth
                  margin="normal"
                  disabled={form.submitting || (currInventoryItem && !isNil(currInventoryItem.get('expiresOn')))}
                  dateFormat={dateFormat}
                  intl={intl}
                  RootProps={{
                    name: 'expiresOn',
                  }}
                  onChange={(...params) => {
                    // Get the second parameter, representing the string date
                    // This is ugly, I know.
                    const stringDate = params[1]
                    onExpiresOnChange(stringDate)
                  }}
                  value={values.expiresOn}
                />
              </FormGroup>
            )}
          </section>
          <section>
            {has(values, 'fromSiteId') && (
              <SiteSelectField
                name="fromSiteId"
                floatingLabelText={intl.formatMessage(messages.fromSiteName)}
                disabled={
                  form.submitting ||
                  (currInventoryItem && (isReceiveInventoryDialog || !isNil(currInventoryItem.get('siteId'))))
                }
                value={values.fromSiteId}
                onSiteChange={onFromSiteIdChange}
                errorStyle={{
                  float: 'left',
                  whiteSpace: 'nowrap',
                  textOverflow: 'visible',
                }}
                errorText={meta.fromSiteId.touched && meta.fromSiteId.error}
                fullWidth
                tabIndex="0"
                aria-haspopup
              />
            )}
            {has(values, 'toSiteId') && (
              <SiteSelectField
                name="toSiteId"
                floatingLabelText={intl.formatMessage(messages.toSiteName)}
                disabled={form.submitting || isReceiveInventoryDialog}
                value={values.toSiteId}
                onSiteChange={onToSiteIdChange}
                errorStyle={{
                  float: 'left',
                  whiteSpace: 'nowrap',
                  textOverflow: 'visible',
                }}
                errorText={meta.toSiteId.touched && meta.toSiteId.error}
                fullWidth
                tabIndex="0"
                aria-haspopup
              />
            )}
          </section>
          <section>
            <TextField
              fullWidth
              type="text"
              name="quantity"
              label={labels.quantity}
              disabled={form.submitting}
              value={values.quantity}
              onChange={onQuantityChange}
              error={meta.quantity.touched && meta.quantity.error}
              helperText={meta.quantity.touched && meta.quantity.error}
              margin="normal"
              FormHelperTextProps={{
                margin: 'dense',
              }}
              inputProps={{ maxLength: 500 }}
            />
            {currInventoryItem !== null ? (
              <p className={cssClasses('Field__quantity--status')}>
                <span>{consumable.get('unitShortName')}</span>
                <span>{labels.nextQuantityStatus}</span>
              </p>
            ) : null}
          </section>
          {has(values, 'reasonId') && (
            <section>
              <ConsumableReasonSelectField
                intl={intl}
                name="reasonId"
                floatingLabelText={intl.formatMessage(messages.reason)}
                disabled={form.submitting}
                value={values.reasonId}
                onConsumableReasonIdChange={onReasonIdChange}
                errorText={meta.reasonId.touched && meta.reasonId.error}
                margin="normal"
                fullWidth
              />
            </section>
          )}
          {consumableReason && consumableReason.get('i18nKey') === testConductedReasonI18nKey && (
            <section>
              <FormGroup label={intl.formatMessage(messages.testsRunBetween)}>
                <DateTimeInput
                  fullWidth
                  margin="normal"
                  intl={intl}
                  disabled={form.submitting}
                  dateFormat={dateFormat}
                  RootProps={{
                    name: 'dateAdjustedFrom',
                  }}
                  value={values.dateAdjustedFrom}
                  onChange={onDateAdjustedFromChange}
                />
              </FormGroup>
              <FormGroup label={intl.formatMessage(messages.and)}>
                <DateTimeInput
                  fullWidth
                  margin="normal"
                  disabled={form.submitting}
                  dateFormat={dateFormat}
                  intl={intl}
                  RootProps={{
                    name: 'dateAdjustedTo',
                    // style: formFieldStyle
                  }}
                  value={values.dateAdjustedTo}
                  onChange={onDateAdjustedToChange}
                  // container="inline"
                  // mode="landscape"
                  // style={formFieldStyle}
                />
              </FormGroup>
            </section>
          )}
          {has(values, 'dateAdjusted') && (
            <section>
              <FormGroup label={labels.dateAdjusted}>
                <DateTimeInput
                  fullWidth
                  margin="normal"
                  disabled={form.submitting}
                  dateFormat={dateFormat}
                  intl={intl}
                  RootProps={{
                    name: 'dateAdjusted',
                  }}
                  value={values.dateAdjusted}
                  onChange={onDateAdjustedChange}
                />
              </FormGroup>
            </section>
          )}
          <section>
            <TextField
              fullWidth
              type="notes"
              name="quantity"
              label={intl.formatMessage(messages.notes)}
              disabled={form.submitting}
              value={values.notes}
              onChange={onNotesChange}
              multiline
              rows={2}
              error={meta.notes.touched && meta.notes.error}
              helperText={meta.notes.touched && meta.notes.error}
              margin="normal"
              FormHelperTextProps={{
                margin: 'dense',
              }}
              inputProps={{ maxLength: 2000 }}
            />
          </section>
        </div>
      </form>
    </AspectDialog>
  )
}
