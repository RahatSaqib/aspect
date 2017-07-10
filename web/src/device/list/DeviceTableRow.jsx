import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { TableRow, TableCell } from 'react-toolbox/lib/table'

const cssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const enhance = _.identity

const DeviceTableRow = ({ columns, ...restProps }) =>
  <TableRow
    {...restProps}
    className={cssClasses(restProps.className, 'TableRow')}
  >
    {columns.map(({ key = index, column, hoverLabel }, index) =>
      <TableCell key={key} className={cssClasses('TableCell')}>
        {column}
        {hoverLabel &&
          <small className={cssClasses('TableCell__small')}>
            {hoverLabel}
          </small>}
      </TableCell>
    )}
  </TableRow>

export default enhance(DeviceTableRow)
