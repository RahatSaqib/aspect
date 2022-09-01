import React from 'react'
import { Helmet } from 'react-helmet'

import AppNotificationSnackBar from './appNotification/AppNotificationSnackBar'
import AppNotificationDialog from './appNotification/AppNotificationDialog'
import useI18n from '../hooks/useI18n'

export const SignedOutLayout = ({ children }) => {
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
