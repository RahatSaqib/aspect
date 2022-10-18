import React from 'react'
import classnames from 'classnames/bind'
import identity from 'lodash/identity'
import { FaCircle } from 'react-icons/fa'
import { injectIntl } from 'react-intl'
import { DataTableRow as TableRow, DataTableCell as TableCell } from '../../../components/shared/tableBody'
import ColoredButton from '../../../components/themedReactToolbox/ColoredButton'
import { formatRelative } from '../../../utils/utils/dateFormat'
import styles from './NotificationDeliveryTableRow.css'

const cssClasses = classnames.bind(styles)

const enhance = identity(injectIntl)

const NotificationDeliveryTableRow = ({ intl, delivery, ...restProps }) => (
  <TableRow {...restProps} className={cssClasses(restProps.className)}>
    <TableCell className={cssClasses('TableCell')}>
      <FaCircle className={cssClasses('FaCircle')} />
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      <ColoredButton className={cssClasses('ColoredButton')} shipCove label={delivery.topic} />
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>{delivery.title}</TableCell>
    <TableCell className={cssClasses('TableCell')}>{delivery.site}</TableCell>
    <TableCell className={cssClasses('TableCell')}>{formatRelative(delivery.time)}</TableCell>
    <TableCell className={cssClasses('TableCell')}>…</TableCell>
  </TableRow>
)

export default enhance(NotificationDeliveryTableRow)
