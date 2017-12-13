import _ from 'lodash'
import subDays from 'date-fns/subDays'
import classnames from 'classnames/bind'
import React from 'react'
import { defineMessages } from 'react-intl'
import Helmet from 'react-helmet'
import { Card } from 'react-toolbox/lib/card'

import BrowseTablePaginator from '../../../globals/components/BrowseTablePaginator'
import NotificationDetailBackBar from '../NotificationDetailBackBar'
import {
  NotificationHistoryDataTable,
  NotificationHistoryDataTableHead,
  NotificationHistoryDataTableRow,
} from './NotificationHistoryDataTable'

const cssClasses = classnames.bind(require('../NotificationDetail.css'))

const messages = defineMessages({
  paginatorStatus: {
    id: 'pages.NotificationDetailHistory.paginatorStatus',
    defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
    one {# event}
    other {# events}
  }`,
  },
})

const enhance = _.identity

const now = new Date()

export const NotificationDetailHistory = ({
  intl,
  history,
  location,
  match,
  // --- injected by recompose ---
}) => (
  <div>
    <Helmet title="TB MTB+ Rif+ in Western Region" />
    <NotificationDetailBackBar
      intl={intl}
      history={history}
      location={location}
      match={match}
      title="TB MTB+ Rif+ in Western Region"
    />
    <section
      className={cssClasses('Section', 'Section--first', 'Section--last')}
    >
      <Card className={cssClasses('Card')}>
        <NotificationHistoryDataTable
          selectable={false}
          className={cssClasses('NotificationHistoryDataTable')}
        >
          <NotificationHistoryDataTableHead
            columns={[
              {
                key: 'id',
                label: '',
              },
              {
                key: 'date',
                label: 'Date',
              },
              {
                key: 'web-alerts',
                label: 'Web alerts',
              },
              {
                key: 'email-sent',
                label: 'Email sent',
              },
              {
                key: 'email-errors',
                label: 'Email errors',
              },
              {
                key: 'sms-sent',
                label: 'SMSes sent',
              },
              {
                key: 'sms-errors',
                label: 'SMS errors',
              },
            ]}
          />
          {[
            {
              id: 1,
              date: subDays(now, 2),
              webCount: 10,
              emailCount: 10,
              emailError: 1,
              smsCount: 6,
              smsError: 1,
            },
            {
              id: 2,
              date: subDays(now, 3),
              webCount: 10,
              emailCount: 10,
              emailError: 0,
              smsCount: 6,
              smsError: 0,
            },
            {
              id: 3,
              date: subDays(now, 5),
              webCount: 9,
              emailCount: 9,
              emailError: 0,
              smsCount: 3,
              smsError: 0,
            },
            {
              id: 4,
              date: subDays(now, 6),
              webCount: 9,
              emailCount: 9,
              emailError: 0,
              smsCount: 3,
              smsError: 0,
            },
            {
              id: 5,
              date: subDays(now, 7),
              webCount: 9,
              emailCount: 9,
              emailError: 1,
              smsCount: 3,
              smsError: 1,
            },
            {
              id: 6,
              date: subDays(now, 8),
              webCount: 9,
              emailCount: 9,
              emailError: 0,
              smsCount: 3,
              smsError: 0,
            },
          ].map(delivery => (
            <NotificationHistoryDataTableRow
              key={delivery.id}
              intl={intl}
              delivery={delivery}
            />
          ))}
        </NotificationHistoryDataTable>
        <BrowseTablePaginator
          history={history}
          location={location}
          intl={intl}
          paginatorStatus={messages.paginatorStatus}
          total={897}
          pageAt={0}
          pageSize={25}
        />
      </Card>
    </section>
  </div>
)

export default enhance(NotificationDetailHistory)
