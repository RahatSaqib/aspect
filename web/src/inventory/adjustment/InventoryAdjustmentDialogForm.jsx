import _ from 'lodash'
import startOfDay from 'date-fns/startOfDay'
import Immutable from 'immutable'
import classnames from 'classnames/bind'
import React from 'react'
import { withProps } from 'recompose'
import { connect } from 'react-redux'
import { defineMessages } from 'react-intl'
import { Dialog } from 'react-toolbox/lib/dialog'
import { Input } from 'react-toolbox/lib/input'
import { DatePicker } from 'react-toolbox/lib/date_picker'

import SiteSelectField from '../../filter/resource/SiteSelectField'
import ConsumableSelectField from '../../filter/resource/ConsumableSelectField'
import ConsumableReasonSelectField, {
  testConductedReasonI18nKey,
} from '../../filter/resource/ConsumableReasonSelectField'

const cssClasses = classnames.bind(
  require('./InventoryAdjustmentDialogForm.css')
)

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
  dateAdjusted: undefined,
  notes: '',
}

export const sharedFields = {
  lotNumber: {
    fieldName: 'lotNumber',
    valueFromChangeEvent: _.identity,
  },
  canExpire: {
    fieldName: 'canExpire',
    valueFromChangeEvent: _.identity,
  },
  expiresOn: {
    fieldName: 'expiresOn',
    valueFromChangeEvent: _.identity,
  },
  quantity: {
    fieldName: 'quantity',
    valueFromChangeEvent: value => {
      if (/^\d+\.?\d*$/.test(value)) {
        return parseInt(value, 10)
      }
      return 0
    },
  },
  dateAdjusted: {
    fieldName: 'dateAdjusted',
    valueFromChangeEvent: _.identity,
  },
  notes: {
    fieldName: 'notes',
    valueFromChangeEvent: _.identity,
  },
  // Partial:
  toSiteId: {
    fieldName: 'toSiteId',
    valueFromChangeEvent: _.identity,
  },
  fromSiteId: {
    fieldName: 'fromSiteId',
    valueFromChangeEvent: _.identity,
  },
}

export const withTodayProps = withProps(() => ({
  today: startOfDay(new Date()),
}))

export const connectConsumableFromInventoryItem = connect(
  (state, { inventoryItem }) => ({
    consumable: state.consumable.consumables.items.find(
      c => inventoryItem && c.get('id') === inventoryItem.get('consumableId'),
      null,
      EMPTY_MAP
    ),
  })
)

const messages = defineMessages({
  submit: {
    id: 'pages.InventoryAdjustmentDialogForm.submit',
    defaultMessage: 'Submit',
  },
  cancel: {
    id: 'pages.InventoryAdjustmentDialogForm.cancel',
    defaultMessage: 'Cancel',
  },
  consumable: {
    id: 'pages.InventoryAdjustmentDialogForm.consumable',
    defaultMessage: 'Consumable',
  },
  lotNumber: {
    id: 'pages.InventoryAdjustmentDialogForm.lotNumber',
    defaultMessage: 'Lot Number',
  },
  expiryDate: {
    id: 'pages.InventoryAdjustmentDialogForm.expiryDate',
    defaultMessage: 'Expiry Date',
  },
  toSiteName: {
    id: 'pages.InventoryAdjustmentDialogForm.toSiteName',
    defaultMessage: 'To Site',
  },
  fromSiteName: {
    id: 'pages.InventoryAdjustmentDialogForm.fromSiteName',
    defaultMessage: 'From Site',
  },
  reason: {
    id: 'pages.InventoryAdjustmentDialogForm.reason',
    defaultMessage: 'Reason',
  },
  testsRunBetween: {
    id: 'pages.InventoryAdjustmentDialogForm.testsRunBetween',
    defaultMessage: 'Tests Run Between',
  },
  and: {
    id: 'pages.InventoryAdjustmentDialogForm.and',
    defaultMessage: 'and',
  },
  notes: {
    id: 'pages.InventoryAdjustmentDialogForm.notes',
    defaultMessage: 'Notes',
  },
})

