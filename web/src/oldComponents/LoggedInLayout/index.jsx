import React from 'react'
import classnames from 'classnames/bind'
import { Helmet } from 'react-helmet'
import Footer from '../../components/Footer'
import useI18n from '../../hooks/useI18n'
import AppNotificationDialog from '../appNotification/AppNotificationDialog'
import AppNotificationSnackBar from '../appNotification/AppNotificationSnackBar'
import IdleDialog from '../IdleDialog'
import HorizontalAppBar from './HorizontalAppBar'
import styles from './index.css'

const cssClasses = classnames.bind(styles)

export const LoggedInLayout = ({ children }) => {
  const intl = useI18n()
  return (
    <div classnames={cssClasses('Layout')}>
      <div className={cssClasses('Panel')}>
        <HorizontalAppBar />
        <Helmet titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <div className={cssClasses('Page-Content')}>{children}</div>
        <IdleDialog intl={intl} />
        <AppNotificationDialog intl={intl} />
        <AppNotificationSnackBar intl={intl} />
        <Footer />
      </div>
    </div>
  )
}

export default LoggedInLayout
