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

/** Deployment start/end are date-only in the DB; use as-is for inputs (no timezone conversion). */
function getDeploymentDateForInput(value) {
  if (value == null) return ''
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10)
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
}

const EditDeploymentDialog = ({ open, onClose, onConfirm, deployment, hasOtherActiveDeployment, otherDeployments }) => {
  const { formatMessage } = useIntl()

  const validationSchema = Yup.object({
    start: Yup.date().required(formatMessage(validationErrorMessages.required)),
    end: Yup.date()
      .nullable()
      .notRequired()
      .when('start', (start, schema) =>
        start ? schema.min(start, formatMessage(messages.editDeploymentEndNotBeforeStart)) : schema
      ),
  })

  const initialValues = {
    start: deployment ? getDeploymentDateForInput(deployment.start) : '',
    end: deployment?.end ? getDeploymentDateForInput(deployment.end) : '',
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
                inputProps={values.start ? { min: values.start } : undefined}
                error={touched.end && !!errors.end}
                helperText={touched.end && errors.end}
              />
              {activeConflict && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {formatMessage(messages.editDeploymentActiveWarning)}
                </Alert>
              )}
              {hasOverlap && !activeConflict && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {formatMessage(messages.deploymentOverlap)}
                </Alert>
              )}
              <DialogActions>
                <AspectButton onClick={onClose}>{formatMessage(messages.cancel)}</AspectButton>
                <AspectButton
                  type="submit"
                  color="primary"
                  variant="contained"
                  disabled={!isValid || !dirty || activeConflict || hasOverlap}
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
