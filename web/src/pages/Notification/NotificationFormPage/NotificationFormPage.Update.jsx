import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import isNaN from 'lodash/isNaN'
import reduce from 'lodash/reduce'
import map from 'lodash/map'
import unset from 'lodash/unset'
import CircularProgress from '@mui/material/CircularProgress'

import { FaNotesMedical } from 'react-icons/fa'
import { useQuery } from 'react-query'
import { sanitizeFormValues } from '../../../components/Form/Formik/Helpers'
import './NotificationFormPage.css'
import getFormConfig from './Forms/editConfig'
import useI18n from '../../../hooks/useI18n'
import useJobFunctions from '../../../hooks/jobFunction/useJobFunctions'
import useSaveNotification from '../../../hooks/notification/saveNotifiaction'

import { FormikProvider } from '../../../components/Form/Formik/Context'
import AspectForm from '../../../components/Form'
import FormActions from '../../../components/Form/formActions'
import { Shell, ShellHeader, ShellContent, ShellFooter } from '../../../components/Shell'
import { NOTIFICATION_DETAIL } from '../../../components/QueryFetch/Notification'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import { getFormConfigWithData } from './utils'
import validationSchema from './Forms/validation'

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

const NotificationFormPage = () => {
  const intl = useI18n()
  let { notificationId } = useParams()
  const navigate = useNavigate()
  const [formConfig, setFormConfig] = useState(false)

  const { data: jobFunctions, isLoading } = useJobFunctions()
  const { mutate: submitNotification } = useSaveNotification()

  notificationId = isNaN(notificationId) ? undefined : Number(notificationId)

  const { data: values, isLoading: notificationLoading } = useQuery(
    [NOTIFICATION_DETAIL.KEY, { notificationId }],
    async ({ queryKey: [, { notificationId }] }) =>
      fetchWrapperForQueries({
        endpoint: `${NOTIFICATION_DETAIL.ENDPOINT}/${notificationId}`,
      })
  )

  useEffect(() => {
    if (values) {
      const { data: responseData } = values
      const { notificationType, name, emailSubject, emailBody, smsBody, webUrl, webBody, filterCondition, enabled } =
        responseData

      const filter = JSON.parse(filterCondition)
      const newValues = {
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

      setFormConfig(
        getFormConfigWithData(
          intl,
          jobFunctions,
          newValues.notificationType,
          validationSchema(intl.formatMessage),
          true,
          newValues
        )
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationLoading, values])
  const onSubmit = formik => {
    const specificPersonId = 'specificPerson'
    const formConfig = getFormConfig(intl.formatMessage, formik.values.notificationType, jobFunctions, true)
    const values = sanitizeFormValues(formik.values, { formConfig })
    const { deviceLevelId } = formik.values
    values.notificationType = formik.values.notificationType
    values.jobFunctions.map((jf, index) => {
      jf.jobFunctionId = formik.values.jobFunctions[index].jobFunctionId
      if (jf.tags === '') {
        jf.tags = []
      }
      return jf
    })
    // sanitise persons for post endpoint
    const sanitisedPersons = reduce(
      formik.values.persons,
      (acc, curr) => {
        ;(acc || ((acc = []) && curr?.length)).push({
          personId: curr?.value,
          checked: true,
        })
        return acc
      },
      []
    )
    values.jobFunctions = values.jobFunctions.filter(
      ({ checked, jobFunctionId }) => checked && jobFunctionId !== specificPersonId
    )
    if (sanitisedPersons?.length) {
      values.persons = sanitisedPersons
    }
    if (!values?.jobFunctions?.length) {
      unset(values, 'jobFunctions')
    }
    if (!values?.persons?.length) {
      unset(values, 'persons')
    }
    /**
     * fun little excercise to sanitise three different
     * areaItem fields (state|lga|lab) into a single DB field :)
     */
    if (deviceLevelId === 'state') {
      values.areaItems = values.areaItemsState
      delete values.areaItemsState
    }
    if (deviceLevelId === 'lga') {
      values.areaItems = map(values.areaItemsLGA, ({ label, value }) => ({
        label,
        value,
      }))
      delete values.areaItemsLGA
    }
    if (deviceLevelId === 'lab') {
      values.areaItems = values.areaItemsLab
      delete values.areaItemsLab
    }
    submitNotification({ values, id: notificationId })
    navigate('/browse/notification')
  }

  return isLoading || notificationLoading ? (
    <CircularProgress />
  ) : (
    <Shell>
      <FormikProvider config={formConfig}>
        <ShellHeader icon={FaNotesMedical} title={formConfig.title}>
          <FormActions config={formConfig} onSubmit={onSubmit} />
        </ShellHeader>
        <ShellContent>
          <AspectForm config={formConfig} />
        </ShellContent>
        <ShellFooter />
      </FormikProvider>
    </Shell>
  )
}

export default NotificationFormPage
