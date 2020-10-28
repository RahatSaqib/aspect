import identity from 'lodash/identity'
import has from 'lodash/has'
import Immutable from 'immutable'
import classnames from 'classnames/bind'
import React from 'react'
import { connect } from 'react-redux'
import { defineMessages } from 'react-intl'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'

import AspectDialog from '../../components/shared/AspectDialog'
import DateTimeInput from '../../components/shared/DateTimeInput'
import FormGroup from '../../components/themedReactToolbox/FormGroup'
import SiteSelectField from '../../filter/resource/SiteSelectField'
import ConsumableSelectField from '../../filter/resource/ConsumableSelectField'
import ConsumableReasonSelectField, {
  testConductedReasonI18nKey,
} from '../../filter/resource/ConsumableReasonSelectField'
import messages from './messages'

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

export const connectConsumableFromInventoryItem = connect(
  (state, { inventoryItem }) => ({
    consumable: state.consumable.consumables.items.find(
      c => inventoryItem && c.get('id') === inventoryItem.get('consumableId'),
      null,
      EMPTY_MAP
    ),
  })
)

export const InventoryAdjustmentDialogForm = ({
  intl,
  isDialogActive,
  onCancel,
  // --- injected by recompose ---
  consumable,
  consumableReason,
  dateFormat = 'yyyy-MM-dd',
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
}) => (
  <AspectDialog
    actions={[
      <Button color="primary" onClick={onCancel}>
        {intl.formatMessage(messages.cancel)}
      </Button>,
      <Button
        color="primary"
        variant="contained"
        disabled={
          (values.action !== 'receive' ? form.pristine : false) ||
          !form.valid ||
          form.submitting
        }
        onClick={handleSubmit}
      >
        {intl.formatMessage(messages.submit)}
      </Button>,
    ]}
    maxWidth="sm"
    open={isDialogActive}
    onEscapeKeyDown={onCancel}
    onClose={onCancel}
    title={labels.dialogTitle}
  >
    <form className={cssClasses('Form')}>
      <div className={cssClasses('Form__Content')}>
        <section>
          {has(values, 'consumableId') && (
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
            />
          )}
        </section>
        <section>
          <TextField
            fullWidth
            type="text"
            name="lotNumber"
            label={intl.formatMessage(messages.lotNumber)}
            disabled={form.submitting}
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
          {values.canExpire && (
            <FormGroup label={intl.formatMessage(messages.expiryDate)}>
              <DateTimeInput
                fullWidth
                margin="normal"
                disabled={form.submitting}
                dateFormat={dateFormat}
                intl={intl}
                RootProps={{
                  name: 'expiresOn',
                  // style: formFieldStyle
                }}
                onChange={onExpiresOnChange}
                value={values.expiresOn}
                // container="inline"
                // mode="landscape"
                // autoOk
              />
            </FormGroup>
          )}
        </section>
        <section>
          {has(values, 'fromSiteId') && (
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
            />
          )}
          {has(values, 'toSiteId') && (
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
            // style={formFieldStyle}
            // inputStyle={{ textAlign: 'right' }}
            error={meta.quantity.touched && meta.quantity.error}
            helperText={meta.quantity.touched && meta.quantity.error}
            margin="normal"
            FormHelperTextProps={{
              margin: 'dense',
            }}
            inputProps={{ maxLength: 500 }}
          />
          <p className={cssClasses('Field__quantity--status')}>
            <span>{consumable.get('unitShortName')}</span>
            <span>{labels.nextQuantityStatus}</span>
          </p>
        </section>
        {has(values, 'reasonId') && (
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
              margin="normal"
              fullWidth
            />
          </section>
        )}
        {consumableReason &&
          consumableReason.get('i18nKey') === testConductedReasonI18nKey && (
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
                    // style: formFieldStyle
                  }}
                  value={values.dateAdjustedFrom}
                  onChange={onDateAdjustedFromChange}
                  // autoOk
                  // container="inline"
                  // mode="landscape"
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
                  // style: formFieldStyle
                }}
                value={values.dateAdjusted}
                onChange={onDateAdjustedChange}
                // container="inline"
                // mode="landscape"
                // style={formFieldStyle}
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
            // style={formFieldStyle}
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
