import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { TableRow, TableCell } from 'react-toolbox/lib/table'

const csssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const enhance = _.identity

const ResultTableRow = ({ columns, ...restProps }) =>
  <TableRow
    {...restProps}
    className={csssClasses(restProps.className, 'TableRow')}
  >
    {columns.map(({ key = index, column, hoverLabel }, index) =>
      <TableCell key={key} className={csssClasses('TableCell')}>
        {column}
        {hoverLabel &&
          <small className={csssClasses('TableCell_small')}>
            {hoverLabel}
          </small>}
      </TableCell>
    )}
  </TableRow>

export default enhance(ResultTableRow)
