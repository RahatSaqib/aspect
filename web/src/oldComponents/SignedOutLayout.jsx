import React from 'react'
import { Helmet } from 'react-helmet'
import useI18n from '../hooks/useI18n'
import AppNotificationDialog from './appNotification/AppNotificationDialog'
import AppNotificationSnackBar from './appNotification/AppNotificationSnackBar'

const SignedOutLayout = ({ children }) => {
  const intl = useI18n()
  return (
    <div>
      <Helmet titleTemplate="%s - Aspect" defaultTitle="Aspect" />
      {children}
      <AppNotificationDialog intl={intl} />
      <AppNotificationSnackBar intl={intl} />
    </div>
  )
}
export default SignedOutLayout
