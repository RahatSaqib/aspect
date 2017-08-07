import classnames from 'classnames/bind'
import React from 'react'
import { createEagerFactory, compose, pure } from 'recompose'
import Helmet from 'react-helmet'
import { Layout, Panel } from 'react-toolbox/lib/layout'

import { IdleDialogContainer } from '../../../idle/dialog/IdleDialog'
import AppNotificationSnackBar from '../../../appNotification/AppNotificationSnackBar'
import AppNotificationDialog from '../../../appNotification/AppNotificationDialog'
import ensureAuthorizedFactory from '../ensureAuthorizedFactory'
import intlScrollToTopOnUpdateFactory from '../intlScrollToTopOnUpdateFactory'
import ConnectedNavDrawer from './ConnectedNavDrawer'
import VerticalAppBar from './VerticalAppBar'
import HorizontalAppBar from './HorizontalAppBar'

const cssClasses = classnames.bind(require('./index.css'))

export const loggedInFactory = compose(
  ensureAuthorizedFactory,
  intlScrollToTopOnUpdateFactory,
  render => props =>
    <Layout>
      <ConnectedNavDrawer history={props.history} location={props.location} />
      <Panel className={cssClasses('Panel')}>
        <VerticalAppBar history={props.history} location={props.location} />
        <HorizontalAppBar history={props.history} location={props.location} />
        <Helmet titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <div className={cssClasses('Content')}>
          {render(props)}
        </div>
        <IdleDialogContainer intl={props.intl} />
        <AppNotificationDialog intl={props.intl} />
        <AppNotificationSnackBar intl={props.intl} />
      </Panel>
    </Layout>,
  createEagerFactory,
  pure
)

export default loggedInFactory
