/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { FaNotesMedical } from 'react-icons/fa'
import CircularProgress from '@material-ui/core/CircularProgress'
import { useQuery } from 'react-query'

import useI18n from '../../../../Hooks/i18n/useI18n'
import { FormikProvider } from '../../../Form/Formik/Context'

import AspectForm from '../../../Form'
import FormActions from '../../../Form/formActions'
import Shell from '../../../Shell'
import ShellHeader from '../../../Shell/Header'
import ShellContent from '../../../Shell/Content'
import ShellFooter from '../../../Shell/Footer'
import { NOTIFICATION_DETAIL } from '../../../QueryFetch/Notification'
import fetchWrapperForQueries from '../../../QueryFetch'
import { getFormConfigWithData } from '../utils'
import validationSchema from '../../Forms/validation'

const AspectNotificationDetail = ({
  notificationId,
  jobFunctions,
  onSubmit,
}) => {
  const intl = useI18n()
  const [formConfig, setFormConfig] = useState(false)
  const [values, setValues] = useState(false)

  useEffect(() => {
    if (!isLoading && values) {
      setFormConfig(
        getFormConfigWithData(
          intl,
          jobFunctions,
          values.notificationType,
          values.notificationTypeName,
          validationSchema(intl.formatMessage),
          true,
          values
        )
      )
    }
  }, [isLoading, values])

  const { isLoading, isError, error } = useQuery(
    [NOTIFICATION_DETAIL.KEY, { notificationId }],
    async ({ queryKey: [, { notificationId }] }) =>
      fetchWrapperForQueries({
        endpoint: `${NOTIFICATION_DETAIL.ENDPOINT}/${notificationId}`,
      }),
    {
      onSuccess: resp => {
        const { data } = resp
        const {
          notificationTypeName,
          notificationType,
          name,
          emailSubject,
          emailBody,
          smsBody,
          webUrl,
          webBody,
          filterCondition,
        } = data
        const filter = JSON.parse(filterCondition)
        setValues({
          notificationTypeName,
          notificationType,
          name,
          emailSubject,
          emailBody,
          sendEmail: filter.sendEmail,
          smsBody,
          sendSms: filter.sendSms,
          webUrl,
          webBody,
          sendWeb: filter.sendWeb,
          jobFunctions: filter.jobFunctions,
          deviceLevelId: filter.deviceLevelId,
          areaItems: filter.areaItems,
          result: filter.result,
        })
      },
    }
  )
  if (isError) {
    throw new Error(error)
  }

  return (
    <Shell>
      {!isLoading && formConfig ? (
        <FormikProvider config={formConfig}>
          <ShellHeader icon={FaNotesMedical} title={formConfig.title}>
            <FormActions config={formConfig} onSubmit={onSubmit} />
          </ShellHeader>
          <ShellContent>
            <AspectForm config={formConfig} />
          </ShellContent>
          <ShellFooter />
        </FormikProvider>
      ) : (
        <CircularProgress />
      )}
    </Shell>
  )
}

AspectNotificationDetail.propTypes = {
  notificationId: PropTypes.number.isRequired,
  jobFunctions: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSubmit: PropTypes.func.isRequired,
}

export default AspectNotificationDetail
