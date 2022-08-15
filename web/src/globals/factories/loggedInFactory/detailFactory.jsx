import React from 'react'
import { compose, pure } from 'recompose'
import { Helmet } from 'react-helmet'

import IdleDialog from '../../../oldComponents/IdleDialog'
import AppNotificationSnackBar from '../../../oldComponents/appNotification/AppNotificationSnackBar'
import AppNotificationDialog from '../../../oldComponents/appNotification/AppNotificationDialog'
import intlScrollToTopOnUpdateFactory from '../intlScrollToTopOnUpdateFactory'

export const loggedInFactory = compose(
  intlScrollToTopOnUpdateFactory,
  render => props =>
    (
      <div>
        <Helmet titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        {render(props)}
        <IdleDialog intl={props.intl} />
        <AppNotificationDialog intl={props.intl} />
        <AppNotificationSnackBar intl={props.intl} />
      </div>
    ),
  React.createFactory,
  pure
)

export default loggedInFactory
