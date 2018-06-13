import React from 'react'
import { compose, pure } from 'recompose'
import Helmet from 'react-helmet'

import AppNotificationSnackBar from '../../appNotification/AppNotificationSnackBar'
import AppNotificationDialog from '../../appNotification/AppNotificationDialog'
import intlScrollToTopOnUpdateFactory from './intlScrollToTopOnUpdateFactory'

export const signedOutFactory = compose(
  intlScrollToTopOnUpdateFactory,
  render => props => (
    <div>
      <Helmet titleTemplate="%s - Aspect" defaultTitle="Aspect" />
      {render(props)}
      <AppNotificationDialog intl={props.intl} />
      <AppNotificationSnackBar intl={props.intl} />
    </div>
  ),
  React.createFactory,
  pure
)

export default signedOutFactory
