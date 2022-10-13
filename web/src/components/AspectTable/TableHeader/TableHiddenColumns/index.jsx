import React from 'react'
import { Chip } from '@mui/material'
import classnames from 'classnames/bind'
import { array, func, oneOfType } from 'prop-types'
import useI18n from '../../../../hooks/useI18n'
import styles from '../../Table.css'
import messages from '../messages'

const cssClasses = classnames.bind(styles)

const getProperColumnLabelFromKey = (key, columns) => {
  const columnArray = columns.filter(({ accessor }) => accessor === key)
  if (columnArray && columnArray.length) {
    return columnArray[0].Header
  }
  return key
}

/**
 * Component to render names of hidden columns
 */

const TableHiddenColumns = ({ columns, hiddenColumns, handleHideColumnToggle }) => {
  const { formatMessage } = useI18n()
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
  /**
    Array of all columns rendered to table
  */
  columns: oneOfType([array]).isRequired,
  /**
    Array of columns names currently hidden
  */
  hiddenColumns: oneOfType([array]).isRequired,
  /**
    Function to handle visibility toggle
  */
  handleHideColumnToggle: func.isRequired,
}

export default TableHiddenColumns
