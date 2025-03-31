import React from 'react'
import { Button, Checkbox, CircularProgress, FormControlLabel, Grid, TextField } from '@mui/material'
import { Formik } from 'formik'
import { useIntl } from 'react-intl'
import { UnitSelect } from '../../../../cleanComponents'
import { useUpdateConsumableById } from '../../../../hooks/inventory/useConsumable'
import messages from '../messages'
import { initialValues, validationSchema } from './Forms/validation'

export function InventoryDetailsForm(props) {
  const { data, cartridgeId } = props
  const { formatMessage } = useIntl()
  const { mutateAsync: updateConsumable, isLoading: isUpdating } = useUpdateConsumableById()

  return (
    <Formik
      enableReinitialize
      initialValues={data || initialValues}
      validationSchema={validationSchema(formatMessage)}
      onSubmit={async (values, { setSubmitting, resetForm }) => {
        try {
          await updateConsumable({ consumableId: cartridgeId, payload: values })
          resetForm({ values })
        } catch (error) {
          console.error('Error updating consumable:', error)
        } finally {
          setSubmitting(false)
        }
      }}
    >
      {({
        values,
        errors,
        touched,
        handleChange,
        handleBlur,
        dirty,
        setFieldValue,
        isSubmitting,
        isValid,
        handleSubmit,
      }) => (
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {/* Name Field */}
            <Grid item xs={12}>
              <TextField
                id="name"
                name="name"
                label={formatMessage(messages.name)}
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={!!(touched.name && Boolean(errors.name))}
                fullWidth
              />
            </Grid>

            {/* Checkbox Fields */}
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    color="primary"
                    checked
                    disabled
                    onChange={e => setFieldValue('canExpire', e.target.checked)}
                    name="canExpire"
                  />
                }
                label={formatMessage(messages.trackByBatch)}
              />
            </Grid>

            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    disabled
                    color="primary"
                    checked={Boolean(values.includeLocation)}
                    onChange={e => setFieldValue('includeLocation', e.target.checked)}
                    name="includeLocation"
                  />
                }
                label={formatMessage(messages.includeLocation)}
              />
            </Grid>

            {/* Manufacturer Field */}
            <Grid item xs={12}>
              <TextField
                id="manufacturer"
                name="manufacturer"
                label={formatMessage(messages.manufacturer)}
                value={values.manufacturer}
                onChange={handleChange}
                onBlur={handleBlur}
                error={Boolean(touched.manufacturer && Boolean(errors.manufacturer))}
                fullWidth
              />
            </Grid>

            {/* Part Number Field */}
            <Grid item xs={12}>
              <TextField
                id="partNumber"
                name="partNumber"
                label={formatMessage(messages.partNumber)}
                value={values.partNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                error={!!(touched.partNumber && Boolean(errors.partNumber))}
                fullWidth
              />
            </Grid>

            {/* Price Field */}
            <Grid item xs={6}>
              <TextField
                id="price"
                name="price"
                label={formatMessage(messages.price)}
                value={values.price}
                onChange={handleChange}
                onBlur={handleBlur}
                inputProps={{ type: 'number' }}
                error={!!(touched.price && Boolean(errors.price))}
                sx={{ width: '200px' }}
              />
            </Grid>

            <Grid item xs={6}>
              <UnitSelect
                select
                name="unit"
                id="unit"
                label={formatMessage(messages.unit)}
                value={values.unit}
                disabled
                onChange={handleChange}
                sx={{ width: '200px' }}
              />
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12} sx={{ textAlign: 'left' }}>
              <Button type="submit" disabled={isSubmitting || !(dirty && isValid)} color="primary" variant="contained">
                {isSubmitting || isUpdating ? <CircularProgress size={20} /> : formatMessage(messages.save)}
              </Button>
            </Grid>
          </Grid>
        </form>
      )}
    </Formik>
  )
}
