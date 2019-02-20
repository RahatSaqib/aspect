import Immutable from 'immutable'
import React from 'react'
import { shallow } from 'enzyme'
import { IntlProvider } from 'react-intl'
import NotificationTableRow from './NotificationTableRow'

describe('NotificationTableRow module', () => {
  const intlProvider = new IntlProvider({ locale: 'en' }, {})
  const { intl } = intlProvider.getChildContext()

  const props = {
    intl,
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
