import _ from 'lodash'
import classnames from 'classnames/bind'
import React, { useEffect } from 'react'
import { defineMessages, injectIntl } from 'react-intl'
import { Helmet } from 'react-helmet'
import Card from '@material-ui/core/Card'
import TableBody from '@material-ui/core/TableBody'
import { useParams } from 'react-router-dom'

import { useDispatch, useSelector } from 'react-redux'
import BrowseTablePaginator from '../../../globals/components/BrowseTablePaginator'
import NotificationDetailBackBar from '../NotificationDetailBackBar'
import { fetchNotificationsHistory } from '../../NotificationRedux'
import {
  NotificationHistoryDataTable,
  NotificationHistoryDataTableHead,
  NotificationHistoryDataTableRow,
} from './NotificationHistoryDataTable'

import { makeSortPageSelector } from '../../../shared/selectors/searchParams'

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

const enhance = _.identity(injectIntl)

export const NotificationDetailHistory = ({
  intl,
  history,
  location,
  match,
  // --- injected by recompose ---
}) => {
  const dispatch = useDispatch()
  const { notificationId } = useParams()
  const { pageAt, pageSize } = makeSortPageSelector()({ location })

  const notification = useSelector(state => state.notification)

  useEffect(() => {
    dispatch(fetchNotificationsHistory({ notificationId, pageSize, pageAt }))
  }, [dispatch, notificationId, pageSize, pageAt])

  return (
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
            <TableBody>
              {notification?.items?.currentIdList
                .map(id => notification?.items?.byId.get(id))
                .map(delivery => (
                  <NotificationHistoryDataTableRow
                    key={delivery.get('id')}
                    intl={intl}
                    delivery={delivery.toJS()}
                  />
                ))}
            </TableBody>
          </NotificationHistoryDataTable>
          <BrowseTablePaginator
            history={history}
            location={location}
            intl={intl}
            paginatorStatus={messages.paginatorStatus}
            total={notification?.table?.get('total')}
            pageAt={pageAt}
            pageSize={pageSize}
          />
        </Card>
      </section>
    </div>
  )
}

export default enhance(NotificationDetailHistory)
