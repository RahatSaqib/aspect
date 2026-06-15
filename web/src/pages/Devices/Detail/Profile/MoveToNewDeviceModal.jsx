import React, { useState } from 'react'
import { DialogActions } from '@mui/material'
import { Form, Formik } from 'formik'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import * as Yup from 'yup'
import AspectButton from '../../../../components/shared/AspectButton'
import AspectDialog from '../../../../components/shared/AspectDialog'
import SiteSelect from '../../../../components/SiteSelect/SiteSelect'
import useTransferInstrumentToNewDevice from '../../../../hooks/device/useTransferInstrumentToNewDevice'
import validationErrorMessages from '../../../../messages/validationErrorMessages'
import messages from './messages'

const MoveToNewDeviceModal = ({ open, onClose, onConfirm, instrumentId }) => {
  const { formatMessage } = useIntl()
  const navigate = useNavigate()

  const { mutate, isLoading } = useTransferInstrumentToNewDevice()
  const [submitError, setSubmitError] = useState(false)

  const validationSchema = Yup.object({
    siteId: Yup.string().nullable(true).required(formatMessage(validationErrorMessages.required)),
  })

  const initialValues = {
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
              siteId: values.siteId,
              instrumentId,
            },
            {
              onSuccess: data => {
                toast.success(formatMessage(messages.transferSuccess))
                resetForm()
                setSubmitError(false)
                if (data?.deletedDeviceIds?.length > 0) {
                  // Navigate to target device detail page when source device was deleted
                  navigate(`/browse/device/list/${data.newDeviceId}`)
                  onClose()
                } else {
                  onConfirm()
                }
              },
              onError: error => {
                setSubmitError(true)
                if (error?.data?.errorKeyCode === 'sitePermissionDenied') {
                  setFieldError('siteId', formatMessage(messages.sitePermissionDenied))
                }
                toast.error(formatMessage(messages.transferError))
              },
            }
          )
        }}
      >
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, resetForm, isValid, dirty }) => {
          const handleSiteChange = e => {
            if (submitError) setSubmitError(false)
            handleChange({ target: { name: 'siteId', value: e.target.value } })
          }
          return (
            <Form onSubmit={handleSubmit}>
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
  instrumentId: PropTypes.number.isRequired,
}

export default MoveToNewDeviceModal
