import React from 'react'
import { Box, Button, CircularProgress, TextField } from '@mui/material'
import { Formik } from 'formik'
import { useIntl } from 'react-intl'
import { useQueryClient } from 'react-query'
import { ADMIN_STATES_KEYS } from '../../../hooks/admin/adminKeys'
import { useCreateState } from '../../../hooks/admin/useCreateState'
import { STATE_KEY } from '../../../hooks/geography/geographyKeys'
import useAuthState from '../../../hooks/useAuthState'
import { getCustomMessage } from '../../../messages'
import AspectDialog from '../../../components/shared/AspectDialog'
import { stateFormValidation } from '../consts'
import messages from '../messages'

export function AddStateDialog({ open, onOpenChange }) {
  const { formatMessage } = useIntl()
  const client = useQueryClient()
  const user = useAuthState()
  const { mutateAsync: createState } = useCreateState({
    onSuccess: () => {
      client.refetchQueries(ADMIN_STATES_KEYS)
      client.refetchQueries(STATE_KEY)
      onOpenChange(false)
    },
  })
  return (
    <AspectDialog
      title={`${formatMessage(messages.createNew)} ${getCustomMessage(formatMessage, messages, 'state', user)}`}
      maxWidth="sm"
      open={open}
      onClose={() => onOpenChange(false)}
    >
      <Box sx={{ my: '15px', display: 'flex', flexDirection: 'column' }}>
        <Formik
          initialValues={{ name: '', abbreviation: '' }}
          validationSchema={stateFormValidation}
          onSubmit={values => createState(values)}
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
                {isSubmitting ? <CircularProgress size={20} /> : formatMessage(messages.create)}
              </Button>
            </>
          )}
        </Formik>
      </Box>
    </AspectDialog>
  )
}
