import React from 'react'
import { Box, Button, CircularProgress, TextField } from '@mui/material'
import { Formik } from 'formik'
import { useIntl } from 'react-intl'
import { useQueryClient } from 'react-query'
import { number, object, string } from 'yup'
import { StateSelect } from '../../../cleanComponents'
import { ADMIN_LGAS_KEYS } from '../../../hooks/admin/adminKeys'
import { useEditLga } from '../../../hooks/admin/useEditLga'
import useAuthState from '../../../hooks/useAuthState'
import AspectDialog from '../../../oldComponents/shared/AspectDialog'
import messages from '../messages'

export function EditLgaDialog({ open, lga, onOpenChange }) {
  const { formatMessage } = useIntl()
  const user = useAuthState()
  const client = useQueryClient()
  const { mutateAsync: editLga } = useEditLga({
    onSuccess: () => {
      client.refetchQueries(ADMIN_LGAS_KEYS)
      onOpenChange(false)
    },
  })
  return (
    <AspectDialog title={formatMessage(messages.editLga)} maxWidth="sm" open={open} onClose={() => onOpenChange(false)}>
      <Box sx={{ my: '15px', display: 'flex', flexDirection: 'column' }}>
        <Formik
          initialValues={{ name: lga?.name, stateId: lga?.stateId }}
          validationSchema={object({
            name: string().required(formatMessage(messages.lgaNameRequired)),
            stateId: number().required(formatMessage(messages.stateNameRequired)),
          })}
          onSubmit={values => editLga({ lgaId: lga?.id, stateId: values.stateId, name: values.name })}
        >
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
            <>
              <StateSelect
                id="stateId"
                name="stateId"
                label={formatMessage(messages.stateName)}
                value={values?.stateId ?? ''}
                onChange={handleChange}
                error={!!(touched.stateId && Boolean(errors.stateId))}
                helperText={touched.stateId && errors.stateId}
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
                {isSubmitting ? <CircularProgress size={20} /> : formatMessage(messages.edit)}
              </Button>
            </>
          )}
        </Formik>
      </Box>
    </AspectDialog>
  )
}
