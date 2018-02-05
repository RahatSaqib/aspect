import Immutable from 'immutable'
import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'
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
    const renderer = ReactShallowRenderer.createRenderer()

    it('should render correctly', () => {
      const element = renderer.render(<NotificationTableRow {...props} />)
      expect(element).toMatchSnapshot()
    })
  })
})
