import React, { memo } from 'react'
import { Button, DialogActions, FormLabel, TextField } from '@mui/material'
import { Formik } from 'formik'
import { useIntl } from 'react-intl'
import { ConsumableSelect, SiteSelect, ConsumableReasonSelect } from '../../../cleanComponents'
import SiteAutoCompleteField from '../../../components/SiteAutocompleteField'
import useSiteList from '../../../hooks/site/useSiteList'
import { testConductedReasonI18nKey } from '../../../oldComponents/resource/ConsumableReasonSelectField'
import AspectDialog from '../../../oldComponents/shared/AspectDialog'
import DateTimeInput from '../../../oldComponents/shared/DateTimeInput'
import FormGroup from '../../../oldComponents/themedReactToolbox/FormGroup'
import { types } from '../../../store/InventoryRedux'
import {
  getLabels,
  getQuantityOnHand,
  getValidations,
  hasExpireDate,
  hasLot,
  transformInitialValue,
  transformValues,
} from './helpers'
import styles from './InventoryAdjustmentDialogForm.module.css'
import messages from './messages'

function InventoryAdjustmentDialog(props) {
  const { data: allSites = [] } = useSiteList()
  const { onCancel, onSubmit, inventoryItem, actionType } = props
  const { formatMessage, ...intl } = useIntl()
  const inventory = inventoryItem?.toJS?.() ?? undefined
  const labels = getLabels(actionType)
  const uiAdd = [types.SHOW_NEW_INVENTORY_DIALOG, types.SHOW_ADD_INVENTORY_DIALOG].includes(actionType)
  const uiTransfer = actionType === types.SHOW_TRANSFER_INVENTORY_DIALOG
  const uiRemove = actionType === types.SHOW_REMOVE_INVENTORY_DIALOG
  const now = new Date()

  return (
    <Formik
      validationSchema={getValidations(formatMessage, actionType, inventory)}
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
        const fromSite = allSites.find(it => it.id === values.fromSiteId)
        const toSite = allSites.find(it => it.id === values.toSiteId)
        const isExpired = date => date && new Date(date) < new Date()
        const toSiteFilter = sites => {
          if (uiTransfer) {
            sites = sites?.filter(s => s.siteConsumables?.includes(values.consumable.id))
            if (isExpired(values.expiresOn ?? inventory?.expiresOn)) {
              sites = sites?.filter(it => it.id === fromSite.parentWarehouseId)
            }
          }
          return sites
        }
        const onToSiteChange = event => {
          const toSiteId = event.id || undefined
          setFieldValue('toSiteId', toSiteId)
          //
          if (actionType === types.SHOW_NEW_INVENTORY_DIALOG) {
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
                {initialValues?.fromSiteId ? (
                  <SiteSelect
                    name="fromSiteId"
                    label={formatMessage(messages.fromSiteName)}
                    disabled
                    value={values.fromSiteId ?? null}
                    onChange={handleChange}
                  />
                ) : null}

                {actionType !== types.SHOW_REMOVE_INVENTORY_DIALOG ? (
                  <SiteAutoCompleteField
                    name="toSiteId"
                    value={values.toSiteId || ''}
                    onChange={onToSiteChange}
                    errorText={errors.toSiteId}
                    disabled={
                      actionType === types.SHOW_RECEIVE_INVENTORY_DIALOG ||
                      actionType === types.SHOW_ADD_INVENTORY_DIALOG
                    }
                    floatingLabelFixed
                    floatingLabelText={formatMessage(messages.toSiteName)}
                    width="100%"
                    customFilter={toSiteFilter}
                  />
                ) : null}
                {!inventory ? (
                  <ConsumableSelect
                    name="consumable"
                    label={formatMessage(messages.consumable)}
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
                      (actionType === types.SHOW_NEW_INVENTORY_DIALOG && !values.toSiteId) ||
                      // ...or local adding inventory (`toSite` and `consumable` fields are prefilled)
                      actionType === types.SHOW_ADD_INVENTORY_DIALOG ||
                      // ...or remove (`fromSite` and `consumable` fields are prefilled)
                      actionType === types.SHOW_REMOVE_INVENTORY_DIALOG ||
                      // ...or transferring inventory
                      uiTransfer
                    }
                  />
                ) : null}

                <FormGroup
                  labelProps={{
                    required: hasExpireDate(values?.consumable?.strategy || inventory?.strategy),
                  }}
                  label={`${formatMessage(messages.expiryDate)} (yyyy-mm-dd)`}
                >
                  <DateTimeInput
                    fullWidth
                    margin="normal"
                    dateFormat="yyyy-MM-dd"
                    disabled={!!initialValues?.expiresOn}
                    RootProps={{
                      name: 'expiresOn',
                    }}
                    onChange={onExpiresChange}
                    value={values.expiresOn}
                    error={!!errors.expiresOn}
                    helperText={errors.expiresOn}
                  />
                </FormGroup>

                <TextField
                  required={hasLot(values?.consumable?.strategy || inventory?.strategy)}
                  fullWidth
                  type="text"
                  name="lotNumber"
                  label={formatMessage(messages.cartridgeLotNumber)}
                  value={values.lotNumber}
                  onChange={handleChange}
                  disabled={!!initialValues?.lotNumber}
                  onBlur={handleBlur}
                  margin="normal"
                  FormHelperTextProps={{
                    margin: 'dense',
                  }}
                  inputProps={{ maxLength: 100 }}
                  error={!!errors.lotNumber}
                  helperText={errors.lotNumber}
                />

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
                  <p className={styles.Field__quantity__status}>
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

export default memo(InventoryAdjustmentDialog)
