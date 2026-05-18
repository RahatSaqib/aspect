import React, { useState, useEffect } from 'react'
import { CircularProgress, Box, Card, CardContent, Grid } from '@mui/material'
import { useFormikContext } from 'formik'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import './NotificationFormPage.module.css'
import { useIntl } from 'react-intl'
import { DetailHeader } from '../../../components'
import AspectForm from '../../../components/Form'
import { FormikProvider } from '../../../components/Form/Formik/Context'
import useJobFunctions from '../../../hooks/jobFunction/useJobFunctions'
import useNotification from '../../../hooks/notification/useNotification'
import usePartner from '../../../hooks/partner/usePartner'
import AspectButton from '../../../components/shared/AspectButton'
import validationSchema from './Forms/validation'
import messages from './messages'
import NotificationFormPreview from './NotificationFormPage.Preview'
import { getFormConfigWithData } from './utils'

function buildAreaItems(id, target, data) {
  switch (true) {
    case (id === target && id === 'state') || (id === target && id === 'lab'):
      return map(data, ({ label, value }) => ({ label, value }))

    case id === target && id === 'lga':
      return map(data, ({ label, value }) => ({ label, value, grouped: true }))

    default:
      return []
  }
}

const NotificationFormPage = ({ id, onSubmit }) => {
  const notificationId = Number(id)
  const intl = useIntl()
  const [formConfig, setFormConfig] = useState(false)

  const { data: jobFunctions } = useJobFunctions()
  const { data: partner } = usePartner()

  /**
   * get raw data from useNotification hook, which is based on useQuery cached response
   * Notice that any further calls of this hook (useNotification) will return same
   * reference of `data` (=initialValues), which we then use in below `useEffect`. And because reference
   * of the `data` is the same - useEffect will run only once and we do `setFormConfig(form)` in it only
   * the first time we open Notification edit page with this notificationId
   */
  const { data: initialValues } = useNotification(notificationId, {
    enabled: !!intl && !!jobFunctions && !!partner,
  })

  useEffect(() => {
    /**
     * first rendering cycle `initialValues` is undefined until useNotification
     * via useQuery return response with this notification data
     */
    if (!initialValues) return

    /**
     * initialValues is defined and below we process it and set initial form's data
     */
    if (initialValues.notificationType === 'issueBased') {
      initialValues.notificationType = initialValues.issueType
    }
    const { notificationType, issueType, reportId, name, emailSubject, emailBody, daysBeforeCalibrationDueDate } =
      initialValues
    const { smsBody, webUrl, webBody, filterCondition, enabled } = initialValues

    const filter = JSON.parse(filterCondition)
    const newValues = {
      notificationType,
      resultBasedScope: filter.resultBasedScope,
      name,
      daysBeforeCalibrationDueDate,
      emailSubject,
      emailBody,
      sendEmail: filter.sendEmail,
      sendSms: filter.sendSms,
      sendWeb: filter.sendWeb,
      smsBody,
      webUrl,
      webBody,
      sendToPatient: filter.sendToPatient,
      enabled: !!enabled,
      persons: map(filter?.persons, p => p.personId),
      deviceLevelId: filter.deviceLevelId,
      areaItemsState: buildAreaItems(filter.deviceLevelId, 'state', filter.areaItems),
      areaItemsLGA: buildAreaItems(filter.deviceLevelId, 'lga', filter.areaItems),
      areaItemsLab: buildAreaItems(filter.deviceLevelId, 'lab', filter.areaItems),
      result: filter.result,
      issueType,
      reportId,
      hasRecurrency: !!initialValues.cronRecurrency,
      /**
       * use loaded values from `filter.jobFunctions` for restoring array with Job Functions
       * to make sure all items in array are located in their positions
       * (filter.jobFunctions is array with only checked items) and are marked as
       * checked or not. This values in final jobFunctions will be next used in generic func
       * getInitialValuesFromFormConfig for setting initial values of the form
       */
      jobFunctions: jobFunctions.map(jf => {
        const jfSaved = filter?.jobFunctions?.find(({ jobFunctionId }) => jobFunctionId === jf.id)
        return {
          jobFunctionId: jf.id,
          checked: !!jfSaved,
          tags: jfSaved ? jfSaved.tags : [],
        }
      }),
    }

    if (notificationType === 'reportBased') {
      const cronRecurrency = {
        cronExpression: initialValues.cronRecurrency.split(' '),
        frequency: filter.reportFrequency,
      }
      newValues.cronRecurrency = cronRecurrency
      newValues.reportDateRange = filter.reportDateRange
      newValues.reportStartingWeekDay = filter.reportStartingWeekDay
    }

    if (issueType === 'DeviceOffline') {
      newValues.recurrenceFactor = initialValues.recurrenceFactor?.toString()
      newValues.daysInactive = initialValues.daysInactive?.toString()
    }

    const form = getFormConfigWithData(
      intl,
      jobFunctions,
      partner,
      validationSchema(intl.formatMessage),
      true,
      newValues
    )
    setFormConfig(form)
  }, [initialValues, intl, jobFunctions, partner])

  return !formConfig ? (
    <CircularProgress />
  ) : (
    <FormikProvider config={formConfig}>
      <NotificationForm formConfig={formConfig} onSubmit={onSubmit} />
    </FormikProvider>
  )
}

const NotificationForm = ({ formConfig, onSubmit }) => {
  const intl = useIntl()
  const { formik, meta } = useFormikContext()

  return (
    <>
      <DetailHeader name={formConfig.title} back="/browse/notification/types">
        {[
          {
            disabled: !formik.dirty || !formik.isValid || formik.isSubmitting,
            label: intl.formatMessage(messages.save),
            onClick: async () => {
              const errors = await formik.validateForm()
              if (isEmpty(errors)) {
                onSubmit(formik, meta)
              }
            },
          },
        ].map(({ label, onClick, disabled = false }) => (
          <AspectButton
            key={label}
            onClick={onClick}
            disabled={disabled}
            color="primary"
            variant="contained"
            style={{ margin: '0 4px' }}
          >
            {label}
          </AspectButton>
        ))}
      </DetailHeader>
      <Box component="main" sx={{ p: 1, width: '100%' }}>
        <Card>
          <CardContent>
            <Grid container spacing={1}>
              <Grid item xs={8}>
                <h2>{intl.formatMessage(messages.editNotification)}</h2>
                <AspectForm config={formConfig} />
              </Grid>
              <Grid item xs={4}>
                <NotificationFormPreview values={formik.values} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </>
  )
}
export default NotificationFormPage
