import React from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import Chip from '@material-ui/core/Chip'
import classnames from 'classnames/bind'

import messages from '../messages'

const cssClasses = classnames.bind(require('../../Table.css'))

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
  const { formatMessage } = useIntl()
  return (
    <div className={cssClasses('hiddenColumn__container')}>
      {formatMessage(messages.hiddenColumns)}
      {hiddenColumns.map(column => (
        <Chip
          key={column}
          label={`${getProperColumnLabelFromKey(column, columns)}`}
          onDelete={e => handleHideColumnToggle(e, column)}
          className={cssClasses('hiddenColumn__chip')}
        />
      ))}
    </div>
  )
}

TableHiddenColumns.propTypes = {
  columns: PropTypes.oneOfType([PropTypes.array]).isRequired,
  hiddenColumns: PropTypes.oneOfType([PropTypes.array]).isRequired,
  handleHideColumnToggle: PropTypes.func.isRequired,
}

export default TableHiddenColumns
