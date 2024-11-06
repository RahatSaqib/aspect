import React from 'react'
import LoadingButton from '@mui/lab/LoadingButton'
import { Stack, Typography, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup } from '@mui/material'
import { Formik } from 'formik'
import { useIntl } from 'react-intl'
import { useQueryClient } from 'react-query'
import { INVENTORY_KEY } from '../../../../hooks/inventory/inventoryKeys'
import { useUpdateConsumableById } from '../../../../hooks/inventory/useConsumable'
import messages from '../messages'

export function InventoryReconciliationForm(props) {
  const { cartridge } = props
  const { formatMessage } = useIntl()
  const { mutateAsync: updateConsumable } = useUpdateConsumableById()
  const queryClient = useQueryClient()

  return (
    <Stack sx={{ padding: '15px' }}>
      <Typography>{formatMessage(messages.reconciliationTitle)}</Typography>

      <Formik
        enableReinitialize
        initialValues={{ adjustment: cartridge?.adjustment, strategy: cartridge?.strategy }}
        onSubmit={async ({ strategy, adjustment }, { setSubmitting, resetForm }) => {
          setSubmitting(true)
          try {
            await updateConsumable({
              consumableId: cartridge.id,
              payload: {
                ...cartridge,
                strategy,
                adjustment,
              },
            })
            await queryClient.refetchQueries([INVENTORY_KEY, 'consumable', cartridge.id.toString()])
            resetForm({ values: { strategy, adjustment } })
            // eslint-disable-next-line no-empty
          } catch (e) {
          } finally {
            setSubmitting(false)
          }
        }}
      >
        {({ setFieldValue, values, dirty, isSubmitting, isValid, handleSubmit }) => (
          <>
            <FormControl sx={{ mt: '15px' }}>
              <FormLabel id="strategy-radio-buttons-group-label">
                {formatMessage(messages.cartridgesManagedThrough)}
              </FormLabel>
              <RadioGroup
                value={values.strategy}
                onChange={event => setFieldValue('strategy', event.target.value)}
                aria-labelledby="strategy-radio-buttons-group-label"
                name="strategy-radio-buttons-group"
              >
                <FormControlLabel
                  value="withExpirationDateStrategy"
                  control={<Radio />}
                  label={formatMessage(messages.expiryDate)}
                />
                <FormControlLabel
                  value="withLotStrategy"
                  control={<Radio />}
                  label={formatMessage(messages.cartridgeLotNumber)}
                />
                <FormControlLabel
                  value="withLotAndExpirationDateStrategy"
                  control={<Radio />}
                  label={formatMessage(messages.cartridgeLotNumberAndExpiryDate)}
                />
              </RadioGroup>
            </FormControl>
            <FormControl>
              <FormLabel id="adjustment-radio-buttons-group-label">
                {formatMessage(messages.inventoryAdjustedAgainst)}
              </FormLabel>
              <RadioGroup
                value={values.adjustment}
                onChange={event => setFieldValue('adjustment', event.target.value)}
                aria-labelledby="adjustment-radio-buttons-group-label"
                name="adjustment-radio-buttons-group"
              >
                <FormControlLabel
                  value="currentSiteAdjustment"
                  control={<Radio />}
                  label={formatMessage(messages.inventoryAtCurrentSite)}
                />
                <FormControlLabel
                  value="currentSiteAndProviderAdjustment"
                  control={<Radio />}
                  label={formatMessage(messages.aboveRuleAndStockProvider)}
                />
                <FormControlLabel
                  value="currentSiteAndProviderAndNationalAdjustment"
                  control={<Radio />}
                  label={formatMessage(messages.aboveRuleAndParentSites)}
                />
              </RadioGroup>
            </FormControl>
            <LoadingButton
              loading={isSubmitting}
              disabled={!(dirty && isValid)}
              onClick={handleSubmit}
              variant="contained"
              sx={{ alignSelf: 'flex-start' }}
            >
              {formatMessage(messages.save)}
            </LoadingButton>
          </>
        )}
      </Formik>
    </Stack>
  )
}
