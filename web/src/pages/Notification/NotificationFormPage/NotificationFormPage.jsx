import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import isNaN from 'lodash/isNaN'
import reduce from 'lodash/reduce'
import map from 'lodash/map'
import unset from 'lodash/unset'
import CircularProgress from '@mui/material/CircularProgress'

import Create from './CreateNotification'
import Update from './Update'
import { sanitizeFormValues } from '../../../components/Form/Formik/Helpers'
import './NotificationFormPage.css'
import getFormConfig from './Forms/editConfig'
import useI18n from '../../../hooks/useI18n'
import useJobFunctions from '../../../hooks/jobFunction/useJobFunctions'
import useSaveNotification from '../../../hooks/notification/saveNotifiaction'

const NotificationFormPage = () => {
  const intl = useI18n()
  const { notificationId } = useParams()
  const navigate = useNavigate()

  const { data: jobFunctions, isLoading } = useJobFunctions()
  const { mutate: submitNotification } = useSaveNotification()

  const id = isNaN(notificationId) ? undefined : Number(notificationId)

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
    submitNotification({ values, id })
    navigate('/browse/notification')
  }

  return isLoading ? (
    <CircularProgress />
  ) : isNaN(+notificationId) ? (
    <Create jobFunctions={jobFunctions} onSubmit={onSubmit} />
  ) : (
    <Update jobFunctions={jobFunctions} onSubmit={onSubmit} notificationId={id} />
  )
}

export default NotificationFormPage
