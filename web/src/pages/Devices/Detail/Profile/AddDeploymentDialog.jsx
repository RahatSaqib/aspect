import React from 'react'
import { Alert, DialogActions, TextField } from '@mui/material'
import { formatInTimeZone } from 'date-fns-tz'
import { Form, Formik } from 'formik'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import * as Yup from 'yup'
import SiteSelect from '../../../../components/SiteSelect/SiteSelect'
import useSiteList from '../../../../hooks/site/useSiteList'
import validationErrorMessages from '../../../../messages/validationErrorMessages'
import AspectButton from '../../../../oldComponents/shared/AspectButton'
import AspectDialog from '../../../../oldComponents/shared/AspectDialog'
import { toDateOnly } from '../../../../oldComponents/shared/DateTimeInput/utils/date'
import messages from './messages'

const getTodayInUserTimezone = () => {
  const fallback = toDateOnly(new Date())

  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return fallback
  }

  const timezoneId = window.localStorage.getItem('asTimezoneId')
  if (!timezoneId) {
    return fallback
  }

  try {
    return formatInTimeZone(new Date(), timezoneId, 'yyyy-MM-dd')
  } catch (e) {
    return fallback
  }
}

/**
 * Dialog for adding a new deployment. The new deployment becomes the active one.
 * - First deployment (activeDeployment is null): only site is asked; start will be null.
 * - Subsequent deployments: site + start date; current active closes at (start - 1).
 */
const AddDeploymentDialog = ({ open, onClose, onConfirm, activeDeployment }) => {
  const { formatMessage } = useIntl()
  const { data: sites = [] } = useSiteList()

  const isFirstDeployment = !activeDeployment

  const today = getTodayInUserTimezone()

  // Min start: day after active deployment's start (so the current active has ≥1 day duration)
  const activeStartStr = toDateOnly(activeDeployment?.start)
  const minStart = activeStartStr
    ? (() => {
        const d = new Date(activeStartStr)
        d.setDate(d.getDate() + 1)
        return d.toISOString().slice(0, 10)
      })()
    : null

  const validationSchema = Yup.object({
    ...(isFirstDeployment
      ? {}
      : {
          start: Yup.date()
            .required(formatMessage(validationErrorMessages.required))
            .min(
              minStart || '1900-01-01',
              formatMessage(messages.deploymentNewStartAfterCurrentEnd, { minStartDate: minStart })
            )
            .max(
              today,
              formatMessage(messages.deploymentStartNotInFuture, {
                maxStartDate: today,
              })
            ),
        }),
    siteId: Yup.number().nullable(true).required(formatMessage(validationErrorMessages.required)),
  })

  const initialValues = {
    start: isFirstDeployment ? '' : minStart && minStart > today ? minStart : today,
    siteId: '',
  }

  return (
    <AspectDialog open={open} onRequestClose={onClose} title={formatMessage(messages.addDeploymentTitle)} maxWidth="sm">
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        enableReinitialize
        onSubmit={(values, { resetForm }) => {
          const site = sites.find(s => s.id === values.siteId)
          // First deployment: pass start=null; subsequent: pass the date string
          const success = onConfirm({
            siteId: values.siteId,
            siteName: site?.name || null,
            start: isFirstDeployment ? null : values.start,
          })
          if (success !== false) resetForm()
        }}
      >
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isValid, dirty }) => {
          const activeClosesOn =
            !isFirstDeployment && values.start
              ? (() => {
                  const d = new Date(values.start)
                  d.setDate(d.getDate() - 1)
                  return d.toISOString().slice(0, 10)
                })()
              : null

          return (
            <Form onSubmit={handleSubmit}>
              {!isFirstDeployment && (
                <>
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
                    inputProps={{
                      ...(minStart ? { min: minStart } : {}),
                      max: today,
                    }}
                    error={touched.start && !!errors.start}
                    helperText={touched.start && errors.start}
                  />
                  {activeClosesOn && (
                    <Alert severity="info" sx={{ mb: 1 }}>
                      {formatMessage(messages.deploymentAddClosesActive, {
                        site: activeDeployment.siteName || `Site #${activeDeployment.siteId}`,
                        date: activeClosesOn,
                      })}
                    </Alert>
                  )}
                </>
              )}
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
                <AspectButton type="submit" color="primary" variant="contained" disabled={!isValid || !dirty}>
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

AddDeploymentDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  activeDeployment: PropTypes.object,
}

AddDeploymentDialog.defaultProps = {
  activeDeployment: null,
}

export default AddDeploymentDialog
