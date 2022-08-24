import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import reduce from 'lodash/reduce'
import map from 'lodash/map'
import unset from 'lodash/unset'
import CircularProgress from '@mui/material/CircularProgress'

import { FaNotesMedical } from 'react-icons/fa'
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
import { getFormConfigWithData } from './utils'
import validationSchema from './Forms/validation'
import useNotification from '../../../hooks/notification/useNotification'

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

const NotificationFormPage = ({ id }) => {
  const notificationId = Number(id)
  const intl = useI18n()
  const navigate = useNavigate()
  const [formConfig, setFormConfig] = useState(false)

  const { data: jobFunctions } = useJobFunctions()
  const { mutate: submitNotification } = useSaveNotification()

  useNotification(notificationId, {
    enabled: !!intl && !!jobFunctions,
    onSuccess: data => {
      const { notificationType, name, emailSubject, emailBody } = data
      const { smsBody, webUrl, webBody, filterCondition, enabled } = data

      const filter = JSON.parse(filterCondition)
      const newValues = {
        notificationType,
        name,
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
        persons: map(filter?.persons, p => `${p.personId}`),
        deviceLevelId: filter.deviceLevelId,
        areaItemsState: buildAreaItems(filter.deviceLevelId, 'state', filter.areaItems),
        areaItemsLGA: buildAreaItems(filter.deviceLevelId, 'lga', filter.areaItems),
        areaItemsLab: buildAreaItems(filter.deviceLevelId, 'lab', filter.areaItems),
        result: filter.result,
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
            tags: jfSaved ? jfSaved.tags.map(tag => ({ ...tag, value: `${tag.value}` })) : [],
          }
        }),
      }
      const form = getFormConfigWithData(intl, jobFunctions, validationSchema(intl.formatMessage), true, newValues)
      setFormConfig(form)
    },
  })

  const onSubmit = formik => {
    const specificPersonId = 'specificPerson'
    const formConfig = getFormConfig(intl.formatMessage, jobFunctions, true)
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
          personId: curr,
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
    submitNotification({ values, id: notificationId }, { onSuccess: () => navigate('/browse/notification') })
  }

  return !formConfig ? (
    <CircularProgress />
  ) : (
    <Shell>
      <FormikProvider config={formConfig} debug>
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