export const InventoryAdjustmentDialogForm = ({
  intl,
  isDialogActive,
  onCancel,
  // --- injected by recompose ---
  consumable,
  consumableReason,
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
}) =>
  <Dialog
    actions={[
      { label: intl.formatMessage(messages.cancel), onClick: onCancel },
      {
        accent: true,
        raised: true,
        label: intl.formatMessage(messages.submit),
        onClick: handleSubmit,
        disabled: form.pristine || !form.valid || form.submitting,
      },
    ]}
    active={isDialogActive}
    onEscKeyDown={onCancel}
    onOverlayClick={onCancel}
    title={labels.dialogTitle}
  >
    <form className={cssClasses('Form')}>
      <div className={cssClasses('Form__Content')}>
        <section>
          {_.has(values, 'consumableId') &&
            <ConsumableSelectField
              name="consumableId"
              floatingLabelText={intl.formatMessage(messages.consumable)}
              floatingLabelFixed
              disabled={form.submitting}
              value={values.consumableId}
              onConsumableChange={onConsumableIdChange}
              errorText={meta.consumableId.touched && meta.consumableId.error}
              fullWidth
              // style={formFieldStyle}
            />}
        </section>
        <section>
          <Input
            type="text"
            name="lotNumber"
            label={intl.formatMessage(messages.lotNumber)}
            disabled={form.submitting}
            value={values.lotNumber}
            onChange={onLotNumberChange}
            error={meta.lotNumber.touched && meta.lotNumber.error}
            maxLength={500}
          />
          {values.canExpire &&
            <DatePicker
              name="expiresOn"
              label={intl.formatMessage(messages.expiryDate)}
              disabled={form.submitting}
              // container="inline"
              // mode="landscape"
              // autoOk
              // style={formFieldStyle}
              onChange={onExpiresOnChange}
              value={values.expiresOn}
              sundayFirstDayOfWeek
            />}
        </section>
        <section>
          {_.has(values, 'fromSiteId') &&
            <SiteSelectField
              name="fromSiteId"
              floatingLabelText={intl.formatMessage(messages.fromSiteName)}
              // style={formFieldStyle}
              disabled={form.submitting}
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
            />}
          {_.has(values, 'toSiteId') &&
            <SiteSelectField
              name="toSiteId"
              floatingLabelText={intl.formatMessage(messages.toSiteName)}
              // style={formFieldStyle}
              disabled={form.submitting}
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
            />}
        </section>
        <section>
          <Input
            type="text"
            name="quantity"
            label={labels.quantity}
            disabled={form.submitting}
            value={values.quantity}
            onChange={onQuantityChange}
            // style={formFieldStyle}
            // inputStyle={{ textAlign: 'right' }}
            error={meta.quantity.touched && meta.quantity.error}
            maxLength={500}
          />
          <p className={cssClasses('Field__quantity--status')}>
            <span>
              {consumable.get('unitShortName')}
            </span>
            <span>
              {labels.nextQuantityStatus}
            </span>
          </p>
        </section>
        {_.has(values, 'reasonId') &&
          <section>
            <ConsumableReasonSelectField
              intl={intl}
              name="reasonId"
              floatingLabelText={intl.formatMessage(messages.reason)}
              disabled={form.submitting}
              // style={formFieldStyle}
              value={values.reasonId}
              onConsumableReasonIdChange={onReasonIdChange}
              errorText={meta.reasonId.touched && meta.reasonId.error}
              fullWidth
            />
          </section>}
        {consumableReason &&
          consumableReason.get('i18nKey') === testConductedReasonI18nKey &&
          <section>
            <DatePicker
              name="dateAdjustedFrom"
              label={intl.formatMessage(messages.testsRunBetween)}
              disabled={form.submitting}
              // container="inline"
              // mode="landscape"
              // style={formFieldStyle}
              value={values.dateAdjustedFrom}
              onChange={onDateAdjustedFromChange}
              autoOk
              sundayFirstDayOfWeek
            />
            <DatePicker
              name="dateAdjustedTo"
              label={intl.formatMessage(messages.and)}
              disabled={form.submitting}
              // container="inline"
              // mode="landscape"
              // style={formFieldStyle}
              value={values.dateAdjustedTo}
              onChange={onDateAdjustedToChange}
              autoOk
              sundayFirstDayOfWeek
            />
          </section>}
        {_.has(values, 'dateAdjusted') &&
          <section>
            <DatePicker
              name="dateAdjusted"
              label={labels.dateAdjusted}
              disabled={form.submitting}
              // container="inline"
              // mode="landscape"
              // style={formFieldStyle}
              value={values.dateAdjusted}
              onChange={onDateAdjustedChange}
              autoOk
              sundayFirstDayOfWeek
            />
          </section>}
        <section>
          <Input
            type="notes"
            name="quantity"
            label={intl.formatMessage(messages.notes)}
            disabled={form.submitting}
            value={values.notes}
            onChange={onNotesChange}
            multiline
            rows={2}
            // style={formFieldStyle}
            error={meta.notes.touched && meta.notes.error}
            maxLength={2000}
          />
        </section>
      </div>
    </form>
  </Dialog>
