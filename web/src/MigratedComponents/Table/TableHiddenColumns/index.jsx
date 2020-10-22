import React from 'react'
import Chip from '@material-ui/core/Chip'

import classnames from 'classnames/bind'

const cssClasses = classnames.bind(require('../Table.css'))

const getProperColumnLabelFromKey = (key, columns) => {
  const columnArray = columns.filter(({ accessor }) => accessor === key)
  if (columnArray && columnArray.length) {
    return columnArray[0].Header
  }
  return key
}

const TableHiddenColumns = ({
  columns,
  hiddenColumns,
  handleHideColumnToggle,
}) => {
  return (
    <div className={cssClasses('hiddenColumn__container')}>
      Hidden Columns:
      {hiddenColumns.map(column => (
        <Chip
          label={`${getProperColumnLabelFromKey(column, columns)}`}
          // onClick={handleClick}
          onDelete={e => handleHideColumnToggle(e, column)}
          className={cssClasses('hiddenColumn__chip')}
        />
      ))}
    </div>
  )
}

export default TableHiddenColumns
