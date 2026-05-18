import React from 'react'
import { Box, Button, CircularProgress, TextField } from '@mui/material'
import { Formik } from 'formik'
import { useIntl } from 'react-intl'
import { useQueryClient } from 'react-query'
import AspectDialog from '../../../components/shared/AspectDialog'
import { ADMIN_STATES_KEYS } from '../../../hooks/admin/adminKeys'
import { useEditState } from '../../../hooks/admin/useEditState'
import { STATE_KEY } from '../../../hooks/geography/geographyKeys'
import useAuthState from '../../../hooks/useAuthState'
import { getCustomMessage } from '../../../messages'
import { stateFormValidation } from '../consts'
import messages from '../messages'

export function EditStateDialog({ open, state, onOpenChange }) {
  const { formatMessage } = useIntl()
  const client = useQueryClient()
  const user = useAuthState()
  const { mutateAsync: editState } = useEditState({
    onSuccess: () => {
      client.refetchQueries(ADMIN_STATES_KEYS)
      client.refetchQueries(STATE_KEY)
      onOpenChange(false)
    },
  })
  return (
    <AspectDialog
      title={`${formatMessage(messages.edit)} ${getCustomMessage(formatMessage, messages, 'state', user)}`}
      maxWidth="sm"
      open={open}
      onClose={() => onOpenChange(false)}
    >
      <Box sx={{ my: '15px', display: 'flex', flexDirection: 'column' }}>
        <Formik
          initialValues={{ name: state?.name, abbreviation: state?.abbreviation }}
          validationSchema={stateFormValidation}
          onSubmit={({ abbreviation, name }) => editState({ stateId: state?.id, abbreviation, name })}
        >
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, isValid }) => (
            <>
              <TextField
                id="name"
                name="name"
                label={formatMessage(messages.name)}
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={!!(touched.name && Boolean(errors.name))}
              />
              <TextField
                id="abbreviation"
                name="abbreviation"
                label={formatMessage(messages.abbreviation)}
                value={values.abbreviation}
                onChange={handleChange}
                onBlur={handleBlur}
                error={!!(touched.abbreviation && Boolean(errors.abbreviation))}
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
