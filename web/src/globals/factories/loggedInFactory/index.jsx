import classnames from 'classnames/bind'
import React from 'react'
import { compose, pure } from 'recompose'
import { Helmet } from 'react-helmet'

import IdleDialog from '../../../idle/components/IdleDialog'
import AppNotificationSnackBar from '../../../appNotification/AppNotificationSnackBar'
import AppNotificationDialog from '../../../appNotification/AppNotificationDialog'
import intlScrollToTopOnUpdateFactory from '../intlScrollToTopOnUpdateFactory'
import ConnectedNavDrawer from './ConnectedNavDrawer'
import VerticalAppBar from './VerticalAppBar'
import HorizontalAppBar from './HorizontalAppBar'
import Footer from '../../../MigratedComponents/Shell/PageFooter'

const cssClasses = classnames.bind(require('./index.css'))

export const loggedInFactory = compose(
  intlScrollToTopOnUpdateFactory,
  render => props => (
    <div classnames={cssClasses('Layout')}>
      <ConnectedNavDrawer history={props.history} location={props.location} />
      <div className={cssClasses('Panel')}>
        <VerticalAppBar history={props.history} location={props.location} />
        <HorizontalAppBar history={props.history} location={props.location} />
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
