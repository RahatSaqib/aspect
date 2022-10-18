import React from 'react'
import { shallow } from 'enzyme'
import { createIntl } from 'react-intl'
import { hideAppNotification, Error, showMoreDetails } from '../../store/AppNotificationRedux'
import { AppNotificationDialog } from './AppNotificationDialog'

describe('App Notification Dialog component', () => {
  const appNotification = new Error()
  const props = {
    intl: createIntl({ locale: 'en' }),
    appNotification,
    hideAppNotification,
    showMoreDetails,
  }

  it('should shallow render correctly', () => {
    const element = shallow(<AppNotificationDialog {...props} />)

    expect(element).toMatchSnapshot()
  })
})
