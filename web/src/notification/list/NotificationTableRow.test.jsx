import Immutable from 'immutable'
import React from 'react'
import { shallow } from 'enzyme'
import { createIntl } from 'react-intl'
import NotificationTableRow from './NotificationTableRow'

describe('NotificationTableRow module', () => {
  const props = {
    intl: createIntl({ locale: 'en' }),
    notification: Immutable.fromJS({
      alertType: 'mine',
      alertName: 'Failed search devices',
      lastTriggeredOn: Date.now(),
      recipientsCount: 10,
      triggersCount: 10,
      errorsCount: 10,
    }),
  }

  describe('NotificationTableRow component', () => {
    it('should render without crash', () => {
      shallow(<NotificationTableRow {...props} />)
    })
  })
})
