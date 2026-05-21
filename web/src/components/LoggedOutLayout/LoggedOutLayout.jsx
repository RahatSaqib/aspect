import React from 'react'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import AppNotificationDialog from '../appNotification/AppNotificationDialog'
import AppNotificationSnackBar from '../appNotification/AppNotificationSnackBar'

const SignedOutLayout = ({ children }) => {
  const intl = useIntl()
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
