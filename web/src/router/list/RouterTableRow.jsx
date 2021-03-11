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
import { formatI18nMessage } from '../../shared/i18n/formatter'

const cssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const enhance = identity

const RouterTableRow = ({ router, ...restProps }) => {
  const intl = useIntl()

  return (
    <TableRow {...restProps} className={cssClasses(restProps.className)}>
      <TableCell>{router.get('name')}</TableCell>
      <TableCell>
        {formatI18nMessage(
          messages,
          intl.formatMessage,
          router.get('statusI18nKey'),
          router.get('approval')
        )}
      </TableCell>
      <TableCell>{formatRelative(intl, router.get('createdOn'))}</TableCell>
      <TableCell>{formatRelative(intl, router.get('lastSeen'))}</TableCell>
    </TableRow>
  )
}

export default enhance(RouterTableRow)
