import React from 'react'
import { DialogActions, Typography } from '@mui/material'
import { Form, Formik } from 'formik'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import * as Yup from 'yup'
import SiteSelect from '../../../../components/SiteSelect/SiteSelect'
import useSiteList from '../../../../hooks/site/useSiteList'
import validationErrorMessages from '../../../../messages/validationErrorMessages'
import AspectButton from '../../../../components/shared/AspectButton'
import AspectDialog from '../../../../components/shared/AspectDialog'
import messages from './messages'

const FillGapDeploymentDialog = ({ open, onClose, onConfirm, gap }) => {
  const { formatMessage } = useIntl()
  const { data: sites = [] } = useSiteList()

  const validationSchema = Yup.object({
    siteId: Yup.number().nullable(true).required(formatMessage(validationErrorMessages.required)),
  })

  const initialValues = {
    siteId: '',
  }

  if (!gap) return null

  const { start, end } = gap

  return (
    <AspectDialog
      open={open}
      onRequestClose={onClose}
      title={formatMessage(messages.fillGapDeploymentTitle)}
      maxWidth="sm"
    >
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={(values, { resetForm }) => {
          const site = sites.find(s => s.id === values.siteId)
          onConfirm({
            siteId: values.siteId,
            siteName: site?.name || null,
            start,
            end,
          })
          resetForm()
          onClose()
        }}
      >
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isValid }) => (
          <Form onSubmit={handleSubmit}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {formatMessage(messages.fillGapDeploymentDescription, { start, end })}
            </Typography>
            <SiteSelect
              id="siteId"
              name="siteId"
              label={formatMessage(messages.deploymentSite)}
              value={values.siteId || ''}
              onChange={e => handleChange({ target: { name: 'siteId', value: e.target.value } })}
              onBlur={handleBlur}
              error={touched.siteId && !!errors.siteId}
              helperText={touched.siteId && errors.siteId}
              required
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

FillGapDeploymentDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  gap: PropTypes.shape({
    start: PropTypes.string.isRequired,
    end: PropTypes.string.isRequired,
  }),
}

FillGapDeploymentDialog.defaultProps = {
  gap: null,
}

export default FillGapDeploymentDialog
