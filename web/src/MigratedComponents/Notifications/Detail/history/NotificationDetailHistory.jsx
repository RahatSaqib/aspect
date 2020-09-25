import classnames from 'classnames/bind'
import React from 'react'
import { defineMessages, useIntl } from 'react-intl'
import PropTypes from 'prop-types'
import TableBody from '@material-ui/core/TableBody'

import { useQuery } from 'react-query'
import BrowseTablePaginator from '../../../../globals/components/BrowseTablePaginator'

import {
  NotificationHistoryDataTable,
  NotificationHistoryDataTableHead,
  NotificationHistoryDataTableRow,
} from './NotificationHistoryDataTable'

import { makeSortPageSelector } from '../../../../shared/selectors/searchParams'
import fetchWrapperForQueries from '../../../QueryFetch/index'
import { NOTIFICATION_HISTORY } from '../../../QueryFetch/Notification/index'

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

export const NotificationDetailHistory = ({
  history,
  location,
  notificationId,
}) => {
  const intl = useIntl()
  const { pageAt, pageSize } = makeSortPageSelector()({ location })
  const { data: { data, total } = false, isError, error } = useQuery(
    [NOTIFICATION_HISTORY.KEY, notificationId, pageAt, pageSize],
    async () =>
      fetchWrapperForQueries({
        endpoint: `${NOTIFICATION_HISTORY.ENDPOINT}/${notificationId}`,
        params: { page: pageAt, size: pageSize },
      })
  )

  if (isError) {
    throw new Error(error)
  }

  return (
    <div>
      <section
        className={cssClasses('Section', 'Section--first', 'Section--last')}
      >
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
            {data
              ? data.map(({ id, ...delivery }) => (
                  <NotificationHistoryDataTableRow
                    key={id}
                    delivery={delivery}
                  />
                ))
              : null}
          </TableBody>
        </NotificationHistoryDataTable>
        <BrowseTablePaginator
          history={history}
          location={location}
          intl={intl}
          paginatorStatus={messages.paginatorStatus}
          total={total || 0}
          pageAt={pageAt}
          pageSize={pageSize}
        />
      </section>
    </div>
  )
}

NotificationDetailHistory.propTypes = {
  location: PropTypes.oneOf([PropTypes.object]).isRequired,
  history: PropTypes.oneOf([PropTypes.object]).isRequired,
  notificationId: PropTypes.number.isRequired,
}

export default NotificationDetailHistory
