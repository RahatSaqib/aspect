import identity from 'lodash/identity'
import classnames from 'classnames/bind'
import React from 'react'
import { useIntl } from 'react-intl'
import messages from '../../device/list/messages'
import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'
import { formatRelative } from '../../shared/utils/dateFormat'

const cssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const enhance = identity

const RouterTableRow = ({ router, ...restProps }) => {
  const intl = useIntl()

  const formatI18n = (key, defaultMessage) =>
    messages[router.get(key)]
      ? intl.formatMessage(messages[router.get(key)])
      : router.get(defaultMessage)
  return (
    <TableRow {...restProps} className={cssClasses(restProps.className)}>
      <TableCell>{router.get('name')}</TableCell>
      <TableCell>{formatI18n('statusI18nKey', 'approval')}</TableCell>
      <TableCell>{formatRelative(intl, router.get('createdOn'))}</TableCell>
      <TableCell>{formatRelative(intl, router.get('lastSeen'))}</TableCell>
    </TableRow>
  )
}

export default enhance(RouterTableRow)
