import React from 'react'
import { DialogActions, TextField } from '@mui/material'
import { Form, Formik } from 'formik'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import * as Yup from 'yup'
import SiteSelect from '../../../../cleanComponents/SiteSelect/SiteSelect'
import useSiteList from '../../../../hooks/site/useSiteList'
import validationErrorMessages from '../../../../messages/validationErrorMessages'
import AspectButton from '../../../../oldComponents/shared/AspectButton'
import AspectDialog from '../../../../oldComponents/shared/AspectDialog'
import messages from './messages'

const AddDeploymentDialog = ({ open, onClose, onConfirm, excludeSiteId }) => {
  const { formatMessage } = useIntl()
  const { data: sites = [] } = useSiteList()

  const today = new Date().toISOString().slice(0, 10)

  const validationSchema = Yup.object({
    start: Yup.date().required(formatMessage(validationErrorMessages.required)),
    siteId: Yup.number().nullable(true).required(formatMessage(validationErrorMessages.required)),
  })

  const initialValues = {
    start: today,
    siteId: '',
  }

  const siteFilter = sites => (excludeSiteId ? sites.filter(s => s.id !== excludeSiteId) : sites)

  return (
    <AspectDialog open={open} onRequestClose={onClose} title={formatMessage(messages.addDeploymentTitle)} maxWidth="sm">
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={(values, { resetForm }) => {
          const site = sites.find(s => s.id === values.siteId)
          const success = onConfirm({ siteId: values.siteId, siteName: site?.name || null, start: values.start })
          if (success) resetForm()
        }}
      >
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isValid, dirty }) => (
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
            <SiteSelect
              id="siteId"
              name="siteId"
              label={formatMessage(messages.deploymentSite)}
              value={values.siteId || ''}
              onChange={e => handleChange({ target: { name: 'siteId', value: e.target.value } })}
              onBlur={handleBlur}
              error={touched.siteId && !!errors.siteId}
              helperText={touched.siteId && errors.siteId}
              customFilter={siteFilter}
              required
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

AddDeploymentDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  excludeSiteId: PropTypes.number,
}

AddDeploymentDialog.defaultProps = {
  excludeSiteId: null,
}

export default AddDeploymentDialog
