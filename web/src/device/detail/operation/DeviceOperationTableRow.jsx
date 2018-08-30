import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { TableRow, TableCell } from 'react-toolbox/lib/table'
import { formatDate } from '../../../shared/utils/dateFormat'

const cssClasses = classnames.bind(
  require('../../../components/shared/DataTableRow.css')
)

const enhance = _.identity

const formatterByType = _.partial(
  // TODO: Extract to a shared module
  (formatterBy, type) => formatterBy[type] || formatterBy.default,
  {
    number(it, intl, schema) {
      return `${schema.get('prefix')}${intl.formatNumber(it, {
        maximumFractionDigits: schema.get('decimals'),
      })}${schema.get('suffix')}`
    },
    default: _.identity,
  }
)

const DeviceOperationTableRow = ({
  intl,
  deviceOperation,
  deviceOperationSchema,
  ...restProps
}) => (
  <TableRow
    {...restProps}
    className={cssClasses(restProps.className, 'TableRow')}
  >
    <TableCell className={cssClasses('TableCell')}>
      {formatDate(deviceOperation.get('startedOn'))}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {deviceOperation.get('id')}
    </TableCell>
    {deviceOperationSchema
      .map((schema, key) => (
        // eslint-disable-next-line react/no-array-index-key
        <TableCell key={key} className={cssClasses('TableCell')}>
          {formatterByType(schema.get('type'))(
            deviceOperation.getIn(['data', key]),
            intl,
            schema
          )}
        </TableCell>
      ))
      .valueSeq()}
  </TableRow>
)

export default enhance(DeviceOperationTableRow)
