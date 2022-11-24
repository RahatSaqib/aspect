import React, { useCallback } from 'react'
import map from 'lodash/map'
import reduce from 'lodash/reduce'
import unset from 'lodash/unset'
import { useParams, useNavigate } from 'react-router-dom'
import { sanitizeFormValues } from '../../../components/Form/Formik/Helpers'
import useJobFunctions from '../../../hooks/jobFunction/useJobFunctions'
import useSaveNotification from '../../../hooks/notification/saveNotifiaction'
import usePartner from '../../../hooks/partner/usePartner'
import useI18n from '../../../hooks/useI18n'
import getFormConfig from './Forms/editConfig'
import Create from './NotificationFormPage.Create'
import Update from './NotificationFormPage.Update'

const NotificationFormPage = () => {
  const { notificationId } = useParams()
  const { formatMessage } = useI18n()
  const navigate = useNavigate()
  const { data: jobFunctions } = useJobFunctions()
  const { data: partner } = usePartner()
  const { mutate: submitNotification } = useSaveNotification()

  const onSubmit = useCallback(
    formik => {
      const isNew = notificationId === 'create'
      const specificPersonId = 'specificPerson'
      const formConfig = getFormConfig(formatMessage, jobFunctions, partner, !isNew)
      const values = sanitizeFormValues(formik.values, { formConfig })
      const { deviceLevelId } = formik.values

      values.notificationType = formik.values.notificationType
      if (!['resultBased', 'reportBased'].includes(formik.values.notificationType)) {
        values.issueType = formik.values.notificationType
        values.notificationType = 'issueBased'
      }

      values.jobFunctions.map((jf, index) => {
        jf.jobFunctionId = formik.values.jobFunctions[index].jobFunctionId
        if (jf.tags === '') {
          jf.tags = []
        }
        return jf
      })
      // sanitize persons for post endpoint
      const sanitizedPersons = reduce(
        formik.values.persons,
        (acc, person) => {
          acc = [
            ...acc,
            {
              personId: person.value,
              checked: true,
            },
          ]
          return acc
        },
        []
      )
      values.jobFunctions = values.jobFunctions.filter(
        ({ checked, jobFunctionId }) => checked && jobFunctionId !== specificPersonId
      )
      if (sanitizedPersons?.length) {
        values.persons = sanitizedPersons
      }
      if (!values?.jobFunctions?.length) {
        unset(values, 'jobFunctions')
      }
      if (!values?.persons?.length) {
        unset(values, 'persons')
      }

      /**
       * sanitize three different
       * areaItem fields (state|lga|lab) into a single DB field
       */
      if (deviceLevelId === 'state') {
        values.areaItems = values.areaItemsState
        delete values.areaItemsState
      } else if (deviceLevelId === 'lga') {
        values.areaItems = map(values.areaItemsLGA, ({ label, value }) => ({
          label,
          value,
        }))
        delete values.areaItemsLGA
      } else if (deviceLevelId === 'lab') {
        values.areaItems = values.areaItemsLab
        delete values.areaItemsLab
      }

      if (values.notificationType === 'reportBased') {
        /**
         * reorganize prop names for `formik.values.cronRecurrency` because in db
         * we store
         * - cronExpression in table field `NotificationType.cronRecurrency`
         * - frequency in JSON field `NotificationType.filterCondition`
         */
        const { cronExpression, frequency } = formik.values.cronRecurrency
        values.cronRecurrency = cronExpression.join(' ')
        values.reportFrequency = frequency
      }

      submitNotification(
        { values, id: isNew ? undefined : notificationId },
        {
          onSuccess: () => navigate('/browse/notification'),
        }
      )
    },
    [formatMessage, jobFunctions, navigate, notificationId, partner, submitNotification]
  )

  return notificationId === 'create' ? (
    <Create onSubmit={onSubmit} />
  ) : (
    <Update id={notificationId} onSubmit={onSubmit} />
  )
}

export default NotificationFormPage
