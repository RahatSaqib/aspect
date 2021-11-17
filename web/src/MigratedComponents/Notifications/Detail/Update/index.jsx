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

  const {
    data: queryResponse,
    isLoading,
    isError,
    error,
  } = useQuery(
    [NOTIFICATION_DETAIL.KEY, { notificationId }],
    async ({ queryKey: [, { notificationId }] }) =>
      fetchWrapperForQueries({
        endpoint: `${NOTIFICATION_DETAIL.ENDPOINT}/${notificationId}`,
      })
  )

  if (isError) {
    throw new Error(error)
  }

  useEffect(() => {
    if (isLoading || !queryResponse) return
    const { data } = queryResponse
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
      /**
       * use loaded values from `filter.jobFunctions` for restoring array with Job Functions
       * to make sure all items in array are located in their positions
       * (filter.jobFunctions is array with only checked items) and are marked as
       * checked or not. This values in final jobFunctions will be next used in generic func
       * getInitialValuesFromFormConfig for setting initial values of the form
       */
      jobFunctions: jobFunctions.map(jf => {
        const jfSaved = filter.jobFunctions.find(
          ({ jobFunctionId }) => jobFunctionId === jf.id
        )
        return {
          jobFunctionId: jf.id,
          checked: !!jfSaved,
          tags: jfSaved
            ? jfSaved.tags.map(tag => ({
                ...tag,
                value: `${tag.value}`, // should be string
              }))
            : [],
        }
      }),
      deviceLevelId: filter.deviceLevelId,
      areaItems: filter.areaItems,
      result: filter.result,
    })
  }, [isLoading, queryResponse])

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
