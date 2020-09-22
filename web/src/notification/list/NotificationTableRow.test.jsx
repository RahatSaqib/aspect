import Immutable from 'immutable'
import React from 'react'
import { mountWithIntl } from '../../test/common'

import NotificationTableRow from './NotificationTableRow'

describe('NotificationTableRow module', () => {
  const props = {
    className: '',
    onClick: jest.fn(),
    notification: {
      id: 1,
      alertType: 'mine',
      alertName: 'Failed search devices',
      lastTriggeredOn: new Date(),
      totalTriggers: 10,
      contacts: 'Contact1, contact2',
      contactsCount: 8,
      recipientsCount: 10,
      triggersCount: 10,
      erorsCount: 10,
    },
  }

  describe('NotificationTableRow component', () => {
    it('should render without crash', () => {
      mountWithIntl(<NotificationTableRow {...props} />)
    })
  })
})
