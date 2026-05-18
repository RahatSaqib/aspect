import React from 'react'
import { Alert, DialogActions, TextField } from '@mui/material'
import { addDays, subDays } from 'date-fns'
import parseISO from 'date-fns/parseISO'
import { Form, Formik } from 'formik'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import * as Yup from 'yup'
import SiteSelect from '../../../../components/SiteSelect/SiteSelect'
import useSiteList from '../../../../hooks/site/useSiteList'
import validationErrorMessages from '../../../../messages/validationErrorMessages'
import AspectButton from '../../../../components/shared/AspectButton'
import AspectDialog from '../../../../components/shared/AspectDialog'
import { toDateOnly } from '../../../../components/shared/DateTimeInput/utils/date'
import messages from './messages'

function dayBefore(dateStr) {
  const s = toDateOnly(dateStr)
  if (!s) return null
  return toDateOnly(subDays(parseISO(s), 1))
}

function dayAfter(dateStr) {
  const s = toDateOnly(dateStr, '')
  if (!s) return null
  return toDateOnly(addDays(parseISO(s), 1))
}

/**
 * Dialog for editing a deployment. In the continuous timeline model:
 * - The user can change the site (always).
 * - The user can change the start date, EXCEPT for the first deployment (which has null start).
 * - Changing the start date automatically adjusts the previous deployment's end to (newStart - 1).
 */
const EditDeploymentDialog = ({ open, onClose, onConfirm, deployment, previousDeployment }) => {
  const { formatMessage } = useIntl()
  const { data: sites = [] } = useSiteList()

  const isFirstDeployment = !deployment?.start
  const currentStartStr = toDateOnly(deployment?.start, '')

  // Min start: day after previous deployment's start (to ensure previous has ≥1 day duration)
  const minStart = previousDeployment?.start ? dayAfter(previousDeployment.start) : null

  const validationSchema = Yup.object({
    siteId: Yup.number().nullable().required(formatMessage(validationErrorMessages.required)),
    start: isFirstDeployment
      ? Yup.string().nullable()
      : Yup.date()
          .required(formatMessage(validationErrorMessages.required))
          .min(minStart || '1900-01-01', formatMessage(messages.editDeploymentEndNotBeforeStart)),
  })

  const initialValues = {
    siteId: deployment?.siteId ?? '',
    start: currentStartStr,
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
          const site = sites.find(s => s.id === values.siteId)
          onConfirm({
            siteId: values.siteId,
            siteName: site?.name ?? null,
            start: isFirstDeployment ? null : values.start,
          })
          resetForm()
        }}
      >
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isValid }) => {
          const startChanged = !isFirstDeployment && values.start && values.start !== currentStartStr
          const newPrevEndDate = startChanged ? dayBefore(values.start) : null

          return (
            <Form onSubmit={handleSubmit}>
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
              {!isFirstDeployment && (
                <TextField
                  label={formatMessage(messages.deploymentStartDate)}
                  name="start"
                  type="date"
                  value={values.start}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  fullWidth
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                  inputProps={minStart ? { min: minStart } : undefined}
                  error={touched.start && !!errors.start}
                  helperText={touched.start && errors.start}
                />
              )}
              {startChanged && previousDeployment && newPrevEndDate && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  {formatMessage(messages.deploymentEditAdjustsPrev, {
                    site: previousDeployment.siteName || `Site #${previousDeployment.siteId}`,
                    date: newPrevEndDate,
                  })}
                </Alert>
              )}
              <DialogActions>
                <AspectButton onClick={onClose}>{formatMessage(messages.cancel)}</AspectButton>
                <AspectButton type="submit" color="primary" variant="contained" disabled={!isValid}>
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
  previousDeployment: PropTypes.object,
}

EditDeploymentDialog.defaultProps = {
  deployment: null,
  previousDeployment: null,
}

export default EditDeploymentDialog
