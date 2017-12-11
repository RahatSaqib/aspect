import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { TableRow, TableCell } from 'react-toolbox/lib/table'
import FaCircle from 'react-icons/lib/fa/circle'
import ColoredButton from '../../components/themedReactToolbox/ColoredButton'

const cssClasses = classnames.bind(
  require('./NotificationDeliveryTableRow.css')
)

const enhance = _.identity

const NotificationDeliveryTableRow = ({ intl, delivery, ...restProps }) => (
  <TableRow
    {...restProps}
    className={cssClasses(restProps.className, 'TableRow')}
  >
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
