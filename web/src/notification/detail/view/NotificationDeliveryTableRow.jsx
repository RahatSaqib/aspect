import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import FaCircle from 'react-icons/lib/fa/circle'
import ColoredButton from '../../../components/themedReactToolbox/ColoredButton'

import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../../components/shared/tableBody'

const cssClasses = classnames.bind(
  require('./NotificationDeliveryTableRow.css')
)

const enhance = _.identity

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
      {intl.formatRelative(delivery.time)}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>…</TableCell>
  </TableRow>
)

export default enhance(NotificationDeliveryTableRow)
