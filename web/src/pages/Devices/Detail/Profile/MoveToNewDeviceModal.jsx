import React, { useRef, useState } from 'react'
import { TextField, DialogActions } from '@mui/material'
import { Formik, Form } from 'formik'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import { toast } from 'react-toastify'
import * as Yup from 'yup'
import SiteSelect from '../../../../cleanComponents/SiteSelect/SiteSelect'
import useTransferInstrumentToNewDevice from '../../../../hooks/device/useTransferInstrumentToNewDevice'
import validationErrorMessages from '../../../../messages/validationErrorMessages'
import AspectButton from '../../../../oldComponents/shared/AspectButton'
import AspectDialog from '../../../../oldComponents/shared/AspectDialog'
import messages from './messages'

const MoveToNewDeviceModal = ({ open, onClose, onConfirm, instrumentSerial }) => {
  const { formatMessage } = useIntl()
  const { mutate, isLoading } = useTransferInstrumentToNewDevice()
  const [submitError, setSubmitError] = useState(false)

  const validationSchema = Yup.object({
    deviceName: Yup.string().required(formatMessage(validationErrorMessages.required)),
    deviceShortname: Yup.string().required(formatMessage(validationErrorMessages.required)),
    siteId: Yup.string().nullable(true).required(formatMessage(validationErrorMessages.required)),
  })

  const initialValues = {
    deviceName: '',
    deviceShortname: '',
    siteId: '',
  }

  const handleCancel = resetForm => {
    resetForm()
    onClose()
  }

  return (
    <AspectDialog open={open} onClose={() => {}} title={formatMessage(messages.moveToNewDeviceTitle)}>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={(values, { resetForm, setFieldError }) => {
          mutate(
            {
              name: values.deviceName,
              shortName: values.deviceShortname,
              siteId: values.siteId,
              instrumentSerial,
            },
            {
              onSuccess: () => {
                toast.success(formatMessage(messages.transferSuccess))
                resetForm()
                setSubmitError(false)
                onConfirm()
              },
              onError: error => {
                setSubmitError(true)
                if (error?.data?.errorKeyCode === 'deviceNameAlreadyExists') {
                  setFieldError('deviceName', formatMessage(messages.deviceNameAlreadyExists))
                } else if (error?.data?.errorKeyCode === 'deviceShortNameAlreadyExists') {
                  setFieldError('deviceShortname', formatMessage(messages.deviceShortNameAlreadyExists))
                } else if (error?.data?.errorKeyCode === 'sitePermissionDenied') {
                  setFieldError('siteId', formatMessage(messages.sitePermissionDenied))
                }
                toast.error(formatMessage(messages.transferError))
              },
            }
          )
        }}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          handleSubmit,
          resetForm,
          isValid,
          dirty,
          setFieldValue,
        }) => {
          // Wrap handleChange to reset submitError on any change
          const handleAnyChange = e => {
            if (submitError) setSubmitError(false)
            handleChange(e)
          }
          // For SiteSelect, which uses a custom onChange
          const handleSiteChange = e => {
            if (submitError) setSubmitError(false)
            handleChange({ target: { name: 'siteId', value: e.target.value } })
          }
          return (
            <Form onSubmit={handleSubmit}>
              <TextField
                label={formatMessage(messages.deviceName)}
                name="deviceName"
                value={values.deviceName}
                onChange={handleAnyChange}
                onBlur={handleBlur}
                required
                fullWidth
                error={touched.deviceName && !!errors.deviceName}
                helperText={touched.deviceName && errors.deviceName}
              />
              <TextField
                label={formatMessage(messages.shortName)}
                name="deviceShortname"
                value={values.deviceShortname}
                onChange={handleAnyChange}
                onBlur={handleBlur}
                required
                fullWidth
                error={touched.deviceShortname && !!errors.deviceShortname}
                helperText={touched.deviceShortname && errors.deviceShortname}
              />
              <SiteSelect
                id="siteId"
                name="siteId"
                label={formatMessage(messages.site)}
                value={values.siteId || ''}
                onChange={handleSiteChange}
                onBlur={handleBlur}
                error={touched.siteId && !!errors.siteId}
                helperText={touched.siteId && errors.siteId}
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
                  {isLoading ? formatMessage(messages.transferLoading) : formatMessage(messages.moveToNewDevice)}
                </AspectButton>
              </DialogActions>
            </Form>
          )
        }}
      </Formik>
    </AspectDialog>
  )
}

MoveToNewDeviceModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  instrumentSerial: PropTypes.string.isRequired,
}

export default MoveToNewDeviceModal
