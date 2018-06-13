import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'
import { IntlProvider } from 'react-intl'

import { AppNotificationDialog } from './AppNotificationDialog'
import {
  hideAppNotification,
  Error,
  showMoreDetails,
} from './AppNotificationRedux'

describe('App Notification Dialog component', () => {
  const renderer = new ReactShallowRenderer()
  const intlProvider = new IntlProvider({ locale: 'en' }, {})
  const { intl } = intlProvider.getChildContext()
  const appNotification = new Error()
  const props = {
    intl,
    appNotification,
    hideAppNotification,
    showMoreDetails,
  }

  it('should shallow render correctly', () => {
    const element = renderer.render(<AppNotificationDialog {...props} />)

    expect(element).toMatchSnapshot()
  })
})
