import React from 'react'
import { DialogActions, TextField } from '@mui/material'
import { Form, Formik } from 'formik'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import * as Yup from 'yup'
import validationErrorMessages from '../../../../messages/validationErrorMessages'
import AspectButton from '../../../../oldComponents/shared/AspectButton'
import AspectDialog from '../../../../oldComponents/shared/AspectDialog'
import messages from './messages'

const formatDateStr = d => (d ? new Date(d).toISOString().slice(0, 10) : null)

const FinishDeploymentDialog = ({ open, onClose, onConfirm, startDate }) => {
  const { formatMessage } = useIntl()

  const startStr = formatDateStr(startDate)
  const today = new Date().toISOString().slice(0, 10)
  // Default end to start (same-day) or today, whichever is later, so end is never before start
  const defaultEnd = startStr && startStr > today ? startStr : startStr || today

  const validationSchema = React.useMemo(() => {
    let endSchema = Yup.date().required(formatMessage(validationErrorMessages.required))
    if (startStr) {
      endSchema = endSchema.min(startStr, formatMessage(messages.finishDeploymentEndNotBeforeStart))
    }
    return Yup.object({ end: endSchema })
  }, [startStr, formatMessage])

  const initialValues = React.useMemo(
    () => ({
      end: defaultEnd,
    }),
    [defaultEnd]
  )

  return (
    <AspectDialog
      open={open}
      onRequestClose={onClose}
      title={formatMessage(messages.finishDeploymentTitle)}
      maxWidth="sm"
    >
      <Formik
        key={defaultEnd}
        initialValues={initialValues}
        validationSchema={validationSchema}
        enableReinitialize
        onSubmit={(values, { resetForm }) => {
          onConfirm({ end: values.end })
          resetForm()
        }}
      >
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isValid }) => (
          <Form onSubmit={handleSubmit}>
            <TextField
              label={formatMessage(messages.deploymentEndDate)}
              name="end"
              type="date"
              value={values.end}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              inputProps={startStr ? { min: startStr } : undefined}
              error={touched.end && !!errors.end}
              helperText={touched.end && errors.end}
            />
            <DialogActions>
              <AspectButton onClick={onClose}>{formatMessage(messages.cancel)}</AspectButton>
              <AspectButton type="submit" color="primary" variant="contained" disabled={!isValid}>
                {formatMessage(messages.confirm)}
              </AspectButton>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </AspectDialog>
  )
}

FinishDeploymentDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  startDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
}

FinishDeploymentDialog.defaultProps = {
  startDate: null,
}

export default FinishDeploymentDialog
