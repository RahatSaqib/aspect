/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { FaNotesMedical } from 'react-icons/fa'
import CircularProgress from '@mui/material/CircularProgress'
import { useQuery } from 'react-query'
import map from 'lodash/map'
import isEqual from 'lodash/isEqual'
import useI18n from '../../../../hooks/i18n/useI18n'
import { FormikProvider } from '../../../../components/Form/Formik/Context'
import AspectForm from '../../../../components/Form'
import FormActions from '../../../../components/Form/formActions'
import Shell from '../../../../components/Shell'
import ShellHeader from '../../../../components/Shell/Header'
import ShellContent from '../../../../components/Shell/Content'
import ShellFooter from '../../../../components/Shell/Footer'
import { NOTIFICATION_DETAIL } from '../../../../components/QueryFetch/Notification'
import fetchWrapperForQueries from '../../../../components/QueryFetch'
import { getFormConfigWithData } from '../utils'
import validationSchema from '../../Forms/validation'

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

const AspectNotificationDetail = ({ notificationId, jobFunctions, onSubmit }) => {
  const intl = useI18n()
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState({ error: false, message: null })
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

  useQuery([NOTIFICATION_DETAIL.KEY, { notificationId }], async ({ queryKey: [, { notificationId }] }) => {
    const fetch = await fetchWrapperForQueries({
      endpoint: `${NOTIFICATION_DETAIL.ENDPOINT}/${notificationId}`,
    })
    if (fetch && !fetch.ok) {
      setIsError({
        error: true,
        message: `${NOTIFICATION_DETAIL.KEY} query failed`,
      })
    }
    if (fetch?.ok) {
      const { data: responseData } = fetch
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
        enabled,
      } = responseData

      const filter = JSON.parse(filterCondition)
      const newValues = {
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
        sendToPatient: filter.sendToPatient,
        enabled: !!enabled,
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
            tags: jfSaved
              ? jfSaved.tags.map(tag => ({
                  ...tag,
                  value: `${tag.value}`, // should be string
                }))
              : [],
          }
        }),
        persons: map(filter?.persons, ({ checked, personId }) => ({
          checked,
          id: `${personId}`, // should be string
        })),
        deviceLevelId: filter.deviceLevelId,
        areaItemsState: buildAreaItems(filter.deviceLevelId, 'state', filter.areaItems),
        areaItemsLGA: buildAreaItems(filter.deviceLevelId, 'lga', filter.areaItems),
        areaItemsLab: buildAreaItems(filter.deviceLevelId, 'lab', filter.areaItems),
        result: filter.result,
      }

      if (!isEqual(newValues, values)) {
        setValues(newValues)
        setIsLoading(false)
      }
    }
    return fetch
  })

  if (isError?.error) {
    throw new Error(isError.message)
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
