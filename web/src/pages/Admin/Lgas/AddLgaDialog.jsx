import React from 'react'
import { Box, Button, TextField } from '@mui/material'
import { Formik } from 'formik'
import { useIntl } from 'react-intl'
import { object, string } from 'yup'
import AspectDialog from '../../../oldComponents/shared/AspectDialog'
import messages from '../messages'

export function AddLgaDialog({ open, onOpenChange }) {
  const { formatMessage } = useIntl()
  return (
    <AspectDialog
      title={formatMessage(messages.createNewLga)}
      maxWidth="sm"
      open={open}
      onClose={() => onOpenChange(false)}
    >
      <Box sx={{ my: '15px', display: 'flex', flexDirection: 'column' }}>
        <Formik
          initialValues={{ name: '' }}
          validationSchema={object({
            name: string().required(formatMessage(messages.lgaNameRequired)),
          })}
          onSubmit={({ values }) => {}}
        >
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
            <>
              <TextField
                id="name"
                name="name"
                label={formatMessage(messages.lgaName)}
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={!!(touched.name && Boolean(errors.name))}
                helperText={touched.name && errors.name}
              />
              <Button sx={{ alignSelf: 'flex-end' }} color="primary" variant="contained" onClick={handleSubmit}>
                {formatMessage(messages.createLga)}
              </Button>
            </>
          )}
        </Formik>
      </Box>
    </AspectDialog>
  )
}
