import React from 'react'
import { Box, Button, CircularProgress, TextField } from '@mui/material'
import { Formik } from 'formik'
import { useIntl } from 'react-intl'
import { object, string } from 'yup'
import { useCreateState } from '../../../hooks/admin/useCreateState'
import AspectDialog from '../../../oldComponents/shared/AspectDialog'
import messages from '../messages'

export function AddStateDialog({ open, onOpenChange }) {
  const { formatMessage } = useIntl()
  const { mutateAsync: createState } = useCreateState()
  return (
    <AspectDialog
      title={formatMessage(messages.createNewState)}
      maxWidth="sm"
      open={open}
      onClose={() => onOpenChange(false)}
    >
      <Box sx={{ my: '15px', display: 'flex', flexDirection: 'column' }}>
        <Formik
          initialValues={{ name: '', abbreviation: '' }}
          validationSchema={object({
            name: string().required(formatMessage(messages.stateNameRequired)),
            abbreviation: string().required(formatMessage(messages.stateAbbreviationRequired)),
          })}
          onSubmit={values => createState(values)}
        >
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
            <>
              <TextField
                id="name"
                name="name"
                label={formatMessage(messages.stateName)}
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={!!(touched.name && Boolean(errors.name))}
                helperText={touched.name && errors.name}
              />
              <TextField
                id="abbreviation"
                name="abbreviation"
                label={formatMessage(messages.stateAbbreviation)}
                value={values.abbreviation}
                onChange={handleChange}
                onBlur={handleBlur}
                error={!!(touched.abbreviation && Boolean(errors.abbreviation))}
                helperText={touched.abbreviation && errors.abbreviation}
              />
              <Button
                disabled={isSubmitting}
                sx={{ alignSelf: 'flex-end' }}
                color="primary"
                variant="contained"
                onClick={handleSubmit}
              >
                {isSubmitting ? <CircularProgress size={20} /> : formatMessage(messages.createState)}
              </Button>
            </>
          )}
        </Formik>
      </Box>
    </AspectDialog>
  )
}
