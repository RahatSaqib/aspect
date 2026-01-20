import React, { useState } from 'react'
import { DialogActions } from '@mui/material'
import { Form, Formik } from 'formik'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import * as Yup from 'yup'
import useTransferInstruments from '../../../../hooks/device/useTransferInstruments'
import validationErrorMessages from '../../../../messages/validationErrorMessages'
import DeviceSelectField from '../../../../oldComponents/resource/DeviceSelectField'
import AspectButton from '../../../../oldComponents/shared/AspectButton'
import AspectDialog from '../../../../oldComponents/shared/AspectDialog'
import CONSTS from '../../../../utils/consts/Devices/CONSTS'
import messages from './messages'

const MoveToExistingDeviceModal = ({ open, onClose, onConfirm, instrumentId }) => {
  const { formatMessage } = useIntl()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState(false)
  const { mutate, isLoading } = useTransferInstruments()

  const validationSchema = Yup.object({
    deviceId: Yup.string().required(formatMessage(validationErrorMessages.required)),
  })

  const initialValues = {
    deviceId: '',
  }

  const handleCancel = resetForm => {
    resetForm()
    onClose()
  }

  return (
    <AspectDialog open={open} onClose={() => {}} title={formatMessage(messages.moveToExistingDeviceTitle)}>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={(values, { resetForm, setFieldError }) => {
          mutate(
            {
              targetDeviceId: values.deviceId,
              sourceInstrumentsIds: [instrumentId],
            },
            {
              onSuccess: data => {
                toast.success(formatMessage(messages.transferSuccess))
                resetForm()
                setSubmitError(false)
                if (data?.deletedDeviceIds?.length > 0) {
                  // Navigate to target device detail page when source device was deleted
                  navigate(`/browse/device/list/${values.deviceId}`)
                  onClose()
                } else {
                  onConfirm()
                }
              },
              onError: error => {
                setSubmitError(true)
                if (error?.data?.errorKeyCode === 'targetDeviceIsSourceDevice') {
                  setFieldError('deviceId', formatMessage(messages.targetDeviceIsSourceDevice))
                }
                // Optionally handle specific error codes here
                toast.error(formatMessage(messages.transferError))
              },
            }
          )
        }}
      >
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, resetForm, isValid, dirty }) => {
          return (
            <Form onSubmit={handleSubmit}>
              <DeviceSelectField
                name="deviceId"
                deviceTypeExternalId={CONSTS.GENEXPERT_EXTERNAL_ID}
                label={formatMessage(messages.device)}
                value={values.deviceId}
                onDeviceChange={value => {
                  if (submitError) setSubmitError(false)
                  handleChange({ target: { name: 'deviceId', value } })
                }}
                onBlur={handleBlur}
                error={touched.deviceId && !!errors.deviceId}
                helperText={touched.deviceId && errors.deviceId}
                required
              />
              <DialogActions>
                <AspectButton onClick={() => handleCancel(resetForm)}>{formatMessage(messages.cancel)}</AspectButton>
                <AspectButton
                  type="submit"
                  color="primary"
                  variant="contained"
                  disabled={isLoading || !isValid || !dirty || submitError}
                >
                  {isLoading ? formatMessage(messages.transferLoading) : formatMessage(messages.moveToExistingDevice)}
                </AspectButton>
              </DialogActions>
            </Form>
          )
        }}
      </Formik>
    </AspectDialog>
  )
}

MoveToExistingDeviceModal.propTypes = {
  instrumentId: PropTypes.number.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
}

export default MoveToExistingDeviceModal
