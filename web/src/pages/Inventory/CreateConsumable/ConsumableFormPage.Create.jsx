import React from 'react'
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  MenuItem,
} from '@mui/material'
import { Formik } from 'formik'
import { useIntl } from 'react-intl'
import TabsExample from '../Component/InventoryTabs'
import { validationSchema, initialValues } from './Forms/validation'
import messages from './messages'
import './ConsumableFormPage.module.css'

// import { getFormConfigWithData } from './utils'

const ConsumableFormPage = ({ onSubmit }) => {
  return <ConsumableForm onSubmit={onSubmit} />
}

const ConsumableForm = ({ onSubmit }) => {
  const { formatMessage } = useIntl()

  return (
    <>
      <Box component="main" sx={{ p: 1, width: '100%' }}>
        <Card>
          <CardContent>
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={values => console.log(values)}
            >
              {({
                values,
                errors,
                touched,
                handleChange,
                handleBlur,
                setFieldValue,
                handleSubmit,
                isSubmitting,
                isValid,
              }) => (
                <Grid container spacing={1}>
                  <Grid spacing={2} item xs={8}>
                    <TextField
                      id="name"
                      name="name"
                      label={formatMessage(messages.name)}
                      value={values.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={!!(touched.name && Boolean(errors.name))}
                    />
                    <FormControlLabel
                      control={<Checkbox color="primary" type="checkbox" value={1} onChange={handleChange} checked />}
                      key={1}
                      id="trackByExpirationDate"
                      name="trackByExpirationDate"
                      label={formatMessage(messages.trackByExpirationDate)}
                    />
                    <FormControlLabel
                      control={<Checkbox color="primary" type="checkbox" value={1} onChange={handleChange} checked />}
                      key={1}
                      id="includeLocation"
                      name="includeLocation"
                      label={formatMessage(messages.includeLocation)}
                    />
                    <TextField
                      id="manufacturer"
                      name="manufacturer"
                      label={formatMessage(messages.manufacturer)}
                      value={values.manufacturer}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={!!(touched.manufacturer && Boolean(errors.manufacturer))}
                    />
                    <TextField
                      id="partNumber"
                      name="partNumber"
                      label={formatMessage(messages.partNumber)}
                      value={values.partNumber}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={!!(touched.partNumber && Boolean(errors.partNumber))}
                    />
                    <TextField
                      id="price"
                      name="price"
                      label={formatMessage(messages.price)}
                      value={values.price}
                      onChange={handleChange}
                      inputProps={{ type: 'number' }}
                      onBlur={handleBlur}
                      error={!!(touched.price && Boolean(errors.price))}
                    />
                    <TextField
                      select
                      name="unit"
                      id="unit"
                      label={formatMessage(messages.unit)}
                      fullWidth
                      variant="standard"
                      value={values.unit}
                      onChange={handleChange}
                    >
                      {[{ id: 'piece', unit: 'Piece' }].map(site => (
                        <MenuItem key={site.id} value={site.id}>
                          {site.unit}
                        </MenuItem>
                      ))}
                    </TextField>

                    <Button
                      disabled={isSubmitting || !isValid}
                      sx={{ alignSelf: 'flex-end' }}
                      color="primary"
                      variant="contained"
                      onClick={handleSubmit}
                    >
                      {isSubmitting ? <CircularProgress size={20} /> : formatMessage(messages.save)}
                    </Button>
                  </Grid>
                  <Grid item xs={4}>
                    <TabsExample />
                  </Grid>
                </Grid>
              )}
            </Formik>
          </CardContent>
        </Card>
      </Box>
    </>
  )
}

export default ConsumableFormPage
