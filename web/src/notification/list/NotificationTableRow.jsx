import identity from 'lodash/identity'
import classnames from 'classnames/bind'
import React from 'react'
import { useHistory } from 'react-router-dom'

import AspectVertMenu from '../../MigratedComponents/AspectVertMenu'
import { useIntl, defineMessages } from 'react-intl'

import PropTypes from 'prop-types'

import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'
import { formatRelative } from '../../shared/utils/dateFormat'

const messages = defineMessages({
  moreContacts: {
    id: 'pages.NotificationListRow.moreContacts',
    defaultMessage: 'more contacts',
  },
})

const cssClasses = classnames.bind(require('./NotificationTableRow.css'))

const enhance = identity
const NotificationTableRow = ({
  className,
  onClick,
  notification: {
    id,
    name,
    lastTriggeredOn,
    totalTriggers,
    contacts,
    contactsCount,
  },
}) => {
  const intl = useIntl()

const getItemActions = history => [
  {
    icon: 'FaEdit',
    text: 'Edit',
    action: params => history.push(`/browse/notification/${params.get('id')}`),
  },
  {
    icon: 'FaCopy',
    text: 'Copy',
    action: params => {
      /* eslint-disable no-debugger, no-console */
      console.log('Copy', params)
    },
    disabled: true,
  },
  {
    icon: 'FaEye',
    text: 'Preview',
    action: params => {
      /* eslint-disable no-debugger, no-console */
      console.log('Preview', params)
    },
    disabled: true,
  },
  {
    icon: 'FaFileAlt',
    text: 'View Log',
    action: params =>
      history.push(`/browse/notification/${params.get('id')}/history`),
    separator: true,
  },
  {
    icon: 'FaTrash',
    text: 'Delete',
    action: params => {
      /* eslint-disable no-debugger, no-console */
      console.log('Delete', params)
    },
    disabled: true,
  },
]

const NotificationTableRow = ({ intl, notification, ...restProps }) => {
  const history = useHistory()

  const counter = column =>
    notification.get(column) === null
      ? 'Not Configured'
      : notification.get(column)
  
  const addEllipsis = (words, totalCount) => {
    const wordsArray = words ? words.split(',') : []
    if (wordsArray.length < totalCount)
      return (
        <div>
          {words}...{' '}
          <b>
            {totalCount - wordsArray.length}{' '}
            {intl.formatMessage(messages.moreContacts)}
          </b>
        </div>
      )
    return words
  }

  return (
    <TableRow
      key={id}
      data-notification-id={id}
      onClick={onClick}
      className={cssClasses(className)}
    >
      <TableCell>{name}</TableCell>
      <TableCell>{formatRelative(intl, lastTriggeredOn)}</TableCell>
      <TableCell>{totalTriggers}</TableCell>
      <TableCell className={cssClasses('table__cell--truncate')}>
        {addEllipsis(contacts, contactsCount)}
      </TableCell>
      <TableCell>{notification.get('totalTriggers')}</TableCell>
      <TableCell>{counter('alertCount')}</TableCell>
      <TableCell>{counter('smsCount')}</TableCell>
      <TableCell>{counter('emailCount')}</TableCell>
      <TableCell>
        <AspectVertMenu
          params={notification}
          actions={getItemActions(history)}
        />
      </TableCell>
    </TableRow>
  )
}

NotificationTableRow.propTypes = {
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string,
  notification: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string,
    lastTriggeredOn: PropTypes.instanceOf(Date),
    totalTriggers: PropTypes.number.isRequired,
    contacts: PropTypes.string.isRequired,
    contactsCount: PropTypes.number.isRequired,
  }).isRequired,
}

NotificationTableRow.defaultProps = {
  className: '',
}
export default enhance(NotificationTableRow)
