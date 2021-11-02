import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'

import styles from './TableXScrollWrapper.css'

const cssClasses = classnames.bind(styles)

const TableXScrollWrapper = ({ children }) => {
  return (
    <div className={cssClasses('datatable_scroll__outer')}>
      <div className={cssClasses('datatable_scroll__inner')}>{children}</div>
    </div>
  )
}

TableXScrollWrapper.propTypes = {
  children: PropTypes.node.isRequired,
}

export default TableXScrollWrapper
