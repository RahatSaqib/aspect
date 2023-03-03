import React, { useCallback } from 'react'
import isPlainObject from 'lodash/isPlainObject'
import map from 'lodash/map'
import reduce from 'lodash/reduce'
import unset from 'lodash/unset'
import { useQueryClient } from 'react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { sanitizeFormValues } from '../../../components/Form/Formik/Helpers'
import { NOTIFICATION_LIST } from '../../../components/QueryFetch/Notification'
import useJobFunctions from '../../../hooks/jobFunction/useJobFunctions'
import { NOTIFICATION_KEY } from '../../../hooks/notification/notificationKeys'
import useSaveNotification from '../../../hooks/notification/useSaveNotification'
import usePartner from '../../../hooks/partner/usePartner'
import useI18n from '../../../hooks/useI18n'
import getFormConfig from './Forms/editConfig'
import Create from './NotificationFormPage.Create'
import Update from './NotificationFormPage.Update'

const NotificationFormPage = () => {
  const queryClient = useQueryClient()
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

      delete values.siteWithLowFieldCompletionRateDescription
      delete values.deviceOfflineDescription
      delete values.descriptionWhenResultBasedNotificationBeTriggered

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
          const personId = isPlainObject(person) ? person.value : person
          acc = [
            ...acc,
            {
              personId,
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
          onSuccess: () => {
            /**
             * invalidate query cache for entire notification list - this is needed when
             * updated notification should show something in the list column
             */
            queryClient.invalidateQueries(NOTIFICATION_LIST.KEY)
            /**
             * for Update mode (isNew = false) invalidate query cache for the _SAME_
             * array keys as in `useNotification` hook.
             * _SAME_ means also including data types for keys array elements.
             * See `NotificationFormPage.Update` - we also use `Number(id)` for notificationId
             */
            if (!isNew) {
              queryClient.invalidateQueries([NOTIFICATION_KEY, Number(notificationId)])
            }
            navigate('/browse/notification')
          },
        }
      )
    },
    [formatMessage, jobFunctions, navigate, notificationId, partner, queryClient, submitNotification]
  )

  return notificationId === 'create' ? (
    <Create onSubmit={onSubmit} />
  ) : (
    <Update id={notificationId} onSubmit={onSubmit} />
  )
}

export default NotificationFormPage
