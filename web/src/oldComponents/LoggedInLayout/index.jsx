import classnames from 'classnames/bind'
import React from 'react'
import { Helmet } from 'react-helmet'

import IdleDialog from '../IdleDialog'
import AppNotificationSnackBar from '../appNotification/AppNotificationSnackBar'
import AppNotificationDialog from '../appNotification/AppNotificationDialog'
import HorizontalAppBar from './HorizontalAppBar'
import Footer from '../../components/Footer'

import styles from './index.css'
import useI18n from '../../hooks/useI18n'

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
