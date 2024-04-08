import React from 'react'
import { Box, Button, TextField } from '@mui/material'
import { Formik } from 'formik'
import { useIntl } from 'react-intl'
import { number, object, string } from 'yup'
import { StateSelect } from '../../../cleanComponents'
import useAuthState from '../../../hooks/useAuthState'
import AspectDialog from '../../../oldComponents/shared/AspectDialog'
import messages from '../messages'

export function AddLgaDialog({ open, onOpenChange }) {
  const { formatMessage } = useIntl()
  const user = useAuthState()

  return (
    <AspectDialog
      title={formatMessage(messages.createNewLga)}
      maxWidth="sm"
      open={open}
      onClose={() => onOpenChange(false)}
    >
      <Box sx={{ my: '15px', display: 'flex', flexDirection: 'column' }}>
        <Formik
          initialValues={{ name: '', stateId: '' }}
          validationSchema={object({
            name: string().required(formatMessage(messages.lgaNameRequired)),
            stateId: number().nullable().required(formatMessage(messages.stateNameRequired)),
          })}
          onSubmit={({ values }) => {}}
        >
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
            <>
              <StateSelect
                id="stateId"
                name="stateId"
                label={formatMessage(messages.stateName)}
                value={String(values?.stateId ?? '')}
                onChange={handleChange}
                error={!!errors.stateId}
                helperText={errors.stateId}
                countryId={user.countryId}
              />
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
