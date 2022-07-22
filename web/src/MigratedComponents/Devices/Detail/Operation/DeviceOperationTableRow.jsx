import identity from 'lodash/identity'
import partial from 'lodash/partial'
import classnames from 'classnames/bind'
import React from 'react'
import { formatDate } from '../../../../shared/utils/dateFormat'

import { DataTableRow as TableRow, DataTableCell as TableCell } from '../../../../components/shared/tableBody'

import styles from '../../../../components/shared/DataTableRow.css'

const cssClasses = classnames.bind(styles)

const enhance = identity

const formatterByType = partial(
  // TODO: Extract to a shared module
  (formatterBy, type) => formatterBy[type] || formatterBy.default,
  {
    number(it, intl, schema) {
      return `${schema.get('prefix')}${intl.formatNumber(it, {
        maximumFractionDigits: schema.get('decimals'),
      })}${schema.get('suffix')}`
    },
    default: identity,
  }
)

const DeviceOperationTableRow = ({ intl, deviceOperation, deviceOperationSchema, ...restProps }) => (
  <TableRow {...restProps} className={cssClasses(restProps.className)}>
    <TableCell>{formatDate(deviceOperation.get('startedOn'))}</TableCell>
    <TableCell>{deviceOperation.get('id')}</TableCell>
    {deviceOperationSchema
      .map((schema, key) => (
        // eslint-disable-next-line react/no-array-index-key
        <TableCell key={key}>
          {formatterByType(schema.get('type'))(deviceOperation.getIn(['data', key]), intl, schema)}
        </TableCell>
      ))
      .valueSeq()}
  </TableRow>
)

export default enhance(DeviceOperationTableRow)
