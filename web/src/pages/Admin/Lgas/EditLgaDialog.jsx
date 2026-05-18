import React from 'react'
import { Box, Button, CircularProgress, TextField } from '@mui/material'
import { Formik } from 'formik'
import { useIntl } from 'react-intl'
import { useQueryClient } from 'react-query'
import { StateSelect } from '../../../components'
import AspectDialog from '../../../components/shared/AspectDialog'
import { ADMIN_LGAS_KEYS } from '../../../hooks/admin/adminKeys'
import { useEditLga } from '../../../hooks/admin/useEditLga'
import { LGA_KEY } from '../../../hooks/geography/geographyKeys'
import useAuthState from '../../../hooks/useAuthState'
import { getCustomMessage } from '../../../messages'
import { lgaFormValidation } from '../consts'
import messages from '../messages'

export function EditLgaDialog({ open, lga, onOpenChange }) {
  const { formatMessage } = useIntl()
  const user = useAuthState()
  const client = useQueryClient()
  const { mutateAsync: editLga } = useEditLga({
    onSuccess: () => {
      client.refetchQueries(ADMIN_LGAS_KEYS)
      client.removeQueries(LGA_KEY)
      onOpenChange(false)
    },
  })
  return (
    <AspectDialog
      title={`${formatMessage(messages.edit)} ${getCustomMessage(formatMessage, messages, 'lga', user)}`}
      maxWidth="sm"
      open={open}
      onClose={() => onOpenChange(false)}
    >
      <Box sx={{ my: '15px', display: 'flex', flexDirection: 'column' }}>
        <Formik
          initialValues={{ name: lga?.name, stateId: lga?.stateId }}
          validationSchema={lgaFormValidation}
          onSubmit={values => editLga({ lgaId: lga?.id, stateId: values.stateId, name: values.name })}
        >
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, isValid }) => (
            <>
              <StateSelect
                id="stateId"
                name="stateId"
                label={getCustomMessage(formatMessage, messages, 'state', user)}
                value={values?.stateId ?? ''}
                onChange={handleChange}
                error={!!(touched.stateId && Boolean(errors.stateId))}
                countryId={user.countryId}
              />
              <TextField
                id="name"
                name="name"
                label={formatMessage(messages.name)}
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={!!(touched.name && Boolean(errors.name))}
              />
              <Button
                disabled={isSubmitting || !isValid}
                sx={{ alignSelf: 'flex-end' }}
                color="primary"
                variant="contained"
                onClick={handleSubmit}
              >
                {isSubmitting ? <CircularProgress size={20} /> : formatMessage(messages.edit)}
              </Button>
            </>
          )}
        </Formik>
      </Box>
    </AspectDialog>
  )
}
