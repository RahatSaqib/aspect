import React from 'react'
import { Box, Button, CircularProgress, TextField } from '@mui/material'
import { Formik } from 'formik'
import { useIntl } from 'react-intl'
import { useQueryClient } from 'react-query'
import { number, object, string } from 'yup'
import { StateSelect } from '../../../cleanComponents'
import { ADMIN_LGAS_KEYS } from '../../../hooks/admin/adminKeys'
import { useCreateLga } from '../../../hooks/admin/useCreateLga'
import useAuthState from '../../../hooks/useAuthState'
import AspectDialog from '../../../oldComponents/shared/AspectDialog'
import messages from '../messages'

export function AddLgaDialog({ open, onOpenChange }) {
  const { formatMessage } = useIntl()
  const user = useAuthState()
  const client = useQueryClient()
  const { mutateAsync: createLga } = useCreateLga({
    onSuccess: () => {
      client.refetchQueries(ADMIN_LGAS_KEYS)
      onOpenChange(false)
    },
  })

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
          onSubmit={values => createLga(values)}
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
              <Button
                disabled={isSubmitting}
                sx={{ alignSelf: 'flex-end' }}
                color="primary"
                variant="contained"
                onClick={handleSubmit}
              >
                {isSubmitting ? <CircularProgress size={20} /> : formatMessage(messages.createLga)}
              </Button>
            </>
          )}
        </Formik>
      </Box>
    </AspectDialog>
  )
}
