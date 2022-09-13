import React, { Fragment, useEffect, useState } from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import isNaN from 'lodash/isNaN'
import isNumber from 'lodash/isNumber'
import map from 'lodash/map'
import reduce from 'lodash/reduce'
import unset from 'lodash/unset'
import { useMutation, useQuery } from 'react-query'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getReturnUrl, useUrlQuery } from '../../../components/AspectTable/Helpers'
import { sanitizeFormValues } from '../../../components/Form/Formik/Helpers'
import fetchWrapperForQueries from '../../../components/QueryFetch/index'
import JOBFUNCTIONS_LIST from '../../../components/QueryFetch/JobFunctions/index'
import { NOTIFICATION_DETAIL } from '../../../components/QueryFetch/Notification'
import useI18n from '../../../hooks/useI18n'
import getFormConfig from '../Forms/editConfig'
import Create from './Create'
import Update from './Update'
import './Detail.css'

const AspectNotificationDetails = () => {
  const intl = useI18n()
  const { notificationId } = useParams()
  const navigate = useNavigate()
  const { search } = useLocation()
  const query = useUrlQuery(search)

  const {
    isError,
    data: { data } = [],
    error,
  } = useQuery(JOBFUNCTIONS_LIST.KEY, async () => fetchWrapperForQueries({ endpoint: JOBFUNCTIONS_LIST.ENDPOINT }))

  if (isError) {
    throw new Error(error)
  }
  const [jobFunctions, setJobFunctions] = useState(undefined)

  useEffect(() => {
    if (data) {
      const mergedJobFunctions = [...data[0].jobFunctions]
      setJobFunctions(mergedJobFunctions)
    }
  }, [data, intl])

  const { mutate: submitNotification } = useMutation(
    ({ values, id }) => {
      let endpoint = NOTIFICATION_DETAIL.ENDPOINT
      if (id) {
        endpoint += `/${id}`
      }

      return fetchWrapperForQueries({
        endpoint,
        method: id ? 'PUT' : 'POST',
        params: {
          ...values,
        },
      })
    },
    {
      onSuccess: () => {
        const path = getReturnUrl(query.get('returnUrl'), `/browse/notification`)
        navigate(path)
      },
    }
  )

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
  }

  if (!jobFunctions) return <CircularProgress />
  return (
    <Fragment>
      {isNaN(+notificationId) ? (
        <Create
          jobFunctions={jobFunctions}
          onSubmit={onSubmit}
          notificationType={isNumber(notificationId) ? +notificationId : notificationId}
        />
      ) : (
        <Update jobFunctions={jobFunctions} onSubmit={onSubmit} notificationId={id} />
      )}
    </Fragment>
  )
}

export default AspectNotificationDetails
