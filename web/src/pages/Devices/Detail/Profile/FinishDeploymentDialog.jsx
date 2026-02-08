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

const FinishDeploymentDialog = ({ open, onClose, onConfirm }) => {
  const { formatMessage } = useIntl()

  const today = new Date().toISOString().slice(0, 10)

  const validationSchema = Yup.object({
    end: Yup.date().required(formatMessage(validationErrorMessages.required)),
  })

  const initialValues = {
    end: today,
  }

  return (
    <AspectDialog
      open={open}
      onRequestClose={onClose}
      title={formatMessage(messages.finishDeploymentTitle)}
      maxWidth="sm"
    >
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={(values, { resetForm }) => {
          onConfirm({ end: values.end })
          resetForm()
        }}
      >
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isValid, dirty }) => (
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
              error={touched.end && !!errors.end}
              helperText={touched.end && errors.end}
            />
            <DialogActions>
              <AspectButton onClick={onClose}>{formatMessage(messages.cancel)}</AspectButton>
              <AspectButton type="submit" color="primary" variant="contained" disabled={!isValid || !dirty}>
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
}

export default FinishDeploymentDialog
