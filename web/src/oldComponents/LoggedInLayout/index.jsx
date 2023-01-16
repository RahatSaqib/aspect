import React from 'react'
import classnames from 'classnames/bind'
import { Helmet } from 'react-helmet'
import useI18n from '../../hooks/useI18n'
import AppNotificationDialog from '../appNotification/AppNotificationDialog'
import AppNotificationSnackBar from '../appNotification/AppNotificationSnackBar'
import HorizontalAppBar from './HorizontalAppBar'
import styles from './index.css'

const cssClasses = classnames.bind(styles)

export const LoggedInLayout = ({ children }) => {
  const intl = useI18n()
  return (
    <div classnames={cssClasses('Layout')}>
      <div className={cssClasses('Panel')}>
        <Helmet titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <HorizontalAppBar />
        <div className={cssClasses('Page-Content')}>{children}</div>
        <AppNotificationDialog intl={intl} />
        <AppNotificationSnackBar intl={intl} />
      </div>
    </div>
  )
}

export default LoggedInLayout
