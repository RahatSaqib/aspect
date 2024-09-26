import React from 'react'
import { Card, CardContent, CircularProgress, Grid, Button, TextField, Checkbox, FormControlLabel } from '@mui/material'
import { Formik } from 'formik'
import { useIntl } from 'react-intl'
import { UnitSelect } from '../../../../cleanComponents'
import { useUpdateConsumableById } from '../../../../hooks/inventory/useConsumable'
import messages from '../messages'
import { validationSchema, initialValues } from './Forms/validation'

export const InventoryDetailsForm = ({ data, cartridgeId }) => {
  const { formatMessage } = useIntl()
  const { mutateAsync: updateConsumable, isLoading: isUpdating } = useUpdateConsumableById()

  return (
    <Card>
      <CardContent>
        <Formik
          enableReinitialize
          initialValues={data || initialValues}
          validationSchema={validationSchema(formatMessage)}
        >
          {({ values, errors, touched, handleChange, handleBlur, dirty, setFieldValue, isSubmitting }) => (
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
                      checked={values.trackByExpiration || false} // Ensure a boolean is passed
                      onChange={e => setFieldValue('trackByExpiration', e.target.checked)} // Manually update the field value
                      name="trackByExpiration"
                    />
                  }
                  label={formatMessage(messages.trackByExpirationDate)}
                />
              </Grid>

              <Grid item xs={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      color="primary"
                      checked={values.includeLocation || false} // Ensure a boolean is passed
                      onChange={e => setFieldValue('includeLocation', e.target.checked)} // Manually update the field value
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
                  error={!!(touched.manufacturer && Boolean(errors.manufacturer))}
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
                  onChange={handleChange}
                  sx={{ width: '200px' }}
                />
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12} sx={{ textAlign: 'left' }}>
                <Button
                  type="submit"
                  disabled={!dirty || isSubmitting}
                  color="primary"
                  onClick={() => updateConsumable({ consumableId: cartridgeId, payload: values })}
                  variant="contained"
                >
                  {isUpdating ? <CircularProgress size={20} /> : formatMessage(messages.save)}
                </Button>
              </Grid>
            </Grid>
          )}
        </Formik>
      </CardContent>
    </Card>
  )
}
