import React from 'react'
import { useParams } from 'react-router-dom'
import Create from './NotificationFormPage.Create'
import Update from './NotificationFormPage.Update'

const NotificationFormPage = () => {
  const { notificationId } = useParams()

  return notificationId === 'create' ? <Create /> : <Update id={notificationId} />
}

export default NotificationFormPage
