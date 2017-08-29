import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { TableRow, TableCell } from 'react-toolbox/lib/table'
import { Button } from 'react-toolbox/lib/button'
import FaCircle from 'react-icons/lib/fa/circle'

const cssClasses = classnames.bind(
  require('./NotificationDeliveryTableRow.css')
)

const enhance = _.identity

const NotificationDeliveryTableRow = ({ intl, delivery, ...restProps }) =>
  <TableRow
    {...restProps}
    className={cssClasses(restProps.className, 'TableRow')}
  >
    <TableCell className={cssClasses('TableCell')}>
      <FaCircle className={cssClasses('FaCircle')} />
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      <Button
        className={cssClasses('Button', {
          'Button--ship-cove': true,
        })}
        neutral
        raised
        label={delivery.topic}
        theme={{
          neutral: cssClasses('Button--neutral'),
          raised: cssClasses('Button--raised'),
        }}
      />
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {delivery.title}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {delivery.site}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {intl.formatRelative(delivery.time)}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {'…'}
    </TableCell>
  </TableRow>

export default enhance(NotificationDeliveryTableRow)
