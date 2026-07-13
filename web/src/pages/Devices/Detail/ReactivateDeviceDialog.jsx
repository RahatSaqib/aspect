import React, { useMemo } from 'react'
import { DialogActions } from '@mui/material'
import { Form, Formik } from 'formik'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import { toast } from 'react-toastify'
import * as Yup from 'yup'
import AspectButton from '../../../components/shared/AspectButton'
import AspectDialog from '../../../components/shared/AspectDialog'
import SiteSelect from '../../../components/SiteSelect/SiteSelect'
import useDeployments from '../../../hooks/device/useDeployments'
import useReactivateDevice from '../../../hooks/device/useReactivateDevice'
import validationErrorMessages from '../../../messages/validationErrorMessages'
import messages from './messages'
import profileMessages from './Profile/messages'

const ReactivateDeviceDialog = ({ open, onClose, deviceId }) => {
  const { formatMessage } = useIntl()
  const reactivateMutation = useReactivateDevice()
  const { data: deploymentsData, isLoading } = useDeployments(deviceId)

  const defaultSiteId = useMemo(() => {
    const deployments = deploymentsData?.deployments ?? []
    const activeDeployment = deployments.find(d => !d.end)
    return activeDeployment?.siteId ?? ''
  }, [deploymentsData])

  const validationSchema = Yup.object({
    siteId: Yup.number().nullable(true).required(formatMessage(validationErrorMessages.required)),
  })

  const handleSubmit = values => {
    reactivateMutation.mutate(
      { deviceId, siteId: values.siteId },
      {
        onSuccess: () => onClose(),
        onError: error => {
          const errorKeyCode = error?.data?.errorKeyCode
          toast.error(
            errorKeyCode && messages[errorKeyCode]
              ? formatMessage(messages[errorKeyCode])
              : formatMessage(messages.reactivateFailed)
          )
        },
      }
    )
  }

  return (
    <AspectDialog
      open={open}
      onRequestClose={onClose}
      title={formatMessage(messages.reactivateConfirmTitle)}
      maxWidth="sm"
    >
      {isLoading ? null : (
        <Formik
          initialValues={{ siteId: defaultSiteId }}
          validationSchema={validationSchema}
          enableReinitialize
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isValid }) => (
            <Form onSubmit={handleSubmit}>
              <SiteSelect
                id="siteId"
                name="siteId"
                label={formatMessage(messages.reactivateSite)}
                value={values.siteId || ''}
                onChange={e => handleChange({ target: { name: 'siteId', value: e.target.value } })}
                onBlur={handleBlur}
                error={touched.siteId && !!errors.siteId}
                helperText={touched.siteId && errors.siteId}
                required
              />
              <DialogActions>
                <AspectButton onClick={onClose}>{formatMessage(profileMessages.cancel)}</AspectButton>
                <AspectButton
                  type="submit"
                  color="primary"
                  variant="contained"
                  disabled={!isValid || reactivateMutation.isLoading}
                >
                  {formatMessage(profileMessages.confirm)}
                </AspectButton>
              </DialogActions>
            </Form>
          )}
        </Formik>
      )}
    </AspectDialog>
  )
}

ReactivateDeviceDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  deviceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
}

export default ReactivateDeviceDialog
