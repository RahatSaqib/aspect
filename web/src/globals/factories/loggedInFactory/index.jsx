import classnames from 'classnames/bind'
import React from 'react'
import { compose, pure } from 'recompose'
import { Helmet } from 'react-helmet'

import IdleDialog from '../../../oldComponents/IdleDialog'
import AppNotificationSnackBar from '../../../oldComponents/appNotification/AppNotificationSnackBar'
import AppNotificationDialog from '../../../oldComponents/appNotification/AppNotificationDialog'
import intlScrollToTopOnUpdateFactory from '../intlScrollToTopOnUpdateFactory'
import ConnectedNavDrawer from './ConnectedNavDrawer'
import VerticalAppBar from './VerticalAppBar'
import HorizontalAppBar from './HorizontalAppBar'
import Footer from '../../../components/Footer'

import styles from './index.css'

const cssClasses = classnames.bind(styles)

export const loggedInFactory = compose(
  intlScrollToTopOnUpdateFactory,
  render => props =>
    (
      <div classnames={cssClasses('Layout')}>
        <ConnectedNavDrawer history={props.history} location={props.location} />
        <div className={cssClasses('Panel')}>
          <VerticalAppBar />
          <HorizontalAppBar />
          <Helmet titleTemplate="%s - Aspect" defaultTitle="Aspect" />
          <div className={cssClasses('Page-Content')}>{render(props)}</div>
          <IdleDialog intl={props.intl} />
          <AppNotificationDialog intl={props.intl} />
          <AppNotificationSnackBar intl={props.intl} />
          <Footer />
        </div>
      </div>
    ),
  React.createFactory,
  pure
)

export default loggedInFactory
