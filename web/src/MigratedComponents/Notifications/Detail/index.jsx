import React, { Fragment, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import isNaN from 'lodash/isNaN'
import isNumber from 'lodash/isNumber'
import { useQuery } from 'react-query'
import CircularProgress from '@material-ui/core/CircularProgress'
import Create from './Create'
import Update from './Update'
import './Detail.css'
import fetchWrapperForQueries from '../../QueryFetch/index'
import JOBFUNCTIONS_LIST from '../../QueryFetch/JobFunctions/index'

const AspectNotificationDetails = () => {
  const { notificationId } = useParams()

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
  const props = {
    notificationType: isNumber(notificationId)
      ? +notificationId
      : notificationId,
    jobFunctions,
  }
  if (!jobFunctions)
    return (
      <Fragment>
        <CircularProgress />
      </Fragment>
    )
  return (
    <Fragment>
      {isNaN(+notificationId) ? <Create {...props} /> : <Update {...props} />}
    </Fragment>
  )
}

export default AspectNotificationDetails
