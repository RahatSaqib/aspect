import React from 'react'
import { shallow } from 'enzyme'
import { createIntl } from 'react-intl'

import { AppNotificationDialog } from './AppNotificationDialog'
import { hideAppNotification, Error, showMoreDetails } from '../../store/AppNotificationRedux'

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
