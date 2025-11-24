import React from 'react'
import LoadingButton from '@mui/lab/LoadingButton'
import {
  Stack,
  Typography,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material'
import { Formik } from 'formik'
import { useIntl } from 'react-intl'
import { toast } from 'react-toastify'
import { DetailHeader } from '../../../../cleanComponents'
import usePartner from '../../../../hooks/partner/usePartner'
import { useUpdatePartnerInventory } from '../../../../hooks/partner/useUpdatePartnerInventory'
import messages from '../messages'

export default function InventoryReconciliationForm() {
  const { formatMessage } = useIntl()
  const { isLoading, data: partner, refetch } = usePartner()
  const { mutateAsync: updatePartnerInventory } = useUpdatePartnerInventory()
  return (
    <>
      <DetailHeader name={formatMessage(messages.inventoryManagementConfiguration)} />
      <Card sx={{ width: '100%', margin: '10px' }}>
        {isLoading ? (
          <LinearProgress />
        ) : (
          <CardContent>
            <Stack sx={{ padding: '15px' }}>
              <Typography>{formatMessage(messages.reconciliationTitle)}</Typography>

              <Formik
                initialValues={{ adjustment: partner?.inventoryAdjustment, strategy: partner?.inventoryStrategy }}
                onSubmit={async ({ strategy, adjustment }, { setSubmitting, resetForm }) => {
                  setSubmitting(true)
                  try {
                    await updatePartnerInventory({
                      inventoryAdjustment: adjustment,
                      inventoryStrategy: strategy,
                    })
                    await refetch()
                    resetForm({ values: { strategy, adjustment } })
                    toast.success(formatMessage(messages.updateInventoryConfigurationSuccessMessage))
                  } catch (e) {
                    toast.error(formatMessage(messages.updateInventoryConfigurationFailedMessage))
                  } finally {
                    setSubmitting(false)
                  }
                }}
              >
                {({ setFieldValue, values, dirty, isSubmitting, isValid, handleSubmit }) => (
                  <>
                    <FormControl sx={{ mt: '15px' }}>
                      <FormLabel id="strategy-radio-buttons-group-label">
                        {formatMessage(messages.cartridgeBatchManagement)}
                      </FormLabel>
                      <RadioGroup
                        value={values?.strategy}
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
                        value={values?.adjustment}
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
          </CardContent>
        )}
      </Card>
    </>
  )
}
