import React, { memo } from 'react'
import { Button, DialogActions, TextField } from '@mui/material'
import classnames from 'classnames/bind'
import { Formik } from 'formik'
import { ConsumableSelect, SiteSelect } from '../../../cleanComponents'
import ConsumableReasonSelect from '../../../cleanComponents/ConsumableReasonSelect'
import useI18n from '../../../hooks/useI18n'
import { testConductedReasonI18nKey } from '../../../oldComponents/resource/ConsumableReasonSelectField'
import AspectDialog from '../../../oldComponents/shared/AspectDialog'
import DateTimeInput from '../../../oldComponents/shared/DateTimeInput'
import FormGroup from '../../../oldComponents/themedReactToolbox/FormGroup'
import { types } from '../../../store/InventoryRedux'
import { getLabels, getQuantityOnHand, getValidations, transformInitialValue, transformValues } from './helpers'
import styles from './InventoryAdjustmentDialogForm.css'
import messages from './messages'

const cssClasses = classnames.bind(styles)

export { testConductedReasonI18nKey }

export function PakistanInventoryAdjustmentDialog(props) {
  const { onCancel, onSubmit, inventoryItem, actionType } = props
  const { formatMessage, ...intl } = useI18n()
  const inventory = inventoryItem?.toJS?.() ?? undefined
  const labels = getLabels(actionType)

  return (
    <Formik
      validationSchema={getValidations(formatMessage, actionType)}
      initialValues={transformInitialValue(inventory, actionType)}
      onSubmit={values => onSubmit(transformValues(values))}
    >
      {({
        resetForm,
        values,
        initialValues,
        handleBlur,
        handleSubmit,
        errors,
        handleChange,
        setFieldValue,
        isSubmitting,
      }) => {
        return (
          <AspectDialog
            maxWidth="sm"
            open={!!actionType}
            onClose={() => {
              onCancel()
              resetForm()
            }}
            title={formatMessage(labels.dialogTitle, {
              consumableName: values?.consumable?.name ?? formatMessage(messages.defaultConsumableName),
            })}
          >
            <form className={cssClasses('Form')}>
              <div className={cssClasses('Form__Content')}>
                {!inventory ? (
                  <ConsumableSelect
                    name="consumable"
                    label={formatMessage(messages.consumable)}
                    error={errors?.consumable}
                    value={values.consumable ?? null}
                    onChange={consumable => setFieldValue('consumable', consumable)}
                    fullWidth
                  />
                ) : null}

                {values?.consumable?.showLot || inventory?.lotNumber ? (
                  <TextField
                    fullWidth
                    type="text"
                    name="lotNumber"
                    label={formatMessage(messages.lotNumber)}
                    value={values.lotNumber}
                    onChange={handleChange}
                    disabled={!!initialValues?.lotNumber}
                    onBlur={handleBlur}
                    margin="normal"
                    FormHelperTextProps={{
                      margin: 'dense',
                    }}
                    inputProps={{ maxLength: 500 }}
                  />
                ) : null}

                {values?.consumable?.showExpirationDate || inventory?.expiresOn ? (
                  <FormGroup label={formatMessage(messages.expiryDate)}>
                    <DateTimeInput
                      fullWidth
                      margin="normal"
                      dateFormat="yyyy-MM-dd"
                      disabled={!!initialValues?.expiresOn}
                      RootProps={{
                        name: 'expiresOn',
                      }}
                      onChange={(_, date) => setFieldValue('expiresOn', date)}
                      value={values.expiresOn}
                    />
                  </FormGroup>
                ) : null}

                {initialValues?.fromSiteId ? (
                  <SiteSelect
                    name="fromSiteId"
                    label={formatMessage(messages.fromSiteName)}
                    disabled
                    value={values.fromSiteId ?? null}
                    onChange={e => setFieldValue('fromSiteId', e.target.value)}
                  />
                ) : null}

                {actionType !== types.SHOW_REMOVE_INVENTORY_DIALOG ? (
                  <SiteSelect
                    name="toSiteId"
                    disabled={actionType === types.SHOW_RECEIVE_INVENTORY_DIALOG}
                    error={errors?.toSiteId ?? null}
                    label={formatMessage(messages.toSiteName)}
                    value={values.toSiteId}
                    onChange={e => setFieldValue('toSiteId', e.target.value)}
                  />
                ) : null}

                <TextField
                  fullWidth
                  type="text"
                  name="quantity"
                  label={formatMessage(labels.quantity)}
                  value={values.quantity}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={!!errors.quantity}
                  helperText={errors.quantity}
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
                  <ConsumableReasonSelect
                    name="reasonId"
                    error={errors?.reason}
                    label={formatMessage(messages.reason)}
                    value={values?.reason ?? null}
                    onChange={reason => setFieldValue('reason', reason)}
                  />
                ) : null}

                {values?.reason?.i18nKey === testConductedReasonI18nKey ? (
                  <>
                    <FormGroup label={formatMessage(messages.testsRunBetween)}>
                      <DateTimeInput
                        fullWidth
                        margin="normal"
                        intl={{ formatMessage, ...intl }}
                        dateFormat="yyyy-MM-dd"
                        RootProps={{
                          name: 'dateAdjustedFrom',
                        }}
                        value={values.dateAdjustedFrom}
                        onChange={(_, date) => setFieldValue('dateAdjustedFrom', date)}
                      />
                    </FormGroup>
                    <FormGroup label={formatMessage(messages.and)}>
                      <DateTimeInput
                        fullWidth
                        margin="normal"
                        dateFormat="yyyy-MM-dd"
                        intl={{ formatMessage, ...intl }}
                        RootProps={{
                          name: 'dateAdjustedTo',
                        }}
                        value={values.dateAdjustedTo}
                        onChange={(_, date) => setFieldValue('dateAdjustedTo', date)}
                      />
                    </FormGroup>
                  </>
                ) : null}

                <FormGroup label={formatMessage(labels.dateAdjusted)}>
                  <DateTimeInput
                    fullWidth
                    intl={{ formatMessage, ...intl }}
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
                  <Button color="primary" variant="contained" disabled={isSubmitting} onClick={handleSubmit}>
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

export default memo(PakistanInventoryAdjustmentDialog)
