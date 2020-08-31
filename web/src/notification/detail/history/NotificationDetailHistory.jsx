import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { defineMessages, injectIntl } from 'react-intl'
import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet'
import Card from '@material-ui/core/Card'
import TableBody from '@material-ui/core/TableBody'
import { useParams } from 'react-router-dom'

import { useSelector } from 'react-redux'
import { useQuery } from 'react-query'
import BrowseTablePaginator from '../../../globals/components/BrowseTablePaginator'
import NotificationDetailBackBar from '../NotificationDetailBackBar'

import {
  NotificationHistoryDataTable,
  NotificationHistoryDataTableHead,
  NotificationHistoryDataTableRow,
} from './NotificationHistoryDataTable'

import { makeSortPageSelector } from '../../../shared/selectors/searchParams'
import fetchWrapperForQueries from '../../../MigratedComponents/QueryFetch/index'
import { NOTIFICATION_HISTORY } from '../../../MigratedComponents/QueryFetch/Notification/index'

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
  const { notificationId } = useParams()
  const { pageAt, pageSize } = makeSortPageSelector()({ location })
  const notification = useSelector(state => state.notification)
  const { data, isError, error } = useQuery(
    [NOTIFICATION_HISTORY.KEY, notificationId, pageAt, pageSize],
    async () =>
      fetchWrapperForQueries(
        `${NOTIFICATION_HISTORY.ENDPOINT}/${notificationId}?page=${pageAt}&size=${pageSize}`
      )
  )

  if (isError) {
    throw new Error(error)
  }

  return (
    <div>
      <Helmet title={notification?.items?.byId.toJS()[notificationId]?.name} />
      <NotificationDetailBackBar
        intl={intl}
        history={history}
        location={location}
        match={match}
        title={notification?.items?.byId.toJS()[notificationId]?.name}
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
                  key: 'date',
                  label: 'Date',
                },
                {
                  key: 'web-sent',
                  label: 'Webhook Sent',
                },
                {
                  key: 'email-sent',
                  label: 'Emails sent',
                },
                {
                  key: 'sms-sent',
                  label: 'SMS sent',
                },
              ]}
            />
            <TableBody>
              {data?.map(delivery => (
                <NotificationHistoryDataTableRow
                  key={delivery.id}
                  intl={intl}
                  delivery={delivery}
                />
              ))}
            </TableBody>
          </NotificationHistoryDataTable>
          <BrowseTablePaginator
            history={history}
            location={location}
            intl={intl}
            paginatorStatus={messages.paginatorStatus}
            total={0}
            pageAt={pageAt}
            pageSize={pageSize}
          />
        </Card>
      </section>
    </div>
  )
}

NotificationDetailHistory.propTypes = {
  intl: PropTypes.object.isRequired, // eslint-disable-line
  location: PropTypes.object.isRequired, // eslint-disable-line
  history: PropTypes.object.isRequired, // eslint-disable-line
  match: PropTypes.object.isRequired, // eslint-disable-line
}

export default enhance(NotificationDetailHistory)
