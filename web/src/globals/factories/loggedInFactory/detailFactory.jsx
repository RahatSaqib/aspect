import React from 'react'
import { createEagerFactory, compose, pure } from 'recompose'
import Helmet from 'react-helmet'

import { IdleDialogContainer } from '../../../idle/dialog/IdleDialog'
import AppNotificationSnackBar from '../../../appNotification/AppNotificationSnackBar'
import AppNotificationDialog from '../../../appNotification/AppNotificationDialog'
import ensureAuthorizedFactory from '../ensureAuthorizedFactory'
import intlScrollToTopOnUpdateFactory from '../intlScrollToTopOnUpdateFactory'

export const loggedInFactory = compose(
  ensureAuthorizedFactory,
  intlScrollToTopOnUpdateFactory,
  render => props =>
    <div>
      <Helmet titleTemplate="%s - Aspect" defaultTitle="Aspect" />
      {render(props)}
      <IdleDialogContainer intl={props.intl} />
      <AppNotificationDialog intl={props.intl} />
      <AppNotificationSnackBar intl={props.intl} />
    </div>,
  createEagerFactory,
  pure
)

export default loggedInFactory
