import React from 'react'
import { Alert, DialogActions, TextField } from '@mui/material'
import { Form, Formik } from 'formik'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import * as Yup from 'yup'
import validationErrorMessages from '../../../../messages/validationErrorMessages'
import AspectButton from '../../../../oldComponents/shared/AspectButton'
import AspectDialog from '../../../../oldComponents/shared/AspectDialog'
import messages from './messages'

const EditDeploymentDialog = ({ open, onClose, onConfirm, deployment, hasOtherActiveDeployment, otherDeployments }) => {
  const { formatMessage } = useIntl()

  const validationSchema = Yup.object({
    start: Yup.date().required(formatMessage(validationErrorMessages.required)),
    end: Yup.date().nullable().notRequired(),
  })

  const initialValues = {
    start: deployment ? new Date(deployment.start).toISOString().slice(0, 10) : '',
    end: deployment?.end ? new Date(deployment.end).toISOString().slice(0, 10) : '',
  }

  const checkOverlap = (start, end) => {
    if (!start || !otherDeployments) return false
    const s = new Date(start)
    const e = end ? new Date(end) : null

    return otherDeployments.some(d => {
      const ds = new Date(d.start)
      const de = d.end ? new Date(d.end) : null

      // Two ranges overlap if one starts before the other ends
      const startsBefore = e ? s <= (de || new Date('9999-12-31')) : true
      const endsAfter = (de || new Date('9999-12-31')) >= s
      const otherStartsBefore = ds <= (e || new Date('9999-12-31'))

      return (
        startsBefore &&
        endsAfter &&
        otherStartsBefore &&
        ds <= (e || new Date('9999-12-31')) &&
        s <= (de || new Date('9999-12-31'))
      )
    })
  }

  return (
    <AspectDialog
      open={open}
      onRequestClose={onClose}
      title={formatMessage(messages.editDeploymentTitle)}
      maxWidth="sm"
    >
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        enableReinitialize
        onSubmit={(values, { resetForm }) => {
          onConfirm({
            start: values.start,
            end: values.end || null,
          })
          resetForm()
        }}
      >
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isValid, dirty }) => {
          const endIsEmpty = !values.end
          const activeConflict = endIsEmpty && hasOtherActiveDeployment
          const hasOverlap = checkOverlap(values.start, values.end)

          return (
            <Form onSubmit={handleSubmit}>
              <TextField
                label={formatMessage(messages.deploymentStartDate)}
                name="start"
                type="date"
                value={values.start}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
                error={touched.start && !!errors.start}
                helperText={touched.start && errors.start}
              />
              <TextField
                label={formatMessage(messages.deploymentEndDate)}
                name="end"
                type="date"
                value={values.end}
                onChange={handleChange}
                onBlur={handleBlur}
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
                error={touched.end && !!errors.end}
                helperText={touched.end && errors.end}
              />
              {activeConflict && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {formatMessage(messages.editDeploymentActiveWarning)}
                </Alert>
              )}
              {hasOverlap && !activeConflict && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  {formatMessage(messages.editDeploymentOverlapWarning)}
                </Alert>
              )}
              <DialogActions>
                <AspectButton onClick={onClose}>{formatMessage(messages.cancel)}</AspectButton>
                <AspectButton
                  type="submit"
                  color="primary"
                  variant="contained"
                  disabled={!isValid || !dirty || activeConflict}
                >
                  {formatMessage(messages.confirm)}
                </AspectButton>
              </DialogActions>
            </Form>
          )
        }}
      </Formik>
    </AspectDialog>
  )
}

EditDeploymentDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  deployment: PropTypes.object,
  hasOtherActiveDeployment: PropTypes.bool,
  otherDeployments: PropTypes.array,
}

EditDeploymentDialog.defaultProps = {
  deployment: null,
  hasOtherActiveDeployment: false,
  otherDeployments: [],
}

export default EditDeploymentDialog
