import React, { Fragment } from 'react'
import { useParams } from 'react-router-dom'
import isNaN from 'lodash/isNaN'
import Create from './Create'
import Update from './Update'

import './Detail.css'

const AspectNotificationDetails = () => {
  const { notificationId } = useParams()
  return (
    <Fragment>
      {isNaN(+notificationId) ? (
        <Create notificationType={notificationId} />
      ) : (
        <Update notificationId={+notificationId} />
      )}
    </Fragment>
  )
}

export default AspectNotificationDetails
