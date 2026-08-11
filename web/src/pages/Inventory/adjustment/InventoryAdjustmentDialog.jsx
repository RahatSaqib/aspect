import React, { memo } from 'react'
import { Button, DialogActions, TextField } from '@mui/material'
import { Formik } from 'formik'
import { useIntl } from 'react-intl'
import { ConsumableReasonSelect, ConsumableSelect, SiteSelect } from '../../../components'
import InventoryItemSelect from '../../../components/InventoryItemSelect'
import AspectDialog from '../../../components/shared/AspectDialog'
import DateTimeInput from '../../../components/shared/DateTimeInput'
import SiteAutoCompleteField from '../../../components/SiteAutocompleteField'
import FormGroup from '../../../components/themedReactToolbox/FormGroup'
import useSiteList from '../../../hooks/site/useSiteList'
import { adjustmentActions } from './actionTypes'
import { getLabels, getQuantityOnHand, getValidations, transformInitialValue, transformValues } from './helpers'
import styles from './InventoryAdjustmentDialogForm.module.css'
import messages, { validationMessages } from './messages'

function InventoryAdjustmentDialog(props) {
  const { data: allSites = [] } = useSiteList()
  const { onCancel, onSubmit, inventoryItem, actionType, requireExpirationDate, requireLotNumber, breakOutByLot } =
    props
  const { formatMessage, ...intl } = useIntl()
  const inventory = inventoryItem
  const labels = getLabels(actionType)
  const uiAdd = [adjustmentActions.NEW, adjustmentActions.ADD].includes(actionType)
  const uiTransfer = actionType === adjustmentActions.TRANSFER
  const uiRemove = actionType === adjustmentActions.REMOVE
  const uiReceive = actionType === adjustmentActions.RECEIVE

  const now = new Date()

  return (
    <Formik
      validationSchema={() =>
        getValidations(formatMessage, actionType, { inventory, requireExpirationDate, requireLotNumber, allSites })
      }
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
        touched,
      }) => {
        const fromSite = allSites.find(it => it.id === values.fromSiteId)
        const toSite = allSites.find(it => it.id === values.toSiteId)
        const isExpired = date => date && new Date(date) < new Date()
        const toSiteFilter = sites => {
          if (uiTransfer) {
            sites = sites?.filter(
              s =>
                // toSite is not the same as fromSite
                s.id !== values.fromSiteId &&
                // cartridge is applicable (via SiteConsumable table mapping)
                s.siteConsumables?.includes(values.consumable.id)
            )
            if (isExpired(values.expiresOn ?? inventory?.expiresOn)) {
              sites = sites?.filter(it => it.siteType === 'warehouse')
            }
          }
          return sites
        }
        const onToSiteChange = event => {
          const toSiteId = event.id || undefined
          setFieldValue('toSiteId', toSiteId)
          //
          if (actionType === adjustmentActions.NEW) {
            let resetConsumable = true
            if (toSiteId) {
              /**
               * if just selected toSite doesn't include current consumable  -
               * then reset `consumable` field
               */
              const site = allSites.find(it => it.id === +toSiteId)
              resetConsumable = values.consumable && !site?.siteConsumables?.includes(values.consumable.id)
            }
            if (resetConsumable) {
              setFieldValue('consumable', undefined)
            }
          }
        }
        const onExpiresChange = (_, date) => {
          setFieldValue('expiresOn', date)
          if (uiTransfer && isExpired(date) && fromSite?.parentWarehouseId !== values.toSiteId) {
            setFieldValue('toSiteId', undefined)
          }
        }

        if (!touched.quantity) {
          delete errors.quantity
        }
        if (inventory?.quantityOnHand <= 0) {
          if (uiTransfer && !values.quantity) {
            errors.quantity = formatMessage(validationMessages.quantityMissingToTransfer)
          } else if (uiRemove && !values.quantity) {
            errors.quantity = formatMessage(validationMessages.quantityMissingToRemove)
          }
        }

        const isFormValid =
          !Object.keys(errors).length &&
          Object.keys(touched).length > 0 &&
          (!uiTransfer || (values.quantity && values.toSiteId)) &&
          (values.reason?.externalId !== 'other' || !!values.notes?.trim())

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
            <form className={styles.Form}>
              <div className={styles.Form__Content}>
                {uiAdd || uiRemove ? (
                  <FormGroup
                    labelProps={{ required: true }}
                    label={formatMessage(messages.reason)}
                    error={!!errors.reason}
                    helperText={errors.reason}
                  >
                    <ConsumableReasonSelect
                      name="reasonId"
                      error={errors?.reason ? ' ' : null}
                      value={values?.reason ?? null}
                      onChange={reason => setFieldValue('reason', reason)}
                      filterType={uiRemove ? 'decrease' : 'increase'} // Map actionType to filterType
                    />
                  </FormGroup>
                ) : null}

                {initialValues?.fromSiteId ? (
                  <SiteSelect
                    name="fromSiteId"
                    label={formatMessage(messages.fromSiteName)}
                    disabled
                    value={values.fromSiteId ?? null}
                    onChange={handleChange}
                  />
                ) : null}

                {uiAdd ? (
                  <SiteAutoCompleteField
                    name="toSiteId"
                    value={values.toSiteId || ''}
                    onChange={onToSiteChange}
                    errorText={errors.toSiteId}
                    disabled={actionType === adjustmentActions.RECEIVE || actionType === adjustmentActions.ADD}
                    floatingLabelFixed
                    floatingLabelText={
                      <span>
                        {formatMessage(messages.toSiteName)} <span style={{ color: 'red' }}>*</span>
                      </span>
                    }
                    floatingLabelClasses={{
                      error: styles.Field__label__when__error,
                    }}
                    floatingHelperTextProps={{
                      margin: 'dense',
                      classes: {
                        error: styles.Field__error__message,
                      },
                    }}
                    width="100%"
                    customFilter={toSiteFilter}
                  />
                ) : null}
                {!inventory ? (
                  <ConsumableSelect
                    name="consumable"
                    label={
                      <span>
                        {formatMessage(messages.consumable)} <span style={{ color: 'red' }}>*</span>
                      </span>
                    }
                    error={errors?.consumable}
                    value={values.consumable ?? null}
                    onChange={consumable => setFieldValue('consumable', consumable)}
                    fullWidth
                    /**
                     * show only those consumables which are linked to selected toSite/fromSite,
                     * (see table SiteConsumable)
                     */
                    onlyWhitelisted
                    whitelistIds={
                      uiAdd ? toSite?.siteConsumables : uiTransfer || uiRemove ? fromSite?.siteConsumables : null
                    }
                    /**
                     * disable this component if...
                     */
                    disabled={
                      // ...global adding inventory but toSite is not selected
                      (actionType === adjustmentActions.NEW && !values.toSiteId) ||
                      // ...or local adding inventory (`toSite` and `consumable` fields are prefilled)
                      actionType === adjustmentActions.ADD ||
                      // ...or remove (`fromSite` and `consumable` fields are prefilled)
                      actionType === adjustmentActions.REMOVE ||
                      // ...or transferring inventory
                      uiTransfer
                    }
                    floatingLabelClasses={{
                      error: styles.Field__label__when__error,
                    }}
                    floatingHelperTextProps={{
                      margin: 'dense',
                      classes: {
                        error: styles.Field__error__message,
                      },
                    }}
                  />
                ) : null}

                {(uiTransfer || uiRemove || (uiAdd && initialValues?.consumable)) && !breakOutByLot ? (
                  // Transfer or remove inventory with break out by lot option unchecked
                  <FormGroup
                    labelProps={{ required: true }}
                    label={formatMessage(messages.inventoryItem)}
                    error={!!errors.inventoryItem}
                    helperText={errors.inventoryItem}
                  >
                    <InventoryItemSelect
                      name="inventoryItem"
                      inventoryItem={inventory}
                      requireExpirationDate={requireExpirationDate}
                      requireLotNumber={requireLotNumber}
                      onChange={(value, options) => {
                        const inventoryItem = options.find(o => o.id === value)
                        setFieldValue('expiresOn', inventoryItem?.expiresOn)
                        setFieldValue('lotNumber', inventoryItem?.lotNumber)
                        inventory.quantityOnHand = inventoryItem?.quantityOnHand
                        handleChange({ target: { name: 'inventoryItem', value } })
                      }}
                    />
                  </FormGroup>
                ) : (
                  <>
                    {requireExpirationDate && (
                      <FormGroup
                        labelProps={{
                          required: true,
                        }}
                        label={`${formatMessage(messages.expiryDate)} (yyyy-mm-dd)`}
                        error={!!errors.expiresOn}
                        helperText={errors.expiresOn}
                      >
                        <DateTimeInput
                          fullWidth
                          margin="normal"
                          dateFormat="yyyy-MM-dd"
                          disabled={!!initialValues?.expiresOn || uiTransfer || uiRemove || uiReceive}
                          RootProps={{
                            name: 'expiresOn',
                          }}
                          onChange={onExpiresChange}
                          value={values.expiresOn}
                        />
                      </FormGroup>
                    )}

                    {requireLotNumber && (
                      <TextField
                        required
                        fullWidth
                        type="text"
                        name="lotNumber"
                        label={formatMessage(messages.cartridgeLotNumber)}
                        value={values.lotNumber}
                        onChange={handleChange}
                        disabled={!!initialValues?.lotNumber || uiTransfer || uiRemove || uiReceive}
                        onBlur={handleBlur}
                        margin="normal"
                        FormHelperTextProps={{
                          margin: 'dense',
                          classes: {
                            error: styles.Field__error__message,
                          },
                        }}
                        InputLabelProps={{
                          shrink: true,
                          classes: {
                            error: styles.Field__label__when__error,
                          },
                        }}
                        inputProps={{ maxLength: 100 }}
                        error={!!errors.lotNumber}
                        helperText={errors.lotNumber}
                      />
                    )}
                  </>
                )}

                {uiTransfer ? (
                  <SiteAutoCompleteField
                    name="toSiteId"
                    value={values.toSiteId || ''}
                    onChange={onToSiteChange}
                    errorText={errors.toSiteId}
                    disabled={actionType === adjustmentActions.RECEIVE || actionType === adjustmentActions.ADD}
                    floatingLabelFixed
                    floatingLabelText={formatMessage(messages.toSiteName)}
                    floatingLabelClasses={{
                      error: styles.Field__label__when__error,
                    }}
                    floatingHelperTextProps={{
                      margin: 'dense',
                      classes: {
                        error: styles.Field__error__message,
                      },
                    }}
                    width="100%"
                    customFilter={toSiteFilter}
                  />
                ) : null}

                <TextField
                  required
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
                    classes: {
                      error: styles.Field__error__message,
                    },
                  }}
                  InputLabelProps={{
                    shrink: true,
                    classes: {
                      error: styles.Field__label__when__error,
                    },
                  }}
                  inputProps={{ maxLength: 500 }}
                />

                {inventory ? (
                  <p className={styles.Field__quantity__status}>
                    <span>{values?.consumable?.unitShortName}</span>
                    <span>
                      {formatMessage(messages.nextQuantityStatus, getQuantityOnHand(actionType, inventory, values))}
                    </span>
                  </p>
                ) : null}

                {values.reason?.effectOnStock !== 'resetToValue' ? (
                  <FormGroup label={`${formatMessage(labels.dateAdjusted)} (yyyy-mm-dd)`}>
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
                      maxDate={now}
                    />
                  </FormGroup>
                ) : null}

                <TextField
                  fullWidth
                  required={values.reason?.externalId === 'other'}
                  type="notes"
                  name="notes"
                  label={formatMessage(messages.notes)}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  multiline
                  rows={2}
                  margin="normal"
                  error={!!errors.notes}
                  helperText={errors.notes}
                  FormHelperTextProps={{
                    margin: 'dense',
                    classes: {
                      error: styles.Field__error__message,
                    },
                  }}
                  InputLabelProps={{
                    shrink: true,
                    classes: {
                      error: styles.Field__label__when__error,
                    },
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
                    disabled={!isFormValid || isSubmitting}
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

export default memo(InventoryAdjustmentDialog)
