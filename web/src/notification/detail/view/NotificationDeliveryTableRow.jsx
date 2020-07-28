import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { FaCircle } from 'react-icons/fa'
import { injectIntl } from 'react-intl'

import ColoredButton from '../../../components/themedReactToolbox/ColoredButton'

import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../../components/shared/tableBody'
import { formatRelative } from '../../../shared/utils/dateFormat'

const cssClasses = classnames.bind(
  require('./NotificationDeliveryTableRow.css')
)

const enhance = _.identity(injectIntl)

const NotificationDeliveryTableRow = ({ intl, delivery, ...restProps }) => (
  <TableRow {...restProps} className={cssClasses(restProps.className)}>
    <TableCell className={cssClasses('TableCell')}>
      <FaCircle className={cssClasses('FaCircle')} />
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      <ColoredButton
        className={cssClasses('ColoredButton')}
        shipCove
        label={delivery.topic}
      />
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>{delivery.title}</TableCell>
    <TableCell className={cssClasses('TableCell')}>{delivery.site}</TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {formatRelative(intl, delivery.time)}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>…</TableCell>
  </TableRow>
)

export default enhance(NotificationDeliveryTableRow)
