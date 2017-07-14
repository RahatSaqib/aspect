import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { TableRow, TableCell } from 'react-toolbox/lib/table'

const cssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const enhance = _.identity

const formatterByType = _.partial(
  (formatterBy, type) => formatterBy[type] || formatterBy.default,
  {
    number: (n, intl) => (_.isNumber(n) ? intl.formatNumber(n) : false),
    default: _.identity,
  }
)

const ResultTableRow = ({ intl, extraColumns, result, ...restProps }) =>
  <TableRow
    {...restProps}
    className={cssClasses(restProps.className, 'TableRow')}
  >
    <TableCell className={cssClasses('TableCell')}>
      {intl.formatDate(result.get('endedOn'))}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {result.get('deviceName')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {result.get('sampleOriginSiteName')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {result.get('sampleId')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {result.get('sampleGroup')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {result.get('patientId')}
    </TableCell>
    {extraColumns.map(column =>
      <TableCell key={column.get('db')} className={cssClasses('TableCell')}>
        {formatterByType(column.get('type'))(
          result.get(column.get('db')),
          intl
        )}
      </TableCell>
    )}
  </TableRow>

export default enhance(ResultTableRow)
