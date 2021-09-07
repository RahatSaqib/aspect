import React, { Fragment, useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import isNaN from 'lodash/isNaN'
import isNumber from 'lodash/isNumber'
import { useMutation, useQuery } from 'react-query'
import CircularProgress from '@material-ui/core/CircularProgress'

import Create from './Create'
import Update from './Update'
import { sanitizeFormValues } from '../../Form/Formik/Helpers'
import { NOTIFICATION_DETAIL } from '../../QueryFetch/Notification'
import './Detail.css'
import fetchWrapperForQueries from '../../QueryFetch/index'
import JOBFUNCTIONS_LIST from '../../QueryFetch/JobFunctions/index'
import { getReturnUrl, useUrlQuery } from '../../AspectTable/Helpers'

const AspectNotificationDetails = () => {
  const { notificationId } = useParams()
  const navigate = useNavigate()
  const { search } = useLocation()
  const query = useUrlQuery(search)

  const {
    isError,
    data: { data } = [],
    error,
  } = useQuery(JOBFUNCTIONS_LIST.KEY, async () =>
    fetchWrapperForQueries({ endpoint: JOBFUNCTIONS_LIST.ENDPOINT })
  )

  if (isError) {
    throw new Error(error)
  }
  const [jobFunctions, setJobFunctions] = useState(undefined)

  useEffect(() => {
    if (data) setJobFunctions(data[0].jobFunctions)
  }, [data])

  const { mutate: submitNotification } = useMutation(
    (values, notificationId) => {
      let endpoint = NOTIFICATION_DETAIL.ENDPOINT
      if (notificationId) {
        endpoint += `/${notificationId}`
      }

      return fetchWrapperForQueries({
        endpoint,
        method: notificationId ? 'PUT' : 'POST',
        params: {
          ...values,
        },
      })
    },
    {
      onSuccess: () => {
        const path = getReturnUrl(
          query.get('returnUrl'),
          `/browse/notification`
        )
        navigate(path)
      },
    }
  )

  const onSubmit = (formik, meta) => {
    const values = sanitizeFormValues(formik.values, { meta })
    // save only checked Job Functions
    values.jobFunctions = values.jobFunctions.filter(({ checked }) => checked)
    const id = isNumber(notificationId) ? +notificationId : undefined

    submitNotification(values, id)
  }

  const props = {
    notificationType: isNumber(notificationId)
      ? +notificationId
      : notificationId,
    jobFunctions,
    onSubmit,
  }
  if (!jobFunctions) return <CircularProgress />
  return (
    <Fragment>
      {isNaN(+notificationId) ? <Create {...props} /> : <Update {...props} />}
    </Fragment>
  )
}

export default AspectNotificationDetails
