import React from 'react'
import Immutable from 'immutable'
import { createIntl } from 'react-intl'
import ReactShallowRenderer from 'react-test-renderer/shallow'
import { StyledAppNotificationSnackBar } from './AppNotificationSnackBar'

describe('App Notification SnackBar component', () => {
  const renderer = new ReactShallowRenderer()
  const intl = createIntl({ locale: 'en' })

  const notificationOptions = Immutable.fromJS({
    showAs: 'interrupt',
    showClose: true,
    showProceed: false,
    severity: 'warn',
    title: {
      id: 'errorResponseMessages.loginStart.POST.default.default.title',
      defaultMessage: 'Login Failed',
    },
    message: {
      id: 'errorResponseMessages.loginStart.POST.default.default.message',
      defaultMessage: 'The details that you have entered are incorrect',
    },
    resolution: {
      id: 'errorResponseMessages.loginStart.POST.default.resolution',
      defaultMessage: 'Please re-enter your login details and try again?',
    },
  })

  const Error = Immutable.Record({
    hasNotification: true,
    notificationType: 'error',
    messageValues: {
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Authentication failed. Wrong username or password.',
    },
    showDetails: true,
    notificationOptions,
  })
  const appNotification = new Error()
  const props = {
    intl,
    appNotification,
    hideAppNotification: () => {},
    showMoreDetails: () => {},
  }

  it('should shallow render correctly', () => {
    const element = renderer.render(<StyledAppNotificationSnackBar {...props} />)

    expect(element).toMatchSnapshot()
  })
})
