import React from 'react'
import PropTypes from 'prop-types'
import { MdExpandMore, MdExpandLess } from 'react-icons/md'
import classnames from 'classnames/bind'

const cssClasses = classnames.bind(require('../Table.css'))

function TableColumnHeader({ render, isSorted, isSortedDesc }) {
  return (
    <div className={cssClasses('table__header')}>
      <span
        className={cssClasses(
          `${
            isSorted
              ? 'table__headerTitle table__headerTitle--bold'
              : 'table__headerTitle'
          }`
        )}
      >
        {render}
      </span>
      <span className={cssClasses('table__headerIcon')}>
        {isSorted ? isSortedDesc ? <MdExpandMore /> : <MdExpandLess /> : ''}
      </span>
    </div>
  )
}

TableColumnHeader.propTypes = {
  render: PropTypes.func.isRequired,
  isSorted: PropTypes.bool.isRequired,
  isSortedDesc: PropTypes.bool.isRequired,
}

export default TableColumnHeader
