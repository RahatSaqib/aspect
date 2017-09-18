import Immutable from 'Immutable'
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
      type: 'error',
      name: 'Failed search devices',
      assignedContacts: 'Assigned Contacts',
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
